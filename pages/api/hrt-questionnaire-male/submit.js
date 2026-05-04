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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { responses } = req.body || {};
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({ error: 'responses is required' });
    }

    const firstName = responses.first_name?.trim() || null;
    const lastName = responses.last_name?.trim() || null;
    const dateOfBirth = responses.date_of_birth || null;
    const phone = normalizePhone(responses.phone);
    const email = responses.email?.trim().toLowerCase() || null;

    if (!firstName || !lastName || !phone || !email) {
      return res.status(400).json({ error: 'Missing required patient information' });
    }

    // Strip patient identification keys from the responses payload
    const clinicalResponses = { ...responses };
    for (const k of PATIENT_INFO_KEYS) delete clinicalResponses[k];

    // Best-effort link to an existing patient by phone or email
    let patientId = null;
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
