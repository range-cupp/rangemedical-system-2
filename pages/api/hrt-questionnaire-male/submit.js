// pages/api/hrt-questionnaire-male/submit.js
// Receives HRT Male Questionnaire submissions from the patient-facing page.
// Stores into hrt_male_questionnaire_responses and links to existing patient by phone/email when possible.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PATIENT_INFO_KEYS = ['first_name', 'last_name', 'date_of_birth', 'phone', 'email'];

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : null;
}

// Accepts MM/DD/YYYY or YYYY-MM-DD; returns YYYY-MM-DD or null.
function normalizeDob(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const usMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (usMatch) {
    const [, mm, dd, yyyy] = usMatch;
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { responses, bundleToken } = req.body || {};
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({ error: 'responses is required' });
    }
    const bundleTokenClean = typeof bundleToken === 'string' && bundleToken.trim()
      ? bundleToken.trim()
      : null;

    const firstName = responses.first_name?.trim() || null;
    const lastName = responses.last_name?.trim() || null;
    const dateOfBirth = normalizeDob(responses.date_of_birth);
    const phone = normalizePhone(responses.phone);
    const email = responses.email?.trim().toLowerCase() || null;

    if (!firstName || !lastName || !phone || !email) {
      return res.status(400).json({ error: 'Missing required patient information' });
    }

    // Strip patient identification keys from the responses payload
    const clinicalResponses = { ...responses };
    for (const k of PATIENT_INFO_KEYS) delete clinicalResponses[k];

    // Best-effort link to an existing patient — prefer the bundle's patient_id
    // when this submission came from a sent form bundle, else match by phone/email.
    let patientId = null;
    if (bundleTokenClean) {
      try {
        const { data: bundle } = await supabase
          .from('form_bundles')
          .select('patient_id')
          .eq('token', bundleTokenClean)
          .maybeSingle();
        if (bundle?.patient_id) patientId = bundle.patient_id;
      } catch (bundleErr) {
        console.error('Bundle lookup failed:', bundleErr);
      }
    }
    if (!patientId) {
      try {
        const { data: matchByPhone } = await supabase
          .from('patients')
          .select('id')
          .eq('phone', phone)
          .limit(1)
          .maybeSingle();
        if (matchByPhone?.id) {
          patientId = matchByPhone.id;
        } else if (email) {
          const { data: matchByEmail } = await supabase
            .from('patients')
            .select('id')
            .eq('email', email)
            .limit(1)
            .maybeSingle();
          if (matchByEmail?.id) patientId = matchByEmail.id;
        }
      } catch (lookupErr) {
        console.error('Patient lookup failed:', lookupErr);
      }
    }

    const { data, error } = await supabase
      .from('hrt_male_questionnaire_responses')
      .insert({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        phone,
        email,
        responses: clinicalResponses,
        patient_id: patientId,
        bundle_token: bundleTokenClean,
      })
      .select('id')
      .single();

    if (error) {
      console.error('HRT male questionnaire insert error:', error);
      return res.status(500).json({ error: 'Failed to save responses' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('HRT male questionnaire submit error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
