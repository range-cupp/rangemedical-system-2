// pages/api/notes/plan-summaries.js
// Fetch all notes with plan summaries for a patient.
// GET ?patient_id=xxx  →  [{ id, plan_summary, note_date, created_by, encounter_service }]

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id } = req.query;
  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id is required' });
  }

  try {
    const { data, error } = await supabase
      .from('patient_notes')
      .select('id, plan_summary, note_date, created_by, encounter_service, status, signed_by, signed_at')
      .eq('patient_id', patient_id)
      .not('plan_summary', 'is', null)
      .order('note_date', { ascending: false });

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('[plan-summaries] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch plan summaries' });
  }
}
