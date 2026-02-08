// /pages/api/admin/import-appointments.js
// Manually import appointments to clinic_appointments table
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { appointments } = req.body;

  if (!appointments || !Array.isArray(appointments)) {
    return res.status(400).json({ error: 'appointments array required' });
  }

  const results = {
    imported: 0,
    errors: []
  };

  for (const apt of appointments) {
    try {
      // Find patient by GHL contact ID
      let patientId = null;
      if (apt.ghl_contact_id) {
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('ghl_contact_id', apt.ghl_contact_id)
          .single();
        if (patient) {
          patientId = patient.id;
        }
      }

      const appointmentData = {
        ghl_appointment_id: apt.ghl_appointment_id,
        ghl_contact_id: apt.ghl_contact_id,
        patient_id: patientId,
        calendar_name: apt.calendar_name,
        appointment_title: apt.appointment_title,
        appointment_date: apt.appointment_date,
        start_time: apt.start_time,
        end_time: apt.end_time || null,
        status: apt.status || 'showed',
        notes: apt.notes || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('clinic_appointments')
        .upsert(appointmentData, { onConflict: 'ghl_appointment_id' });

      if (error) {
        results.errors.push({ id: apt.ghl_appointment_id, error: error.message });
      } else {
        results.imported++;
      }
    } catch (e) {
      results.errors.push({ id: apt.ghl_appointment_id, error: e.message });
    }
  }

  return res.status(200).json({
    success: true,
    ...results
  });
}
