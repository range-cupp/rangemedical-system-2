// /pages/api/admin/backfill-patient-tags.js
// Backfill patient condition tags from intakes + assessment_leads
// Scans medical_conditions from intakes and medical_history from assessment_leads
// Maps them to condition:xxx tags on the patient record
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map intake condition keys/labels to our standard condition tag keys
const CONDITION_MAP = {
  // Keys that might appear in intake medical_conditions
  'hypertension': 'hypertension',
  'high blood pressure': 'hypertension',
  'highCholesterol': 'highCholesterol',
  'high cholesterol': 'highCholesterol',
  'heartDisease': 'heartDisease',
  'heart disease': 'heartDisease',
  'diabetes': 'diabetes',
  'thyroid': 'thyroid',
  'thyroid disorder': 'thyroid',
  'depression': 'depression',
  'depression/anxiety': 'depression',
  'anxiety': 'depression',
  'eatingDisorder': 'eatingDisorder',
  'eating disorder': 'eatingDisorder',
  'kidney': 'kidney',
  'kidney disease': 'kidney',
  'liver': 'liver',
  'liver disease': 'liver',
  'autoimmune': 'autoimmune',
  'cancer': 'cancer',
};

function normalizeConditionKey(rawKey, label) {
  // Try exact match on key first
  const lowerKey = (rawKey || '').toLowerCase().trim();
  if (CONDITION_MAP[lowerKey]) return CONDITION_MAP[lowerKey];

  // Try label
  const lowerLabel = (label || '').toLowerCase().trim();
  if (CONDITION_MAP[lowerLabel]) return CONDITION_MAP[lowerLabel];

  // Fuzzy match on label keywords
  if (lowerLabel.includes('blood pressure') || lowerLabel.includes('hypertension')) return 'hypertension';
  if (lowerLabel.includes('cholesterol')) return 'highCholesterol';
  if (lowerLabel.includes('heart')) return 'heartDisease';
  if (lowerLabel.includes('diabet')) return 'diabetes';
  if (lowerLabel.includes('thyroid')) return 'thyroid';
  if (lowerLabel.includes('depress') || lowerLabel.includes('anxiety')) return 'depression';
  if (lowerLabel.includes('eating')) return 'eatingDisorder';
  if (lowerLabel.includes('kidney') || lowerLabel.includes('renal')) return 'kidney';
  if (lowerLabel.includes('liver') || lowerLabel.includes('hepat')) return 'liver';
  if (lowerLabel.includes('autoimmune') || lowerLabel.includes('lupus') || lowerLabel.includes('rheumatoid')) return 'autoimmune';
  if (lowerLabel.includes('cancer') || lowerLabel.includes('tumor') || lowerLabel.includes('oncol') || lowerLabel.includes('carcinoma') || lowerLabel.includes('lymphoma') || lowerLabel.includes('leukemia')) return 'cancer';

  // If nothing matched but it was flagged "Yes", use the raw key as a fallback
  return lowerKey.replace(/\s+/g, '_') || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = { checked: 0, tagged: 0, details: [], skipped_no_conditions: 0 };

  try {
    // 1. Get all patients
    const { data: patients, error: pErr } = await supabase
      .from('patients')
      .select('id, email, name, tags')
      .order('created_at', { ascending: false });

    if (pErr) throw pErr;

    // 2. Get all intakes with medical_conditions
    const { data: intakes } = await supabase
      .from('intakes')
      .select('patient_id, email, medical_conditions');

    // Build intake lookup by patient_id AND email
    const intakesByPatientId = {};
    const intakesByEmail = {};
    for (const intake of (intakes || [])) {
      if (intake.patient_id) {
        if (!intakesByPatientId[intake.patient_id]) intakesByPatientId[intake.patient_id] = [];
        intakesByPatientId[intake.patient_id].push(intake);
      }
      const email = (intake.email || '').toLowerCase().trim();
      if (email) {
        if (!intakesByEmail[email]) intakesByEmail[email] = [];
        intakesByEmail[email].push(intake);
      }
    }

    // 3. Get assessment leads for additional medical history
    const { data: leads } = await supabase
      .from('assessment_leads')
      .select('email, assessment_path, medical_history');

    const leadsByEmail = {};
    for (const lead of (leads || [])) {
      const email = (lead.email || '').toLowerCase().trim();
      if (email) {
        if (!leadsByEmail[email]) leadsByEmail[email] = [];
        leadsByEmail[email].push(lead);
      }
    }

    // 4. Process each patient
    for (const patient of patients) {
      results.checked++;
      const existingTags = Array.isArray(patient.tags) ? patient.tags : [];
      const newTags = new Set(existingTags);
      const email = (patient.email || '').toLowerCase().trim();

      // --- Intakes: medical_conditions ---
      const patientIntakes = [
        ...(intakesByPatientId[patient.id] || []),
        ...(intakesByEmail[email] || []),
      ];

      for (const intake of patientIntakes) {
        const mc = intake.medical_conditions;
        if (!mc || typeof mc !== 'object') continue;

        // medical_conditions is { key: { label, response } }
        for (const [key, val] of Object.entries(mc)) {
          if (!val) continue;
          const response = (val.response || '').toString().trim();
          if (response === 'No' || response === 'no' || response === '' || response === 'false') continue;

          // This condition was marked as something other than "No"
          const tagKey = normalizeConditionKey(key, val.label);
          if (tagKey) {
            newTags.add(`condition:${tagKey}`);
          }
        }
      }

      // --- Assessment leads: medical_history.conditions ---
      const patientLeads = leadsByEmail[email] || [];
      for (const lead of patientLeads) {
        const conditions = lead.medical_history?.conditions || {};
        for (const [key, val] of Object.entries(conditions)) {
          if (!val) continue;
          const response = (val.response || '').toString().trim();
          if (response === 'No' || response === 'no' || response === '' || response === 'false') continue;

          const tagKey = normalizeConditionKey(key, val.label);
          if (tagKey) {
            newTags.add(`condition:${tagKey}`);
          }
        }
      }

      // Only update if tags changed
      const finalTags = [...newTags];
      const addedTags = finalTags.filter(t => !existingTags.includes(t));

      if (addedTags.length > 0) {
        const { error: updateErr } = await supabase
          .from('patients')
          .update({ tags: finalTags })
          .eq('id', patient.id);

        if (updateErr) {
          results.details.push(`Error updating ${patient.name}: ${updateErr.message}`);
        } else {
          results.tagged++;
          results.details.push(`${patient.name}: +${addedTags.join(', ')}`);
        }
      }
    }

    return res.status(200).json({ success: true, ...results });
  } catch (error) {
    return res.status(500).json({ error: error.message, ...results });
  }
}
