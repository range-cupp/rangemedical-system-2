// /pages/api/dose-change-requests/[token].js
// GET  — fetch request details (for the approval page)
// POST — approve or deny the dose change
//
// Records IP address, timestamps, and updates the protocol on approval.
// Full audit trail for compliance.

import { createClient } from '@supabase/supabase-js';
import { createProtocol, closeProtocol } from '../../../lib/create-protocol';

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
      return res.status(200).json({
        success: true,
        status: 'approved',
        applied: false,
        error: 'Protocol not found — dose change approved but not yet applied',
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
        return res.status(200).json({
          success: true,
          status: 'approved',
          applied: false,
          error: `Approved but ${targetName} is no longer on the parent protocol — apply the change manually if still needed.`,
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
        return res.status(200).json({
          success: true,
          status: 'approved',
          applied: false,
          error: `Approved but failed to update ${targetName} dose: ${updateErr.message}`,
        });
      }

      // Mark request as applied — new_protocol_id stays as the parent protocol
      // since we updated in place rather than spawning a new row.
      await supabase
        .from('dose_change_requests')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
          new_protocol_id: protocol.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      console.log(`Secondary med dose APPROVED & APPLIED by ${request.provider_name} for ${request.patient_name}: ${targetName} ${request.current_dose} -> ${request.proposed_dose}`);

      return res.status(200).json({
        success: true,
        status: 'applied',
        applied: true,
        new_protocol_id: protocol.id,
        secondary_medication_name: targetName,
      });
    }

    // 3. Apply the dose change (close old protocol, create new one)
    const newIpw = request.proposed_injections_per_week || protocol.injections_per_week || 2;
    const newDosePerInj = parseMlFromDose(request.proposed_dose);

    // Calculate remaining supply on old protocol
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

    // Close old protocol
    const closeNotes = `Closed ${effDate} — dose changed to ${request.proposed_dose} (approved by ${request.provider_name})${remainingMl != null ? `. ${remainingMl}ml carried to new protocol.` : ''}`;

    const closeResult = await closeProtocol(request.protocol_id, 'historic', {
      endDate: effDate,
      notes: closeNotes,
    });

    if (!closeResult.success) {
      console.error('Failed to close old protocol:', closeResult.error);
      return res.status(200).json({
        success: true,
        status: 'approved',
        applied: false,
        error: `Approved but failed to close old protocol: ${closeResult.error}`,
      });
    }

    // Calculate next expected date
    let nextExpectedDate = null;
    const newVialMl = vialMlFromSupplyType(protocol.supply_type);
    if (newVialMl && newDosePerInj > 0 && newIpw > 0) {
      const supplyMl = remainingMl != null ? remainingMl : newVialMl;
      const supplyDays = Math.round((supplyMl / (newDosePerInj * newIpw)) * 7);
      const nextDate = new Date(effDate + 'T12:00:00');
      nextDate.setDate(nextDate.getDate() + supplyDays);
      nextExpectedDate = nextDate.toISOString().split('T')[0];
    }

    // Create new protocol with the approved dose
    const result = await createProtocol({
      patient_id: protocol.patient_id,
      program_type: protocol.program_type,
      program_name: protocol.program_name,
      medication: protocol.medication,
      hrt_type: protocol.hrt_type,
      delivery_method: protocol.delivery_method,
      supply_type: protocol.supply_type,
      vial_size: protocol.vial_size,
      injection_method: protocol.injection_method,
      hrt_reminders_enabled: protocol.hrt_reminders_enabled,
      hrt_reminder_schedule: protocol.hrt_reminder_schedule,
      first_followup_weeks: protocol.first_followup_weeks,
      secondary_medications: protocol.secondary_medications,
      selected_dose: request.proposed_dose,
      injections_per_week: newIpw,
      dose_per_injection: newDosePerInj,
      start_date: effDate,
      last_refill_date: effDate,
      next_expected_date: nextExpectedDate,
      parent_protocol_id: request.protocol_id,
      dose_change_reason: request.reason || `Approved by ${request.provider_name}`,
      starting_supply_ml: remainingMl,
      dose_history: [{
        date: effDate,
        dose: request.proposed_dose,
        injections_per_week: newIpw,
        notes: `Dose ${request.change_type} approved by ${request.provider_name}`,
        approval_request_id: request.id,
      }],
    }, {
      source: 'dose-change-approval',
      parentProtocolId: request.protocol_id,
      skipDuplicateCheck: true,
    });

    if (!result.success) {
      // Rollback the close
      await supabase
        .from('protocols')
        .update({ status: protocol.status, end_date: protocol.end_date })
        .eq('id', request.protocol_id);

      return res.status(200).json({
        success: true,
        status: 'approved',
        applied: false,
        error: `Approved but failed to create new protocol: ${result.error}`,
      });
    }

    // 4. Mark request as applied
    await supabase
      .from('dose_change_requests')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString(),
        new_protocol_id: result.protocol.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    console.log(`Dose change APPROVED & APPLIED by ${request.provider_name} for ${request.patient_name}: ${request.current_dose} -> ${request.proposed_dose}`);

    return res.status(200).json({
      success: true,
      status: 'applied',
      applied: true,
      new_protocol_id: result.protocol.id,
      carried_supply_ml: remainingMl,
    });

  } catch (err) {
    console.error('Dose change approval error:', err);
    return res.status(500).json({ error: err.message });
  }
}
