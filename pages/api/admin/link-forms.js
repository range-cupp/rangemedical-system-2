// /pages/api/admin/link-forms.js
// Link consents and intakes to patient records
// Range Medical
//
// This API:
// 1. Finds all consents/intakes without patient_id
// 2. Matches them to patients via email, phone, or name
// 3. Updates the records with the correct patient_id

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Normalize phone for comparison
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

// Normalize name for comparison
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    consents: { found: 0, linked: 0, skipped: 0 },
    intakes: { found: 0, linked: 0, skipped: 0 }
  };

  try {
    // Get all patients for matching
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, ghl_contact_id, email, phone, first_name, last_name');

    if (patientsError) throw patientsError;

    // Create lookup maps for faster matching
    const patientByEmail = {};
    const patientByPhone = {};
    const patientByName = {};

    patients.forEach(p => {
      // By email
      if (p.email) {
        patientByEmail[p.email.toLowerCase().trim()] = p;
      }
      
      // By phone (last 10 digits)
      if (p.phone) {
        const normalized = normalizePhone(p.phone);
        if (normalized.length >= 10) {
          patientByPhone[normalized] = p;
        }
      }
      
      // By full name
      if (p.first_name && p.last_name) {
        const fullName = `${normalizeName(p.first_name)} ${normalizeName(p.last_name)}`;
        patientByName[fullName] = p;
      }
    });

    console.log(`Loaded ${patients.length} patients for matching`);
    console.log(`  - By email: ${Object.keys(patientByEmail).length}`);
    console.log(`  - By phone: ${Object.keys(patientByPhone).length}`);
    console.log(`  - By name: ${Object.keys(patientByName).length}`);

    // =====================
    // LINK CONSENTS
    // =====================
    const { data: unlinkedConsents, error: consentsError } = await supabase
      .from('consents')
      .select('*')
      .is('patient_id', null);

    if (consentsError) {
      console.log('Consents query error (table may not exist):', consentsError.message);
    } else {
      results.consents.found = unlinkedConsents?.length || 0;

      for (const consent of (unlinkedConsents || [])) {
        let matchedPatient = null;

        // Try to match by email first
        if (consent.email && patientByEmail[consent.email.toLowerCase().trim()]) {
          matchedPatient = patientByEmail[consent.email.toLowerCase().trim()];
        }
        // Then try phone
        else if (consent.phone) {
          const normalizedPhone = normalizePhone(consent.phone);
          if (normalizedPhone.length >= 10 && patientByPhone[normalizedPhone]) {
            matchedPatient = patientByPhone[normalizedPhone];
          }
        }
        // Then try name
        else if (consent.first_name && consent.last_name) {
          const fullName = `${normalizeName(consent.first_name)} ${normalizeName(consent.last_name)}`;
          if (patientByName[fullName]) {
            matchedPatient = patientByName[fullName];
          }
        }

        if (matchedPatient) {
          const { error: updateError } = await supabase
            .from('consents')
            .update({ patient_id: matchedPatient.id })
            .eq('id', consent.id);

          if (!updateError) {
            results.consents.linked++;
          } else {
            console.error('Failed to link consent:', consent.id, updateError);
            results.consents.skipped++;
          }
        } else {
          results.consents.skipped++;
        }
      }
    }

    // =====================
    // LINK INTAKES
    // =====================
    const { data: unlinkedIntakes, error: intakesError } = await supabase
      .from('intakes')
      .select('*')
      .is('patient_id', null);

    if (intakesError) {
      console.log('Intakes query error (table may not exist):', intakesError.message);
    } else {
      results.intakes.found = unlinkedIntakes?.length || 0;

      for (const intake of (unlinkedIntakes || [])) {
        let matchedPatient = null;

        // Try to match by email first
        if (intake.email && patientByEmail[intake.email.toLowerCase().trim()]) {
          matchedPatient = patientByEmail[intake.email.toLowerCase().trim()];
        }
        // Then try phone
        else if (intake.phone) {
          const normalizedPhone = normalizePhone(intake.phone);
          if (normalizedPhone.length >= 10 && patientByPhone[normalizedPhone]) {
            matchedPatient = patientByPhone[normalizedPhone];
          }
        }
        // Then try name
        else if (intake.first_name && intake.last_name) {
          const fullName = `${normalizeName(intake.first_name)} ${normalizeName(intake.last_name)}`;
          if (patientByName[fullName]) {
            matchedPatient = patientByName[fullName];
          }
        }

        if (matchedPatient) {
          const { error: updateError } = await supabase
            .from('intakes')
            .update({ patient_id: matchedPatient.id })
            .eq('id', intake.id);

          if (!updateError) {
            results.intakes.linked++;
          } else {
            console.error('Failed to link intake:', intake.id, updateError);
            results.intakes.skipped++;
          }
        } else {
          results.intakes.skipped++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      results,
      message: `Linked ${results.consents.linked} consents and ${results.intakes.linked} intakes`
    });

  } catch (error) {
    console.error('Link forms error:', error);
    return res.status(500).json({ error: error.message });
  }
}
