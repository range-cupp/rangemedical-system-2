// /pages/api/admin/debug-patient.js
// Debug endpoint to check patient data
// Usage: GET /api/admin/debug-patient?name=Ali%20Amir

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Name parameter required' });
  }

  try {
    // Find patient
    const { data: patients } = await supabase
      .from('patients')
      .select('*')
      .ilike('name', `%${name}%`);

    if (!patients || patients.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patients[0];

    // Get protocols for this patient
    const { data: protocols } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    // Get clinic appointments
    const { data: appointments } = await supabase
      .from('clinic_appointments')
      .select('*')
      .eq('ghl_contact_id', patient.ghl_contact_id)
      .order('appointment_date', { ascending: false });

    return res.status(200).json({
      patient: {
        id: patient.id,
        name: patient.name,
        ghl_contact_id: patient.ghl_contact_id
      },
      protocols: protocols?.map(p => ({
        id: p.id,
        program_type: p.program_type,
        delivery_method: p.delivery_method,
        status: p.status,
        last_visit_date: p.last_visit_date,
        next_expected_date: p.next_expected_date,
        sessions_used: p.sessions_used,
        total_sessions: p.total_sessions,
        visit_frequency: p.visit_frequency
      })),
      clinic_appointments: appointments?.map(a => ({
        id: a.id,
        ghl_appointment_id: a.ghl_appointment_id,
        calendar_name: a.calendar_name,
        appointment_date: a.appointment_date,
        status: a.status,
        start_time: a.start_time
      }))
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
