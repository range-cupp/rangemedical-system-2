// /pages/api/cron/link-forms.js
// Daily cron job to link unlinked consents and intakes to patients
// Range Medical
//
// Run daily via Vercel cron or external scheduler
// GET /api/cron/link-forms?key=YOUR_CRON_SECRET

import { createClient } from '@supabase/supabase-js';

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
    // Get all patients for matching
    const { data: patients } = await supabase
      .from('patients')
      .select('id, ghl_contact_id, email, phone');

    // Create lookup maps
    const patientByGhlId = {};
    const patientByEmail = {};
    const patientByPhone = {};

    patients?.forEach(p => {
      if (p.ghl_contact_id) patientByGhlId[p.ghl_contact_id] = p;
      if (p.email) patientByEmail[p.email.toLowerCase()] = p;
      if (p.phone) {
        const normalized = p.phone.replace(/\D/g, '');
        patientByPhone[normalized] = p;
        if (normalized.length >= 10) {
          patientByPhone[normalized.slice(-10)] = p;
        }
      }
    });

    // Link unlinked consents
    const { data: unlinkedConsents } = await supabase
      .from('consents')
      .select('id, ghl_contact_id, email, phone')
      .is('patient_id', null)
      .limit(500);

    results.consents.found = unlinkedConsents?.length || 0;

    for (const consent of (unlinkedConsents || [])) {
      let patient = null;
      
      if (consent.ghl_contact_id && patientByGhlId[consent.ghl_contact_id]) {
        patient = patientByGhlId[consent.ghl_contact_id];
      } else if (consent.email && patientByEmail[consent.email.toLowerCase()]) {
        patient = patientByEmail[consent.email.toLowerCase()];
      } else if (consent.phone) {
        const normalized = consent.phone.replace(/\D/g, '');
        patient = patientByPhone[normalized] || patientByPhone[normalized.slice(-10)];
      }

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
      .select('id, ghl_contact_id, email, phone')
      .is('patient_id', null)
      .limit(500);

    results.intakes.found = unlinkedIntakes?.length || 0;

    for (const intake of (unlinkedIntakes || [])) {
      let patient = null;
      
      if (intake.ghl_contact_id && patientByGhlId[intake.ghl_contact_id]) {
        patient = patientByGhlId[intake.ghl_contact_id];
      } else if (intake.email && patientByEmail[intake.email.toLowerCase()]) {
        patient = patientByEmail[intake.email.toLowerCase()];
      } else if (intake.phone) {
        const normalized = intake.phone.replace(/\D/g, '');
        patient = patientByPhone[normalized] || patientByPhone[normalized.slice(-10)];
      }

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
