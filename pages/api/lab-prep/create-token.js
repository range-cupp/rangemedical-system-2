// /pages/api/lab-prep/create-token.js
// Creates a lab prep acknowledgment token for a patient
// Called from appointment notification code when sending blood draw SMS
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { patientId, patientName, patientPhone, appointmentDate } = req.body;

  const { data, error } = await supabase
    .from('lab_prep_acknowledgments')
    .insert({
      patient_id: patientId || null,
      patient_name: patientName || null,
      patient_phone: patientPhone || null,
      appointment_date: appointmentDate || null,
    })
    .select('token')
    .single();

  if (error) {
    console.error('Create lab prep token error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ token: data.token });
}
