// lib/pipeline-automations.js
// Side effects that fire when an energy_workup pipeline card enters a stage.
// Creates tasks, queues patient SMS. Call `runStageEntry` after moveCard().
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { STAFF } from './staff';
import { isInQuietHours, getNextSendTime } from './quiet-hours';
import { normalizePhone } from './send-sms';
import { notifyTaskAssignee } from './notify-task-assignee';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

const STAFF_EMAIL = Object.fromEntries(
  STAFF.filter(s => s.email).map(s => [s.id, s.email])
);

// Resolve pipeline staff IDs (e.g. 'damien') to employee records (UUID + phone).
async function resolveEmployees(client, staffIds = []) {
  const emails = staffIds.map(id => STAFF_EMAIL[id]).filter(Boolean);
  if (!emails.length) return [];
  const { data } = await client
    .from('employees')
    .select('id, email, name, phone')
    .in('email', emails);
  return data || [];
}

async function patientDisplayName(client, card) {
  if (card.first_name || card.last_name) {
    return [card.first_name, card.last_name].filter(Boolean).join(' ').trim();
  }
  if (!card.patient_id) return 'Patient';
  const { data } = await client
    .from('patients')
    .select('name')
    .eq('id', card.patient_id)
    .maybeSingle();
  return data?.name || 'Patient';
}

async function patientPhone(client, card) {
  if (card.phone) return card.phone;
  if (!card.patient_id) return null;
  const { data } = await client
    .from('patients')
    .select('phone')
    .eq('id', card.patient_id)
    .maybeSingle();
  return data?.phone || null;
}

async function firstName(displayName) {
  return (displayName || 'there').split(' ')[0] || 'there';
}

// Create a single task with primary + additional assignees. Sends SMS to all.
async function createLinkedTask(client, {
  title, description = null, staffIds, patientId, patientName,
  priority = 'medium', dueDate = null, pipelineCardId, onCompleteMoveTo = null,
}) {
  const employees = await resolveEmployees(client, staffIds);
  if (!employees.length) {
    console.warn('[pipeline-automations] No employees resolved for', staffIds);
    return null;
  }

  const [primary, ...rest] = employees;
  const additional = rest.map(e => e.id);

  const { data: task, error } = await client
    .from('tasks')
    .insert({
      title,
      description,
      assigned_to: primary.id,
      additional_assignees: additional,
      assigned_by: primary.id, // system-created; self-assign as "assigned_by"
      patient_id: patientId || null,
      patient_name: patientName || null,
      priority,
      due_date: dueDate,
      task_category: 'clinical',
      status: 'pending',
      pipeline_card_id: pipelineCardId,
      on_complete_move_to: onCompleteMoveTo,
    })
    .select()
    .single();

  if (error) {
    console.error('[pipeline-automations] Task insert failed:', error);
    return null;
  }

  // SMS every assignee.
  for (const emp of employees) {
    notifyTaskAssignee(emp.id, {
      assignerName: 'Range Medical Automation',
      taskTitle: title,
      priority,
    }).catch(err => console.error('[pipeline-automations] Task SMS error:', err));
  }

  return task;
}

// Close any pending tasks linked to this card. Used when stage advances past a
// task's point — e.g. Tara's "Schedule consult" task becomes moot once the
// appointment is booked and the card moves to consult_booked.
async function closeCardTasks(client, cardId) {
  await client
    .from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('pipeline_card_id', cardId)
    .eq('status', 'pending');
}

// Check if the patient already has a consult appointment booked or completed.
// Returns 'completed' | 'booked' | null.
async function getConsultAppointmentState(client, patientId) {
  if (!patientId) return null;
  const { data } = await client
    .from('appointments')
    .select('id, status, service_name')
    .eq('patient_id', patientId)
    .in('status', ['scheduled', 'confirmed', 'completed'])
    .order('start_time', { ascending: false })
    .limit(50);
  if (!data?.length) return null;

  const consults = data.filter(a => {
    const sn = (a.service_name || '').toLowerCase();
    return sn.includes('consult') || sn.includes('lab review');
  });
  if (!consults.length) return null;
  if (consults.some(a => a.status === 'completed')) return 'completed';
  return 'booked';
}

