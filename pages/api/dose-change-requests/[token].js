// /pages/api/dose-change-requests/[token].js
// GET  — fetch request details (for the approval page)
// POST — approve or deny the dose change
//
// Records IP address, timestamps, and updates the protocol on approval.
// Full audit trail for compliance.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const todayLA = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

function parseMlFromDose(doseStr) {
  if (!doseStr) return null;
  const m = doseStr.match(/(\d+\.?\d*)\s*ml/i);
  return m ? parseFloat(m[1]) : null;
}

function vialMlFromSupplyType(supplyType) {
  if (!supplyType) return null;
  if (supplyType === 'vial_5ml') return 5;
  if (supplyType === 'vial_10ml' || supplyType === 'vial') return 10;
  return null;
}

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  // Look up the request by token
  const { data: request, error } = await supabase
    .from('dose_change_requests')
    .select('*')
    .eq('approval_token', token)
    .single();

  if (error || !request) {
    return res.status(404).json({ error: 'Dose change request not found' });
  }

  // ── GET: Return request details for the approval page ──
  if (req.method === 'GET') {
    // Record that the link was opened (first time only)
    if (!request.link_opened_at) {
      await supabase
        .from('dose_change_requests')
        .update({
          link_opened_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);
    }

    return res.status(200).json({
      id: request.id,
      patient_name: request.patient_name,
      medication: request.medication,
      current_dose: request.current_dose,
      proposed_dose: request.proposed_dose,
      current_injections_per_week: request.current_injections_per_week,
      proposed_injections_per_week: request.proposed_injections_per_week,
      change_type: request.change_type,
      reason: request.reason,
      requested_by_name: request.requested_by_name,
      requested_at: request.requested_at,
      provider_name: request.provider_name,
      status: request.status,
      expires_at: request.expires_at,
      approved_at: request.approved_at,
      denied_at: request.denied_at,
      denial_reason: request.denial_reason,
      is_secondary_med: request.is_secondary_med || false,
      secondary_medication_name: request.secondary_medication_name || null,
    });
  }

  // ── POST: Approve or deny ──
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, denial_reason } = req.body || {};

  if (!action || !['approve', 'deny'].includes(action)) {
    return res.status(400).json({ error: 'action must be "approve" or "deny"' });
  }

  // Check if already processed
  if (['approved', 'denied', 'applied'].includes(request.status)) {
    return res.status(409).json({
      error: `This request has already been ${request.status}`,
      status: request.status,
    });
  }

  // Check if expired
  if (new Date(request.expires_at) < new Date()) {
    await supabase
      .from('dose_change_requests')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', request.id);
    return res.status(410).json({ error: 'This request has expired. Please submit a new dose change request.' });
  }

  // Get client IP for audit trail
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';

  // ── DENY ──
  if (action === 'deny') {
    await supabase
      .from('dose_change_requests')
      .update({
        status: 'denied',
        denied_at: new Date().toISOString(),
        denial_reason: denial_reason || null,
        approved_from_ip: clientIp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    console.log(`Dose change DENIED by ${request.provider_name} for ${request.patient_name}: ${request.current_dose} -> ${request.proposed_dose}`);

    // Email the requester about the denial
    if (request.requested_by_email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const medLine = request.is_secondary_med
          ? `${request.secondary_medication_name} (HRT secondary)`
          : (request.medication || 'medication');
        await resend.emails.send({
          from: 'Range Medical <notifications@range-medical.com>',
          to: request.requested_by_email,
          subject: `Dose change denied — ${request.patient_name}`,
          html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellspacing="0" cellpadding="0" style="background:#fff;max-width:600px;">
<tr><td style="background:#000;padding:24px 30px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:0.1em;">RANGE MEDICAL</h1>
</td></tr>
<tr><td style="padding:36px 30px 24px;">
  <h2 style="margin:0 0 8px;color:#c53030;font-size:20px;">Dose Change Denied</h2>
  <p style="margin:0 0 20px;color:#666;font-size:14px;">Denied by ${request.provider_name}</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr><td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;font-weight:600;width:40%;">Patient</td>
        <td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;">${request.patient_name}</td></tr>
    <tr><td style="padding:10px 12px;border:1px solid #eee;font-weight:600;">Medication</td>
        <td style="padding:10px 12px;border:1px solid #eee;">${medLine}</td></tr>
    <tr><td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;font-weight:600;">Requested</td>
        <td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;">${request.current_dose} → ${request.proposed_dose}</td></tr>
    ${denial_reason ? `<tr><td style="padding:10px 12px;border:1px solid #eee;font-weight:600;">Reason</td>
        <td style="padding:10px 12px;border:1px solid #eee;">${denial_reason}</td></tr>` : ''}
  </table>
</td></tr>
<tr><td style="background:#fafafa;padding:20px 30px;border-top:1px solid #eee;">
  <p style="margin:0;color:#888;font-size:13px;text-align:center;">Range Medical &bull; (949) 997-3988</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
        });
      } catch (emailErr) {
        console.error('Failed to email requester about denied dose change:', emailErr);
      }
    }

    return res.status(200).json({ success: true, status: 'denied' });
  }

  // ── APPROVE ──
  try {
    // 1. Mark request as approved
    await supabase
      .from('dose_change_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_from_ip: clientIp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    // 2. Load the current protocol
    const { data: protocol, error: protoErr } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', request.protocol_id)
      .single();

    if (protoErr || !protocol) {
      // Approved but can't apply — mark as approved (staff can apply manually)
      console.error('Protocol not found for dose change application:', request.protocol_id);
      const errMsg = `Protocol ${request.protocol_id} not found — dose change approved but not yet applied`;
      await recordApplyFailure(request.id, errMsg);
      return res.status(200).json({
        success: true,
        status: 'approved',
        applied: false,
        error: errMsg,
      });
    }

    const effDate = todayLA();

    // ── SECONDARY-MED BRANCH ──
    // Secondary HRT meds (HCG, Gonadorelin, Anastrozole) live inside the parent
    // protocol's secondary_medication_details JSON. We patch the matching entry
    // in place — no close+new-protocol dance.
    if (request.is_secondary_med && request.secondary_medication_name) {
      const existingDetails = protocol.secondary_medication_details
        ? (typeof protocol.secondary_medication_details === 'string'
            ? JSON.parse(protocol.secondary_medication_details)
            : protocol.secondary_medication_details)
        : [];

      const targetName = request.secondary_medication_name;
      const targetExists = existingDetails.some(d => (d.medication || d.name) === targetName);
      if (!targetExists) {
        console.error('Secondary med not found on parent protocol:', { protocol_id: protocol.id, targetName });
        const errMsg = `Approved but ${targetName} is no longer on the parent protocol — apply the change manually if still needed.`;
        await recordApplyFailure(request.id, errMsg);
        return res.status(200).json({
          success: true,
          status: 'approved',
          applied: false,
          error: errMsg,
        });
      }

      const updatedDetails = existingDetails.map(d => {
        if ((d.medication || d.name) === targetName) {
          return {
            ...d,
            medication: d.medication || d.name,
            dosage: request.proposed_dose,
            // Record the change in a per-medication history list on the JSON entry
            history: [
              ...(Array.isArray(d.history) ? d.history : []),
              {
                date: effDate,
                from_dose: request.current_dose || null,
                to_dose: request.proposed_dose,
                approved_by: request.provider_name,
                approval_request_id: request.id,
                reason: request.reason || null,
              },
            ],
          };
        }
        return d;
      });

      const { error: updateErr } = await supabase
        .from('protocols')
        .update({
          secondary_medication_details: updatedDetails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', protocol.id);

      if (updateErr) {
        console.error('Failed to update secondary med dosage:', updateErr);
        const errMsg = `Approved but failed to update ${targetName} dose: ${updateErr.message}`;
        await recordApplyFailure(request.id, errMsg);
        return res.status(200).json({
          success: true,
          status: 'approved',
          applied: false,
          error: errMsg,
        });
      }

      // Mark request as applied — new_protocol_id stays as the parent protocol
      // since we updated in place rather than spawning a new row. Clear
      // apply_error in case a previous attempt failed and we're succeeding now.
      await supabase
        .from('dose_change_requests')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
          apply_attempted_at: new Date().toISOString(),
          apply_error: null,
          new_protocol_id: protocol.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      console.log(`Secondary med dose APPROVED & APPLIED by ${request.provider_name} for ${request.patient_name}: ${targetName} ${request.current_dose} -> ${request.proposed_dose}`);

      // Notify the requester (task + SMS) — best effort.
      await notifyRequesterOfApproval(request);

      return res.status(200).json({
        success: true,
        status: 'applied',
        applied: true,
        new_protocol_id: protocol.id,
        secondary_medication_name: targetName,
      });
    }

    // 3. Apply the dose change in place — the protocol stays open and continuous
    //    on the business side. The medical-side audit trail lives in dose_history.
    const newIpw = request.proposed_injections_per_week || protocol.injections_per_week || 2;
    const newDosePerInj = parseMlFromDose(request.proposed_dose);

    // Calculate remaining supply at the moment of the dose change.
    const oldVialMl = vialMlFromSupplyType(protocol.supply_type);
    const oldStartingMl = protocol.starting_supply_ml != null
      ? parseFloat(protocol.starting_supply_ml)
      : oldVialMl;

    let remainingMl = null;
    if (oldStartingMl && protocol.dose_per_injection) {
      const since = protocol.last_refill_date || protocol.start_date;
      const { data: logs } = await supabase
        .from('service_logs')
        .select('id')
        .eq('patient_id', protocol.patient_id)
        .eq('protocol_id', request.protocol_id)
        .in('entry_type', ['injection', 'session'])
        .gte('entry_date', since || '1970-01-01');

      const injCount = (logs || []).length;
      const usedMl = injCount * parseFloat(protocol.dose_per_injection);
      remainingMl = Math.max(0, oldStartingMl - usedMl);
      remainingMl = Math.round(remainingMl * 100) / 100;
    }

    // Recalculate next_expected_date based on remaining supply + new dose.
    let nextExpectedDate = protocol.next_expected_date || null;
    const newVialMl = vialMlFromSupplyType(protocol.supply_type);
    if (newVialMl && newDosePerInj > 0 && newIpw > 0) {
      const supplyMl = remainingMl != null ? remainingMl : newVialMl;
      const supplyDays = Math.round((supplyMl / (newDosePerInj * newIpw)) * 7);
      const nextDate = new Date(effDate + 'T12:00:00');
      nextDate.setDate(nextDate.getDate() + supplyDays);
      nextExpectedDate = nextDate.toISOString().split('T')[0];
    }

    // Append dose entry to dose_history (audit trail). Seed a starting-dose
    // entry first if the protocol pre-dates dose tracking.
    const oldHistory = Array.isArray(protocol.dose_history)
      ? [...protocol.dose_history]
      : [];
    if (
      oldHistory.length === 0 &&
      protocol.selected_dose &&
      protocol.start_date
    ) {
      oldHistory.push({
        date: protocol.start_date,
        dose: protocol.selected_dose,
        injections_per_week: protocol.injections_per_week || 2,
        notes: 'Starting dose',
      });
    }
    const newHistory = [
      ...oldHistory,
      {
        date: effDate,
        dose: request.proposed_dose,
        injections_per_week: newIpw,
        notes: `Dose ${request.change_type} approved by ${request.provider_name}`,
        approval_request_id: request.id,
      },
    ];

    const updatePayload = {
      selected_dose: request.proposed_dose,
      current_dose: request.proposed_dose,
      injections_per_week: newIpw,
      dose_history: newHistory,
      dose_change_reason: request.reason || `Approved by ${request.provider_name}`,
      // Treat the dose-change date as a checkpoint so the supply-remaining
      // calculation uses the new dose_per_injection from here forward.
      last_refill_date: effDate,
      starting_supply_ml: remainingMl,
      next_expected_date: nextExpectedDate,
      updated_at: new Date().toISOString(),
    };
    if (newDosePerInj != null) updatePayload.dose_per_injection = newDosePerInj;
    if (protocol.sig && request.current_dose && protocol.sig.includes(request.current_dose)) {
      updatePayload.sig = protocol.sig.replace(request.current_dose, request.proposed_dose);
    }

    const { error: updateErr } = await supabase
      .from('protocols')
      .update(updatePayload)
      .eq('id', request.protocol_id);

    if (updateErr) {
      console.error('Failed to apply dose change to protocol:', updateErr);
      const errMsg = `Approved but failed to apply dose change: ${updateErr.message}`;
      await recordApplyFailure(request.id, errMsg);
      return res.status(200).json({
        success: true,
        status: 'approved',
        applied: false,
        error: errMsg,
      });
    }

    // 4. Mark request as applied. new_protocol_id stays as the parent protocol
    //    since we updated in place rather than spawning a new row.
    await supabase
      .from('dose_change_requests')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString(),
        apply_attempted_at: new Date().toISOString(),
        apply_error: null,
        new_protocol_id: request.protocol_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    console.log(`Dose change APPROVED & APPLIED by ${request.provider_name} for ${request.patient_name}: ${request.current_dose} -> ${request.proposed_dose}`);

    // Notify the requester (task + SMS) — best effort, non-blocking on the response.
    await notifyRequesterOfApproval(request);

    return res.status(200).json({
      success: true,
      status: 'applied',
      applied: true,
      new_protocol_id: request.protocol_id,
      carried_supply_ml: remainingMl,
    });

  } catch (err) {
    console.error('Dose change approval error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Create a follow-up task for the requester and text them so they know to
// document the change in an encounter note. Both side effects are best-effort —
// failure here doesn't roll back the dose change application.
async function notifyRequesterOfApproval(request) {
  try {
    // Look up the requester (assigned_to + SMS recipient)
    const { data: requester } = await supabase
      .from('employees')
      .select('id, phone')
      .ilike('email', request.requested_by_email || '')
      .maybeSingle();

    // Look up the provider (assigned_by on the task)
    const { data: provider } = await supabase
      .from('employees')
      .select('id')
      .ilike('email', request.provider_email || '')
      .maybeSingle();

    const phiName = toFirstNameLastInitial(request.patient_name);
    const medLine = request.is_secondary_med
      ? `${request.secondary_medication_name} (HRT secondary)`
      : (request.medication || 'medication');
    const direction = request.change_type === 'increase' ? 'increase' : 'decrease';

    // 1. Task — assigned to the requester, prompts them to document the change.
    if (requester?.id) {
      const { error: taskErr } = await supabase.from('tasks').insert({
        title: `Document dose change for ${request.patient_name}`,
        description: [
          `${medLine}: ${request.current_dose} → ${request.proposed_dose}`,
          `Approved by ${request.provider_name}`,
          request.reason ? `Reason: ${request.reason}` : null,
          `Please document this dose change in an encounter note.`,
        ].filter(Boolean).join('\n'),
        assigned_to: requester.id,
        // Tasks require assigned_by to be NOT NULL — fall back to self-assign
        // if the provider isn't in the employees table for some reason.
        assigned_by: provider?.id || requester.id,
        patient_id: request.patient_id,
        patient_name: request.patient_name,
        task_category: 'medical',
        priority: 'high',
      });
      if (taskErr) console.error('Failed to create dose-change documentation task:', taskErr);
    }

    // 2. SMS — direct heads-up to the requester so they don't have to refresh.
    if (requester?.phone) {
      const message = [
        `RANGE MEDICAL - Dose ${direction} approved`,
        ``,
        `Patient: ${phiName}`,
        `${medLine}`,
        `${request.current_dose} → ${request.proposed_dose}`,
        `Approved by: ${request.provider_name}`,
        ``,
        `Please document this dose change in an encounter note.`,
      ].join('\n');

      const smsResult = await sendSMS({
        to: normalizePhone(requester.phone),
        message,
        log: {
          messageType: 'dose_change_approved',
          source: 'dose-change-requests',
          patientId: request.patient_id,
          protocolId: request.protocol_id,
        },
      });
      if (!smsResult?.success) {
        console.error('Failed to SMS requester about approved dose change:', smsResult?.error);
      }
    }

    // 3. Email — ensures the requester is notified even when SMS is down.
    if (request.requested_by_email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: emailErr } = await resend.emails.send({
          from: 'Range Medical <notifications@range-medical.com>',
          to: request.requested_by_email,
          subject: `Dose ${direction} approved — ${request.patient_name}`,
          html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellspacing="0" cellpadding="0" style="background:#fff;max-width:600px;">
<tr><td style="background:#000;padding:24px 30px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:0.1em;">RANGE MEDICAL</h1>
</td></tr>
<tr><td style="padding:36px 30px 24px;">
  <h2 style="margin:0 0 8px;color:#1a7f37;font-size:20px;">Dose ${direction === 'increase' ? 'Increase' : 'Decrease'} Approved ✓</h2>
  <p style="margin:0 0 20px;color:#666;font-size:14px;">Approved by ${request.provider_name}</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr><td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;font-weight:600;width:40%;">Patient</td>
        <td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;">${request.patient_name}</td></tr>
    <tr><td style="padding:10px 12px;border:1px solid #eee;font-weight:600;">Medication</td>
        <td style="padding:10px 12px;border:1px solid #eee;">${medLine}</td></tr>
    <tr><td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;font-weight:600;">Previous Dose</td>
        <td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;">${request.current_dose}</td></tr>
    <tr><td style="padding:10px 12px;border:1px solid #eee;font-weight:600;">New Dose</td>
        <td style="padding:10px 12px;border:1px solid #eee;font-weight:600;color:#1a7f37;">${request.proposed_dose}</td></tr>
    ${request.reason ? `<tr><td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;font-weight:600;">Reason</td>
        <td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;">${request.reason}</td></tr>` : ''}
  </table>
  <p style="margin:0;color:#666;font-size:14px;">Please document this dose change in an encounter note.</p>
</td></tr>
<tr><td style="background:#fafafa;padding:20px 30px;border-top:1px solid #eee;">
  <p style="margin:0;color:#888;font-size:13px;text-align:center;">Range Medical &bull; (949) 997-3988</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
        });
        if (emailErr) console.error('Failed to email requester about approved dose change:', emailErr);
      } catch (emailCatchErr) {
        console.error('Email exception in notifyRequesterOfApproval:', emailCatchErr.message);
      }
    }
  } catch (err) {
    console.error('notifyRequesterOfApproval failed:', err);
  }
}

function toFirstNameLastInitial(fullName) {
  if (!fullName) return 'Patient';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// Record that the apply step failed after a provider had already approved.
// Status stays 'approved' (the provider really did approve) but apply_error
// captures why we couldn't apply the change, and apply_attempted_at marks the
// most recent attempt. Clearing apply_error happens on a successful apply.
async function recordApplyFailure(requestId, errorMessage) {
  try {
    await supabase
      .from('dose_change_requests')
      .update({
        apply_error: errorMessage,
        apply_attempted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);
  } catch (err) {
    console.error('Failed to record apply failure on request row:', err);
  }
}
