// /pages/api/patients/delete.js
// Delete a patient and all related records
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// All tables that reference patient_id (from merge-patients.js + extras)
const RELATED_TABLES = [
  'protocols',
  'purchases',
  'labs',
  'symptoms',
  'measurements',
  'alerts',
  'sessions',
  'intakes',
  'consents',
  'medical_documents',
  'clinic_appointments',
  'lab_orders',
  'symptom_responses',
  'lab_documents',
  'questionnaire_responses',
  'injection_logs',
  'service_logs',
  'weight_logs',
  'protocol_follow_up_labs',
  'appointment_logs',
  'hrt_memberships',
  'protocol_logs',
  'lab_journeys',
  'hrt_monthly_periods',
  'comms_log',
  'daily_logs',
  'check_ins',
  'calcom_bookings',
  'cellular_energy_checkins',
  'challenges',
  'patient_labs',
  'patient_notes',
  'session_packages',
  'weight_loss_programs',
  'notification_queue',
  'refill_requests',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, confirm } = req.body;

  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id is required' });
  }

  // Look up the patient
  const { data: patient, error: lookupErr } = await supabase
    .from('patients')
    .select('id, name, first_name, last_name, email, phone, created_at')
    .eq('id', patient_id)
    .maybeSingle();

  if (lookupErr) {
    return res.status(500).json({ error: lookupErr.message });
  }

  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const patientName = patient.first_name && patient.last_name
    ? `${patient.first_name} ${patient.last_name}`
    : patient.name || patient.email || patient_id;

  // Count related records
  const recordCounts = {};
  let totalRecords = 0;

  for (const table of RELATED_TABLES) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patient_id);

      if (!error && count > 0) {
        recordCounts[table] = count;
        totalRecords += count;
      }
    } catch (e) {
      // Table might not exist, skip
    }
  }

  // If not confirmed, return preview of what will be deleted
  if (!confirm) {
    return res.status(200).json({
      preview: true,
      patient: {
        id: patient.id,
        name: patientName,
        email: patient.email,
        phone: patient.phone,
        created_at: patient.created_at,
      },
      relatedRecords: recordCounts,
      totalRecords,
    });
  }

  // Delete all related records, then the patient
  const errors = [];

  for (const table of RELATED_TABLES) {
    try {
      const { error: delErr } = await supabase
        .from(table)
        .delete()
        .eq('patient_id', patient_id);

      if (delErr && !delErr.message.includes('does not exist')) {
        errors.push({ table, error: delErr.message });
      }
    } catch (e) {
      // Ignore tables that don't exist
    }
  }

  // Delete the patient record itself
  const { error: patientDelErr } = await supabase
    .from('patients')
    .delete()
    .eq('id', patient_id);

  if (patientDelErr) {
    return res.status(500).json({
      error: 'Failed to delete patient record',
      details: patientDelErr.message,
      relatedErrors: errors,
    });
  }

  console.log(`Patient deleted: ${patientName} (${patient_id}) — ${totalRecords} related records removed`);

  return res.status(200).json({
    success: true,
    deleted: patientName,
    relatedRecordsDeleted: recordCounts,
    totalRecordsDeleted: totalRecords,
    errors: errors.length > 0 ? errors : undefined,
  });
}
