// lib/wl-note-sync.js
// Canonical sync from a weight-loss encounter note to its corresponding
// service_log row. Single source of truth for "the provider documented an
// injection." Called from notes/create.js, notes/[id].js, notes/sign.js so
// the sync can never silently drop a note.
//
// Design rules:
//   - service_logs.note_id is ALWAYS set on rows we create. No more orphan
//     date-fallback rows.
//   - We never promote weight_check or any other entry_type to 'injection'.
//     If a row already exists with a different entry_type, leave it alone
//     and create a new injection row (linked to the note).
//   - sessions_used is always recomputed from the service_logs count after
//     a write — never incremented by hand.

import { extractWLFields } from './wl-note-parser';
import { isWeightLossType } from './protocol-config';
import { guardDoseChange } from './dose-change-guard';

const PACIFIC_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

function logDateFor(noteDate) {
  if (noteDate) {
    return new Date(noteDate).toISOString().split('T')[0];
  }
  const now = new Date(Date.now() - PACIFIC_TZ_OFFSET_MS);
  return now.toISOString().split('T')[0];
}

export function isWLEncounter(encounterService) {
  const es = (encounterService || '').toLowerCase();
  return isWeightLossType(es) || es.includes('weight') || es === 'weight_loss';
}

/**
 * Recount sessions_used on a protocol from actual service_logs entries.
 * Always called after any write to service_logs; the protocol is the view,
 * the service_logs table is the source of truth.
 */
export async function recountProtocolSessions(supabase, protocolId) {
  if (!protocolId) return null;

  const { count } = await supabase
    .from('service_logs')
    .select('*', { count: 'exact', head: true })
    .eq('protocol_id', protocolId)
    .in('entry_type', ['injection', 'session']);

  const actual = count || 0;

  await supabase
    .from('protocols')
    .update({ sessions_used: actual, updated_at: new Date().toISOString() })
    .eq('id', protocolId);

  return actual;
}

/**
 * Sync a weight-loss encounter note to its service_log row.
 *
 * @param {object} supabase - Supabase client
 * @param {object} note - { id, patient_id, body, structured_data, encounter_service, note_date, created_by, appointment_id }
 * @param {object} options
 *   - approvedDoseChangeRequestId
 *   - createIfMissing: when true (default for live note paths), insert a new
 *     service_log when no existing row matches. Set to false for backfill to
 *     avoid creating duplicate rows from addendum/back-dated notes.
 *   - dateMatchWindowDays: how far an existing same-date orphan can drift
 *     from the note's logDate and still match (default 0 = exact). Backfill
 *     uses 2 so addendums link back to the original injection row.
 * @returns {object} { synced, serviceLogId, protocolId, doseGuardBlocked, doseGuardReason, reason }
 */
