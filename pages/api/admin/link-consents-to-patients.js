// /pages/api/admin/link-consents-to-patients.js
// Backfill patient_id for existing consents by matching email
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

  const { createMissing = false } = req.body;

  try {
    const results = {
      consentsProcessed: 0,
      consentsLinked: 0,
      patientsCreated: 0,
      errors: []
    };

    // Get all consents without patient_id
    const { data: unlinkedConsents, error: fetchError } = await supabase
      .from('consents')
      .select('id, email, first_name, last_name, phone, date_of_birth')
      .is('patient_id', null)
      .order('submitted_at', { ascending: false });

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    console.log(`Found ${unlinkedConsents.length} consents without patient_id`);
    results.consentsProcessed = unlinkedConsents.length;

    // Group consents by email for efficiency
    const emailGroups = {};
    for (const consent of unlinkedConsents) {
      if (!consent.email) continue;
      const normalizedEmail = consent.email.toLowerCase().trim();
      if (!emailGroups[normalizedEmail]) {
        emailGroups[normalizedEmail] = [];
      }
      emailGroups[normalizedEmail].push(consent);
    }

    // Process each unique email
    for (const [email, consents] of Object.entries(emailGroups)) {
      try {
        // Try to find patient by email
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('email', email)
          .single();

        let patientId = patient?.id;

        // Create patient if not found and createMissing is true
        if (!patientId && createMissing) {
          const firstConsent = consents[0];
          const fullName = `${firstConsent.first_name || ''} ${firstConsent.last_name || ''}`.trim();

          const { data: newPatient, error: createError } = await supabase
            .from('patients')
            .insert({
              name: fullName || 'Unknown',
              first_name: firstConsent.first_name || null,
              last_name: firstConsent.last_name || null,
              email: email,
              phone: firstConsent.phone || null,
              date_of_birth: firstConsent.date_of_birth || null
            })
            .select('id')
            .single();

          if (createError) {
            results.errors.push({ email, error: `Create patient: ${createError.message}` });
            continue;
          }

          patientId = newPatient.id;
          results.patientsCreated++;
          console.log(`Created patient for ${email}: ${patientId}`);
        }

        if (!patientId) {
          continue; // Skip if no patient found and not creating
        }

        // Update all consents for this email
        const consentIds = consents.map(c => c.id);
        const { error: updateError } = await supabase
          .from('consents')
          .update({ patient_id: patientId })
          .in('id', consentIds);

        if (updateError) {
          results.errors.push({ email, error: `Update consents: ${updateError.message}` });
        } else {
          results.consentsLinked += consents.length;
          console.log(`Linked ${consents.length} consents to patient ${patientId} (${email})`);
        }

      } catch (e) {
        results.errors.push({ email, error: e.message });
      }
    }

    return res.status(200).json({
      success: true,
      ...results,
      message: createMissing
        ? `Linked ${results.consentsLinked} consents to patients, created ${results.patientsCreated} new patients`
        : `Linked ${results.consentsLinked} consents to existing patients. Set createMissing=true to also create patients.`
    });

  } catch (error) {
    console.error('Link consents error:', error);
    return res.status(500).json({ error: error.message });
  }
}
