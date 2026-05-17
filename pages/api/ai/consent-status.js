// /pages/api/ai/consent-status.js
// Checks consent form status for a patient for the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REQUIRED_BY_SERVICE = {
  general: ['intake', 'hipaa'],
  hrt: ['intake', 'hipaa', 'hrt', 'blood-draw'],
  weight_loss: ['intake', 'hipaa', 'weight-loss', 'blood-draw'],
  iv: ['intake', 'hipaa', 'iv'],
  peptide: ['intake', 'hipaa', 'peptide'],
  hbot: ['intake', 'hipaa', 'hbot'],
  rlt: ['intake', 'hipaa', 'red-light'],
  prp: ['intake', 'hipaa', 'prp', 'blood-draw'],
  injection: ['intake', 'hipaa'],
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    const { data, error } = await supabase
      .from('consents')
      .select('id, consent_type, consent_date, consent_given, submitted_at')
      .eq('patient_id', patient_id)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    const signed = (data || []).filter(c => c.consent_given);
    const signedTypes = [...new Set(signed.map(c => c.consent_type))];

    const forms = signed.map(c => ({
      type: c.consent_type,
      signed_date: c.consent_date || c.submitted_at,
    }));

    const missing = {};
    for (const [service, required] of Object.entries(REQUIRED_BY_SERVICE)) {
      const missingForms = required.filter(r => !signedTypes.includes(r));
      if (missingForms.length > 0) missing[service] = missingForms;
    }

    const hasBasics = signedTypes.includes('intake') && signedTypes.includes('hipaa');

    return res.status(200).json({
      forms,
      signed_types: signedTypes,
      has_basics: hasBasics,
      missing_by_service: missing,
      summary: {
        total_signed: signedTypes.length,
        has_intake: signedTypes.includes('intake'),
        has_hipaa: signedTypes.includes('hipaa'),
      },
    });
  } catch (err) {
    console.error('Consent status error:', err);
    return res.status(500).json({ error: 'Failed to fetch consent status' });
  }
}
