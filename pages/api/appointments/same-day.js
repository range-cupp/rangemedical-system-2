// pages/api/appointments/same-day.js
// Returns other appointments for the same patient on the same day
// Used by EncounterModal to offer multi-service encounter notes

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, date, exclude_id } = req.query;

  if (!patient_id || !date) {
    return res.status(400).json({ error: 'patient_id and date are required' });
  }

  try {
    const dayStart = `${date}T00:00:00-08:00`;
    const dayEnd = `${date}T23:59:59-08:00`;

    let query = supabase
      .from('appointments')
      .select('id, service_name, appointment_title, start_time, status, provider')
      .eq('patient_id', patient_id)
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd)
      .not('status', 'in', '("cancelled","no_show")');

    if (exclude_id) {
      query = query.neq('id', exclude_id);
    }

    const { data: appointments, error } = await query.order('start_time', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ appointments: appointments || [] });
  } catch (error) {
    console.error('Same-day appointments error:', error);
    return res.status(500).json({ error: error.message });
  }
}
