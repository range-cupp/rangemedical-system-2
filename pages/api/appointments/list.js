// GET /api/appointments/list
// Query appointments by date range, patient, status, provider

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { start_date, end_date, patient_id, status, provider } = req.query;

    let query = supabase
      .from('appointments')
      .select('*')
      .order('start_time', { ascending: true });

    if (start_date) {
      query = query.gte('start_time', start_date);
    }
    if (end_date) {
      query = query.lte('start_time', end_date);
    }
    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (provider) {
      query = query.eq('provider', provider);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('List appointments error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ appointments });
  } catch (error) {
    console.error('List appointments error:', error);
    return res.status(500).json({ error: error.message });
  }
}
