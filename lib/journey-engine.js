// lib/journey-engine.js
// Journey automation engine — evaluates conditions and auto-advances protocol stages
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Auto-advance conditions that can be defined on journey template stages.
 * Each stage can have an `auto_conditions` object:
 *
 * {
 *   consent_signed: true,         — patient has a signed consent form
 *   intake_submitted: true,       — patient has a submitted intake form
 *   days_elapsed: 28,             — N days since entering current stage
 *   days_on_protocol: 56,         — N days since protocol start_date
 *   labs_completed: true,         — patient has lab results after current stage entry
 *   appointment_completed: true,  — patient has a completed appointment after stage entry
 *   sessions_completed: 5,        — at least N sessions completed on protocol
 *   sessions_at_midpoint: true,   — sessions >= half of sessions_total
 *   protocol_ending_soon: 14,     — within N days of end_date
 * }
 *
 * ALL conditions must be true for auto-advancement (AND logic).
 */

/**
 * Evaluate a single protocol against its template's auto-advance conditions.
 * Returns the next stage key if all conditions are met, or null.
 */
export async function evaluateProtocol(protocol, template) {
  if (!protocol || !template) return null;

  const stages = template.stages || [];
  const currentStage = protocol.current_journey_stage;

  if (!currentStage) return null;

  // Find current stage index
  const currentIdx = stages.findIndex(s => s.key === currentStage);
  if (currentIdx === -1 || currentIdx >= stages.length - 1) return null;

  // Get next stage
  const nextStage = stages[currentIdx + 1];
  if (!nextStage) return null;

  // Check if the CURRENT stage has auto_conditions for advancing to next
  const conditions = stages[currentIdx].auto_conditions;
  if (!conditions || Object.keys(conditions).length === 0) return null;

  // Get the journey event for when we entered the current stage
  const { data: stageEntry } = await supabase
    .from('journey_events')
    .select('created_at')
    .eq('protocol_id', protocol.id)
    .eq('current_stage', currentStage)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const stageEnteredAt = stageEntry?.created_at
    ? new Date(stageEntry.created_at)
    : new Date(protocol.updated_at || protocol.created_at);

  // Evaluate each condition
  const results = [];

  for (const [conditionKey, conditionValue] of Object.entries(conditions)) {
    const result = await evaluateCondition(
      conditionKey,
      conditionValue,
      protocol,
      stageEnteredAt
    );
    results.push({ condition: conditionKey, met: result });

    // Short-circuit: if any condition fails, no need to check others
    if (!result) break;
  }

  const allMet = results.every(r => r.met);

  return allMet ? nextStage.key : null;
}

/**
 * Evaluate a single condition for a protocol.
 */
async function evaluateCondition(key, value, protocol, stageEnteredAt) {
  const now = new Date();
  const patientId = protocol.patient_id;

  switch (key) {
    case 'consent_signed': {
      const { count } = await supabase
        .from('consents')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);
      return (count || 0) > 0;
    }

    case 'intake_submitted': {
      const { count } = await supabase
        .from('intakes')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);
      return (count || 0) > 0;
    }

    case 'days_elapsed': {
      const daysSinceEntry = (now - stageEnteredAt) / (1000 * 60 * 60 * 24);
      return daysSinceEntry >= value;
    }

    case 'days_on_protocol': {
      if (!protocol.start_date) return false;
      const startDate = new Date(protocol.start_date + 'T00:00:00');
      const daysOnProtocol = (now - startDate) / (1000 * 60 * 60 * 24);
      return daysOnProtocol >= value;
    }

    case 'labs_completed': {
      // Check for lab results after entering the current stage
      const { count } = await supabase
        .from('service_logs')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .in('category', ['labs', 'lab_draw'])
        .gte('created_at', stageEnteredAt.toISOString());
      return (count || 0) > 0;
    }

    case 'appointment_completed': {
      // Check for completed appointments after entering current stage
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .gte('updated_at', stageEnteredAt.toISOString());
      return (count || 0) > 0;
    }

    case 'sessions_completed': {
      const sessions = protocol.sessions_completed || 0;
      return sessions >= value;
    }

    case 'sessions_at_midpoint': {
      const sessionsTotal = protocol.sessions_total || 0;
      const sessionsCompleted = protocol.sessions_completed || 0;
      if (sessionsTotal === 0) return false;
      return sessionsCompleted >= Math.floor(sessionsTotal / 2);
    }

    case 'protocol_ending_soon': {
      if (!protocol.end_date) return false;
      const endDate = new Date(protocol.end_date + 'T00:00:00');
      const daysUntilEnd = (endDate - now) / (1000 * 60 * 60 * 24);
      return daysUntilEnd <= value && daysUntilEnd >= 0;
    }

    default:
      console.warn(`Unknown journey condition: ${key}`);
      return false;
  }
}

/**
 * Advance a protocol to a new stage and log the event.
 */
export async function advanceProtocol(protocolId, patientId, newStage, previousStage, notes) {
  // Update protocol stage
  const { error: updateError } = await supabase
    .from('protocols')
    .update({
      current_journey_stage: newStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', protocolId);

  if (updateError) {
    console.error(`Failed to advance protocol ${protocolId}:`, updateError);
    return { success: false, error: updateError.message };
  }

  // Log journey event
  const { data: event, error: eventError } = await supabase
    .from('journey_events')
    .insert({
      patient_id: patientId,
      protocol_id: protocolId,
      current_stage: newStage,
      previous_stage: previousStage,
      trigger_type: 'auto',
      triggered_by: 'system',
      notes: notes || `Auto-advanced from ${previousStage} to ${newStage}`,
    })
    .select()
    .single();

  if (eventError) {
    console.error(`Failed to log journey event for ${protocolId}:`, eventError);
  }

  return { success: true, event };
}

/**
 * Get all active protocols with journey templates for evaluation.
 */
export async function getProtocolsForEvaluation() {
  const { data: protocols, error } = await supabase
    .from('protocols')
    .select(`
      id, patient_id, program_type, program_name, status,
      current_journey_stage, journey_template_id,
      start_date, end_date, sessions_total, sessions_completed,
      created_at, updated_at
    `)
    .eq('status', 'active')
    .not('journey_template_id', 'is', null)
    .not('current_journey_stage', 'is', null);

  if (error) {
    console.error('Error fetching protocols for evaluation:', error);
    return [];
  }

  return protocols || [];
}

/**
 * Get all journey templates indexed by ID for efficient lookup.
 */
export async function getTemplateMap() {
  const { data: templates, error } = await supabase
    .from('journey_templates')
    .select('*');

  if (error) {
    console.error('Error fetching templates:', error);
    return {};
  }

  const map = {};
  for (const t of templates || []) {
    map[t.id] = t;
  }
  return map;
}

/**
 * Get recent stage transitions that need notifications sent.
 * Returns events from the last N hours that haven't been notified yet.
 */
export async function getRecentTransitions(hoursBack = 1) {
  const since = new Date();
  since.setHours(since.getHours() - hoursBack);

  const { data: events, error } = await supabase
    .from('journey_events')
    .select(`
      id, patient_id, protocol_id, current_stage, previous_stage,
      trigger_type, triggered_by, notes, created_at
    `)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching recent transitions:', error);
    return [];
  }

  return events || [];
}
