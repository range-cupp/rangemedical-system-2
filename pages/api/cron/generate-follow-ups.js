// /pages/api/cron/generate-follow-ups.js
// Auto-generate follow-up items for the Follow-Up Hub
// Run daily via Vercel Cron (14:15 UTC = 7:15 AM PT)
// 8 trigger types: peptide_renewal, protocol_ending, wl_payment_due,
//   refill_due_soon, labs_ready, session_verification, lead_stale, inactive_patient
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { PEPTIDE_PROGRAM_TYPES, WEIGHT_LOSS_PROGRAM_TYPES } from '../../../lib/protocol-config';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const counts = {
    peptide_renewal: 0,
    protocol_ending: 0,
    wl_payment_due: 0,
    refill_due_soon: 0,
    labs_ready: 0,
    session_verification: 0,
    lead_stale: 0,
    inactive_patient: 0,
  };
  const errors = [];

  try {
    // ── 1. PEPTIDE RENEWAL (70% through protocol) ──
    try {
      const { data: peptideProtocols } = await supabase
        .from('protocols')
        .select('id, patient_id, patient_name, program_name, program_type, start_date, end_date')
        .eq('status', 'active')
        .in('program_type', PEPTIDE_PROGRAM_TYPES)
        .not('end_date', 'is', null);

      if (peptideProtocols) {
        for (const p of peptideProtocols) {
          const startDate = new Date(p.start_date + 'T00:00:00');
          const endDate = new Date(p.end_date + 'T00:00:00');
          const durationDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
          if (durationDays <= 0) continue;
          const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
          const pctComplete = daysElapsed / durationDays;

          if (pctComplete >= 0.7 && pctComplete < 1.0) {
            const created = await createFollowUp({
              patient_id: p.patient_id,
              patient_name: p.patient_name,
              protocol_id: p.id,
              type: 'peptide_renewal',
              trigger_reason: `${p.program_name} is ${Math.round(pctComplete * 100)}% complete (day ${daysElapsed} of ${durationDays}) — time to discuss renewal`,
              priority: 'high',
              due_date: todayStr,
            });
            if (created) counts.peptide_renewal++;
          }
        }
      }
    } catch (e) {
      console.error('Peptide renewal error:', e);
      errors.push(`peptide_renewal: ${e.message}`);
    }

    // ── 2. PROTOCOL ENDING SOON (within 7 days) ──
    try {
      const sevenDaysOut = new Date(today);
      sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
      const sevenDaysStr = sevenDaysOut.toISOString().split('T')[0];

      const { data: endingProtocols } = await supabase
        .from('protocols')
        .select('id, patient_id, patient_name, program_name, program_type, end_date')
        .eq('status', 'active')
        .gte('end_date', todayStr)
        .lte('end_date', sevenDaysStr);

      if (endingProtocols) {
        for (const p of endingProtocols) {
          // Skip if this protocol already has a peptide_renewal follow-up
          if (PEPTIDE_PROGRAM_TYPES.includes(p.program_type)) {
            const { data: existing } = await supabase
              .from('follow_ups')
              .select('id')
              .eq('patient_id', p.patient_id)
              .eq('protocol_id', p.id)
              .eq('type', 'peptide_renewal')
              .in('status', ['pending', 'in_progress'])
              .limit(1);
            if (existing && existing.length > 0) continue;
          }

          const endDate = new Date(p.end_date + 'T00:00:00');
          const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          const dueDateObj = new Date(endDate);
          dueDateObj.setDate(dueDateObj.getDate() - 3);
          const dueStr = dueDateObj < today ? todayStr : dueDateObj.toISOString().split('T')[0];

          const created = await createFollowUp({
            patient_id: p.patient_id,
            patient_name: p.patient_name,
            protocol_id: p.id,
            type: 'protocol_ending',
            trigger_reason: `${p.program_name} ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${p.end_date})`,
            priority: daysLeft <= 3 ? 'high' : 'medium',
            due_date: dueStr,
          });
          if (created) counts.protocol_ending++;
        }
      }
    } catch (e) {
      console.error('Protocol ending error:', e);
      errors.push(`protocol_ending: ${e.message}`);
    }

    // ── 3. WEIGHT LOSS REFILL/PAYMENT DUE ──
    // In-clinic: count injections in service_logs since last WL purchase; fire when
    //   the patient has 1 or fewer injections left in their paid block (block size
    //   comes from purchases.quantity, defaults to 4).
    // Take-home: anchor on last_refill_date (set by Mark as Shipped); fire when
    //   today >= anchor + 21 (28-day supply minus 7-day warning).
    // Includes comp protocols — they still need refill tracking even with no payment.
    try {
      const { data: wlProtocols } = await supabase
        .from('protocols')
        .select('id, patient_id, patient_name, program_name, medication, delivery_method, last_refill_date, start_date, comp')
        .eq('status', 'active')
        .in('program_type', WEIGHT_LOSS_PROGRAM_TYPES);

      if (wlProtocols) {
        for (const p of wlProtocols) {
          let shouldFire = false;
          let reason = '';
          const med = p.medication || p.program_name;
          const compTag = p.comp ? ' [COMP]' : '';

          if (p.delivery_method === 'in_clinic') {
            // Find most recent WL purchase tied to this protocol (or patient+category fallback)
            let purchase = null;
            const { data: tied } = await supabase
              .from('purchases')
              .select('purchase_date, quantity')
              .eq('protocol_id', p.id)
              .order('purchase_date', { ascending: false })
              .limit(1);
            if (tied && tied.length > 0) {
              purchase = tied[0];
            } else {
              const { data: byPatient } = await supabase
                .from('purchases')
                .select('purchase_date, quantity')
                .eq('patient_id', p.patient_id)
                .ilike('category', '%weight%')
                .order('purchase_date', { ascending: false })
                .limit(1);
              if (byPatient && byPatient.length > 0) purchase = byPatient[0];
            }

            // Comp patients won't have a purchase — anchor to start_date and assume 4-block.
            // WL is billed in 4-injection blocks by default. POS data often records each
            // visit as qty=1 even when the patient prepaid for a multi-injection block,
            // so anything <= 1 falls back to the 4-block standard.
            const blockStart = purchase?.purchase_date || p.start_date;
            const blockSize = (purchase?.quantity && purchase.quantity > 1) ? purchase.quantity : 4;
            if (!blockStart) continue;

            const { count } = await supabase
              .from('service_logs')
              .select('id', { count: 'exact', head: true })
              .eq('protocol_id', p.id)
              .eq('entry_type', 'injection')
              .gte('entry_date', blockStart);

            const injectionsInBlock = count || 0;
            if (injectionsInBlock >= blockSize - 1) {
              shouldFire = true;
              const remaining = blockSize - injectionsInBlock;
              reason = remaining <= 0
                ? `${med}${compTag}: block complete (${injectionsInBlock}/${blockSize}). Collect payment before next injection.`
                : `${med}${compTag}: ${injectionsInBlock} of ${blockSize} injections done. Time to collect for next block.`;
            }
          } else if (p.delivery_method === 'take_home') {
            const anchor = p.last_refill_date || p.start_date;
            if (!anchor) continue;
            const anchorDate = new Date(anchor + 'T00:00:00');
            const triggerDate = new Date(anchorDate);
            triggerDate.setDate(triggerDate.getDate() + 21); // 28 - 7
            if (today >= triggerDate) {
              const dueDate = new Date(anchorDate);
              dueDate.setDate(dueDate.getDate() + 28);
              const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              shouldFire = true;
              reason = daysLeft <= 0
                ? `${med}${compTag} take-home OVERDUE by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} (last shipped ${anchor})`
                : `${med}${compTag} take-home refill due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (last shipped ${anchor})`;
            }
          }

          if (shouldFire) {
            const created = await createFollowUp({
              patient_id: p.patient_id,
              patient_name: p.patient_name,
              protocol_id: p.id,
              type: 'wl_payment_due',
              trigger_reason: reason,
              priority: 'high',
              due_date: todayStr,
            });
            if (created) counts.wl_payment_due++;
          }
        }
      }
    } catch (e) {
      console.error('WL refill/payment error:', e);
      errors.push(`wl_payment_due: ${e.message}`);
    }

    // ── 3b. HRT REFILL DUE (mail-order + in-clinic) ──
    // Anchor on last_refill_date (set by Mark as Shipped or Mark New Vial), fall back
    // to start_date. supply_days from vial math; fall back to supply_type defaults.
    // Includes comp protocols — they still need refill tracking.
    try {
      const { data: hrtProtocols } = await supabase
        .from('protocols')
        .select('id, patient_id, patient_name, program_name, medication, delivery_method, supply_type, supply_days, last_refill_date, start_date, comp')
        .eq('status', 'active')
        .eq('program_type', 'hrt');

      if (hrtProtocols) {
        for (const p of hrtProtocols) {
          const anchor = p.last_refill_date || p.start_date;
          if (!anchor) continue;

          let supplyDays = p.supply_days;
          if (!supplyDays || supplyDays <= 0) {
            const supply = (p.supply_type || '').toLowerCase();
            if (supply === 'prefilled_1week') supplyDays = 7;
            else if (supply === 'prefilled_2week') supplyDays = 14;
            else if (supply === 'prefilled_4week' || supply === 'prefilled') supplyDays = 28;
            else if (supply.startsWith('vial_5')) supplyDays = 42;
            else if (supply.startsWith('vial')) supplyDays = 84;
            else if (supply.includes('oral')) supplyDays = 30;
            else supplyDays = 28;
          }

          const anchorDate = new Date(anchor + 'T00:00:00');
          const triggerDate = new Date(anchorDate);
          triggerDate.setDate(triggerDate.getDate() + supplyDays - 7);

          if (today >= triggerDate) {
            const dueDate = new Date(anchorDate);
            dueDate.setDate(dueDate.getDate() + supplyDays);
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            const med = p.medication || p.program_name;
            const compTag = p.comp ? ' [COMP]' : '';
            const event = p.delivery_method === 'in_clinic' ? 'new vial' : 'refill';
            const reason = daysLeft <= 0
              ? `${med}${compTag} ${event} OVERDUE by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} (anchor ${anchor}, ${supplyDays}-day supply)`
              : `${med}${compTag} ${event} due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (anchor ${anchor}, ${supplyDays}-day supply)`;

            const created = await createFollowUp({
              patient_id: p.patient_id,
              patient_name: p.patient_name,
              protocol_id: p.id,
              type: 'refill_due_soon',
              trigger_reason: reason,
              priority: 'high',
              due_date: todayStr,
            });
            if (created) counts.refill_due_soon++;
          }
        }
      }
    } catch (e) {
      console.error('HRT refill due error:', e);
      errors.push(`refill_due_soon: ${e.message}`);
    }

    // ── 4. LABS READY (results uploaded, not reviewed) ──
    try {
      // Labs linked to protocols in 'uploaded' status = results in, not yet reviewed
      const { data: labProtocols } = await supabase
        .from('protocols')
        .select('id, patient_id, patient_name, program_name')
        .eq('status', 'uploaded');

      if (labProtocols) {
        for (const p of labProtocols) {
          const created = await createFollowUp({
            patient_id: p.patient_id,
            patient_name: p.patient_name,
            protocol_id: p.id,
            type: 'labs_ready',
            trigger_reason: `${p.program_name} — lab results uploaded, needs review`,
            priority: 'medium',
            due_date: todayStr,
          });
          if (created) counts.labs_ready++;
        }
      }

      // Also check the labs table directly for results_ready labs
      const { data: readyLabs } = await supabase
        .from('labs')
        .select('id, patient_id, lab_type, created_at')
        .eq('status', 'results_ready');

      if (readyLabs) {
        for (const lab of readyLabs) {
          // Get patient name
          const { data: patient } = await supabase
            .from('patients')
            .select('name')
            .eq('id', lab.patient_id)
            .single();

          const created = await createFollowUp({
            patient_id: lab.patient_id,
            patient_name: patient?.name || 'Unknown',
            protocol_id: null,
            type: 'labs_ready',
            trigger_reason: `${lab.lab_type || 'Lab'} results ready — needs review`,
            priority: 'medium',
            due_date: todayStr,
          });
          if (created) counts.labs_ready++;
        }
      }
    } catch (e) {
      console.error('Labs ready error:', e);
      errors.push(`labs_ready: ${e.message}`);
    }

    // ── 5. SESSION VERIFICATION (yesterday's appointments without service logs) ──
    // Check yesterday (Pacific) since the cron runs early morning and we want to verify
    // that appointments from the previous business day were properly logged.
    try {
      // Yesterday in Pacific time
      const yesterdayPT = new Date(today.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      yesterdayPT.setDate(yesterdayPT.getDate() - 1);
      const yesterdayStr = yesterdayPT.toISOString().split('T')[0];

      // Query appointments from yesterday (Pacific) — use UTC range that covers the full Pacific day
      const yesterdayStartUTC = new Date(yesterdayStr + 'T07:00:00.000Z'); // midnight PT = 7 AM UTC
      const yesterdayEndUTC = new Date(yesterdayStr + 'T07:00:00.000Z');
      yesterdayEndUTC.setDate(yesterdayEndUTC.getDate() + 1); // next day 7 AM UTC = midnight PT

      const { data: yesterdayAppts } = await supabase
        .from('appointments')
        .select('id, patient_id, patient_name, service_name')
        .eq('status', 'completed')
        .gte('start_time', yesterdayStartUTC.toISOString())
        .lt('start_time', yesterdayEndUTC.toISOString());

      if (yesterdayAppts) {
        for (const appt of yesterdayAppts) {
          if (!appt.patient_id) continue;

          // Check if there's a matching service_log for this patient on the appointment date (Pacific)
          const { data: logs } = await supabase
            .from('service_logs')
            .select('id')
            .eq('patient_id', appt.patient_id)
            .eq('entry_date', yesterdayStr)
            .limit(1);

          if (!logs || logs.length === 0) {
            const created = await createFollowUp({
              patient_id: appt.patient_id,
              patient_name: appt.patient_name,
              protocol_id: null,
              type: 'session_verification',
              trigger_reason: `${appt.service_name} appointment completed — no service log found. Verify protocol was updated.`,
              priority: 'urgent',
              due_date: todayStr,
            });
            if (created) counts.session_verification++;
          }
        }
      }
    } catch (e) {
      console.error('Session verification error:', e);
      errors.push(`session_verification: ${e.message}`);
    }

    // ── 6. LEAD STALE (3+ days without activity) ──
    try {
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysStr = threeDaysAgo.toISOString();

      const { data: staleLeads } = await supabase
        .from('sales_pipeline')
        .select('id, first_name, last_name, stage, source, updated_at, patient_id')
        .in('stage', ['new_lead', 'contacted', 'follow_up'])
        .lt('updated_at', threeDaysStr);

      if (staleLeads) {
        for (const lead of staleLeads) {
          const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';
          const daysSince = Math.floor((today - new Date(lead.updated_at)) / (1000 * 60 * 60 * 24));
          const patientId = lead.patient_id;

          // Need a patient_id for follow_ups FK — skip if no patient_id linked
          if (!patientId) continue;

          const created = await createFollowUp({
            patient_id: patientId,
            patient_name: name,
            protocol_id: null,
            type: 'lead_stale',
            trigger_reason: `Lead in "${lead.stage}" stage for ${daysSince} days (source: ${lead.source || 'unknown'})`,
            priority: daysSince >= 7 ? 'high' : 'medium',
            due_date: todayStr,
          });
          if (created) counts.lead_stale++;
        }
      }
    } catch (e) {
      console.error('Lead stale error:', e);
      errors.push(`lead_stale: ${e.message}`);
    }

    // ── 7. INACTIVE PATIENT (60+ days, had protocols before) ──
    try {
      const sixtyDaysAgo = new Date(today);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const sixtyDaysStr = sixtyDaysAgo.toISOString().split('T')[0];

      // Find patients with completed protocols but no active protocols
      const { data: patientsWithCompleted } = await supabase
        .from('protocols')
        .select('patient_id, patient_name')
        .eq('status', 'completed');

      if (patientsWithCompleted) {
        // Deduplicate patient_ids
        const patientMap = {};
        for (const p of patientsWithCompleted) {
          if (!patientMap[p.patient_id]) {
            patientMap[p.patient_id] = p.patient_name;
          }
        }

        for (const [patientId, patientName] of Object.entries(patientMap)) {
          // Skip if patient has any active protocol
          const { data: activeProts } = await supabase
            .from('protocols')
            .select('id')
            .eq('patient_id', patientId)
            .eq('status', 'active')
            .limit(1);

          if (activeProts && activeProts.length > 0) continue;

          // Check last service_log
          const { data: lastLog } = await supabase
            .from('service_logs')
            .select('entry_date')
            .eq('patient_id', patientId)
            .order('entry_date', { ascending: false })
            .limit(1);

          const lastVisitDate = lastLog?.[0]?.entry_date;
          if (lastVisitDate && lastVisitDate >= sixtyDaysStr) continue;

          const daysSince = lastVisitDate
            ? Math.floor((today - new Date(lastVisitDate + 'T00:00:00')) / (1000 * 60 * 60 * 24))
            : null;

          const reason = daysSince
            ? `No active protocols. Last visit ${daysSince} days ago (${lastVisitDate})`
            : `No active protocols. No recorded visits.`;

          const created = await createFollowUp({
            patient_id: patientId,
            patient_name: patientName || 'Unknown',
            protocol_id: null,
            type: 'inactive_patient',
            trigger_reason: reason,
            priority: 'low',
            due_date: todayStr,
          });
          if (created) counts.inactive_patient++;
        }
      }
    } catch (e) {
      console.error('Inactive patient error:', e);
      errors.push(`inactive_patient: ${e.message}`);
    }

    // ── 8. MORNING DIGEST SMS — single message per assignee, no PHI ──
    // After all sections insert their rows, send Damon and Tara ONE SMS each
    // summarizing today's pending queue. Counts only — no patient names, no
    // medications, no protocol IDs. Skips entirely if there's nothing due.
    let digestSent = 0;
    try {
      const { data: pendingToday } = await supabase
        .from('follow_ups')
        .select('type')
        .eq('status', 'pending')
        .lte('due_date', todayStr);

      const dueCount = pendingToday?.length || 0;

      if (dueCount > 0) {
        const TYPE_LABEL = {
          refill_due_soon: 'HRT refills',
          wl_payment_due: 'WL refills',
          peptide_renewal: 'peptide renewals',
          protocol_ending: 'protocols ending',
          labs_ready: 'labs to review',
          session_verification: 'session verifications',
          lead_stale: 'stale leads',
          inactive_patient: 'inactive patients',
          custom: 'manual tasks',
        };

        const byType = {};
        for (const f of pendingToday) {
          byType[f.type] = (byType[f.type] || 0) + 1;
        }
        const breakdown = Object.entries(byType)
          .sort((a, b) => b[1] - a[1])
          .map(([type, n]) => `${n} ${TYPE_LABEL[type] || type}`)
          .join(', ');

        const { data: digestStaff } = await supabase
          .from('employees')
          .select('id, name, phone, email')
          .in('email', ['damon@range-medical.com', 'tara@range-medical.com'])
          .eq('is_active', true);

        for (const staff of digestStaff || []) {
          if (!staff.phone) continue;
          const firstName = (staff.name || '').split(' ')[0] || 'there';
          const message =
            `Good morning ${firstName} — ${dueCount} follow-up${dueCount === 1 ? '' : 's'} ` +
            `in your queue today: ${breakdown}. ` +
            `Open the hub: https://app.range-medical.com/admin/follow-ups`;

          const result = await sendSMS({
            to: normalizePhone(staff.phone),
            message,
            log: {
              messageType: 'follow_up_digest',
              source: 'generate-follow-ups',
            },
          });
          if (result?.success) digestSent++;
        }
      }
    } catch (e) {
      console.error('Morning digest SMS error:', e);
      errors.push(`digest_sms: ${e.message}`);
    }

    const totalCreated = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`Follow-ups generated: ${totalCreated} | digest SMS sent: ${digestSent}`, counts);

    return res.status(200).json({
      success: true,
      created: totalCreated,
      counts,
      digest_sent: digestSent,
      errors: errors.length > 0 ? errors : undefined,
      run_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Generate follow-ups error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}

/**
 * Create a follow-up with deduplication.
 * Returns true if created, false if duplicate exists.
 */
async function createFollowUp({ patient_id, patient_name, protocol_id, type, trigger_reason, priority, due_date }) {
  // Resolve patient name if missing
  let resolvedName = patient_name;
  if (!resolvedName || resolvedName === 'Unknown') {
    const { data: patient } = await supabase
      .from('patients')
      .select('name')
      .eq('id', patient_id)
      .single();
    resolvedName = patient?.name || 'Unknown';
  }

  // Check for existing pending/in_progress follow-up with same patient + type + protocol
  const query = supabase
    .from('follow_ups')
    .select('id')
    .eq('patient_id', patient_id)
    .eq('type', type)
    .in('status', ['pending', 'in_progress']);

  if (protocol_id) {
    query.eq('protocol_id', protocol_id);
  } else {
    query.is('protocol_id', null);
  }

  const { data: existing } = await query.limit(1);
  if (existing && existing.length > 0) return false;

  const { error } = await supabase.from('follow_ups').insert({
    patient_id,
    patient_name: resolvedName,
    protocol_id,
    type,
    trigger_reason,
    status: 'pending',
    priority,
    due_date,
  });

  if (error) {
    console.error(`Failed to create ${type} follow-up for ${patient_name}:`, error);
    return false;
  }
  return true;
}