export async function syncWLNoteToServiceLog(supabase, note, options = {}) {
  const createIfMissing = options.createIfMissing !== false;
  // Default to a 3-day match window so encounter notes link to take-home
  // injection rows that were spawned from a recent pickup. Without the
  // window, a note dated Apr 22 wouldn't match the Apr 22 spawned row if
  // the spawn anchored to the patient's injection_day a day or two off.
  const windowDays = options.dateMatchWindowDays != null ? options.dateMatchWindowDays : 3;
  if (!note || !note.id || !note.patient_id) {
    return { synced: false, reason: 'missing_note_fields' };
  }

  if (!isWLEncounter(note.encounter_service) && note.source !== 'encounter') {
    return { synced: false, reason: 'not_wl_encounter' };
  }

  const wl = extractWLFields(note.structured_data, note.body);
  if (!wl) {
    return { synced: false, reason: 'no_wl_fields_in_body' };
  }

  const dose = wl.dose || null;
  const medication = wl.medication || null;
  const weight = wl.weight ?? null;
  const hasWeight = weight !== null && !isNaN(weight);
  const logDate = logDateFor(note.note_date);

  // Find active WL protocol. program_type + status filters keep us off
  // completed protocols and non-WL ones.
  const { data: protocols } = await supabase
    .from('protocols')
    .select('id, starting_weight, sessions_used, total_sessions, selected_dose, dose, dose_per_injection, injections_per_week, patient_id, medication, program_type, goal_weight')
    .eq('patient_id', note.patient_id)
    .ilike('program_type', 'weight_loss%')
    .in('status', ['active', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1);

  const activeProtocol = protocols?.[0];
  if (!activeProtocol) {
    return { synced: false, reason: 'no_active_wl_protocol' };
  }

  // Find existing service_log to update. Linkage priority:
  //   (a) note_id — we've synced this note before
  //   (b) appointment_id via patient_notes — same visit, same row
  //   (c) date fallback — only matches injection-type rows on same date
  //       that have no note_id yet (legacy rows)
  let existing = null;

  {
    const { data } = await supabase
      .from('service_logs')
      .select('id, entry_type, note_id')
      .eq('note_id', note.id)
      .maybeSingle();
    if (data) existing = data;
  }

  if (!existing && note.appointment_id) {
    const { data: notesForAppt } = await supabase
      .from('patient_notes')
      .select('id')
      .eq('appointment_id', note.appointment_id);
    const noteIds = (notesForAppt || []).map(n => n.id).filter(Boolean);
    if (noteIds.length > 0) {
      const { data } = await supabase
        .from('service_logs')
        .select('id, entry_type, note_id')
        .in('note_id', noteIds)
        .eq('entry_type', 'injection')
        .limit(1)
        .maybeSingle();
      if (data) existing = data;
    }
  }

  if (!existing) {
    let dateQuery = supabase
      .from('service_logs')
      .select('id, entry_type, note_id, entry_date')
      .eq('patient_id', note.patient_id)
      .eq('category', 'weight_loss')
      .eq('entry_type', 'injection')
      .is('note_id', null);

    if (windowDays > 0) {
      const lo = new Date(logDate); lo.setDate(lo.getDate() - windowDays);
      const hi = new Date(logDate); hi.setDate(hi.getDate() + windowDays);
      dateQuery = dateQuery
        .gte('entry_date', lo.toISOString().split('T')[0])
        .lte('entry_date', hi.toISOString().split('T')[0]);
    } else {
      dateQuery = dateQuery.eq('entry_date', logDate);
    }

    const { data } = await dateQuery.limit(1).maybeSingle();
    if (data) existing = data;
  }

  // For backfill: bail if no existing row matched. Don't create new rows
  // from addendum/back-dated notes — that's how the 60-day backfill spawned
  // 25 duplicate injections. Live note paths still create on miss.
  if (!existing && !createIfMissing) {
    return { synced: false, reason: 'no_existing_row_to_link' };
  }

  // Build the row payload
  const row = {
    dosage: dose,
    medication,
    notes: `Via encounter note by ${note.created_by || 'Staff'}`,
    updated_at: new Date().toISOString(),
  };
  if (hasWeight) row.weight = weight;

  let serviceLogId;

  if (existing) {
    // Critical rule: do NOT overwrite entry_type. If the existing row is a
    // weight_check, pickup, or anything other than 'injection', we leave
    // it alone and create a new injection row instead. This is the bug
    // that caused weight checks to silently become injections.
    if (existing.entry_type !== 'injection') {
      const { data: inserted, error } = await supabase
        .from('service_logs')
        .insert({
          patient_id: note.patient_id,
          protocol_id: activeProtocol.id,
          category: 'weight_loss',
          entry_type: 'injection',
          entry_date: logDate,
          note_id: note.id,
          administered_by: note.created_by || null,
          ...row,
        })
        .select('id')
        .single();
      if (error) throw error;
      serviceLogId = inserted.id;
    } else {
      // Update existing injection row, link to this note if not yet linked
      const update = {
        ...row,
        entry_date: logDate,
      };
      if (!existing.note_id) update.note_id = note.id;
      const { error } = await supabase
        .from('service_logs')
        .update(update)
        .eq('id', existing.id);
      if (error) throw error;
      serviceLogId = existing.id;
    }
  } else {
    const { data: inserted, error } = await supabase
      .from('service_logs')
      .insert({
        patient_id: note.patient_id,
        protocol_id: activeProtocol.id,
        category: 'weight_loss',
        entry_type: 'injection',
        entry_date: logDate,
        note_id: note.id,
        administered_by: note.created_by || null,
        ...row,
      })
      .select('id')
      .single();
    if (error) throw error;
    serviceLogId = inserted.id;
  }

  // Apply protocol-level updates (dose with guard, weight, dates)
  let doseGuardBlocked = false;
  let doseGuardReason = null;
  const protocolUpdates = { updated_at: new Date().toISOString() };

  if (dose) {
    const guard = await guardDoseChange(
      supabase,
      activeProtocol,
      { selected_dose: dose, dose, current_dose: dose },
      { mode: 'strip', approvedRequestId: options.approvedDoseChangeRequestId }
    );
    if (!guard.blocked || guard.blocked.length === 0) {
      protocolUpdates.selected_dose = dose;
      protocolUpdates.dose = dose;
      protocolUpdates.current_dose = dose;
    } else {
      doseGuardBlocked = true;
      doseGuardReason = guard.reason;
    }
  }

  // last_visit_date / next_expected_date keep the patient card's "Next" accurate
  protocolUpdates.last_visit_date = logDate;
  const nextDate = new Date(logDate + 'T12:00:00');
  nextDate.setDate(nextDate.getDate() + 7);
  protocolUpdates.next_expected_date = nextDate.toISOString().split('T')[0];

  if (!activeProtocol.starting_weight && wl.starting_weight != null) {
    protocolUpdates.starting_weight = wl.starting_weight;
  }
  if (wl.goal_weight != null) {
    protocolUpdates.goal_weight = wl.goal_weight;
  }

  await supabase
    .from('protocols')
    .update(protocolUpdates)
    .eq('id', activeProtocol.id);

  // Always recount sessions_used from actual service_log rows
  const sessionsUsed = await recountProtocolSessions(supabase, activeProtocol.id);

  // Side effects: weight_logs (legacy) + patient_vitals
  if (hasWeight) {
    try {
      const { data: existingWeightLog } = await supabase
        .from('weight_logs')
        .select('id')
        .eq('protocol_id', activeProtocol.id)
        .eq('log_date', logDate)
        .maybeSingle();

      if (existingWeightLog) {
        await supabase
          .from('weight_logs')
          .update({ weight, notes: `Via encounter note by ${note.created_by || 'Staff'}` })
          .eq('id', existingWeightLog.id);
      } else {
        await supabase
          .from('weight_logs')
          .insert({
            protocol_id: activeProtocol.id,
            log_date: logDate,
            weight,
            notes: `Via encounter note by ${note.created_by || 'Staff'}`,
          });
      }
    } catch (err) {
      console.error('[wl-note-sync] weight_logs error (non-fatal):', err.message);
    }

    try {
      const recordedAt = note.note_date
        ? new Date(note.note_date).toISOString()
        : new Date().toISOString();

      let existingVitals = null;
      if (note.appointment_id) {
        const { data } = await supabase
          .from('patient_vitals')
          .select('id')
          .eq('appointment_id', note.appointment_id)
          .maybeSingle();
        existingVitals = data;
      }
      if (!existingVitals) {
        const dayStart = logDate + 'T00:00:00.000Z';
        const dayEnd = logDate + 'T23:59:59.999Z';
        const { data } = await supabase
          .from('patient_vitals')
          .select('id')
          .eq('patient_id', note.patient_id)
          .gte('recorded_at', dayStart)
          .lte('recorded_at', dayEnd)
          .maybeSingle();
        existingVitals = data;
      }

      if (existingVitals) {
        await supabase.from('patient_vitals')
          .update({ weight_lbs: weight, recorded_by: note.created_by || 'Staff' })
          .eq('id', existingVitals.id);
      } else {
        await supabase.from('patient_vitals').insert({
          patient_id: note.patient_id,
          appointment_id: note.appointment_id || null,
          weight_lbs: weight,
          recorded_by: note.created_by || 'Staff',
          recorded_at: recordedAt,
        });
      }
    } catch (err) {
      console.error('[wl-note-sync] patient_vitals error (non-fatal):', err.message);
    }
  }

  return {
    synced: true,
    serviceLogId,
    protocolId: activeProtocol.id,
    sessionsUsed,
    totalSessions: activeProtocol.total_sessions,
    doseGuardBlocked,
    doseGuardReason,
  };
}