// Queue the "look out for a call" SMS for a patient. Respects quiet hours;
// scheduled message is dropped at send time if the card has moved on.
async function queuePatientOutreachSMS(client, card) {
  const phone = await patientPhone(client, card);
  if (!phone) return;
  const normalized = normalizePhone(phone);
  if (!normalized) return;

  const displayName = await patientDisplayName(client, card);
  const first = await firstName(displayName);
  const message =
    `Hi ${first}, your Range Medical labs are ready to review. ` +
    `A team member will call shortly to schedule your consult — please keep an eye out!`;

  const scheduledFor = isInQuietHours() ? getNextSendTime() : new Date().toISOString();

  await client.from('notification_queue').insert({
    patient_id: card.patient_id || null,
    patient_name: displayName,
    channel: 'sms',
    message_type: 'pipeline_ready_to_schedule',
    recipient: normalized,
    message,
    scheduled_for: scheduledFor,
    status: 'pending',
    metadata: {
      gate_pipeline_card_id: card.id,
      gate_stage: 'ready_to_schedule',
    },
  });
}

/**
 * Fire side effects for a card that just entered a stage.
 * Idempotent-ish: each stage's effects are safe to re-run (tasks will
 * duplicate, so only call after a genuine stage transition).
 *
 * context:
 *   skipTaskCreation  — caller already created the stage's task(s) (e.g., the
 *                       legacy lab-post-import rich tasks); just fire other
 *                       side effects like patient SMS.
 *   skipPatientSMS    — caller doesn't want the ready_to_schedule SMS queued.
 *   consultDate       — YYYY-MM-DD for the consult_completed Evan task due date.
 */
export async function runStageEntry({ card, stage, context = {} }) {
  const client = sb();
  const patientName = await patientDisplayName(client, card);
  const skipTask = !!context.skipTaskCreation;
  const skipSMS  = !!context.skipPatientSMS;

  if (stage === 'under_review') {
    if (!skipTask) {
      await createLinkedTask(client, {
        title: `Review labs for ${patientName}`,
        staffIds: ['damien', 'evan'],
        patientId: card.patient_id,
        patientName,
        priority: 'high',
        pipelineCardId: card.id,
        onCompleteMoveTo: 'ready_to_schedule',
      });
    }
    return;
  }

  if (stage === 'ready_to_schedule') {
    // Fast-forward: if the patient already has a consult booked or completed,
    // skip the SMS and advance the card instead of sending a stale notification.
    const apptState = await getConsultAppointmentState(client, card.patient_id);
    if (apptState) {
      const { moveCard } = await import('./pipelines-server');
      const targetStage = apptState === 'completed' ? 'consult_completed' : 'consult_booked';
      const updated = await moveCard({
        card_id: card.id,
        to_stage: targetStage,
        triggered_by: 'automation',
        automation_reason: `fast_forward:consult_already_${apptState}`,
      });
      if (updated) {
        await runStageEntry({ card: updated, stage: targetStage, context });
      }
      return;
    }

    if (!skipTask) {
      await createLinkedTask(client, {
        title: `Schedule consult for ${patientName}`,
        description: 'Call the patient to book their lab review consult.',
        staffIds: ['tara'],
        patientId: card.patient_id,
        patientName,
        priority: 'high',
        pipelineCardId: card.id,
        onCompleteMoveTo: null,
      });
    }
    if (!skipSMS) {
      await queuePatientOutreachSMS(client, card);
    }
    return;
  }

  if (stage === 'consult_booked') {
    await closeCardTasks(client, card.id);

    // Fast-forward: if the consult is already completed, advance immediately.
    const apptState = await getConsultAppointmentState(client, card.patient_id);
    if (apptState === 'completed') {
      const { moveCard } = await import('./pipelines-server');
      const updated = await moveCard({
        card_id: card.id,
        to_stage: 'consult_completed',
        triggered_by: 'automation',
        automation_reason: 'fast_forward:consult_already_completed',
      });
      if (updated) {
        await runStageEntry({ card: updated, stage: 'consult_completed', context });
      }
    }
    return;
  }

  if (stage === 'consult_completed') {
    if (!skipTask) {
      const consultDate = context.consultDate || new Date().toISOString().slice(0, 10);
      await createLinkedTask(client, {
        title: `Review treatment plan for ${patientName}`,
        description: 'Review the treatment plan in the encounter notes.',
        staffIds: ['evan'],
        patientId: card.patient_id,
        patientName,
        priority: 'high',
        dueDate: consultDate,
        pipelineCardId: card.id,
        onCompleteMoveTo: null,
      });
    }
    return;
  }
}

