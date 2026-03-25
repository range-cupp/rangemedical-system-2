// /pages/api/cron/journey-notifications.js
// Send SMS/email notifications when patients enter new journey stages
// Runs hourly, picks up recent stage transitions
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import { getRecentTransitions } from '../../../lib/journey-engine';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Stage-specific notification messages
// Only stages listed here will trigger a notification
const STAGE_NOTIFICATIONS = {
  // HRT
  baseline_labs: {
    sms: (name) => `Hi ${name}, your baseline labs have been ordered. Please schedule your blood draw at your earliest convenience. Call us at (949) 997-3988 or book online.`,
    subject: 'Baseline Labs Ordered — Range Medical',
  },
  protocol_started: {
    sms: (name) => `Hi ${name}, your HRT protocol is now active! Remember to follow your dosing schedule. Contact us with any questions: (949) 997-3988.`,
    subject: 'Protocol Started — Range Medical',
  },
  week4_checkin: {
    sms: (name) => `Hi ${name}, it's been 4 weeks on your HRT protocol. How are you feeling? Reply to this message or call (949) 997-3988 to discuss your progress.`,
    subject: '4-Week Check-in — Range Medical',
  },
  week8_labs: {
    sms: (name) => `Hi ${name}, it's time for your 8-week follow-up labs. Please schedule your blood draw. Book online or call (949) 997-3988.`,
    subject: '8-Week Labs — Range Medical',
  },
  renewal: {
    sms: (name) => `Hi ${name}, your protocol is coming up for renewal. Please contact us to discuss continuing your treatment: (949) 997-3988.`,
    subject: 'Protocol Renewal — Range Medical',
  },

  // Weight Loss
  midpoint: {
    sms: (name) => `Hi ${name}, you've reached the midpoint of your weight loss program! Let's check in on your progress. Call (949) 997-3988 or reply here.`,
    subject: 'Midpoint Check — Range Medical',
  },
  target_dose: {
    sms: (name) => `Hi ${name}, great news — you've reached your target dose! We'll continue monitoring your progress. Contact us anytime: (949) 997-3988.`,
    subject: 'Target Dose Reached — Range Medical',
  },
  completion: {
    sms: (name) => `Hi ${name}, your weight loss protocol is nearing completion. Let's discuss your results and next steps. Call (949) 997-3988 to schedule.`,
    subject: 'Program Completion — Range Medical',
  },

  // Peptide — no automated SMS; tasks are created for Tara instead (see below)

  // Session-based (HBOT, RLT, IV)
  completing: {
    sms: (name) => `Hi ${name}, you're in the final stretch of your sessions! Make sure to schedule your remaining appointments. Call (949) 997-3988.`,
    subject: 'Sessions Completing — Range Medical',
  },
};

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

  try {
    // Get recent stage transitions (last 2 hours to account for timing overlap)
    const transitions = await getRecentTransitions(2);

    if (transitions.length === 0) {
      return res.status(200).json({
        success: true,
        notified: 0,
        message: 'No recent stage transitions',
        run_at: new Date().toISOString(),
      });
    }

    // Check which transitions have already been notified (avoid duplicates)
    const eventIds = transitions.map(t => t.id);
    const { data: alreadyNotified } = await supabase
      .from('comms_log')
      .select('source')
      .like('source', 'journey-notification:%')
      .in('source', eventIds.map(id => `journey-notification:${id}`));

    const notifiedSet = new Set((alreadyNotified || []).map(c => c.source));

    // Peptide stages that should create tasks instead of sending SMS
    const PEPTIDE_TASK_STAGES = {
      midpoint_review: 'Peptide Midpoint Review',
      cycle_complete: 'Peptide Cycle Complete',
      renewal: 'Peptide Renewal Follow-Up',
    };

    // Pre-fetch Tara's employee ID for peptide follow-up tasks
    let taraId = null;
    const { data: taraEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('email', 'tara@range-medical.com')
      .single();
    if (taraEmployee) taraId = taraEmployee.id;

    let notified = 0;
    let skipped = 0;
    let peptideTasksCreated = 0;
    const errors = [];
    const notifications = [];

    for (const transition of transitions) {
      // Skip if already notified
      if (notifiedSet.has(`journey-notification:${transition.id}`)) {
        skipped++;
        continue;
      }

      // Fetch the protocol to check program_type
      const { data: protocol } = await supabase
        .from('protocols')
        .select('id, program_type, program_name')
        .eq('id', transition.protocol_id)
        .single();

      const isPeptide = protocol?.program_type === 'peptide';

      // For peptide protocols: create a task for Tara instead of sending SMS
      if (isPeptide && PEPTIDE_TASK_STAGES[transition.current_stage] && taraId) {
        const { data: patient } = await supabase
          .from('patients')
          .select('id, name, first_name, last_name')
          .eq('id', transition.patient_id)
          .single();

        const patientName = patient?.first_name && patient?.last_name
          ? `${patient.first_name} ${patient.last_name}`
          : patient?.name || 'Unknown';

        const taskTitle = `${PEPTIDE_TASK_STAGES[transition.current_stage]}: ${patientName} — ${protocol.program_name}`;

        // Check if task already exists to avoid duplicates
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('patient_id', transition.patient_id)
          .ilike('title', `%${PEPTIDE_TASK_STAGES[transition.current_stage]}%${protocol.program_name}%`)
          .eq('status', 'pending')
          .limit(1);

        if (!existingTasks || existingTasks.length === 0) {
          await supabase.from('tasks').insert({
            title: taskTitle,
            description: `${patientName}'s ${protocol.program_name} reached ${transition.current_stage.replace(/_/g, ' ')} stage. Reach out to discuss next steps.`,
            assigned_to: taraId,
            assigned_by: taraId,
            patient_id: transition.patient_id,
            patient_name: patientName,
            priority: 'medium',
            status: 'pending',
          });
          peptideTasksCreated++;
          notifications.push({
            patient: patientName,
            stage: transition.current_stage,
            channel: 'task',
          });
        }

        // Log so we don't re-process this transition
        await logComm({
          channel: 'task',
          messageType: 'journey_stage',
          message: `Task created for ${transition.current_stage}: ${taskTitle}`,
          source: `journey-notification:${transition.id}`,
          patientId: transition.patient_id,
          protocolId: transition.protocol_id,
          patientName,
        });

        continue;
      }

      // Check if this stage has a notification
      const notification = STAGE_NOTIFICATIONS[transition.current_stage];
      if (!notification) {
        continue;
      }

      // Fetch patient info
      const { data: patient } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, email, phone, ghl_contact_id')
        .eq('id', transition.patient_id)
        .single();

      if (!patient) {
        errors.push(`Patient ${transition.patient_id} not found for event ${transition.id}`);
        continue;
      }

      const firstName = patient.first_name || (patient.name || '').split(' ')[0] || 'there';
      const patientName = patient.first_name && patient.last_name
        ? `${patient.first_name} ${patient.last_name}`
        : patient.name || 'Unknown';

      // Send SMS via GHL if contact ID exists
      if (patient.ghl_contact_id && notification.sms) {
        try {
          const message = notification.sms(firstName);
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

          await fetch(`${baseUrl}/api/ghl/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contact_id: patient.ghl_contact_id,
              message,
            }),
          });

          await logComm({
            channel: 'sms',
            messageType: 'journey_stage',
            message,
            source: `journey-notification:${transition.id}`,
            patientId: patient.id,
            protocolId: transition.protocol_id,
            ghlContactId: patient.ghl_contact_id,
            patientName,
          });

          notified++;
          notifications.push({
            patient: patientName,
            stage: transition.current_stage,
            channel: 'sms',
          });
        } catch (smsErr) {
          console.error(`SMS error for ${patient.id}:`, smsErr);
          errors.push(`SMS to ${patientName}: ${smsErr.message}`);

          await logComm({
            channel: 'sms',
            messageType: 'journey_stage',
            message: `Journey notification failed for stage ${transition.current_stage}`,
            source: `journey-notification:${transition.id}`,
            patientId: patient.id,
            protocolId: transition.protocol_id,
            status: 'error',
            errorMessage: smsErr.message,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      transitions_found: transitions.length,
      notified,
      skipped,
      peptideTasksCreated,
      notifications: notifications.length > 0 ? notifications : undefined,
      errors: errors.length > 0 ? errors : undefined,
      run_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('journey-notifications cron error:', error);
    return res.status(500).json({
      error: 'Server error',
      details: error.message,
    });
  }
}
