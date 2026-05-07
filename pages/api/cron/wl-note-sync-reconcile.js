// /pages/api/cron/wl-note-sync-reconcile.js
// Daily reconciliation: re-run syncWLNoteToServiceLog for any signed WL
// encounter note that has no linked service_log. Exists because the
// inline syncs from notes/create, notes/[id], and notes/sign occasionally
// miss — when they do, the protocol's injection counter stays short and
// the schedule pins the next slot to the wrong date (Keely Julian's
// Apr 30 was the canonical case, 2026-05-06).
//
// Looks back 14 days. Older orphans are handled by the one-shot
// scripts/backfill-wl-orphan-notes.mjs.

import { createClient } from '@supabase/supabase-js';
import { syncWLNoteToServiceLog } from '../../../lib/wl-note-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );
  if (!isAuthorized) return res.status(401).json({ error: 'Unauthorized' });

  const lookbackDays = parseInt(req.query.days, 10) || 14;
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const stats = { scanned: 0, alreadyLinked: 0, synced: 0, linkedExisting: 0, skipped: [], errors: [] };

  try {
    const { data: notes, error: notesErr } = await supabase
      .from('patient_notes')
      .select('id, patient_id, body, note_date, encounter_service, source, signed_at, created_by, appointment_id')
      .eq('encounter_service', 'weight_loss')
      .not('signed_at', 'is', null)
      .gte('created_at', since.toISOString())
      .order('note_date');

    if (notesErr) throw notesErr;

    for (const note of notes || []) {
      stats.scanned++;

      const { data: linked } = await supabase
        .from('service_logs')
        .select('id')
        .eq('note_id', note.id)
        .limit(1);
      if (linked && linked.length > 0) {
        stats.alreadyLinked++;
        continue;
      }

      try {
        const result = await syncWLNoteToServiceLog(supabase, note);
        if (result.synced) {
          stats.synced++;
          console.log(`[wl-reconcile] note ${note.id} → service_log ${result.serviceLogId}`);
        } else {
          stats.skipped.push({ noteId: note.id, patientId: note.patient_id, reason: result.reason });
        }
      } catch (err) {
        stats.errors.push({ noteId: note.id, message: err.message });
        console.error(`[wl-reconcile] note ${note.id} sync error:`, err.message);
      }
    }

    return res.status(200).json({ ok: true, lookbackDays, ...stats });
  } catch (err) {
    console.error('[wl-reconcile] fatal error:', err);
    return res.status(500).json({ error: err.message, stats });
  }
}
