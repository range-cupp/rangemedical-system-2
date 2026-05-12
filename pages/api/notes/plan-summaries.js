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

  try {
    let query = supabase
      .from('patient_notes')
      .select('id, patient_id, plan_summary, note_date, created_by, encounter_service, status, signed_by, signed_at')
      .not('plan_summary', 'is', null)
      .order('note_date', { ascending: false });

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!patient_id && data && data.length > 0) {
      const patientIds = [...new Set(data.map(n => n.patient_id))];
      const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, name')
        .in('id', patientIds);

      const patientMap = {};
      (patients || []).forEach(p => {
        patientMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Unknown';
      });
      data.forEach(n => { n.patient_name = patientMap[n.patient_id] || 'Unknown'; });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('[plan-summaries] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch plan summaries' });
  }
}
