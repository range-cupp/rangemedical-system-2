// /pages/api/cron/generate-follow-ups.js
// Auto-generate follow-up items for the Follow-Up Hub
// Run daily via Vercel Cron (14:15 UTC = 7:15 AM PT)
// 7 trigger types: peptide_renewal, protocol_ending, wl_payment_due,
//   labs_ready, session_verification, lead_stale, inactive_patient
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { PEPTIDE_PROGRAM_TYPES, WEIGHT_LOSS_PROGRAM_TYPES } from '../../../lib/protocol-config';

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

    // ── 3. WEIGHT LOSS PAYMENT DUE (within 7 days) ──
    try {
      const { data: wlProtocols } = await supabase
        .from('protocols')
        .select('id, patient_id, patient_name, program_name, medication, next_expected_date, last_payment_date, last_refill_date, start_date, comp')
        .eq('status', 'active')
        .neq('comp', true)
        .in('program_type', WEIGHT_LOSS_PROGRAM_TYPES);

      if (wlProtocols) {
        for (const p of wlProtocols) {
          // Calculate next payment date using priority chain:
          // next_expected_date > last_payment_date + 28d > last_refill_date + 28d > start_date + 28d
          let nextPayDate = null;
          if (p.next_expected_date) {
            nextPayDate = new Date(p.next_expected_date + 'T00:00:00');
          } else if (p.last_payment_date) {
            nextPayDate = new Date(p.last_payment_date + 'T00:00:00');
            nextPayDate.setDate(nextPayDate.getDate() + 28);
          } else if (p.last_refill_date) {
            nextPayDate = new Date(p.last_refill_date + 'T00:00:00');
            nextPayDate.setDate(nextPayDate.getDate() + 28);
          } else if (p.start_date) {
            nextPayDate = new Date(p.start_date + 'T00:00:00');
            nextPayDate.setDate(nextPayDate.getDate() + 28);
          }

          if (!nextPayDate) continue;

          const daysUntil = Math.ceil((nextPayDate - today) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 7) {
            const med = p.medication || p.program_name;
            const reason = daysUntil <= 0
              ? `${med} monthly payment is overdue (was due ${nextPayDate.toISOString().split('T')[0]})`
              : `${med} monthly payment due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;

            const created = await createFollowUp({
              patient_id: p.patient_id,
              patient_name: p.patient_name,
              protocol_id: p.id,
              type: 'wl_payment_due',
              trigger_reason: reason,
              priority: daysUntil <= 0 ? 'urgent' : daysUntil <= 3 ? 'high' : 'medium',
              due_date: daysUntil <= 0 ? todayStr : nextPayDate.toISOString().split('T')[0],
            });
            if (created) counts.wl_payment_due++;
          }
        }
      }
    } catch (e) {
      console.error('WL payment error:', e);
      errors.push(`wl_payment_due: ${e.message}`);
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

    // ── 5. SESSION VERIFICATION (appointments today without service logs) ──
    try {
      const todayStart = todayStr + 'T00:00:00.000Z';
      const todayEnd = todayStr + 'T23:59:59.999Z';

      const { data: todayAppts } = await supabase
        .from('appointments')
        .select('id, patient_id, patient_name, service_name')
        .eq('status', 'completed')
        .gte('start_time', todayStart)
        .lte('start_time', todayEnd);

      if (todayAppts) {
        for (const appt of todayAppts) {
          if (!appt.patient_id) continue;

          // Check if there's a matching service_log for this patient today
          const { data: logs } = await supabase
            .from('service_logs')
            .select('id')
            .eq('patient_id', appt.patient_id)
            .eq('entry_date', todayStr)
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

    const totalCreated = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`Follow-ups generated: ${totalCreated}`, counts);

    return res.status(200).json({
      success: true,
      created: totalCreated,
      counts,
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
