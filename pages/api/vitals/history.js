// pages/api/vitals/history.js
// Fetch vitals history for a patient (for profile flowsheet)
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

  const { patient_id, limit = '50' } = req.query;

  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id required' });
  }

  try {
    const { data, error } = await supabase
      .from('patient_vitals')
      .select('*')
      .eq('patient_id', patient_id)
      .order('recorded_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    return res.status(200).json({ vitals: data || [] });

  } catch (error) {
    console.error('Vitals history error:', error);
    return res.status(500).json({ error: error.message });
  }
}
