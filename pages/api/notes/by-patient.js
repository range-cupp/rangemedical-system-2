// /pages/api/notes/by-patient.js
// Fetch clinical notes for a patient, optionally filtered by source
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, source } = req.query;
  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id is required' });
  }

  try {
    let query = supabase
      .from('patient_notes')
      .select('id, body, raw_input, note_date, source, created_by, created_at, signed_by, signed_at, status, encounter_service, appointment_id, protocol_id')
      .eq('patient_id', patient_id)
      .order('note_date', { ascending: false })
      .limit(100);

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ notes: data || [] });
  } catch (error) {
    console.error('Notes by patient fetch error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch notes' });
  }
}
