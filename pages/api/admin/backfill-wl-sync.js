// Admin endpoint to backfill WL note → service_log sync across recent notes.
// Idempotent: notes already linked are no-ops. Notes without parseable WL
// fields are skipped. Use sparingly; intended for one-off remediation.
//
// POST /api/admin/backfill-wl-sync?days=60&secret=...

import { createClient } from '@supabase/supabase-js';
import { syncWLNoteToServiceLog } from '../../../lib/wl-note-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST required' });
  }
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const days = parseInt(req.query.days || '60');
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const { data: notes, error } = await supabase
    .from('patient_notes')
    .select('id, patient_id, body, encounter_service, source, note_date, created_by, appointment_id, status')
    .eq('source', 'encounter')
    .gte('note_date', sinceISO)
    .order('note_date');

  if (error) return res.status(500).json({ error: error.message });

  const results = { scanned: notes.length, synced: 0, skipped: 0, errored: 0, byReason: {} };
  const errors = [];
  const synced = [];

  for (const note of notes) {
    const es = (note.encounter_service || '').toLowerCase();
    const looksWL = es.includes('weight') || es === 'weight_loss' || es.includes('injection');
    if (!looksWL) {
      results.skipped++;
      results.byReason.not_wl_service = (results.byReason.not_wl_service || 0) + 1;
      continue;
    }

    try {
      const result = await syncWLNoteToServiceLog(supabase, note);
      if (result.synced) {
        results.synced++;
        synced.push({
          note_id: note.id,
          note_date: note.note_date,
          service_log_id: result.serviceLogId,
          sessions: `${result.sessionsUsed}/${result.totalSessions}`,
        });
      } else {
        results.skipped++;
        results.byReason[result.reason] = (results.byReason[result.reason] || 0) + 1;
        if (req.query.verbose) {
          errors.push({ note_id: note.id, note_date: note.note_date, encounter_service: note.encounter_service, skip_reason: result.reason });
        }
      }
    } catch (err) {
      results.errored++;
      errors.push({ note_id: note.id, error: err.message, stack: err.stack?.split('\n').slice(0,3).join(' | ') });
    }
  }

  return res.status(200).json({ ok: true, results, synced, errors });
}
