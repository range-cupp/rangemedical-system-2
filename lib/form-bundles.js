// lib/form-bundles.js
// Shared utility for form bundle creation and definitions
// Range Medical

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Form definitions — single source of truth for form names, paths, and time estimates
export const FORM_DEFINITIONS = {
  'intake': { name: 'Medical Intake', path: '/intake', time: '10 min' },
  'hipaa': { name: 'HIPAA Privacy Notice', path: '/consent/hipaa', time: '3 min' },
  'blood-draw': { name: 'Blood Draw Consent', path: '/consent/blood-draw', time: '2 min' },
  'hrt': { name: 'HRT Consent', path: '/consent/hrt', time: '5 min' },
  'peptide': { name: 'Peptide Consent', path: '/consent/peptide', time: '5 min' },
  'iv': { name: 'IV/Injection Consent', path: '/consent/iv', time: '5 min' },
  'hbot': { name: 'HBOT Consent', path: '/consent/hbot', time: '5 min' },
  'weight-loss': { name: 'Weight Loss Consent', path: '/consent/weight-loss', time: '5 min' },
  'red-light': { name: 'Red Light Therapy Consent', path: '/consent/red-light', time: '5 min' },
  'prp': { name: 'PRP Consent', path: '/consent/prp', time: '5 min' },
  'exosome-iv': { name: 'Exosome IV Consent', path: '/consent/exosome-iv', time: '5 min' },
};

// Map consent_type values from the consents table to form IDs
// The consents table stores consent_type like 'hipaa', 'hrt', 'blood_draw', etc.
export const CONSENT_TYPE_TO_FORM_ID = {
  'intake': 'intake',
  'medical_intake': 'intake',
  'hipaa': 'hipaa',
  'blood_draw': 'blood-draw',
  'blood-draw': 'blood-draw',
  'hrt': 'hrt',
  'peptide': 'peptide',
  'iv': 'iv',
  'iv_injection': 'iv',
  'hbot': 'hbot',
  'weight_loss': 'weight-loss',
  'weight-loss': 'weight-loss',
  'red_light': 'red-light',
  'red-light': 'red-light',
  'prp': 'prp',
  'exosome_iv': 'exosome-iv',
  'exosome-iv': 'exosome-iv',
};

export function generateBundleToken() {
  return crypto.randomBytes(9).toString('base64url'); // 12 chars, URL-safe
}

export async function createFormBundle({ formIds, patientId, patientName, patientEmail, patientPhone, ghlContactId }) {
  const token = generateBundleToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data, error } = await supabase
    .from('form_bundles')
    .insert({
      token,
      form_ids: formIds,
      patient_id: patientId || null,
      ghl_contact_id: ghlContactId || null,
      patient_name: patientName || null,
      patient_email: patientEmail || null,
      patient_phone: patientPhone || null,
      expires_at: expiresAt.toISOString(),
    })
    .select('token')
    .single();

  if (error) throw error;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
  return { token: data.token, url: `${baseUrl}/forms/${data.token}` };
}
