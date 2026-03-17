// lib/encounter-form-config.js
// Structured field definitions for interactive encounter forms
// Each visit type gets its own form layout with dropdowns, selectors, etc.

import { PEPTIDE_OPTIONS } from './protocol-config';

// ================================================================
// SHARED OPTIONS — Reusable across multiple form types
// ================================================================

export const COMPOUNDING_PHARMACIES = [
  'Empower Pharmacy',
  'Olympia Pharmacy',
  'Hallandale Pharmacy',
  'Strive Pharmacy',
  'Revive Rx',
  'Wells Pharmacy',
  'Belmar Pharmacy',
  'Pyxis Labs',
  'Other',
];

export const INJECTION_SITES = [
  'L Delt',
  'R Delt',
  'L Glute',
  'R Glute',
  'RUQ',
  'LUQ',
  'RLQ',
  'LLQ',
  'L Thigh',
  'R Thigh',
];

export const INJECTION_ROUTES = [
  'Intramuscular (IM)',
  'Subcutaneous (SubQ)',
  'IV Push',
  'Intradermal',
];

export const TOLERANCE_OPTIONS = [
  'Patient tolerated well. No bleeding, hematoma, or adverse reaction observed.',
  'Mild discomfort at injection site — resolved quickly.',
  'Mild bruising at injection site — bandaid applied.',
  'Adverse reaction — see notes below.',
];

export const POST_CARE_OPTIONS = [
  'Bandaid applied.',
  'Ice applied post-injection.',
  'Gauze and Coban pressure dressing applied.',
  'Patient provided with written post-care instructions.',
];

export const NEEDLE_GAUGES = ['18G', '20G', '22G', '23G', '25G', '27G', '30G'];

// ================================================================
// FLATTEN PEPTIDE OPTIONS into a single searchable list
// ================================================================
export function getFlatPeptideList() {
  const list = [];
  PEPTIDE_OPTIONS.forEach(group => {
    group.options.forEach(opt => {
      list.push({ ...opt, group: group.group });
    });
  });
  return list;
}

// ================================================================
// FORM DEFINITIONS — Per visit type
// ================================================================

export const ENCOUNTER_FORMS = {
  // ── Peptide Injection ─────────────────────────────────────────
  peptide_injection: {
    label: 'Peptide Injection',
    icon: '💉',
    noteType: 'procedure',
    sections: [
      {
        title: 'Pre-Procedure',
        type: 'checklist',
        key: 'pre_procedure',
        items: [
          { key: 'identity_verified', label: "Patient's identity verified", defaultChecked: true },
          { key: 'allergies_reviewed', label: "Patient's allergies reviewed", defaultChecked: true },
          { key: 'risks_explained', label: 'Risks and benefits explained', defaultChecked: true },
          { key: 'patient_understanding', label: 'Patient verbalized understanding', defaultChecked: true },
          { key: 'no_contraindications', label: 'Patient denies contraindications', defaultChecked: true },
          { key: 'consent_obtained', label: 'Consent obtained', defaultChecked: true },
        ],
      },
      {
        title: 'Medication',
        type: 'fields',
        key: 'medication',
        fields: [
          { key: 'medication_name', label: 'Medication', type: 'peptide_search', required: true },
          { key: 'dose', label: 'Dose', type: 'dose_select', required: true },
          { key: 'route', label: 'Route', type: 'select', options: INJECTION_ROUTES, required: true },
          { key: 'site', label: 'Injection Site', type: 'button_group', options: INJECTION_SITES, required: true },
          { key: 'pharmacy', label: 'Compounding Pharmacy', type: 'select', options: COMPOUNDING_PHARMACIES },
          { key: 'lot_number', label: 'Lot #', type: 'text', placeholder: 'e.g. 24-8812' },
          { key: 'expiration', label: 'Expiration', type: 'text', placeholder: 'e.g. 09/2026' },
          { key: 'ultrasound_guided', label: 'Ultrasound Guided', type: 'toggle', options: ['Yes', 'No'], defaultValue: 'No' },
        ],
      },
      {
        title: 'Outcome',
        type: 'fields',
        key: 'outcome',
        fields: [
          { key: 'tolerance', label: 'Patient Tolerance', type: 'select', options: TOLERANCE_OPTIONS, defaultValue: TOLERANCE_OPTIONS[0] },
          { key: 'post_care', label: 'Post-Care', type: 'multi_check', options: POST_CARE_OPTIONS, defaultChecked: [0, 3] },
        ],
      },
      {
        title: 'Additional Notes',
        type: 'fields',
        key: 'additional',
        fields: [
          { key: 'notes', label: 'Provider Notes', type: 'textarea', placeholder: 'Any additional observations...' },
          { key: 'follow_up', label: 'Follow Up', type: 'text', placeholder: 'e.g. PRN, 1 week, 2 weeks', defaultValue: 'PRN' },
          { key: 'performed_by', label: 'Performed By', type: 'text', required: true },
        ],
      },
    ],
  },
};

