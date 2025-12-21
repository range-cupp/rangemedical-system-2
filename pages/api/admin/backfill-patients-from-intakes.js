// /pages/api/admin/backfill-patients-from-intakes.js
// Creates patient records from intakes that don't have linked patients
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

  const results = {
    intakesProcessed: 0,
    patientsCreated: 0,
    patientsLinked: 0,
    alreadyLinked: 0,
    errors: []
  };

  try {
    // Get all intakes
    const { data: intakes, error: intakesError } = await supabase
      .from('intakes')
      .select('*')
      .order('submitted_at', { ascending: true });

    if (intakesError) throw intakesError;

    console.log(`Processing ${intakes.length} intakes...`);

    // Get all existing patients for matching
    const { data: existingPatients } = await supabase
      .from('patients')
      .select('id, ghl_contact_id, email, phone, first_name, last_name');

    // Build lookup maps
    const patientByGhlId = {};
    const patientByEmail = {};
    const patientByPhone = {};
    const patientByName = {};

    existingPatients?.forEach(p => {
      if (p.ghl_contact_id) patientByGhlId[p.ghl_contact_id] = p;
      if (p.email) patientByEmail[p.email.toLowerCase().trim()] = p;
      if (p.phone) {
        const normalized = p.phone.replace(/\D/g, '').slice(-10);
        if (normalized.length === 10) patientByPhone[normalized] = p;
      }
      if (p.first_name && p.last_name) {
        const fullName = `${p.first_name.toLowerCase().trim()} ${p.last_name.toLowerCase().trim()}`;
        patientByName[fullName] = p;
      }
    });

    for (const intake of intakes) {
      results.intakesProcessed++;

      // Skip if already has patient_id and patient exists
      if (intake.patient_id) {
        const patientExists = existingPatients?.some(p => p.id === intake.patient_id);
        if (patientExists) {
          results.alreadyLinked++;
          continue;
        }
      }

      // Try to find matching patient
      let matchedPatient = null;

      // 1. By ghl_contact_id
      if (intake.ghl_contact_id && patientByGhlId[intake.ghl_contact_id]) {
        matchedPatient = patientByGhlId[intake.ghl_contact_id];
      }
      // 2. By email
      else if (intake.email && patientByEmail[intake.email.toLowerCase().trim()]) {
        matchedPatient = patientByEmail[intake.email.toLowerCase().trim()];
      }
      // 3. By phone
      else if (intake.phone) {
        const normalized = intake.phone.replace(/\D/g, '').slice(-10);
        if (normalized.length === 10 && patientByPhone[normalized]) {
          matchedPatient = patientByPhone[normalized];
        }
      }
      // 4. By name
      else if (intake.first_name && intake.last_name) {
        const fullName = `${intake.first_name.toLowerCase().trim()} ${intake.last_name.toLowerCase().trim()}`;
        if (patientByName[fullName]) {
          matchedPatient = patientByName[fullName];
        }
      }

      if (matchedPatient) {
        // Link intake to existing patient
        const { error: linkError } = await supabase
          .from('intakes')
          .update({ patient_id: matchedPatient.id })
          .eq('id', intake.id);

        if (!linkError) {
          results.patientsLinked++;
          console.log(`Linked intake ${intake.id} to existing patient ${matchedPatient.id}`);
        }
      } else {
        // Create new patient from intake
        const newPatient = {
          ghl_contact_id: intake.ghl_contact_id || null,
          first_name: intake.first_name,
          last_name: intake.last_name,
          email: intake.email,
          phone: intake.phone,
          date_of_birth: intake.date_of_birth,
          gender: intake.gender,
          address: intake.street_address,
          city: intake.city,
          state: intake.state,
          zip: intake.postal_code,
          country: intake.country,
          source: 'intake_backfill',
          created_at: intake.submitted_at || new Date().toISOString()
        };

        const { data: createdPatient, error: createError } = await supabase
          .from('patients')
          .insert(newPatient)
          .select()
          .single();

        if (createError) {
          console.error(`Failed to create patient from intake ${intake.id}:`, createError.message);
          results.errors.push({
            intakeId: intake.id,
            name: `${intake.first_name} ${intake.last_name}`,
            error: createError.message
          });
        } else {
          // Link intake to new patient
          await supabase
            .from('intakes')
            .update({ patient_id: createdPatient.id })
            .eq('id', intake.id);

          results.patientsCreated++;
          console.log(`Created patient ${createdPatient.id} from intake ${intake.id}: ${intake.first_name} ${intake.last_name}`);

          // Add to lookup maps for future iterations
          if (createdPatient.ghl_contact_id) patientByGhlId[createdPatient.ghl_contact_id] = createdPatient;
          if (createdPatient.email) patientByEmail[createdPatient.email.toLowerCase().trim()] = createdPatient;
          if (createdPatient.phone) {
            const normalized = createdPatient.phone.replace(/\D/g, '').slice(-10);
            if (normalized.length === 10) patientByPhone[normalized] = createdPatient;
          }
        }
      }
    }

    console.log('Backfill complete:', results);

    return res.status(200).json({
      success: true,
      results,
      message: `Processed ${results.intakesProcessed} intakes. Created ${results.patientsCreated} new patients, linked ${results.patientsLinked} to existing, ${results.alreadyLinked} already linked.`
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return res.status(500).json({ error: error.message });
  }
}
