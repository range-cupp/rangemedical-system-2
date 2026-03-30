// /lib/lab-prep-token.js
// Creates lab prep acknowledgment tokens for blood draw appointments
// Used by appointment-notifications.js and lab-prep-reminder cron
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create a lab prep acknowledgment token for a patient
 * Returns the token UUID to append to the lab-prep URL
 */
export async function createLabPrepToken({ patientId, patientName, patientPhone, appointmentDate }) {
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
    return null;
  }

  return data.token;
}

/**
 * Build the lab prep URL with token
 */
export function buildLabPrepUrl(token) {
  if (!token) return 'https://www.range-medical.com/lab-prep';
  return `https://www.range-medical.com/lab-prep?t=${token}`;
}
