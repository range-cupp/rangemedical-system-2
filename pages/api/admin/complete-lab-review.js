// /pages/api/admin/complete-lab-review.js
// Called when Evan or Dr. Burgess completes a lab review task.
// 1. Marks the review task as complete
// 2. Advances the lab protocol to provider_reviewed
// 3. Creates "Schedule [Patient]" tasks for Tara + Chris with consult type(s) + instructions
// 4. Sends SMS to Tara + Chris

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth';
import { sendSMS } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { task_id, patient_id, consultation_types, instructions } = req.body;

  if (!task_id || !patient_id) {
    return res.status(400).json({ error: 'task_id and patient_id required' });
  }

  if (!consultation_types || consultation_types.length === 0) {
    return res.status(400).json({ error: 'At least one consultation type required' });
  }

  try {
    // 1. Mark review task as complete
    await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', task_id);

    // 2. Advance protocol to ready_to_schedule (review complete, Tara schedules consult)
    const { data: proto } = await supabase
      .from('protocols')
      .select('id')
      .eq('patient_id', patient_id)
      .eq('program_type', 'labs')
      .in('status', ['under_review', 'uploaded', 'results_received'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proto) {
      await supabase
        .from('protocols')
        .update({ status: 'ready_to_schedule', updated_at: new Date().toISOString() })
        .eq('id', proto.id);
    }

    // 3. Look up patient name
    const { data: patient } = await supabase
      .from('patients')
      .select('name, first_name, last_name')
      .eq('id', patient_id)
      .single();

    const patientName = patient
      ? (patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim())
      : 'Patient';

    // 4. Look up Tara + Chris IDs and phones
    const { data: staff } = await supabase
      .from('employees')
      .select('id, email, name, phone')
      .in('email', ['tara@range-medical.com', 'cupp@range-medical.com'])
      .eq('is_active', true);

    const tara  = staff?.find(e => e.email === 'tara@range-medical.com')  || null;
    const chris = staff?.find(e => e.email === 'cupp@range-medical.com') || null;

    // 5. Build scheduling task
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueTomorrow = tomorrow.toISOString().split('T')[0];

    const typesLabel = consultation_types.join(' / ');
    const schedTitle = `📅 Schedule ${patientName} — ${typesLabel}`;

    const reviewerName = employee.email === 'burgess@range-medical.com' ? `Dr. ${employee.name}` : (employee.name || 'Provider');
    let schedDesc = `${reviewerName} reviewed lab results for ${patientName} and is ready to schedule.\n\nConsultation type(s): ${typesLabel}`;
    if (instructions?.trim()) {
      schedDesc += `\n\nInstructions: ${instructions.trim()}`;
    }

    const baseTask = {
      title: schedTitle,
      description: schedDesc,
      patient_id,
      patient_name: patientName,
      priority: 'high',
      due_date: dueTomorrow,
      status: 'pending',
      category: 'labs',
      assigned_by: employee.id,
    };

    const schedTasks = [];
    if (tara)  schedTasks.push({ ...baseTask, assigned_to: tara.id });
    if (chris) schedTasks.push({ ...baseTask, assigned_to: chris.id });

    if (schedTasks.length > 0) {
      await supabase.from('tasks').insert(schedTasks);
    }

    // 6. Send SMS to Tara + Chris
    const smsMessage = `📋 Range Medical — New lab scheduling task:\n\nPatient: ${patientName}\nConsult: ${typesLabel}${instructions?.trim() ? `\nNote: ${instructions.trim()}` : ''}\n\nCheck your task list to schedule.`;

    const smsTargets = [];
    if (tara?.phone)  smsTargets.push(tara.phone);
    if (chris?.phone) smsTargets.push(chris.phone);

    const smsResults = await Promise.allSettled(
      smsTargets.map(phone => sendSMS({
        to: phone,
        message: smsMessage,
        log: {
          messageType: 'lab_review_scheduling',
          source: 'complete-lab-review',
          patientId: patient_id,
        },
      }))
    );

    const smsSent = smsResults.filter(r => r.status === 'fulfilled').length;
    const smsFailed = smsResults.filter(r => r.status === 'rejected').length;
    if (smsFailed > 0) {
      console.error('Some SMS notifications failed:', smsResults.filter(r => r.status === 'rejected').map(r => r.reason));
    }

    // Main Pipeline: advance the energy_workup card from under_review to
    // ready_to_schedule. Skip task creation (the Tara/Chris scheduling tasks
    // above cover it) but queue the patient "look out for a call" SMS.
    try {
      const { findActiveCard, moveCard } = await import('../../../lib/pipelines-server');
      const { runStageEntry } = await import('../../../lib/pipeline-automations');
      const card = await findActiveCard({ patient_id, pipeline: 'energy_workup' });
      if (card && card.stage === 'under_review') {
        const updated = await moveCard({
          card_id: card.id,
          to_stage: 'ready_to_schedule',
          triggered_by: 'automation',
          automation_reason: `lab_review_completed:${task_id}`,
        });
        if (updated) {
          await runStageEntry({
            card: updated,
            stage: 'ready_to_schedule',
            context: { skipTaskCreation: true },
          });
        }
      }
    } catch (pipeErr) {
      console.error('complete-lab-review pipeline advance error:', pipeErr.message);
    }

    return res.status(200).json({
      success: true,
      patientName,
      consultationTypes: consultation_types,
      tasksCreated: schedTasks.length,
      smsSent,
      reviewedBy: employee.name,
    });

  } catch (err) {
    console.error('complete-lab-review error:', err);
    return res.status(500).json({ error: err.message });
  }
}
