// lib/encounter-form-config.js
// Structured field definitions for interactive encounter forms
// Each visit type gets its own form layout with dropdowns, selectors, etc.

import { PEPTIDE_OPTIONS, WEIGHT_LOSS_MEDICATIONS, WEIGHT_LOSS_DOSAGES, TESTOSTERONE_DOSES } from './protocol-config';

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

  // ── Weight Loss Check-in ──────────────────────────────────────
  weight_loss: {
    label: 'Weight Loss Check-in',
    icon: '⚖️',
    noteType: 'progress',
    sections: [
      {
        title: 'Medication',
        type: 'fields',
        key: 'medication',
        fields: [
          { key: 'medication_name', label: 'Medication', type: 'select', options: WEIGHT_LOSS_MEDICATIONS, required: true },
          { key: 'dose', label: 'Dose', type: 'wl_dose_select', required: true },
          { key: 'route', label: 'Route', type: 'select', options: ['Subcutaneous (SubQ)'], defaultValue: 'Subcutaneous (SubQ)', required: true },
          { key: 'site', label: 'Injection Site', type: 'button_group', options: INJECTION_SITES, required: true },
          { key: 'pharmacy', label: 'Compounding Pharmacy', type: 'select', options: COMPOUNDING_PHARMACIES },
          { key: 'lot_number', label: 'Lot #', type: 'text', placeholder: 'e.g. 24-8812' },
          { key: 'expiration', label: 'Expiration', type: 'text', placeholder: 'e.g. 09/2026' },
        ],
      },
      {
        title: 'Weight & Vitals',
        type: 'fields',
        key: 'weight_vitals',
        fields: [
          { key: 'current_weight', label: 'Current Weight (lbs)', type: 'text', placeholder: 'e.g. 185', required: true },
          { key: 'starting_weight', label: 'Starting Weight (lbs)', type: 'text', placeholder: 'e.g. 210' },
          { key: 'goal_weight', label: 'Goal Weight (lbs)', type: 'text', placeholder: 'e.g. 170' },
        ],
      },
      {
        title: 'Side Effects',
        type: 'fields',
        key: 'side_effects',
        fields: [
          { key: 'reported_effects', label: 'Side Effects Reported', type: 'multi_check', options: [
            'None',
            'Nausea',
            'Vomiting',
            'Diarrhea',
            'Constipation',
            'Fatigue',
            'Headache',
            'Injection site irritation',
            'Decreased appetite (expected)',
            'Acid reflux / heartburn',
            'Dizziness',
            'Hair thinning',
          ], defaultChecked: [0] },
          { key: 'effect_management', label: 'Side Effect Management', type: 'textarea', placeholder: 'e.g. Hydration optimization, protein intake reinforcement, fiber adjustment...' },
        ],
      },
      {
        title: 'Assessment & Plan',
        type: 'fields',
        key: 'assessment',
        fields: [
          { key: 'compliance', label: 'Medication Compliance', type: 'select', options: [
            'Compliant — taking as prescribed',
            'Partially compliant — missed doses',
            'Non-compliant — see notes',
          ], defaultValue: 'Compliant — taking as prescribed' },
          { key: 'diet_exercise', label: 'Diet & Exercise', type: 'select', options: [
            'Patient following diet and exercise plan',
            'Diet adherent, exercise needs improvement',
            'Exercise adherent, diet needs improvement',
            'Needs improvement in both diet and exercise',
            'Not discussed this visit',
          ], defaultValue: 'Patient following diet and exercise plan' },
          { key: 'plan', label: 'Plan', type: 'select', options: [
            'Continue current dose',
            'Increase dose — see notes',
            'Decrease dose — see notes',
            'Hold therapy — see notes',
            'Discontinue therapy — see notes',
          ], defaultValue: 'Continue current dose', required: true },
          { key: 'follow_up', label: 'Follow Up', type: 'select', options: [
            '1 week',
            '2 weeks',
            '4 weeks',
            'PRN',
          ], defaultValue: '1 week' },
        ],
      },
      {
        title: 'Additional Notes',
        type: 'fields',
        key: 'additional',
        fields: [
          { key: 'notes', label: 'Provider Notes', type: 'textarea', placeholder: 'Any additional observations, dose change rationale, etc.' },
          { key: 'performed_by', label: 'Performed By', type: 'text', required: true },
        ],
      },
    ],
  },

  // ── HRT Testosterone Follow-up ─────────────────────────────────
  hrt_followup: {
    label: 'HRT Testosterone',
    icon: '💪',
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
          { key: 'medication_name', label: 'Medication', type: 'select', options: [
            'Testosterone Cypionate 200mg/mL',
            'Testosterone Cypionate 100mg/mL',
            'Testosterone Enanthate 200mg/mL',
            'Testosterone Enanthate 250mg/mL',
            'Nandrolone Decanoate',
            'HCG',
          ], required: true },
          { key: 'patient_sex', label: 'Patient Sex', type: 'button_group', options: ['Male', 'Female'], required: true },
          { key: 'dose', label: 'Dose', type: 'trt_dose_select', required: true },
          { key: 'route', label: 'Route', type: 'select', options: INJECTION_ROUTES, defaultValue: 'Intramuscular (IM)', required: true },
          { key: 'site', label: 'Injection Site', type: 'button_group', options: INJECTION_SITES, required: true },
          { key: 'needle_gauge', label: 'Needle Gauge', type: 'button_group', options: NEEDLE_GAUGES },
          { key: 'pharmacy', label: 'Compounding Pharmacy', type: 'select', options: COMPOUNDING_PHARMACIES },
          { key: 'lot_number', label: 'Lot #', type: 'text', placeholder: 'e.g. 24-8812' },
          { key: 'expiration', label: 'Expiration', type: 'text', placeholder: 'e.g. 09/2026' },
        ],
      },
      {
        title: 'Labs & Monitoring',
        type: 'fields',
        key: 'labs',
        fields: [
          { key: 'labs_status', label: 'Labs Status', type: 'select', options: [
            'Labs up to date — within normal range',
            'Labs up to date — abnormalities noted (see notes)',
            'Labs due — ordered today',
            'Labs overdue — patient notified',
            'Initial labs pending',
          ], defaultValue: 'Labs up to date — within normal range' },
          { key: 'hematocrit', label: 'Last Hematocrit (%)', type: 'text', placeholder: 'e.g. 48.5' },
          { key: 'total_testosterone', label: 'Last Total Testosterone (ng/dL)', type: 'text', placeholder: 'e.g. 850' },
          { key: 'free_testosterone', label: 'Last Free Testosterone (pg/mL)', type: 'text', placeholder: 'e.g. 22.5' },
          { key: 'psa', label: 'Last PSA (ng/mL)', type: 'text', placeholder: 'e.g. 0.8' },
          { key: 'estradiol', label: 'Last Estradiol (pg/mL)', type: 'text', placeholder: 'e.g. 28' },
          { key: 'next_labs_due', label: 'Next Labs Due', type: 'text', placeholder: 'e.g. 06/2026' },
        ],
      },
      {
        title: 'Side Effects',
        type: 'fields',
        key: 'side_effects',
        fields: [
          { key: 'reported_effects', label: 'Side Effects Reported', type: 'multi_check', options: [
            'None',
            'Acne',
            'Hair thinning / hair loss',
            'Mood changes / irritability',
            'Increased aggression',
            'Sleep disturbances',
            'Fluid retention / bloating',
            'Gynecomastia / breast tenderness',
            'Testicular atrophy',
            'Elevated hematocrit',
            'Injection site pain / swelling',
            'Night sweats',
            'Increased libido',
            'Decreased libido',
            'Fatigue',
          ], defaultChecked: [0] },
          { key: 'effect_management', label: 'Side Effect Management', type: 'textarea', placeholder: 'e.g. AI prescribed, dose adjustment recommended, phlebotomy scheduled...' },
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
        title: 'Assessment & Plan',
        type: 'fields',
        key: 'assessment',
        fields: [
          { key: 'response', label: 'Treatment Response', type: 'select', options: [
            'Responding well — symptom improvement noted',
            'Stable — maintaining current levels',
            'Suboptimal response — dose adjustment recommended',
            'New patient — initial dose',
            'See notes',
          ], defaultValue: 'Responding well — symptom improvement noted' },
          { key: 'plan', label: 'Plan', type: 'select', options: [
            'Continue current dose and frequency',
            'Increase dose — see notes',
            'Decrease dose — see notes',
            'Change frequency — see notes',
            'Add ancillary medication — see notes',
            'Order labs',
            'Hold therapy — see notes',
            'Discontinue therapy — see notes',
          ], defaultValue: 'Continue current dose and frequency', required: true },
          { key: 'ancillaries', label: 'Ancillary Medications', type: 'multi_check', options: [
            'None',
            'Anastrozole (AI) — estrogen management',
            'HCG — fertility / testicular maintenance',
            'DHEA',
            'Progesterone',
            'Thyroid medication',
            'Other — see notes',
          ], defaultChecked: [0] },
          { key: 'follow_up', label: 'Follow Up', type: 'select', options: [
            '1 week',
            '2 weeks',
            '4 weeks',
            '6 weeks',
            '8 weeks',
            '12 weeks',
            'PRN',
          ], defaultValue: '2 weeks' },
        ],
      },
      {
        title: 'Additional Notes',
        type: 'fields',
        key: 'additional',
        fields: [
          { key: 'notes', label: 'Provider Notes', type: 'textarea', placeholder: 'Any additional observations, dose change rationale, lab interpretation, etc.' },
          { key: 'performed_by', label: 'Performed By', type: 'text', required: true },
        ],
      },
    ],
  },
  // ── IV Therapy ───────────────────────────────────────────────
  iv_therapy: {
    label: 'IV Therapy',
    icon: '💧',
    noteType: 'procedure',
    sections: [
      {
        title: 'IV Access',
        type: 'fields',
        key: 'iv_access',
        fields: [
          { key: 'catheter_size', label: 'IV Catheter Size', type: 'button_group', options: ['18G', '20G', '22G', '24G'], required: true },
          { key: 'location', label: 'IV Location', type: 'button_group', options: ['R Hand', 'L Hand', 'R AC', 'L AC', 'R Forearm', 'L Forearm'], required: true },
          { key: 'attempts', label: 'Number of Attempts', type: 'button_group', options: ['1', '2', '3'] },
          { key: 'blood_return', label: 'Blood Return / Line Flush', type: 'select', options: [
            'Blood return confirmed; line flushed easily without resistance',
            'Blood return confirmed; mild resistance on flush — repositioned',
            'Difficult access — see notes',
          ], defaultValue: 'Blood return confirmed; line flushed easily without resistance' },
        ],
      },
      {
        title: 'Infusion',
        type: 'fields',
        key: 'infusion',
        fields: [
          { key: 'infusion_type', label: 'Infusion Type', type: 'select', options: [
            'Range IV (Full Vitamin/Mineral)',
            'NAD+ Infusion',
            'NAD+ Infusion + Range IV',
            'High-Dose Vitamin C',
            'Methylene Blue + Vitamin C + Magnesium',
            'Hydration (Normal Saline)',
            'Custom — see notes',
          ], required: true },
          { key: 'saline_volume', label: 'Saline Volume (mL)', type: 'button_group', options: ['250', '500', '1000'] },
          { key: 'nad_dose', label: 'NAD+ Dose (mg)', type: 'button_group', options: ['250', '500', '750', '1000'] },
          { key: 'glutathione', label: 'Glutathione IV Push', type: 'select', options: [
            'None',
            '200mg — slow IV push at completion',
            '400mg — slow IV push at completion',
            '600mg — slow IV push at completion',
          ], defaultValue: 'None' },
          { key: 'zofran', label: 'Zofran (Ondansetron)', type: 'select', options: [
            'None',
            '4mg IV — nausea prevention',
            '4mg IV — administered for nausea',
          ], defaultValue: 'None' },
          { key: 'toradol', label: 'Toradol (Ketorolac)', type: 'select', options: [
            'None',
            '15mg IV push — analgesic/anti-inflammatory',
            '30mg IV push — analgesic/anti-inflammatory',
          ], defaultValue: 'None' },
          { key: 'additional_meds', label: 'Additional Medications/Add-ons', type: 'textarea', placeholder: 'e.g. B12 IM injection, extra Vitamin C, etc.' },
        ],
      },
      {
        title: 'Vitals',
        type: 'fields',
        key: 'vitals',
        fields: [
          { key: 'pre_bp', label: 'Pre-Infusion BP', type: 'text', placeholder: 'e.g. 120/80' },
          { key: 'pre_hr', label: 'Pre-Infusion HR', type: 'text', placeholder: 'e.g. 72' },
          { key: 'pre_o2', label: 'Pre-Infusion O2 Sat (%)', type: 'text', placeholder: 'e.g. 98' },
          { key: 'post_bp', label: 'Post-Infusion BP', type: 'text', placeholder: 'e.g. 118/78' },
          { key: 'post_hr', label: 'Post-Infusion HR', type: 'text', placeholder: 'e.g. 70' },
          { key: 'post_o2', label: 'Post-Infusion O2 Sat (%)', type: 'text', placeholder: 'e.g. 99' },
        ],
      },
      {
        title: 'Outcome',
        type: 'fields',
        key: 'outcome',
        fields: [
          { key: 'duration', label: 'Infusion Duration (min)', type: 'text', placeholder: 'e.g. 45' },
          { key: 'tolerance', label: 'Patient Tolerance', type: 'select', options: [
            'Patient tolerated the procedure well with no pain, burning, or discomfort. IV site remained clean, dry, and intact with no evidence of infiltration or phlebitis.',
            'Mild discomfort during infusion — resolved without intervention.',
            'Nausea during infusion — Zofran administered, symptoms resolved.',
            'Infusion rate reduced due to patient discomfort.',
            'Adverse reaction — see notes.',
          ], defaultValue: 'Patient tolerated the procedure well with no pain, burning, or discomfort. IV site remained clean, dry, and intact with no evidence of infiltration or phlebitis.' },
          { key: 'post_care', label: 'Post-Procedure', type: 'multi_check', options: [
            'Line flushed with normal saline.',
            'Catheter removed intact.',
            'Gauze and Coban pressure dressing applied.',
            'No hematoma or active bleeding noted.',
            'Patient discharged in stable condition.',
            'Post-infusion and emergency precautions reviewed.',
            'Patient instructed to maintain hydration.',
            'Patient verbalized understanding.',
          ], defaultChecked: [0, 1, 2, 3, 4, 5, 6, 7] },
        ],
      },
      {
        title: 'Additional Notes',
        type: 'fields',
        key: 'additional',
        fields: [
          { key: 'notes', label: 'Provider Notes', type: 'textarea', placeholder: 'Any additional observations, reactions, or patient requests...' },
          { key: 'performed_by', label: 'Performed By', type: 'text', required: true },
        ],
      },
    ],
  },

  // ── HBOT Session ────────────────────────────────────────────
  hbot_session: {
    label: 'HBOT Session',
    icon: '🫧',
    noteType: 'progress',
    sections: [
      {
        title: 'Pre-Session',
        type: 'checklist',
        key: 'pre_session',
        items: [
          { key: 'identity_verified', label: "Patient's identity verified", defaultChecked: true },
          { key: 'contraindications_reviewed', label: 'Contraindications reviewed (no pneumothorax, active URI, recent ear surgery)', defaultChecked: true },
          { key: 'no_prohibited_items', label: 'No prohibited items (electronics, lighters, petroleum products)', defaultChecked: true },
          { key: 'ear_equalization', label: 'Ear equalization techniques reviewed with patient', defaultChecked: true },
          { key: 'emergency_procedures', label: 'Emergency procedures reviewed', defaultChecked: true },
        ],
      },
      {
        title: 'Session Parameters',
        type: 'fields',
        key: 'session',
        fields: [
          { key: 'pressure', label: 'Pressure (ATA)', type: 'button_group', options: ['1.3 ATA', '1.5 ATA', '2.0 ATA', '2.4 ATA'], required: true },
          { key: 'duration', label: 'Session Duration', type: 'button_group', options: ['60 min', '90 min', '120 min'], required: true },
          { key: 'session_number', label: 'Session # (of protocol)', type: 'text', placeholder: 'e.g. 5 of 20' },
          { key: 'oxygen_delivery', label: 'Oxygen Delivery', type: 'select', options: [
            'Hood / mask — 100% O2',
            'Ambient chamber air — mild HBOT',
            'Nasal cannula',
          ], defaultValue: 'Hood / mask — 100% O2' },
        ],
      },
      {
        title: 'Tolerance & Observations',
        type: 'fields',
        key: 'tolerance',
        fields: [
          { key: 'ear_comfort', label: 'Ear Comfort', type: 'select', options: [
            'No ear discomfort — equalized without difficulty',
            'Mild ear discomfort — resolved with equalization techniques',
            'Moderate ear discomfort — descent rate slowed',
            'Significant ear pain — session modified (see notes)',
          ], defaultValue: 'No ear discomfort — equalized without difficulty' },
          { key: 'overall_tolerance', label: 'Overall Tolerance', type: 'select', options: [
            'Patient tolerated session well. No adverse effects reported.',
            'Patient tolerated session with mild anxiety — resolved with reassurance.',
            'Patient reported claustrophobia — session completed with coaching.',
            'Session ended early — see notes.',
          ], defaultValue: 'Patient tolerated session well. No adverse effects reported.' },
          { key: 'side_effects', label: 'Side Effects', type: 'multi_check', options: [
            'None',
            'Ear pressure / popping',
            'Mild fatigue post-session',
            'Lightheadedness',
            'Sinus pressure',
            'Visual changes (temporary)',
            'Claustrophobia / anxiety',
          ], defaultChecked: [0] },
          { key: 'patient_report', label: 'Patient Self-Report', type: 'select', options: [
            'Patient reports feeling energized',
            'Patient reports feeling relaxed',
            'Patient reports mild fatigue (expected)',
            'Patient reports improvement in symptoms',
            'No subjective changes reported',
          ], defaultValue: 'Patient reports feeling energized' },
        ],
      },
      {
        title: 'Additional Notes',
        type: 'fields',
        key: 'additional',
        fields: [
          { key: 'notes', label: 'Provider Notes', type: 'textarea', placeholder: 'Any observations, patient feedback, or adjustments for next session...' },
          { key: 'follow_up', label: 'Next Session', type: 'text', placeholder: 'e.g. Scheduled 3/20, Continue 3x/week' },
          { key: 'performed_by', label: 'Performed By', type: 'text', required: true },
        ],
      },
    ],
  },

  // ── Red Light Therapy (RLT) ─────────────────────────────────
  rlt_session: {
    label: 'Red Light Therapy',
    icon: '🔴',
    noteType: 'progress',
    sections: [
      {
        title: 'Treatment Parameters',
        type: 'fields',
        key: 'treatment',
        fields: [
          { key: 'treatment_area', label: 'Treatment Area', type: 'multi_check', options: [
            'Full body',
            'Face / neck',
            'Scalp / hair',
            'Upper body / chest',
            'Back / spine',
            'Joints — knees',
            'Joints — shoulders',
            'Joints — hips',
            'Abdomen',
            'Extremities',
            'Targeted injury site',
          ] },
          { key: 'duration', label: 'Session Duration', type: 'button_group', options: ['10 min', '15 min', '20 min', '30 min'], required: true },
          { key: 'wavelength', label: 'Wavelength', type: 'select', options: [
            'Red (630–660nm) + Near-Infrared (810–850nm)',
            'Red only (630–660nm)',
            'Near-Infrared only (810–850nm)',
          ], defaultValue: 'Red (630–660nm) + Near-Infrared (810–850nm)' },
          { key: 'session_number', label: 'Session # (of protocol)', type: 'text', placeholder: 'e.g. 8 of 20' },
        ],
      },
      {
        title: 'Indication',
        type: 'fields',
        key: 'indication',
        fields: [
          { key: 'primary_indication', label: 'Primary Indication', type: 'select', options: [
            'General wellness / recovery',
            'Skin rejuvenation / anti-aging',
            'Pain management / inflammation',
            'Joint support / arthritis',
            'Wound healing / tissue repair',
            'Hair growth / scalp health',
            'Muscle recovery / performance',
            'Mood / energy optimization',
            'Post-procedure recovery',
          ], required: true },
        ],
      },
      {
        title: 'Tolerance & Outcome',
        type: 'fields',
        key: 'outcome',
        fields: [
          { key: 'tolerance', label: 'Patient Tolerance', type: 'select', options: [
            'Patient tolerated session well. No skin irritation or adverse effects.',
            'Mild warmth reported — within normal parameters.',
            'Skin sensitivity noted — distance adjusted.',
            'Session modified — see notes.',
          ], defaultValue: 'Patient tolerated session well. No skin irritation or adverse effects.' },
          { key: 'skin_check', label: 'Post-Session Skin Check', type: 'select', options: [
            'No erythema, irritation, or burns observed.',
            'Mild erythema — expected and transient.',
            'Erythema noted — will monitor next session.',
          ], defaultValue: 'No erythema, irritation, or burns observed.' },
          { key: 'patient_report', label: 'Patient Self-Report', type: 'select', options: [
            'Patient reports feeling improvement',
            'Patient reports feeling relaxed',
            'Patient reports decreased pain/stiffness',
            'Patient reports skin improvement',
            'No subjective changes reported',
            'Too early in protocol to assess',
          ], defaultValue: 'Patient reports feeling improvement' },
        ],
      },
      {
        title: 'Additional Notes',
        type: 'fields',
        key: 'additional',
        fields: [
          { key: 'notes', label: 'Provider Notes', type: 'textarea', placeholder: 'Any observations, parameter adjustments, or patient feedback...' },
          { key: 'follow_up', label: 'Next Session', type: 'text', placeholder: 'e.g. Scheduled 3/20, Continue 3x/week' },
          { key: 'performed_by', label: 'Performed By', type: 'text', required: true },
        ],
      },
    ],
  },

  // ── General Injection ───────────────────────────────────────
  injection: {
    label: 'Injection',
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
          { key: 'medication_name', label: 'Medication', type: 'select', options: [
            'Vitamin B12 (Hydroxocobalamin)',
            'Vitamin B12 (Cyanocobalamin)',
            'Vitamin D3 (Cholecalciferol)',
            'Lipo-B (MIC + B12)',
            'Lipo-C (MIC + L-Carnitine + B12)',
            'Biotin',
            'Glutathione',
            'Toradol (Ketorolac)',
            'Dexamethasone',
            'Kenalog (Triamcinolone)',
            'Testosterone Cypionate',
            'HCG',
            'NAD+ (IM)',
            'Other — see notes',
          ], required: true },
          { key: 'dose', label: 'Dose', type: 'text', placeholder: 'e.g. 1mL, 1000mcg, 30mg', required: true },
          { key: 'route', label: 'Route', type: 'select', options: INJECTION_ROUTES, required: true },
          { key: 'site', label: 'Injection Site', type: 'button_group', options: INJECTION_SITES, required: true },
          { key: 'needle_gauge', label: 'Needle Gauge', type: 'button_group', options: NEEDLE_GAUGES },
          { key: 'ultrasound_guided', label: 'Ultrasound Guided', type: 'select', options: ['No', 'Yes'], defaultValue: 'No' },
          { key: 'pharmacy', label: 'Compounding Pharmacy', type: 'select', options: COMPOUNDING_PHARMACIES },
          { key: 'lot_number', label: 'Lot #', type: 'text', placeholder: 'e.g. 24-8812' },
          { key: 'expiration', label: 'Expiration', type: 'text', placeholder: 'e.g. 09/2026' },
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
  if (formType === 'weight_loss') {
    return generateWeightLossNote(data, vitals);
  }
  if (formType === 'hrt_followup') {
    return generateHRTNote(data, vitals);
  }
  if (formType === 'iv_therapy') {
    return generateIVNote(data, vitals);
  }
  if (formType === 'hbot_session') {
    return generateHBOTNote(data, vitals);
  }
  if (formType === 'rlt_session') {
    return generateRLTNote(data, vitals);
  }
  if (formType === 'injection') {
    return generateInjectionNote(data, vitals);
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

function generateWeightLossNote(data, vitals) {
  const lines = [];
  const med = data.medication || {};
  const wv = data.weight_vitals || {};
  const se = data.side_effects || {};
  const assess = data.assessment || {};
  const additional = data.additional || {};

  // Medication
  if (med.medication_name) lines.push(`**Medication:** ${med.medication_name}${med.pharmacy ? ` (${med.pharmacy})` : ''}`);
  if (med.dose) lines.push(`**Dose:** ${med.dose}`);
  if (med.route) lines.push(`**Route:** ${med.route}`);
  if (med.site) lines.push(`**Injection Site:** ${med.site}`);
  if (med.lot_number || med.expiration) {
    const parts = [];
    if (med.lot_number) parts.push(`Lot #${med.lot_number}`);
    if (med.expiration) parts.push(`Exp: ${med.expiration}`);
    lines.push(`**Lot/Expiration:** ${parts.join(' | ')}`);
  }

  lines.push('');

  // Weight
  if (wv.current_weight) {
    lines.push(`**Current Weight:** ${wv.current_weight} lbs`);
    if (wv.starting_weight) {
      const lost = parseFloat(wv.starting_weight) - parseFloat(wv.current_weight);
      if (!isNaN(lost)) {
        lines.push(`**Starting Weight:** ${wv.starting_weight} lbs (${lost > 0 ? '-' : '+'}${Math.abs(lost).toFixed(1)} lbs)`);
      } else {
        lines.push(`**Starting Weight:** ${wv.starting_weight} lbs`);
      }
    }
    if (wv.goal_weight) lines.push(`**Goal Weight:** ${wv.goal_weight} lbs`);
  }

  // Vitals if available
  if (vitals && (vitals.bp_systolic || vitals.pulse || vitals.o2_saturation)) {
    const vParts = [];
    if (vitals.bp_systolic && vitals.bp_diastolic) vParts.push(`BP ${vitals.bp_systolic}/${vitals.bp_diastolic}`);
    if (vitals.pulse) vParts.push(`HR ${vitals.pulse}`);
    if (vitals.temperature) vParts.push(`Temp ${vitals.temperature}°F`);
    if (vitals.o2_saturation) vParts.push(`O2 ${vitals.o2_saturation}%`);
    lines.push(`**Vitals:** ${vParts.join(' | ')}`);
  }

  lines.push('');

  // Side effects
  const effects = se.reported_effects || [];
  if (effects.length === 1 && effects[0] === 'None') {
    lines.push('**Side Effects:** None reported. Patient denies nausea, GI issues, or other adverse effects.');
  } else if (effects.length > 0) {
    const filtered = effects.filter(e => e !== 'None');
    if (filtered.length > 0) {
      lines.push(`**Side Effects:** ${filtered.join(', ')}.`);
    } else {
      lines.push('**Side Effects:** None reported.');
    }
  }
  if (se.effect_management) {
    lines.push(`**Management:** ${se.effect_management}`);
  }

  lines.push('');

  // Assessment
  if (assess.compliance) lines.push(`**Compliance:** ${assess.compliance}`);
  if (assess.diet_exercise) lines.push(`**Diet & Exercise:** ${assess.diet_exercise}`);
  lines.push('');

  lines.push(`**Assessment:** Weight management therapy in progress. Patient is responding appropriately to current treatment plan.`);

  if (assess.plan) lines.push(`**Plan:** ${assess.plan}`);
  if (assess.follow_up) lines.push(`**Follow Up:** ${assess.follow_up}`);

  // Additional
  if (additional.notes) {
    lines.push('');
    lines.push(`**Provider Notes:** ${additional.notes}`);
  }
  if (additional.performed_by) lines.push(`**Performed By:** ${additional.performed_by}`);

  lines.push('');
  lines.push('Patient education provided regarding medication administration, potential side effects, and when to seek medical attention. Patient verbalized understanding.');

  return lines.join('\n');
}

function generateHRTNote(data, vitals) {
  const lines = [];
  const med = data.medication || {};
  const labs = data.labs || {};
  const se = data.side_effects || {};
  const outcome = data.outcome || {};
  const assess = data.assessment || {};
  const additional = data.additional || {};

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
  if (med.medication_name) lines.push(`**Medication:** ${med.medication_name}${med.pharmacy ? ` (${med.pharmacy})` : ''}`);
  if (med.dose) lines.push(`**Dose:** ${med.dose}`);
  if (med.route) lines.push(`**Route:** ${med.route}`);
  if (med.site) lines.push(`**Injection Site:** ${med.site}`);
  if (med.needle_gauge) lines.push(`**Needle:** ${med.needle_gauge}`);
  if (med.lot_number || med.expiration) {
    const parts = [];
    if (med.lot_number) parts.push(`Lot #${med.lot_number}`);
    if (med.expiration) parts.push(`Exp: ${med.expiration}`);
    lines.push(`**Lot/Expiration:** ${parts.join(' | ')}`);
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

  // Labs & Monitoring
  if (labs.labs_status) lines.push(`**Labs:** ${labs.labs_status}`);
  const labValues = [];
  if (labs.total_testosterone) labValues.push(`Total T: ${labs.total_testosterone} ng/dL`);
  if (labs.free_testosterone) labValues.push(`Free T: ${labs.free_testosterone} pg/mL`);
  if (labs.hematocrit) labValues.push(`HCT: ${labs.hematocrit}%`);
  if (labs.estradiol) labValues.push(`E2: ${labs.estradiol} pg/mL`);
  if (labs.psa) labValues.push(`PSA: ${labs.psa} ng/mL`);
  if (labValues.length > 0) {
    lines.push(`**Recent Labs:** ${labValues.join(' | ')}`);
  }
  if (labs.next_labs_due) lines.push(`**Next Labs Due:** ${labs.next_labs_due}`);

  lines.push('');

  // Side effects
  const effects = se.reported_effects || [];
  if (effects.length === 1 && effects[0] === 'None') {
    lines.push('**Side Effects:** None reported. Patient denies acne, mood changes, sleep disturbances, or other adverse effects.');
  } else if (effects.length > 0) {
    const filtered = effects.filter(e => e !== 'None');
    if (filtered.length > 0) {
      lines.push(`**Side Effects:** ${filtered.join(', ')}.`);
    } else {
      lines.push('**Side Effects:** None reported.');
    }
  }
  if (se.effect_management) {
    lines.push(`**Management:** ${se.effect_management}`);
  }

  lines.push('');

  // Outcome
  if (outcome.tolerance) lines.push(`**Outcome:** ${outcome.tolerance}`);
  const postCare = outcome.post_care || [];
  if (postCare.length > 0) {
    lines.push(`**Post-Care:** ${postCare.join(' ')} Risks, benefits, and possible side effects reviewed. Patient verbalized understanding.`);
  }

  lines.push('');

  // Assessment & Plan
  if (assess.response) lines.push(`**Treatment Response:** ${assess.response}`);
  if (assess.plan) lines.push(`**Plan:** ${assess.plan}`);

  // Ancillaries
  const ancillaries = assess.ancillaries || [];
  const filteredAnc = ancillaries.filter(a => a !== 'None');
  if (filteredAnc.length > 0) {
    lines.push(`**Ancillary Medications:** ${filteredAnc.join(', ')}`);
  }

  if (assess.follow_up) lines.push(`**Follow Up:** ${assess.follow_up}`);

  // Additional
  if (additional.notes) {
    lines.push('');
    lines.push(`**Provider Notes:** ${additional.notes}`);
  }
  if (additional.performed_by) lines.push(`**Performed By:** ${additional.performed_by}`);

  lines.push('');
  lines.push('Patient education provided regarding testosterone therapy, injection technique, potential side effects, and the importance of routine lab monitoring. Patient verbalized understanding.');

  return lines.join('\n');
}

function generateIVNote(data) {
  const lines = [];
  const access = data.iv_access || {};
  const infusion = data.infusion || {};
  const vitalsData = data.vitals || {};
  const outcome = data.outcome || {};
  const additional = data.additional || {};

  // IV Access
  lines.push('**IV Access**');
  if (access.catheter_size) lines.push(`**IV catheter size:** ${access.catheter_size}`);
  if (access.location) lines.push(`**Location:** ${access.location}`);
  if (access.attempts) lines.push(`**Number of attempts:** ${access.attempts}`);
  lines.push(`**Patient tolerance to IV start:** well tolerated`);
  if (access.blood_return) lines.push(`**${access.blood_return}**`);

  lines.push('');

  // Infusion details
  if (infusion.infusion_type) {
    lines.push(`**IV Infusion Note** — ${infusion.infusion_type}`);
    if (infusion.saline_volume) lines.push(`Prepared and administered in ${infusion.saline_volume} mL of 0.9% Normal Saline.`);
  }

  lines.push('');

  // Medications
  const meds = [];
  if (infusion.nad_dose && infusion.infusion_type && infusion.infusion_type.includes('NAD')) {
    meds.push(`NAD+ — ${infusion.nad_dose} mg`);
  }
  if (infusion.zofran && infusion.zofran !== 'None') {
    meds.push(`Zofran (Ondansetron) — ${infusion.zofran}`);
  }
  if (infusion.toradol && infusion.toradol !== 'None') {
    meds.push(`Toradol (Ketorolac) — ${infusion.toradol}`);
  }
  if (infusion.glutathione && infusion.glutathione !== 'None') {
    meds.push(`Glutathione — ${infusion.glutathione}`);
  }
  if (meds.length > 0) {
    lines.push('**Medications:**');
    meds.forEach(m => lines.push(m));
    lines.push('');
  }

  if (infusion.additional_meds) {
    lines.push(`**Additional:** ${infusion.additional_meds}`);
    lines.push('');
  }

  // Vitals
  const preVitals = [];
  if (vitalsData.pre_bp) preVitals.push(`BP ${vitalsData.pre_bp}`);
  if (vitalsData.pre_hr) preVitals.push(`HR ${vitalsData.pre_hr}`);
  if (vitalsData.pre_o2) preVitals.push(`O2 Sat ${vitalsData.pre_o2}%`);
  if (preVitals.length > 0) lines.push(`**Pre-Infusion Vitals:** ${preVitals.join(' | ')}`);

  const postVitals = [];
  if (vitalsData.post_bp) postVitals.push(`BP ${vitalsData.post_bp}`);
  if (vitalsData.post_hr) postVitals.push(`HR ${vitalsData.post_hr}`);
  if (vitalsData.post_o2) postVitals.push(`O2 Sat ${vitalsData.post_o2}%`);
  if (postVitals.length > 0) lines.push(`**Post-Infusion Vitals:** ${postVitals.join(' | ')}`);

  lines.push('');

  // Outcome
  if (outcome.duration) {
    lines.push(`The infusion was completed over approximately ${outcome.duration} minutes without complications.`);
  }
  if (outcome.tolerance) lines.push(outcome.tolerance);

  // Post-care
  const postCare = outcome.post_care || [];
  if (postCare.length > 0) {
    lines.push('');
    lines.push(postCare.join(' '));
  }

  // Additional
  if (additional.notes) {
    lines.push('');
    lines.push(`**Provider Notes:** ${additional.notes}`);
  }
  if (additional.performed_by) lines.push(`**Performed By:** ${additional.performed_by}`);

  return lines.join('\n');
}

function generateHBOTNote(data) {
  const lines = [];
  const session = data.session || {};
  const tolerance = data.tolerance || {};
  const additional = data.additional || {};

  // Pre-session checklist
  const preChecks = data.pre_session || {};
  const allChecked = Object.values(preChecks).every(v => v);
  if (allChecked) {
    lines.push("Patient's identity verified. Contraindications reviewed (no pneumothorax, active URI, recent ear surgery). No prohibited items confirmed. Ear equalization techniques reviewed. Emergency procedures reviewed.");
  } else {
    const checkLabels = {
      identity_verified: "Patient's identity verified",
      contraindications_reviewed: 'Contraindications reviewed',
      no_prohibited_items: 'No prohibited items confirmed',
      ear_equalization: 'Ear equalization reviewed',
      emergency_procedures: 'Emergency procedures reviewed',
    };
    Object.entries(preChecks).forEach(([key, val]) => {
      if (val) lines.push(`✓ ${checkLabels[key]}`);
    });
  }

  lines.push('');

  // Session parameters
  lines.push('**HBOT Session**');
  if (session.pressure) lines.push(`**Pressure:** ${session.pressure}`);
  if (session.duration) lines.push(`**Duration:** ${session.duration}`);
  if (session.session_number) lines.push(`**Session:** ${session.session_number}`);
  if (session.oxygen_delivery) lines.push(`**Oxygen Delivery:** ${session.oxygen_delivery}`);

  lines.push('');

  // Tolerance
  if (tolerance.ear_comfort) lines.push(`**Ear Comfort:** ${tolerance.ear_comfort}`);
  if (tolerance.overall_tolerance) lines.push(`**Tolerance:** ${tolerance.overall_tolerance}`);

  // Side effects
  const effects = tolerance.side_effects || [];
  if (effects.length === 1 && effects[0] === 'None') {
    lines.push('**Side Effects:** None reported.');
  } else if (effects.length > 0) {
    const filtered = effects.filter(e => e !== 'None');
    if (filtered.length > 0) {
      lines.push(`**Side Effects:** ${filtered.join(', ')}.`);
    } else {
      lines.push('**Side Effects:** None reported.');
    }
  }

  if (tolerance.patient_report) lines.push(`**Patient Report:** ${tolerance.patient_report}`);

  // Additional
  if (additional.notes) {
    lines.push('');
    lines.push(`**Provider Notes:** ${additional.notes}`);
  }
  if (additional.follow_up) lines.push(`**Next Session:** ${additional.follow_up}`);
  if (additional.performed_by) lines.push(`**Performed By:** ${additional.performed_by}`);

  return lines.join('\n');
}

function generateRLTNote(data) {
  const lines = [];
  const treatment = data.treatment || {};
  const indication = data.indication || {};
  const outcome = data.outcome || {};
  const additional = data.additional || {};

  // Treatment parameters
  lines.push('**Red Light Therapy Session**');
  const areas = treatment.treatment_area || [];
  if (areas.length > 0) lines.push(`**Treatment Area:** ${areas.join(', ')}`);
  if (treatment.duration) lines.push(`**Duration:** ${treatment.duration}`);
  if (treatment.wavelength) lines.push(`**Wavelength:** ${treatment.wavelength}`);
  if (treatment.session_number) lines.push(`**Session:** ${treatment.session_number}`);

  lines.push('');

  // Indication
  if (indication.primary_indication) lines.push(`**Indication:** ${indication.primary_indication}`);

  lines.push('');

  // Outcome
  if (outcome.tolerance) lines.push(`**Tolerance:** ${outcome.tolerance}`);
  if (outcome.skin_check) lines.push(`**Post-Session Skin Check:** ${outcome.skin_check}`);
  if (outcome.patient_report) lines.push(`**Patient Report:** ${outcome.patient_report}`);

  // Additional
  if (additional.notes) {
    lines.push('');
    lines.push(`**Provider Notes:** ${additional.notes}`);
  }
  if (additional.follow_up) lines.push(`**Next Session:** ${additional.follow_up}`);
  if (additional.performed_by) lines.push(`**Performed By:** ${additional.performed_by}`);

  return lines.join('\n');
}

function generateInjectionNote(data) {
  const lines = [];
  const med = data.medication || {};
  const outcome = data.outcome || {};
  const additional = data.additional || {};

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
  if (med.medication_name) lines.push(`**Medication:** ${med.medication_name}${med.pharmacy ? ` (${med.pharmacy})` : ''}`);
  if (med.dose) lines.push(`**Dose:** ${med.dose}`);
  if (med.route) lines.push(`**Route:** ${med.route}`);
  if (med.site) lines.push(`**Site:** ${med.site}`);
  if (med.needle_gauge) lines.push(`**Needle:** ${med.needle_gauge}`);
  if (med.ultrasound_guided && med.ultrasound_guided === 'Yes') lines.push(`**Ultrasound Guided:** Yes`);
  if (med.lot_number || med.expiration) {
    const parts = [];
    if (med.lot_number) parts.push(`Lot #${med.lot_number}`);
    if (med.expiration) parts.push(`Exp: ${med.expiration}`);
    lines.push(`**Lot/Expiration:** ${parts.join(' | ')}`);
  }

  lines.push('');

  // Outcome
  if (outcome.tolerance) lines.push(`**Outcome:** ${outcome.tolerance}`);
  const postCare = outcome.post_care || [];
  if (postCare.length > 0) {
    lines.push(`**Post-Care:** ${postCare.join(' ')} Risks, benefits, and possible side effects reviewed. Patient verbalized understanding.`);
  }

  // Additional
  if (additional.notes) {
    lines.push('');
    lines.push(`**Provider Notes:** ${additional.notes}`);
  }
  if (additional.follow_up) lines.push(`**Follow Up:** ${additional.follow_up}`);
  if (additional.performed_by) lines.push(`**Performed By:** ${additional.performed_by}`);

  return lines.join('\n');
}
