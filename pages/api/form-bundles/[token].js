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

    if (conditions.length > 0 || bundle.patient_email || bundle.patient_phone) {
      // Query consents table for completed forms
      let query = supabase
        .from('consents')
        .select('consent_type, first_name, last_name, email, phone, date_of_birth, submitted_at')
        .order('submitted_at', { ascending: true });

      // Build OR filter
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
        query = query.or(orParts.join(','));
      }

      const { data: consents } = await query;

      if (consents && consents.length > 0) {
        // Get completed form IDs
        completedTypes = consents
          .map(c => CONSENT_TYPE_MAP[c.consent_type] || c.consent_type)
          .filter(Boolean);

        // Get patient info from the first consent that has it
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
