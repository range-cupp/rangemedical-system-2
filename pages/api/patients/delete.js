// /pages/api/patients/delete.js
// Delete a patient and all related records
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// All tables that reference patient_id (from FK constraints on patients.id)
const RELATED_TABLES = [
  // Archive tables
  '_archive_patient_protocols',
  '_archive_protocols',
  '_archive_sessions',
  '_archive_symptoms',
  '_archive_symptoms_questionnaires',
  // Core records
  'alerts',
  'appointments',
  'baseline_questionnaires',
  'birthday_gifts',
  'calcom_bookings',
  'cellular_energy_checkins',
  'challenges',
  'check_ins',
  'checkin_reminders_log',
  'clinic_appointments',
  'comms_log',
  'consent_forms',
  'consents',
  'cures_checks',
  'daily_logs',
  'dose_change_requests',
  'email_campaign_recipients',
  'energy_recovery_redemptions',
  'energy_recovery_packs',
  'form_bundles',
  'hrt_memberships',
  'injection_logs',
  'intakes',
  'invoices',
  'journey_events',
  'lab_documents',
  'lab_journeys',
  'lab_orders',
  'lab_prep_acknowledgments',
  'lab_results',
  'labs',
  'measurements',
  'medical_documents',
  'note_edits',
  'notification_queue',
  'patient_allergies',
  'patient_credits',
  'patient_diagnoses',
  'patient_medications',
  'patient_notes',
  'patient_portal_tokens',
  'patient_protocols',
  'patient_tokens',
  'patient_vitals',
  'pending_link_messages',
  'pf_lab_observations',
  'plan_blocks',
  'prescriptions',
  'protocol_checkins',
  'protocol_follow_up_labs',
  'protocol_labs',
  'protocol_logs',
  'protocols',
  'purchase_notifications',
  'purchases',
  'quotes',
  'refill_requests',
  'review_gifts',
  'sales_pipeline',
  'service_logs',
  'session_packages',
  'session_usage',
  'sessions',
  'shared_plans',
  'shop_accounts',
  'shop_orders',
  'staff_alerts',
  'subscriptions',
  'symptom_responses',
  'symptoms',
  'trial_passes',
  'weight_log',
  'weight_loss_programs',
  'wins',
];

// Tables where the FK column is NOT named "patient_id"
const SPECIAL_FK_TABLES = [
  { table: 'gift_cards', column: 'buyer_patient_id' },
  { table: 'gift_card_redemptions', column: 'redeemed_by_patient_id' },
  { table: 'pf_patient_mapping', column: 'crm_patient_id' },
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

  for (const { table, column } of SPECIAL_FK_TABLES) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq(column, patient_id);

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

  for (const { table, column } of SPECIAL_FK_TABLES) {
    try {
      const { error: delErr } = await supabase
        .from(table)
        .delete()
        .eq(column, patient_id);

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
