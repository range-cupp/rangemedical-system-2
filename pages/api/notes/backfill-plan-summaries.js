// pages/api/notes/backfill-plan-summaries.js
// One-time backfill: generate plan summaries for recent provider consultation
// notes that don't have one yet. Processes sequentially to avoid rate limits.
// DELETE THIS FILE after the backfill is complete.

import { createClient } from '@supabase/supabase-js';
import { generateAndEmailPlanSummary } from '../../../lib/plan-summary';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data: notes, error } = await supabase
    .from('patient_notes')
    .select('id, patient_id, created_by, encounter_service, note_date')
    .gte('note_date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .is('plan_summary', null)
    .or('created_by.ilike.%burgess%,created_by.ilike.%brendyn%,created_by.ilike.%reed%')
    .order('note_date', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Exclude procedural/non-consultation types — everything else gets a summary
  const nonConsultPattern = /\binjection\b|iv.?therapy|range.?iv|nad\+?\s*iv|blood.?draw|medication.?pickup|pellet.?procedure|hrt.?followup/i;
  const filtered = notes.filter(n => !nonConsultPattern.test(n.encounter_service || ''));

  const results = [];
  for (const note of filtered) {
    try {
      const summary = await generateAndEmailPlanSummary(note.id);
      results.push({ id: note.id, success: !!summary });
      console.log(`[backfill] ${results.length}/${filtered.length} — ${note.id} ${summary ? 'OK' : 'SKIP'}`);
    } catch (err) {
      results.push({ id: note.id, success: false, error: err.message });
      console.error(`[backfill] ${note.id} FAILED:`, err.message);
    }
  }

  const succeeded = results.filter(r => r.success).length;
  return res.status(200).json({
    total: filtered.length,
    succeeded,
    failed: filtered.length - succeeded,
    results,
  });
}
