// /pages/api/admin/backfill-demographics.js
// Backfill patient demographics from linked intake forms
// Updates patients missing DOB, gender, first_name, last_name from their intakes

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dryRun = true } = req.body;

  try {
    // Get all patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, email, phone, first_name, last_name, date_of_birth, gender, ghl_contact_id')
      .order('created_at', { ascending: false });

    if (patientsError) {
      return res.status(500).json({ error: 'Failed to fetch patients', details: patientsError.message });
    }

    // Get all intakes
    const { data: intakes, error: intakesError } = await supabase
      .from('intakes')
      .select('id, patient_id, ghl_contact_id, email, phone, first_name, last_name, date_of_birth, gender')
      .order('submitted_at', { ascending: false });

    if (intakesError) {
      return res.status(500).json({ error: 'Failed to fetch intakes', details: intakesError.message });
    }

    // Build a map of intakes by various identifiers for quick lookup
    const intakesByPatientId = {};
    const intakesByGhlId = {};
    const intakesByEmail = {};
    const intakesByPhone = {};

    for (const intake of intakes) {
      // By patient_id
      if (intake.patient_id && !intakesByPatientId[intake.patient_id]) {
        intakesByPatientId[intake.patient_id] = intake;
      }
      // By ghl_contact_id
      if (intake.ghl_contact_id && !intakesByGhlId[intake.ghl_contact_id]) {
        intakesByGhlId[intake.ghl_contact_id] = intake;
      }
      // By email (lowercase for case-insensitive matching)
      if (intake.email) {
        const emailLower = intake.email.toLowerCase();
        if (!intakesByEmail[emailLower]) {
          intakesByEmail[emailLower] = intake;
        }
      }
      // By phone (normalized to last 10 digits)
      if (intake.phone) {
        const normalizedPhone = intake.phone.replace(/\D/g, '').slice(-10);
        if (normalizedPhone.length === 10 && !intakesByPhone[normalizedPhone]) {
          intakesByPhone[normalizedPhone] = intake;
        }
      }
    }

    const results = {
      total_patients: patients.length,
      patients_with_missing_data: 0,
      patients_updated: 0,
      patients_with_no_intake: 0,
      updates: []
    };

    for (const patient of patients) {
      // Check if patient is missing any demographics
      const missingDob = !patient.date_of_birth;
      const missingGender = !patient.gender;
      const missingFirstName = !patient.first_name;
      const missingLastName = !patient.last_name;

      if (!missingDob && !missingGender && !missingFirstName && !missingLastName) {
        continue; // Patient has all data, skip
      }

      results.patients_with_missing_data++;

      // Find matching intake
      let intake = null;

      // Try by patient_id
      intake = intakesByPatientId[patient.id];

      // Try by ghl_contact_id
      if (!intake && patient.ghl_contact_id) {
        intake = intakesByGhlId[patient.ghl_contact_id];
      }

      // Try by email
      if (!intake && patient.email) {
        intake = intakesByEmail[patient.email.toLowerCase()];
      }

      // Try by phone
      if (!intake && patient.phone) {
        const normalizedPhone = patient.phone.replace(/\D/g, '').slice(-10);
        if (normalizedPhone.length === 10) {
          intake = intakesByPhone[normalizedPhone];
        }
      }

      if (!intake) {
        results.patients_with_no_intake++;
        continue;
      }

      // Build update object with only missing fields
      const updates = {};

      if (missingDob && intake.date_of_birth) {
        updates.date_of_birth = intake.date_of_birth;
      }
      if (missingGender && intake.gender) {
        updates.gender = intake.gender;
      }
      if (missingFirstName && intake.first_name) {
        updates.first_name = intake.first_name;
      }
      if (missingLastName && intake.last_name) {
        updates.last_name = intake.last_name;
      }

      if (Object.keys(updates).length === 0) {
        continue; // Intake doesn't have the missing data either
      }

      const updateRecord = {
        patient_id: patient.id,
        patient_email: patient.email,
        intake_id: intake.id,
        updates
      };

      if (!dryRun) {
        // Actually update the patient
        const { error: updateError } = await supabase
          .from('patients')
          .update(updates)
          .eq('id', patient.id);

        if (updateError) {
          updateRecord.error = updateError.message;
        } else {
          updateRecord.success = true;
          results.patients_updated++;
        }
      } else {
        updateRecord.dry_run = true;
        results.patients_updated++;
      }

      results.updates.push(updateRecord);
    }

    return res.status(200).json({
      message: dryRun ? 'Dry run complete - no changes made' : 'Backfill complete',
      ...results
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
