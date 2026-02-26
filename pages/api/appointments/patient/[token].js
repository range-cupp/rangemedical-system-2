// GET /api/appointments/patient/[token]
// Returns upcoming and past appointments for a patient portal token

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Resolve token to patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('portal_token', token)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const now = new Date().toISOString();

    // Upcoming: future + not cancelled/rescheduled
    const { data: upcoming } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patient.id)
      .gte('start_time', now)
      .not('status', 'in', '("cancelled","rescheduled")')
      .order('start_time', { ascending: true });

    // Past: before now or completed/no_show/cancelled, last 10
    const { data: past } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patient.id)
      .or(`start_time.lt.${now},status.in.("completed","no_show","cancelled")`)
      .not('status', 'eq', 'rescheduled')
      .order('start_time', { ascending: false })
      .limit(10);

    return res.status(200).json({
      upcoming: upcoming || [],
      past: past || [],
    });
  } catch (error) {
    console.error('Patient appointments error:', error);
    return res.status(500).json({ error: error.message });
  }
}