/**
 * Ensure the patient has a labs-pipeline card at `under_review` (or further).
 * Used by the biomarker import flow — creates the card if missing, advances
 * if still in labs_scheduled/awaiting_results, otherwise no-op.
 *
 * `pipelineKey` is either 'energy_workup' (new patient workup) or
 * 'follow_up_labs' (active HRT/WL patients getting follow-up labs).
 *
 * Pass `skipTaskCreation: true` when the caller already created the review
 * task (legacy lab-post-import path), so we don't duplicate.
 */
export async function ensureLabsCardAtUnderReview({
  patientId,
  pipelineKey = 'energy_workup',
  reason = 'lab_results_received',
  skipTaskCreation = false,
}) {
  if (!patientId) return null;
  const { findActiveCard, createCard, moveCard } = await import('./pipelines-server');
  const existing = await findActiveCard({ patient_id: patientId, pipeline: pipelineKey });

  let card = null;
  let entered = false;

  if (!existing) {
    card = await createCard({
      pipeline: pipelineKey,
      stage: 'under_review',
      patient_id: patientId,
      assigned_to: ['damien', 'evan'],
      triggered_by: 'automation',
      automation_reason: reason,
      meta: { lab_type: pipelineKey === 'follow_up_labs' ? 'Follow-Up' : 'New Patient' },
    });
    entered = true;
  } else if (['labs_scheduled', 'awaiting_results'].includes(existing.stage)) {
    card = await moveCard({
      card_id: existing.id,
      to_stage: 'under_review',
      assigned_to: ['damien', 'evan'],
      triggered_by: 'automation',
      automation_reason: reason,
    });
    entered = true;
  } else {
    card = existing;
  }

  if (entered) {
    await runStageEntry({ card, stage: 'under_review', context: { skipTaskCreation } });
  }
  return card;
}

/**
 * Ensure the patient has a labs-pipeline card at `awaiting_results` (or further).
 * Called when a blood draw is logged — moves the card from labs_scheduled,
 * or creates one at awaiting_results if none exists.
 *
 * Auto-detects the pipeline (energy_workup vs follow_up_labs) based on
 * whether the patient has an active HRT/WL protocol.
 */
export async function ensureLabsCardAtAwaitingResults({
  patientId,
  reason = 'blood_draw_completed',
}) {
  if (!patientId) return null;
  const client = sb();

  const { findActiveCard, createCard, moveCard } = await import('./pipelines-server');

  // Auto-detect pipeline
  const { data: activeTx } = await client
    .from('protocols')
    .select('program_type')
    .eq('patient_id', patientId)
    .eq('status', 'active')
    .in('program_type', [
      'hrt', 'hrt_male', 'hrt_female',
      'weight_loss', 'weight_loss_program', 'weight_loss_injection',
    ])
    .limit(1)
    .maybeSingle();
  let pipelineKey = activeTx ? 'follow_up_labs' : 'energy_workup';

  // Check both pipelines for existing card
  let existing = await findActiveCard({ patient_id: patientId, pipeline: pipelineKey });
  if (!existing) {
    const other = pipelineKey === 'energy_workup' ? 'follow_up_labs' : 'energy_workup';
    existing = await findActiveCard({ patient_id: patientId, pipeline: other });
    if (existing) pipelineKey = other;
  }

  if (!existing) {
    return await createCard({
      pipeline: pipelineKey,
      stage: 'awaiting_results',
      patient_id: patientId,
      triggered_by: 'automation',
      automation_reason: reason,
      meta: { lab_type: pipelineKey === 'follow_up_labs' ? 'Follow-Up' : 'New Patient' },
    });
  }

  if (existing.stage === 'labs_scheduled') {
    return await moveCard({
      card_id: existing.id,
      to_stage: 'awaiting_results',
      triggered_by: 'automation',
      automation_reason: reason,
    });
  }

  // Already at awaiting_results or further — no-op
  return existing;
}

// Back-compat alias — older callers still import this name.
export const ensureEnergyWorkupAtUnderReview = (args) =>
  ensureLabsCardAtUnderReview({ ...args, pipelineKey: 'energy_workup' });
