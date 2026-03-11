// pages/api/prescriptions/index.js
// Get prescriptions for a patient or encounter

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, appointment_id } = req.query;

  if (!patient_id && !appointment_id) {
    return res.status(400).json({ error: 'patient_id or appointment_id required' });
  }

  try {
    let query = supabase.from('prescriptions').select('*');

    if (appointment_id) {
      query = query.eq('appointment_id', appointment_id);
    } else if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, prescriptions: data || [] });
  } catch (error) {
    console.error('Fetch prescriptions error:', error);
    return res.status(500).json({ error: error.message });
  }
}
