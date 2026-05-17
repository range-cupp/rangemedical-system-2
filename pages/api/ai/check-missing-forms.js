// /pages/api/ai/check-missing-forms.js
// Checks which consent forms a patient is missing for a service, returns patient email for sending
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { FORM_DEFINITIONS } from '../../../lib/form-bundles';

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

  const { patient_id, service } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    const [patientRes, consentRes] = await Promise.all([
      supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone')
        .eq('id', patient_id)
        .single(),
      supabase
        .from('consents')
        .select('consent_type, consent_given')
        .eq('patient_id', patient_id)
        .eq('consent_given', true),
    ]);

    if (patientRes.error || !patientRes.data) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const p = patientRes.data;
    const signedTypes = [...new Set((consentRes.data || []).map(c => c.consent_type))];

    const serviceKey = service || 'general';
    const required = REQUIRED_BY_SERVICE[serviceKey] || REQUIRED_BY_SERVICE.general;
    const missingIds = required.filter(f => !signedTypes.includes(f));

    const formsToSend = missingIds.map(id => ({
      id,
      name: FORM_DEFINITIONS[id]?.name || id,
      time: FORM_DEFINITIONS[id]?.time || '5 min',
    }));

    return res.status(200).json({
      patient_id: p.id,
      patient_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      first_name: p.first_name || '',
      patient_email: p.email || null,
      patient_phone: p.phone || null,
      service: serviceKey,
      signed_types: signedTypes,
      forms_to_send: formsToSend,
      all_complete: formsToSend.length === 0,
    });
  } catch (err) {
    console.error('Check missing forms error:', err);
    return res.status(500).json({ error: 'Failed to check forms' });
  }
}
