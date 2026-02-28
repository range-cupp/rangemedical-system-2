// /pages/api/cron/link-forms.js
// Cron job to link unlinked consents and intakes to patients
// Range Medical System V2
//
// Uses shared patient matching utility (ghl_contact_id > email > phone > name)
// Run twice daily via Vercel cron (6am + 6pm PT)
// GET /api/cron/link-forms?key=YOUR_CRON_SECRET

import { createClient } from '@supabase/supabase-js';
import { buildPatientLookupMaps, findPatientFromMaps } from '../../../lib/find-patient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret || req.query.key;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {
    consents: { found: 0, linked: 0 },
    intakes: { found: 0, linked: 0 }
  };

  try {
    // Get all patients for matching (include name fields for name-based matching)
    const { data: patients } = await supabase
      .from('patients')
      .select('id, ghl_contact_id, email, phone, name, first_name, last_name');

    // Build lookup maps using shared utility
    const maps = buildPatientLookupMaps(patients);

    // Link unlinked consents
    const { data: unlinkedConsents } = await supabase
      .from('consents')
      .select('id, ghl_contact_id, email, phone, first_name, last_name')
      .is('patient_id', null)
      .limit(500);

    results.consents.found = unlinkedConsents?.length || 0;

    for (const consent of (unlinkedConsents || [])) {
      const patient = findPatientFromMaps(maps, {
        ghlContactId: consent.ghl_contact_id,
        email: consent.email,
        phone: consent.phone,
        firstName: consent.first_name,
        lastName: consent.last_name
      });

      if (patient) {
        await supabase
          .from('consents')
          .update({ patient_id: patient.id, ghl_contact_id: patient.ghl_contact_id || consent.ghl_contact_id })
          .eq('id', consent.id);
        results.consents.linked++;
      }
    }

    // Link unlinked intakes
    const { data: unlinkedIntakes } = await supabase
      .from('intakes')
      .select('id, ghl_contact_id, email, phone, first_name, last_name')
      .is('patient_id', null)
      .limit(500);

    results.intakes.found = unlinkedIntakes?.length || 0;

    for (const intake of (unlinkedIntakes || [])) {
      const patient = findPatientFromMaps(maps, {
        ghlContactId: intake.ghl_contact_id,
        email: intake.email,
        phone: intake.phone,
        firstName: intake.first_name,
        lastName: intake.last_name
      });

      if (patient) {
        await supabase
          .from('intakes')
          .update({ patient_id: patient.id, ghl_contact_id: patient.ghl_contact_id || intake.ghl_contact_id })
          .eq('id', intake.id);
        results.intakes.linked++;
      }
    }

    console.log('Form linking complete:', results);

    return res.status(200).json({
      success: true,
      results,
      message: `Linked ${results.consents.linked} consents and ${results.intakes.linked} intakes`
    });

  } catch (error) {
    console.error('Cron link-forms error:', error);
    return res.status(500).json({ error: error.message });
  }
}
