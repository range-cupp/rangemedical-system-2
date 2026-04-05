// /pages/api/patient/check-ins.js
// Fetch weekly check-in responses for a patient
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

  const { patient_id } = req.query;

  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id required' });
  }

  try {
    const { data, error } = await supabase
      .from('check_ins')
      .select('id, patient_id, check_in_date, energy_score, sleep_score, mood_score, brain_fog_score, pain_score, libido_score, overall_score, weight, notes, created_at')
      .eq('patient_id', patient_id)
      .order('check_in_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Check-ins fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch check-ins' });
    }

    return res.status(200).json({ checkIns: data || [] });
  } catch (error) {
    console.error('Check-ins API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
