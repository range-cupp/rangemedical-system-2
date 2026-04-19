// Server-side helpers for pipeline operations.
// Shared by API routes and automation hooks.
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import {
  getPipeline, getStage, firstStage, CARD_STATUS,
  PROGRAM_TYPE_TO_PIPELINE,
} from './pipelines-config';

export function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

async function logEvent(client, fields) {
  await client.from('pipeline_events').insert({
    card_id:           fields.card_id,
    event_type:        fields.event_type,
    from_stage:        fields.from_stage ?? null,
    to_stage:          fields.to_stage ?? null,
    from_status:       fields.from_status ?? null,
    to_status:         fields.to_status ?? null,
    triggered_by:      fields.triggered_by || 'system',
    automation_reason: fields.automation_reason ?? null,
    notes:             fields.notes ?? null,
  });
}

/**
 * Create a new pipeline card. Used for new leads, intake-driven workup cards,
 * protocol-created treatment cards, and follow-up pre-creation.
 */
export async function createCard({
  pipeline,
  stage,
  patient_id = null,
  first_name = null, last_name = null, email = null, phone = null,
  assigned_to = null,
  protocol_id = null,
  lead_id = null,
  source = null, path = null, urgency = null,
  scheduled_for = null,
  status = CARD_STATUS.ACTIVE,
  notes = null,
  meta = {},
  triggered_by = 'automation',
  automation_reason = null,
}) {
  const def = getPipeline(pipeline);
  if (!def) throw new Error(`Unknown pipeline: ${pipeline}`);
  const targetStage = stage || firstStage(pipeline)?.key;
  const stageDef = getStage(pipeline, targetStage);
  if (!stageDef) throw new Error(`Unknown stage ${targetStage} for pipeline ${pipeline}`);

  const assignees = assigned_to ?? stageDef.owner ?? def.defaultAssignees ?? [];
  const client = sb();

  const { data, error } = await client
    .from('pipeline_cards')
    .insert({
      pipeline,
      stage: targetStage,
      status,
      patient_id,
      first_name, last_name, email, phone,
      assigned_to: assignees,
      protocol_id, lead_id,
      source, path, urgency,
      scheduled_for,
      notes,
      meta,
    })
    .select()
    .single();

  if (error) throw error;

  await logEvent(client, {
    card_id: data.id,
    event_type: 'created',
    to_stage: targetStage,
    to_status: status,
    triggered_by,
    automation_reason,
  });

  return data;
}

/**
 * Move a card to a new stage (and optionally reassign).
 * Used by automations: cal.com webhook, lab upload, protocol created, etc.
 */
export async function moveCard({
  card_id,
  to_stage,
  to_status = null,
  assigned_to = null,
  triggered_by = 'automation',
  automation_reason = null,
  notes = null,
}) {
  const client = sb();
  const { data: current, error: loadErr } = await client
    .from('pipeline_cards').select('*').eq('id', card_id).maybeSingle();
  if (loadErr) throw loadErr;
  if (!current) throw new Error(`Card ${card_id} not found`);

  const update = { last_activity_at: new Date().toISOString() };
  const events = [];

  if (to_stage && to_stage !== current.stage) {
    update.stage = to_stage;
    update.entered_stage_at = new Date().toISOString();
    events.push({ event_type: 'stage_change', from_stage: current.stage, to_stage });
  }
  if (to_status && to_status !== current.status) {
    update.status = to_status;
    events.push({ event_type: 'status_change', from_status: current.status, to_status });
  }
  if (Array.isArray(assigned_to)) {
    update.assigned_to = assigned_to;
    events.push({ event_type: 'assignment_change' });
  }
  if (notes && notes !== current.notes) {
    update.notes = notes;
    events.push({ event_type: 'note', notes });
  }

  if (Object.keys(update).length === 1) return current; // only last_activity_at — no-op

  const { data: updated, error: updErr } = await client
    .from('pipeline_cards').update(update).eq('id', card_id).select().single();
  if (updErr) throw updErr;

  for (const ev of events) {
    await logEvent(client, {
      ...ev, card_id, triggered_by, automation_reason,
    });
  }
  return updated;
}

/**
 * Find an active card for a patient on a specific pipeline.
 * Used by automations to locate the card before moving/updating.
 */
export async function findActiveCard({ patient_id, pipeline }) {
  const client = sb();
  const { data, error } = await client
    .from('pipeline_cards')
    .select('*')
    .eq('patient_id', patient_id)
    .eq('pipeline', pipeline)
    .eq('status', CARD_STATUS.ACTIVE)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Idempotently ensure a card exists on a pipeline for a patient.
 * If found, returns existing; otherwise creates new. Useful for automations
 * that may re-fire (e.g. assessment completion webhook retries).
 */
export async function ensureCard(params) {
  const existing = await findActiveCard({
    patient_id: params.patient_id,
    pipeline:   params.pipeline,
  });
  if (existing) return existing;
  return createCard(params);
}

/**
 * Map a protocol.program_type to a treatment pipeline key.
 */
export function pipelineForProgramType(programType) {
  if (!programType) return null;
  return PROGRAM_TYPE_TO_PIPELINE[programType] || null;
}

/**
 * Compute follow-up schedule from a protocol.
 * Returns [{ scheduled_for, reason }] entries suitable for pre-creating
 * follow-up cards.
 */
export function followUpsFromProtocol({ start_date, end_date, duration_days }) {
  const start = start_date ? new Date(start_date) : null;
  const end = end_date
    ? new Date(end_date)
    : (start && duration_days ? new Date(start.getTime() + duration_days * 86400000) : null);
  if (!start || !end) return [];

  const totalMs = end - start;
  const seventyPct = new Date(start.getTime() + totalMs * 0.7);
  return [
    { scheduled_for: seventyPct.toISOString(), reason: '70% protocol elapsed — renewal conversation' },
    { scheduled_for: end.toISOString(),        reason: 'Protocol ended — outreach for next step' },
  ];
}

export { logEvent };
