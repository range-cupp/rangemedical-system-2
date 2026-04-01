// /pages/api/admin/backfill-wl-logs.js
// Backfill weight and dose on existing weight loss service_logs from encounter notes
// Does NOT create new injections — only patches missing data on existing logs
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dry_run = true } = req.body;

  try {
    // 1. Get all weight loss encounter notes
    const { data: notes, error: notesErr } = await supabase
      .from('patient_notes')
      .select('id, patient_id, body, note_date, encounter_service')
      .or('encounter_service.ilike.%weight%,encounter_service.ilike.%semaglutide%,encounter_service.ilike.%tirzepatide%,encounter_service.ilike.%retatrutide%,encounter_service.eq.weight_loss')
      .not('body', 'is', null)
      .order('note_date', { ascending: true });

    if (notesErr) throw notesErr;

    const results = { matched: 0, updated_weight: 0, updated_dose: 0, updated_goal: 0, skipped: 0, details: [] };

    for (const note of (notes || [])) {
      const body = note.body || '';

      // Parse weight from note body
      const weightMatch = body.match(/\*\*Current Weight:\*\*\s*([\d.]+)/);
      const weight = weightMatch ? parseFloat(weightMatch[1]) : null;

      // Parse dose from note body
      const doseMatch = body.match(/\*\*Dose:\*\*\s*(.+?)(?:\n|$)/);
      const dose = doseMatch ? doseMatch[1].trim() : null;

      // Parse goal weight from note body
      const goalMatch = body.match(/\*\*Goal Weight:\*\*\s*([\d.]+)/);
      const goalWeight = goalMatch ? parseFloat(goalMatch[1]) : null;

      if (!weight && !dose && !goalWeight) {
        results.skipped++;
        continue;
      }

      // Get the note date (date only)
      const noteDate = note.note_date
        ? new Date(note.note_date).toISOString().split('T')[0]
        : null;

      if (!noteDate || !note.patient_id) {
        results.skipped++;
        continue;
      }

      // Find matching service_log entry within ±1 day
      const dateBefore = new Date(noteDate + 'T00:00:00');
      dateBefore.setDate(dateBefore.getDate() - 1);
      const dateAfter = new Date(noteDate + 'T00:00:00');
      dateAfter.setDate(dateAfter.getDate() + 1);

      const { data: logs } = await supabase
        .from('service_logs')
        .select('id, entry_date, weight, dosage, patient_id, protocol_id')
        .eq('patient_id', note.patient_id)
        .eq('category', 'weight_loss')
        .neq('entry_type', 'pickup')
        .gte('entry_date', dateBefore.toISOString().split('T')[0])
        .lte('entry_date', dateAfter.toISOString().split('T')[0])
        .limit(1);

      const log = logs?.[0];
      if (!log) {
        results.skipped++;
        continue;
      }

      results.matched++;

      // Build update for service_log (only fill missing fields)
      const logUpdate = {};
      if (weight && !log.weight) {
        logUpdate.weight = weight;
        results.updated_weight++;
      }
      if (dose && !log.dosage) {
        logUpdate.dosage = dose;
        results.updated_dose++;
      }

      // Update service_log if there's anything to patch
      if (Object.keys(logUpdate).length > 0) {
        if (!dry_run) {
          await supabase
            .from('service_logs')
            .update(logUpdate)
            .eq('id', log.id);
        }
        results.details.push({
          note_id: note.id,
          log_id: log.id,
          date: noteDate,
          patient_id: note.patient_id,
          patched: logUpdate,
        });
      }

      // Backfill goal_weight on protocol (if found in note and protocol doesn't have it)
      if (goalWeight && log.protocol_id) {
        const { data: proto } = await supabase
          .from('protocols')
          .select('id, goal_weight')
          .eq('id', log.protocol_id)
          .single();

        if (proto && !proto.goal_weight) {
          results.updated_goal++;
          if (!dry_run) {
            await supabase
              .from('protocols')
              .update({ goal_weight: goalWeight })
              .eq('id', proto.id);
          }
          results.details.push({
            note_id: note.id,
            protocol_id: proto.id,
            date: noteDate,
            patched: { goal_weight: goalWeight },
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      dry_run,
      total_notes: (notes || []).length,
      ...results,
    });
  } catch (err) {
    console.error('Backfill error:', err);
    return res.status(500).json({ error: err.message });
  }
}
