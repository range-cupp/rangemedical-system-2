// /pages/api/service-log/sign-out-sheet.js
// Fetch sign-out sheet data for a service log entry
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  try {
    // Fetch the service log entry
    let entry = null;

    // Try service_logs first
    const { data: serviceLog } = await supabase
      .from('service_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (serviceLog) {
      entry = serviceLog;
    } else {
      // Fall back to injection_logs
      const { data: injLog } = await supabase
        .from('injection_logs')
        .select('*')
        .eq('id', id)
        .single();

      entry = injLog;
    }

    if (!entry) {
      return res.status(404).json({ error: 'Service log entry not found' });
    }

    // Fetch patient info
    let patient = null;
    if (entry.patient_id) {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, email, phone, date_of_birth, gender')
        .eq('id', entry.patient_id)
        .single();

      patient = patientData;
    }

    return res.status(200).json({ entry, patient });

  } catch (error) {
    console.error('Sign-out sheet error:', error);
    return res.status(500).json({ error: error.message });
  }
}
