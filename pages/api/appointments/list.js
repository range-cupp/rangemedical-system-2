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

    // Auto-inherit id_verified from patient id_on_file
    const unverifiedWithPatient = (appointments || []).filter(a => !a.id_verified && a.patient_id);
    if (unverifiedWithPatient.length > 0) {
      const patientIds = [...new Set(unverifiedWithPatient.map(a => a.patient_id))];
      const { data: patients } = await supabase
        .from('patients')
        .select('id, id_on_file')
        .in('id', patientIds)
        .eq('id_on_file', true);

      if (patients?.length) {
        const idOnFileSet = new Set(patients.map(p => p.id));
        const apptIdsToUpdate = unverifiedWithPatient
          .filter(a => idOnFileSet.has(a.patient_id))
          .map(a => a.id);

        if (apptIdsToUpdate.length > 0) {
          await supabase
            .from('appointments')
            .update({ id_verified: true })
            .in('id', apptIdsToUpdate);

          // Reflect in response
          for (const apt of appointments) {
            if (apptIdsToUpdate.includes(apt.id)) {
              apt.id_verified = true;
            }
          }
        }
      }
    }

    return res.status(200).json({ appointments });
  } catch (error) {
    console.error('List appointments error:', error);
    return res.status(500).json({ error: error.message });
  }
}
