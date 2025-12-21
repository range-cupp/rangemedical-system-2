// /pages/api/admin/link-forms.js
// Link consents and intakes to patient records
// Range Medical
//
// This API:
// 1. Finds all consents/intakes without patient_id
// 2. Matches them to patients via ghl_contact_id, email, or phone
// 3. Updates the records with the correct patient_id

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
    const patientByGhlId = {};
    const patientByEmail = {};
    const patientByPhone = {};

    patients.forEach(p => {
      if (p.ghl_contact_id) patientByGhlId[p.ghl_contact_id] = p;
      if (p.email) patientByEmail[p.email.toLowerCase()] = p;
      if (p.phone) {
        // Normalize phone - remove all non-digits
        const normalized = p.phone.replace(/\D/g, '');
        patientByPhone[normalized] = p;
        // Also store last 10 digits
        if (normalized.length >= 10) {
          patientByPhone[normalized.slice(-10)] = p;
        }
      }
    });

    // =====================
    // LINK CONSENTS
    // =====================
    const { data: unlinkedConsents, error: consentsError } = await supabase
      .from('consents')
      .select('*')
      .is('patient_id', null);

    if (consentsError) throw consentsError;

    results.consents.found = unlinkedConsents?.length || 0;

    for (const consent of (unlinkedConsents || [])) {
      let matchedPatient = null;

      // Try to match by ghl_contact_id first
      if (consent.ghl_contact_id && patientByGhlId[consent.ghl_contact_id]) {
        matchedPatient = patientByGhlId[consent.ghl_contact_id];
      }
      // Then try email
      else if (consent.email && patientByEmail[consent.email.toLowerCase()]) {
        matchedPatient = patientByEmail[consent.email.toLowerCase()];
      }
      // Then try phone
      else if (consent.phone) {
        const normalizedPhone = consent.phone.replace(/\D/g, '');
        if (patientByPhone[normalizedPhone]) {
          matchedPatient = patientByPhone[normalizedPhone];
        } else if (normalizedPhone.length >= 10 && patientByPhone[normalizedPhone.slice(-10)]) {
          matchedPatient = patientByPhone[normalizedPhone.slice(-10)];
        }
      }

      if (matchedPatient) {
        const { error: updateError } = await supabase
          .from('consents')
          .update({ 
            patient_id: matchedPatient.id,
            ghl_contact_id: matchedPatient.ghl_contact_id || consent.ghl_contact_id
          })
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

    // =====================
    // LINK INTAKES
    // =====================
    const { data: unlinkedIntakes, error: intakesError } = await supabase
      .from('intakes')
      .select('*')
      .is('patient_id', null);

    if (intakesError) throw intakesError;

    results.intakes.found = unlinkedIntakes?.length || 0;

    for (const intake of (unlinkedIntakes || [])) {
      let matchedPatient = null;

      // Try to match by ghl_contact_id first
      if (intake.ghl_contact_id && patientByGhlId[intake.ghl_contact_id]) {
        matchedPatient = patientByGhlId[intake.ghl_contact_id];
      }
      // Then try email
      else if (intake.email && patientByEmail[intake.email.toLowerCase()]) {
        matchedPatient = patientByEmail[intake.email.toLowerCase()];
      }
      // Then try phone
      else if (intake.phone) {
        const normalizedPhone = intake.phone.replace(/\D/g, '');
        if (patientByPhone[normalizedPhone]) {
          matchedPatient = patientByPhone[normalizedPhone];
        } else if (normalizedPhone.length >= 10 && patientByPhone[normalizedPhone.slice(-10)]) {
          matchedPatient = patientByPhone[normalizedPhone.slice(-10)];
        }
      }

      if (matchedPatient) {
        const { error: updateError } = await supabase
          .from('intakes')
          .update({ 
            patient_id: matchedPatient.id,
            ghl_contact_id: matchedPatient.ghl_contact_id || intake.ghl_contact_id
          })
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
