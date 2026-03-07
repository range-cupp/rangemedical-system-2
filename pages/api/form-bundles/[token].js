// /pages/api/form-bundles/[token].js
// Get bundle status with form completion tracking
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { FORM_DEFINITIONS } from '../../../lib/form-bundles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map consent_type values from DB to form IDs (handles inconsistencies)
const CONSENT_TYPE_MAP = {
  'hipaa': 'hipaa',
  'blood-draw': 'blood-draw',
  'blood_draw': 'blood-draw',
  'hrt': 'hrt',
  'weight-loss': 'weight-loss',
  'weight_loss': 'weight-loss',
  'hbot': 'hbot',
  'prp': 'prp',
  'exosome-iv': 'exosome-iv',
  'exosome_iv': 'exosome-iv',
  'iv': 'iv',
  'iv-injection': 'iv',
  'iv_injection': 'iv',
  'red-light': 'red-light',
  'red_light': 'red-light',
  'peptide': 'peptide',
  'intake': 'intake',
  'medical_intake': 'intake',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    // Look up the bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('form_bundles')
      .select('*')
      .eq('token', token)
      .single();

    if (bundleError || !bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    // Check expiration
    if (bundle.expires_at && new Date(bundle.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Bundle has expired' });
    }

    // Build query conditions for matching completed consents
    // Match by patient_id, ghl_contact_id, email, or phone
    const conditions = [];
    if (bundle.patient_id) conditions.push(`patient_id.eq.${bundle.patient_id}`);
    if (bundle.ghl_contact_id) conditions.push(`ghl_contact_id.eq.${bundle.ghl_contact_id}`);

    let completedTypes = [];
    let patientInfo = null;

    // Build OR filter parts for matching by patient identifiers
    const orParts = [];
    if (bundle.patient_id) orParts.push(`patient_id.eq.${bundle.patient_id}`);
    if (bundle.ghl_contact_id) orParts.push(`ghl_contact_id.eq.${bundle.ghl_contact_id}`);
    if (bundle.patient_email) orParts.push(`email.ilike.${bundle.patient_email}`);
    if (bundle.patient_phone) {
      const digits = bundle.patient_phone.replace(/\D/g, '');
      const last10 = digits.slice(-10);
      orParts.push(`phone.ilike.%${last10}`);
    }

    if (orParts.length > 0) {
      // Query consents table for completed consent forms
      let consentsQuery = supabase
        .from('consents')
        .select('consent_type, first_name, last_name, email, phone, date_of_birth, submitted_at')
        .or(orParts.join(','))
        .order('submitted_at', { ascending: true });

      const { data: consents } = await consentsQuery;

      if (consents && consents.length > 0) {
        completedTypes = consents
          .map(c => CONSENT_TYPE_MAP[c.consent_type] || c.consent_type)
          .filter(Boolean);

        const infoSource = consents.find(c => c.first_name && c.last_name) || consents[0];
        if (infoSource) {
          patientInfo = {
            firstName: infoSource.first_name || '',
            lastName: infoSource.last_name || '',
            email: infoSource.email || '',
            phone: infoSource.phone || '',
            dateOfBirth: infoSource.date_of_birth || '',
          };
        }
      }

      // Check intakes table separately (intake form saves there, not consents)
      if (bundle.form_ids.includes('intake')) {
        const intakeOrParts = [];
        if (bundle.patient_id) intakeOrParts.push(`patient_id.eq.${bundle.patient_id}`);
        if (bundle.patient_email) intakeOrParts.push(`email.ilike.${bundle.patient_email}`);
        if (bundle.patient_phone) {
          const digits = bundle.patient_phone.replace(/\D/g, '');
          const last10 = digits.slice(-10);
          intakeOrParts.push(`phone.ilike.%${last10}`);
        }

        if (intakeOrParts.length > 0) {
          const { data: intakes } = await supabase
            .from('intakes')
            .select('first_name, last_name, email, phone, date_of_birth, submitted_at')
            .or(intakeOrParts.join(','))
            .order('submitted_at', { ascending: false })
            .limit(1);

          if (intakes && intakes.length > 0) {
            completedTypes.push('intake');
            // Use intake info as patient info if we don't have it yet
            if (!patientInfo) {
              patientInfo = {
                firstName: intakes[0].first_name || '',
                lastName: intakes[0].last_name || '',
                email: intakes[0].email || '',
                phone: intakes[0].phone || '',
                dateOfBirth: intakes[0].date_of_birth || '',
              };
            }
          }
        }
      }
    }

    // Build the forms list with completion status
    const completedSet = new Set(completedTypes);
    const forms = bundle.form_ids.map(id => {
      const def = FORM_DEFINITIONS[id];
      if (!def) return null;
      return {
        id,
        name: def.name,
        path: def.path,
        time: def.time,
        completed: completedSet.has(id),
      };
    }).filter(Boolean);

    const completedCount = forms.filter(f => f.completed).length;
    const firstName = bundle.patient_name?.split(' ')[0] || patientInfo?.firstName || '';

    return res.status(200).json({
      bundle: {
        token: bundle.token,
        patientName: bundle.patient_name || '',
        firstName,
        ghlContactId: bundle.ghl_contact_id || '',
        patientPhone: bundle.patient_phone || '',
        patientEmail: bundle.patient_email || '',
        forms,
        completedCount,
        totalCount: forms.length,
        allComplete: completedCount === forms.length,
        patientInfo,
      },
    });
  } catch (error) {
    console.error('Form bundle status error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
