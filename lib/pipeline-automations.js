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
 */
export async function runStageEntry({ card, stage, context = {} }) {
  const client = sb();
  const patientName = await patientDisplayName(client, card);

  if (stage === 'under_review') {
    await createLinkedTask(client, {
      title: `Review labs for ${patientName}`,
      staffIds: ['damien', 'evan'],
      patientId: card.patient_id,
      patientName,
      priority: 'high',
      pipelineCardId: card.id,
      onCompleteMoveTo: 'ready_to_schedule',
    });
    return;
  }

  if (stage === 'ready_to_schedule') {
    await createLinkedTask(client, {
      title: `Schedule consult for ${patientName}`,
      description: 'Call the patient to book their lab review consult.',
      staffIds: ['tara'],
      patientId: card.patient_id,
      patientName,
      priority: 'high',
      pipelineCardId: card.id,
      // No auto-advance: appointment creation moves card to consult_booked.
      onCompleteMoveTo: null,
    });
    await queuePatientOutreachSMS(client, card);
    return;
  }

  if (stage === 'consult_booked') {
    // Tara's scheduling task is done — close it.
    await closeCardTasks(client, card.id);
    return;
  }

  if (stage === 'consult_completed') {
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
    return;
  }
}
