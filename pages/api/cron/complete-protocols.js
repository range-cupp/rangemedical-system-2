// /pages/api/cron/complete-protocols.js
// Auto-complete protocols that have passed their end date
// Run daily via Vercel Cron or external scheduler
// No quiet-hours gate — DB-only operation, no patient comms
// Supports ?force=true for manual testing
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { PEPTIDE_PROGRAM_TYPES, IV_PROGRAM_TYPES } from '../../../lib/protocol-config';

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
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let completed = 0;
  let activated = 0;
  let peptideTasksCreated = 0;
  let errors = [];

  try {
    // Find active protocols where end_date is yesterday or earlier
    // Exclude weight_loss and hrt — those need manual follow-up for renewals
    // Peptides ARE included — they auto-complete so check-in texts stop
    const { data: expiredProtocols, error: fetchError } = await supabase
      .from('protocols')
      .select('id, program_name, program_type, end_date, patient_id')
      .eq('status', 'active')
      .not('program_type', 'like', 'weight_loss%')
      .not('program_type', 'like', 'hrt%')
      .lte('end_date', yesterdayStr);

    if (fetchError) {
      console.error('Error fetching expired protocols:', fetchError);
      errors.push(fetchError.message);
    }

    // Pre-fetch Tara's employee ID for peptide follow-up tasks
    let peptideTaskStaff = [];
    const { data: staffEmployees } = await supabase
      .from('employees')
      .select('id, email')
      .eq('email', 'tara@range-medical.com');
    if (staffEmployees) {
      peptideTaskStaff = staffEmployees.map(e => e.id);
    }

    if (expiredProtocols && expiredProtocols.length > 0) {
      console.log(`Found ${expiredProtocols.length} protocols to complete`);

      // Update each to completed
      for (const protocol of expiredProtocols) {
        const { error: updateError } = await supabase
          .from('protocols')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', protocol.id);

        if (updateError) {
          console.error(`Failed to complete protocol ${protocol.id}:`, updateError);
          errors.push(`${protocol.program_name} (${protocol.id}): ${updateError.message}`);
        } else {
          console.log(`Completed: ${protocol.program_name} (ended ${protocol.end_date})`);
          completed++;

        }
      }
    }

    // ── ACTIVATE QUEUED PROTOCOLS ──
    // When a protocol completes, check if there's a queued protocol for the same
    // patient + medication waiting to start. If its start_date is today or earlier, activate it.
    const todayStr = today.toISOString().split('T')[0];
    const { data: queuedProtocols, error: queuedError } = await supabase
      .from('protocols')
      .select('id, patient_id, program_type, medication, start_date, program_name')
      .eq('status', 'queued')
      .lte('start_date', todayStr);

    if (queuedError) {
      console.error('Error fetching queued protocols:', queuedError);
      errors.push(queuedError.message);
    }

    if (queuedProtocols && queuedProtocols.length > 0) {
      for (const queued of queuedProtocols) {
        const { error: activateError } = await supabase
          .from('protocols')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', queued.id);

        if (activateError) {
          console.error(`Failed to activate queued protocol ${queued.id}:`, activateError);
          errors.push(`Activate ${queued.program_name} (${queued.id}): ${activateError.message}`);
        } else {
          console.log(`Activated queued protocol: ${queued.program_name} for patient ${queued.patient_id} (start_date: ${queued.start_date})`);
          activated++;
        }
      }
    }

    // Peptide renewal tasks: when a peptide protocol was just completed above,
    // create a follow-up task for staff to reach out about renewal
    if (peptideTaskStaff.length > 0 && expiredProtocols && expiredProtocols.length > 0) {
      const completedPeptides = expiredProtocols.filter(p =>
        p.program_type === 'peptide' || p.program_type === 'gh_peptide' || p.program_type === 'peptide_vial'
      );

      for (const protocol of completedPeptides) {
        // Skip if patient already has a newer active peptide protocol (they renewed)
        const { data: newerPeptides } = await supabase
          .from('protocols')
          .select('id')
          .eq('patient_id', protocol.patient_id)
          .in('program_type', PEPTIDE_PROGRAM_TYPES)
          .eq('status', 'active')
          .gt('start_date', protocol.end_date)
          .limit(1);

        if (newerPeptides && newerPeptides.length > 0) {
          console.log(`Skipping renewal task for ${protocol.patient_id} — already has newer active peptide protocol`);
          continue;
        }

        // Check if follow-up task already exists to avoid duplicates
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('patient_id', protocol.patient_id)
          .ilike('title', `%Peptide Renewal%`)
          .eq('status', 'pending')
          .limit(1);

        if (existingTasks && existingTasks.length > 0) continue;

        const { data: patient } = await supabase
          .from('patients')
          .select('id, name, first_name, last_name')
          .eq('id', protocol.patient_id)
          .single();

        const patientName = patient?.name
          || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()
          || 'Unknown';

        for (const empId of peptideTaskStaff) {
          await supabase.from('tasks').insert({
            title: `Peptide Renewal: Call ${patientName} — ${protocol.program_name}`,
            description: `${patientName}'s ${protocol.program_name} ended ${protocol.end_date}. Follow up to discuss renewal and next steps.`,
            assigned_to: empId,
            assigned_by: empId,
            patient_id: protocol.patient_id,
            patient_name: patientName,
            priority: 'medium',
            status: 'pending',
          });
          peptideTasksCreated++;
        }
        console.log(`Peptide renewal task created for ${patientName} — ${protocol.program_name}`);
      }
    }

    // Also complete single-session IV protocols that are fully used up
    // These are single IVs that shouldn't be long-running protocols
    const { data: usedUpIVs, error: ivError } = await supabase
      .from('protocols')
      .select('id, program_name, total_sessions, sessions_used')
      .eq('status', 'active')
      .in('program_type', IV_PROGRAM_TYPES)
      .not('total_sessions', 'is', null)
      .filter('total_sessions', 'lte', 1);

    if (ivError) {
      console.error('Error fetching single IV protocols:', ivError);
    }

    if (usedUpIVs && usedUpIVs.length > 0) {
      for (const protocol of usedUpIVs) {
        if ((protocol.sessions_used || 0) >= (protocol.total_sessions || 1)) {
          const { error: updateErr } = await supabase
            .from('protocols')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', protocol.id);
          if (!updateErr) {
            console.log(`Completed single IV: ${protocol.program_name}`);
            completed++;
          }
        }
      }
    }

    // Pipeline automation: mark treatment cards completed for protocols that just ended,
    // and surface any pre-created follow-up cards whose scheduled_for has passed.
    try {
      const { data: completedToday } = await supabase
        .from('protocols')
        .select('id, patient_id, program_type')
        .eq('status', 'completed')
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { sb, moveCard, pipelineForProgramType } = await import('../../../lib/pipelines-server');
      const pipeSb = sb();
      for (const p of completedToday || []) {
        const { data: cards } = await pipeSb
          .from('pipeline_cards')
          .select('id, stage, status')
          .eq('protocol_id', p.id)
          .eq('status', 'active');
        const pipelineKey = pipelineForProgramType(p.program_type);
        for (const card of cards || []) {
          if (pipelineKey && card.stage !== 'completed') {
            await moveCard({
              card_id: card.id,
              to_stage: 'completed',
              to_status: 'completed',
              triggered_by: 'automation',
              automation_reason: 'protocol_end_date_reached',
            });
          }
        }
      }

      // Surface due follow-up cards: scheduled → active
      const nowIso = new Date().toISOString();
      const { data: dueFollowups } = await pipeSb
        .from('pipeline_cards')
        .select('id')
        .eq('pipeline', 'follow_up')
        .eq('status', 'scheduled')
        .lte('scheduled_for', nowIso);
      for (const card of dueFollowups || []) {
        await moveCard({
          card_id: card.id,
          to_status: 'active',
          triggered_by: 'automation',
          automation_reason: 'follow_up_due',
        });
      }
    } catch (pipeErr) {
      console.error('Pipeline completion sweep error:', pipeErr.message);
    }

    return res.status(200).json({
      success: true,
      completed,
      activated,
      peptideTasksCreated,
      errors: errors.length > 0 ? errors : undefined,
      checked_date: yesterdayStr,
      run_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
}
