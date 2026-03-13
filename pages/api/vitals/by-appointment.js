// pages/api/vitals/by-appointment.js
// Fetch vitals for a specific encounter + last known height
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

  const { appointment_id, patient_id } = req.query;

  if (!appointment_id && !patient_id) {
    return res.status(400).json({ error: 'appointment_id or patient_id required' });
  }

  try {
    let vitals = null;
    let lastHeight = null;

    // Fetch vitals for this specific appointment
    if (appointment_id) {
      const { data, error } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('appointment_id', appointment_id)
        .maybeSingle();

      if (error) throw error;
      vitals = data;
    }

    // If no vitals for this appointment, fetch last known height for auto-fill
    if (!vitals && patient_id) {
      const { data: lastVitals } = await supabase
        .from('patient_vitals')
        .select('height_inches')
        .eq('patient_id', patient_id)
        .not('height_inches', 'is', null)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastVitals) {
        lastHeight = lastVitals.height_inches;
      }
    }

    return res.status(200).json({ vitals, lastHeight });

  } catch (error) {
    console.error('Vitals by-appointment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
