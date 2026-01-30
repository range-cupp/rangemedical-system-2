// /pages/api/admin/link-intakes.js
// Link unlinked intakes to patients by email, phone, or ghl_contact_id
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET = preview, POST = apply
  const dryRun = req.method === 'GET';

  try {
    // Get all unlinked intakes
    const { data: unlinkedIntakes, error: intakesError } = await supabase
      .from('intakes')
      .select('id, first_name, last_name, email, phone, ghl_contact_id, patient_id')
      .is('patient_id', null)
      .order('submitted_at', { ascending: false });

    if (intakesError) throw intakesError;

    // Get all patients for matching
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, name, email, phone, ghl_contact_id');

    if (patientsError) throw patientsError;

    const results = {
      total_unlinked: unlinkedIntakes?.length || 0,
      matched: [],
      unmatched: [],
      linked: []
    };

    // Build lookup maps for faster matching
    const patientsByGhl = {};
    const patientsByEmail = {};
    const patientsByPhone = {};

    (patients || []).forEach(p => {
      if (p.ghl_contact_id) {
        patientsByGhl[p.ghl_contact_id] = p;
      }
      if (p.email) {
        patientsByEmail[p.email.toLowerCase()] = p;
      }
      if (p.phone) {
        const normalizedPhone = p.phone.replace(/\D/g, '').slice(-10);
        if (normalizedPhone.length === 10) {
          patientsByPhone[normalizedPhone] = p;
        }
      }
    });

    for (const intake of (unlinkedIntakes || [])) {
      let matchedPatient = null;
      let matchMethod = null;

      // Try ghl_contact_id first
      if (intake.ghl_contact_id && patientsByGhl[intake.ghl_contact_id]) {
        matchedPatient = patientsByGhl[intake.ghl_contact_id];
        matchMethod = 'ghl_contact_id';
      }

      // Try email
      if (!matchedPatient && intake.email) {
        const emailLower = intake.email.toLowerCase();
        if (patientsByEmail[emailLower]) {
          matchedPatient = patientsByEmail[emailLower];
          matchMethod = 'email';
        }
      }

      // Try phone
      if (!matchedPatient && intake.phone) {
        const normalizedPhone = intake.phone.replace(/\D/g, '').slice(-10);
        if (normalizedPhone.length === 10 && patientsByPhone[normalizedPhone]) {
          matchedPatient = patientsByPhone[normalizedPhone];
          matchMethod = 'phone';
        }
      }

      if (matchedPatient) {
        results.matched.push({
          intake_id: intake.id,
          intake_name: `${intake.first_name} ${intake.last_name}`.trim(),
          intake_email: intake.email,
          matched_patient: {
            id: matchedPatient.id,
            name: matchedPatient.name,
            email: matchedPatient.email
          },
          match_method: matchMethod
        });

        // Apply link if not dry run
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('intakes')
            .update({ patient_id: matchedPatient.id })
            .eq('id', intake.id);

          if (!updateError) {
            results.linked.push(intake.id);
          }
        }
      } else {
        results.unmatched.push({
          intake_id: intake.id,
          intake_name: `${intake.first_name} ${intake.last_name}`.trim(),
          intake_email: intake.email,
          intake_phone: intake.phone
        });
      }
    }

    return res.status(200).json({
      mode: dryRun ? 'preview' : 'applied',
      summary: {
        total_unlinked: results.total_unlinked,
        matched_count: results.matched.length,
        unmatched_count: results.unmatched.length,
        linked_count: results.linked.length
      },
      matched: results.matched,
      unmatched: results.unmatched,
      message: dryRun
        ? 'Preview mode. POST to /api/admin/link-intakes to apply links.'
        : `Linked ${results.linked.length} intakes to patients.`
    });

  } catch (error) {
    console.error('Link intakes error:', error);
    return res.status(500).json({ error: error.message });
  }
}