// ================================================================
// NOTE GENERATOR — Turns structured form data into formatted markdown
// ================================================================

export function generateNoteMarkdown(formType, data, vitals) {
  if (formType === 'peptide_injection') {
    return generatePeptideNote(data, vitals);
  }
  return '';
}

function generatePeptideNote(data, vitals) {
  const lines = [];

  // Pre-procedure checklist
  const preChecks = data.pre_procedure || {};
  const allChecked = Object.values(preChecks).every(v => v);
  if (allChecked) {
    lines.push("Patient's identity has been verified. Patient's allergies have been reviewed. Risk and benefits have been explained, and patient has had ample time to ask questions regarding risk/benefits/outcomes. Patient has verbalized understanding. Patient denies contraindications. Consent obtained.");
  } else {
    const checkLabels = {
      identity_verified: "Patient's identity verified",
      allergies_reviewed: "Patient's allergies reviewed",
      risks_explained: "Risks and benefits explained",
      patient_understanding: "Patient verbalized understanding",
      no_contraindications: "Patient denies contraindications",
      consent_obtained: "Consent obtained",
    };
    Object.entries(preChecks).forEach(([key, val]) => {
      if (val) lines.push(`✓ ${checkLabels[key]}`);
    });
  }

  lines.push('');

  // Medication details
  const med = data.medication || {};
  if (med.medication_name) lines.push(`**Medication:** ${med.medication_name}${med.pharmacy ? ` (${med.pharmacy})` : ''}`);
  if (med.dose) lines.push(`**Dose:** ${med.dose}`);
  if (med.route) lines.push(`**Route:** ${med.route}`);
  if (med.site) lines.push(`**Site:** ${med.site}`);
  if (med.lot_number || med.expiration) {
    const parts = [];
    if (med.lot_number) parts.push(`Lot #${med.lot_number}`);
    if (med.expiration) parts.push(`Exp: ${med.expiration}`);
    lines.push(`**Lot/Expiration:** ${parts.join(' | ')}`);
  }
  if (med.ultrasound_guided && med.ultrasound_guided !== 'No') {
    lines.push(`**Ultrasound Guided:** ${med.ultrasound_guided}`);
  }

  // Vitals if available
  if (vitals && (vitals.bp_systolic || vitals.pulse || vitals.o2_saturation)) {
    lines.push('');
    const vParts = [];
    if (vitals.bp_systolic && vitals.bp_diastolic) vParts.push(`BP ${vitals.bp_systolic}/${vitals.bp_diastolic}`);
    if (vitals.pulse) vParts.push(`HR ${vitals.pulse}`);
    if (vitals.temperature) vParts.push(`Temp ${vitals.temperature}°F`);
    if (vitals.o2_saturation) vParts.push(`O2 ${vitals.o2_saturation}%`);
    lines.push(`**Vitals:** ${vParts.join(' | ')}`);
  }

  lines.push('');

  // Outcome
  const outcome = data.outcome || {};
  if (outcome.tolerance) lines.push(`**Outcome:** ${outcome.tolerance}`);

  // Post-care
  const postCare = outcome.post_care || [];
  if (postCare.length > 0) {
    lines.push(`**Post-Care:** ${postCare.join(' ')} Risks, benefits, and possible side effects reviewed. Patient verbalized understanding.`);
  }

  // Additional notes
  const additional = data.additional || {};
  if (additional.notes) {
    lines.push('');
    lines.push(`**Provider Notes:** ${additional.notes}`);
  }

  if (additional.follow_up) lines.push(`**Follow Up:** ${additional.follow_up}`);
  if (additional.performed_by) lines.push(`**Performed By:** ${additional.performed_by}`);

  return lines.join('\n');
}
