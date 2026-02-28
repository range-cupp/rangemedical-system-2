// /lib/protocol-config.js
// Unified Protocol Configuration - Single source of truth
// Range Medical - Updated 2026-02-04

// ================================================================
// PEPTIDE OPTIONS - Complete Dosing Guide from Range Medical
// ================================================================
export const PEPTIDE_OPTIONS = [
  {
    group: 'GH Secretagogue Blends',
    options: [
      { value: '2X Blend: CJC No DAC / Ipamorelin', startingDose: '1mg', maxDose: '4mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water' },
      { value: '2X Blend: Tesamorelin / Ipamorelin', startingDose: '1mg', maxDose: '4mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water' },
      { value: '3X Blend: Tesa / MGF / Ipamorelin', startingDose: '1.6mg', maxDose: '3.2mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water' },
      { value: '4X Blend: GHRP-2 / Tesa / MGF / Ipa', startingDose: '1.8mg', maxDose: '5.2mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Growth Hormone',
    options: [
      { value: 'CJC-1295 No DAC', startingDose: '0.2mg', maxDose: '1mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'CJC-1295 with DAC', startingDose: '2mg', maxDose: '4mg', frequency: '1-2x per week', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'GHRP-2', startingDose: '200mcg', maxDose: '1mg', frequency: '5 on / 2 off (up to 8 wks)', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Hexarelin', startingDose: '100mcg', maxDose: '100mcg', frequency: '3x daily x 20 weeks', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Ipamorelin', startingDose: '200mcg', maxDose: '300mcg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'MK-677 (tablet)', startingDose: '10mg', maxDose: '50mg', frequency: '1-2x daily', notes: 'Oral tablet' },
      { value: 'Sermorelin', startingDose: '500mcg', maxDose: '2mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Tesamorelin', startingDose: '1mg', maxDose: '2mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'IGF-1 LR3', startingDose: '100mcg', maxDose: '200mcg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Follistatin 344', startingDose: '200mcg', maxDose: '200mcg', frequency: 'Daily x 20 days', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'MGF', startingDose: '200mcg', maxDose: '600mcg', frequency: 'After workout', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Recovery/Healing',
    options: [
      { value: 'BPC-157', startingDose: '250mcg', maxDose: '750mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'TB500 (Thymosin Beta 4)', startingDose: '2.5mg', maxDose: '5mg', frequency: '2x per week', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'BPC-157/TB4 (Thymosin Beta 4)', startingDose: '500mcg/500mcg', maxDose: '500mcg/500mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Wolverine Blend (BPC-157/TB-500)', startingDose: '500mcg/500mcg', maxDose: '1mg/1mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'BPC-157/TB-500/KPV/MGF', startingDose: '1mg', maxDose: '2mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Weight Loss',
    options: [
      { value: 'AOD 9604', startingDose: '500mcg', maxDose: '1mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'GLP-1 Agonists',
    options: [
      { value: 'Retatrutide', startingDose: '0.5mg', maxDose: '15mg', frequency: 'Weekly', notes: 'GLP-1 agonist - titrate monthly', doses: ['0.5mg', '1mg', '1.5mg', '2mg', '2.5mg', '3mg', '3.5mg', '4mg', '4.5mg', '5mg', '5.5mg', '6mg', '6.5mg', '7mg', '7.5mg', '8mg', '8.5mg', '9mg', '9.5mg', '10mg', '10.5mg', '11mg', '11.5mg', '12mg', '12.5mg', '13mg', '13.5mg', '14mg', '14.5mg', '15mg'] },
      { value: 'Tirzepatide', startingDose: '0.5mg', maxDose: '15mg', frequency: 'Weekly', notes: 'GLP-1 agonist - titrate monthly', doses: ['0.5mg', '1mg', '1.5mg', '2mg', '2.5mg', '3mg', '3.5mg', '4mg', '4.5mg', '5mg', '5.5mg', '6mg', '6.5mg', '7mg', '7.5mg', '8mg', '8.5mg', '9mg', '9.5mg', '10mg', '10.5mg', '11mg', '11.5mg', '12mg', '12.5mg', '13mg', '13.5mg', '14mg', '14.5mg', '15mg'] },
    ]
  },
  {
    group: 'Skin/Hair',
    options: [
      { value: 'GHK-Cu', startingDose: '1mg', maxDose: '2mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'GHK-Cu Face Cream', startingDose: 'Apply thin layer', maxDose: '2x daily', frequency: 'Daily', notes: 'Topical application' },
      { value: 'GLOW (GHK-Cu / BPC / TB500)', startingDose: '1.67mg/333mcg/333mcg', maxDose: '1.67mg/333mcg/333mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'GLOW 50', startingDose: '1.67mg/333mcg/333mcg', maxDose: '1.67mg/333mcg/333mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'KLOW (GHK-Cu / KPV / BPC / TB)', startingDose: '1mg', maxDose: '3mg', frequency: 'Daily x 30 days', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Melanotan II', startingDose: '500mcg', maxDose: '1mg', frequency: 'Before tanning', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Immune',
    options: [
      { value: 'TA1 (Thymosin Alpha 1)', startingDose: '3mg', maxDose: '8mg', frequency: 'When sick, 2x/week', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'TA1 Complex', startingDose: '3mg', maxDose: '8mg', frequency: 'When sick, 2x/week', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Thymalin', startingDose: '1mg', maxDose: '10mg', frequency: 'Daily x 10 days', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Thymagen', startingDose: '100mcg', maxDose: '200mcg', frequency: 'Daily x 3-10 days', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'LL-37', startingDose: '300mcg', maxDose: '1mg', frequency: 'Daily (when sick)', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'LL-37 Complex', startingDose: '250mcg', maxDose: '250mcg', frequency: 'Daily (when sick)', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'KPV', startingDose: '250mcg', maxDose: '500mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Longevity',
    options: [
      { value: 'Epithalon', startingDose: '10mg', maxDose: '10mg', frequency: 'Daily x 20 days', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'MOTS-C', startingDose: '5mg', maxDose: '10mg', frequency: 'Every 5 days x 20 days (3x/yr)', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'FOXO4-DRI', startingDose: '3mg', maxDose: '3mg', frequency: 'Every other day x 5 days', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'PNC-28', startingDose: '1mg', maxDose: '2mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Bioregulators',
    options: [
      { value: 'Cardiogen', startingDose: '1mg', maxDose: '5mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Cartalax', startingDose: '2mg', maxDose: '5mg', frequency: 'Daily x 10-20 days', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Cognitive',
    options: [
      { value: 'BDNF', startingDose: '500mcg', maxDose: '2mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Dihexa (tablet)', startingDose: '8mg', maxDose: '24mg', frequency: 'Daily', notes: 'Oral tablet' },
      { value: 'PE-22-28', startingDose: '300mcg', maxDose: '1mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Selank', startingDose: '250mcg', maxDose: '500mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Semax', startingDose: '500mcg', maxDose: '1000mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Sleep',
    options: [
      { value: 'DSIP', startingDose: '500mcg', maxDose: '1mg', frequency: 'PRN before bed', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Sexual Health',
    options: [
      { value: 'PT-141', startingDose: '500mcg', maxDose: '1mg', frequency: 'PRN 2 hrs before activity', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Kisspeptin', startingDose: '100mcg', maxDose: '200mcg', frequency: 'PRN', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Oxytocin', startingDose: '250mcg', maxDose: '500mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'HRT Support',
    options: [
      { value: 'Gonadorelin', startingDose: '250mcg', maxDose: '250mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'HCG', startingDose: '500 IU', maxDose: '1000 IU', frequency: '2x per week', notes: 'Reconstitute with 2mL BAC water' },
    ]
  },
  {
    group: 'Specialty',
    options: [
      { value: 'ARA-290', startingDose: '1.6mg', maxDose: '4mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'Curcumin (injectable)', startingDose: '45mg', maxDose: '90mg', frequency: 'Daily', notes: 'Injectable form' },
      { value: 'FLGR242', startingDose: '10mg', maxDose: '10mg', frequency: 'Every 2 weeks', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'NAD+', startingDose: '50mg', maxDose: '200mg', frequency: 'Daily or 2-3x weekly', notes: 'Injectable' },
    ]
  },
  {
    group: 'Oral Peptides',
    options: [
      { value: '5-Amino-1MQ (tablet)', startingDose: '15mg', maxDose: '150mg', frequency: 'Daily', notes: 'Oral tablet' },
      { value: 'SLU-PP-332', startingDose: '250mcg', maxDose: '1.5mg', frequency: 'Daily', notes: 'Oral' },
      { value: 'Tesofensine (tablet)', startingDose: '250mcg', maxDose: '1000mcg', frequency: 'Daily', notes: 'Oral tablet' },
    ]
  }
];

// ================================================================
// RECOVERY PEPTIDE CYCLE TRACKING
// ================================================================
export const RECOVERY_CYCLE_MAX_DAYS = 90; // 90 days (3x 30-day cycles)
export const RECOVERY_CYCLE_OFF_DAYS = 14; // 2 weeks off between cycles

// Recovery/Healing peptides that count toward the 90-day cycle
// Matches any medication containing BPC-157, Wolverine, or TB-500/TB500/TB4
// Does NOT include GLOW/KLOW (skin peptides that happen to contain BPC)
export const isRecoveryPeptide = (medicationName) => {
  if (!medicationName) return false;
  const lower = medicationName.toLowerCase();
  // Exclude GLOW/KLOW skin peptides
  if (lower.includes('glow') || lower.includes('klow')) return false;
  // Match recovery peptides by keyword
  return lower.includes('bpc-157') || lower.includes('bpc 157') ||
    lower.includes('wolverine') ||
    lower.includes('tb-500') || lower.includes('tb500') || lower.includes('tb4') ||
    lower.includes('thymosin beta');
};

// ================================================================
// GROWTH HORMONE PEPTIDE CYCLE TRACKING
// ================================================================
export const GH_CYCLE_MAX_DAYS = 90; // 90 days (3x 30-day cycles)
export const GH_CYCLE_OFF_DAYS = 28; // 4 weeks off between cycles

// Growth Hormone peptides that count toward the 90-day cycle
// Matches blends (2X, 3X, 4X) and individual GH peptides
export const isGHPeptide = (medicationName) => {
  if (!medicationName) return false;
  const lower = medicationName.toLowerCase();
  return lower.includes('cjc') || lower.includes('tesamorelin') || lower.includes('tesa') ||
    lower.includes('ipamorelin') || lower.includes('ghrp') || lower.includes('hexarelin') ||
    lower.includes('mk-677') || lower.includes('sermorelin') || lower.includes('mgf') ||
    lower.includes('2x blend') || lower.includes('3x blend') || lower.includes('4x blend');
};

// Returns cycle config for a medication name: { type, maxDays, offDays, label }
export const getCycleConfig = (medicationName) => {
  if (isRecoveryPeptide(medicationName)) {
    return { type: 'recovery', maxDays: RECOVERY_CYCLE_MAX_DAYS, offDays: RECOVERY_CYCLE_OFF_DAYS, label: 'Recovery Peptide Cycle' };
  }
  if (isGHPeptide(medicationName)) {
    return { type: 'gh', maxDays: GH_CYCLE_MAX_DAYS, offDays: GH_CYCLE_OFF_DAYS, label: 'Growth Hormone Peptide Cycle' };
  }
  return null;
};

// Helper to find peptide info by name
export const findPeptideInfo = (peptideName) => {
  if (!peptideName) return null;
  for (const group of PEPTIDE_OPTIONS) {
    const found = group.options.find(opt => opt.value === peptideName);
    if (found) return found;
  }
  return null;
};

// Helper for fuzzy matching peptide names
export const findMatchingPeptide = (savedMedication) => {
  if (!savedMedication) return null;
  const savedLower = savedMedication.toLowerCase();

  // Try exact match first
  for (const group of PEPTIDE_OPTIONS) {
    for (const opt of group.options) {
      if (opt.value.toLowerCase() === savedLower) {
        return opt.value;
      }
    }
  }

  // Try partial match
  for (const group of PEPTIDE_OPTIONS) {
    for (const opt of group.options) {
      if (opt.value.toLowerCase().includes(savedLower) || savedLower.includes(opt.value.toLowerCase())) {
        return opt.value;
      }
    }
  }

  return savedMedication;
};

// ================================================================
// TESTOSTERONE DOSES
// ================================================================
export const TESTOSTERONE_DOSES = {
  male: [
    { value: '0.2ml/40mg', label: '0.2ml / 40mg' },
    { value: '0.25ml/50mg', label: '0.25ml / 50mg' },
    { value: '0.3ml/60mg', label: '0.3ml / 60mg' },
    { value: '0.35ml/70mg', label: '0.35ml / 70mg' },
    { value: '0.4ml/80mg', label: '0.4ml / 80mg' },
    { value: '0.5ml/100mg', label: '0.5ml / 100mg' },
  ],
  female: [
    { value: '0.1ml/10mg', label: '0.1ml / 10mg' },
    { value: '0.15ml/15mg', label: '0.15ml / 15mg' },
    { value: '0.2ml/20mg', label: '0.2ml / 20mg' },
    { value: '0.25ml/25mg', label: '0.25ml / 25mg' },
    { value: '0.3ml/30mg', label: '0.3ml / 30mg' },
    { value: '0.4ml/40mg', label: '0.4ml / 40mg' },
    { value: '0.5ml/50mg', label: '0.5ml / 50mg' },
  ]
};

// ================================================================
// WEIGHT LOSS
// ================================================================
export const WEIGHT_LOSS_MEDICATIONS = ['Semaglutide', 'Tirzepatide', 'Retatrutide'];

export const WEIGHT_LOSS_DOSAGES = {
  'Semaglutide': ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'],
  'Tirzepatide': ['0.5mg', '1mg', '1.5mg', '2mg', '2.5mg', '3mg', '3.5mg', '4mg', '4.5mg', '5mg', '5.5mg', '6mg', '6.5mg', '7mg', '7.5mg', '8mg', '8.5mg', '9mg', '9.5mg', '10mg', '10.5mg', '11mg', '11.5mg', '12mg', '12.5mg', '13mg', '13.5mg', '14mg', '14.5mg', '15mg'],
  'Retatrutide': ['0.5mg', '1mg', '1.5mg', '2mg', '2.5mg', '3mg', '3.5mg', '4mg', '4.5mg', '5mg', '5.5mg', '6mg', '6.5mg', '7mg', '7.5mg', '8mg', '8.5mg', '9mg', '9.5mg', '10mg', '10.5mg', '11mg', '11.5mg', '12mg', '12.5mg', '13mg', '13.5mg', '14mg', '14.5mg', '15mg']
};

export const WEIGHT_LOSS_DURATIONS = [
  { value: '7', label: '1 Week (1 injection)' },
  { value: '14', label: '2 Weeks (2 injections)' },
  { value: '28', label: '4 Weeks (4 injections)' },
  { value: '56', label: '8 Weeks (8 injections)' }
];

// ================================================================
// INJECTION MEDICATIONS
// ================================================================
export const INJECTION_MEDICATIONS = [
  'Amino Blend',
  'B12',
  'B-Complex',
  'Biotin',
  'Vitamin D3',
  'NAC',
  'BCAA',
  'L-Carnitine',
  'Glutathione',
  'NAD+',
  'Lipo-C',
  'Skinny Shot',
  'Toradol'
];

// ================================================================
// HRT MEDICATIONS
// ================================================================
export const HRT_MEDICATIONS = [
  'Testosterone Cypionate',
  'Testosterone Enanthate',
  'Nandrolone',
  'HCG',
  'Testosterone Booster (Oral)'
];

export const HRT_SECONDARY_MEDICATIONS = ['Gonadorelin', 'HCG', 'Nandrolone'];

// ================================================================
// DELIVERY METHODS - Standardized
// ================================================================
export const DELIVERY_METHODS = [
  { value: 'take_home', label: 'Take Home' },
  { value: 'in_clinic', label: 'In Clinic' }
];

// ================================================================
// SUPPLY TYPES - Standardized (HRT)
// ================================================================
export const HRT_SUPPLY_TYPES = [
  { value: 'prefilled_1week', label: 'Pre-filled 1 Week (2 injections)' },
  { value: 'prefilled_2week', label: 'Pre-filled 2 Week (4 injections)' },
  { value: 'prefilled_4week', label: 'Pre-filled 4 Week (8 injections)' },
  { value: 'vial_5ml', label: 'Vial 5ml' },
  { value: 'vial_10ml', label: 'Vial 10ml' }
];

// ================================================================
// FREQUENCY OPTIONS - Comprehensive
// ================================================================
export const FREQUENCY_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: '1x daily (AM)', label: '1x daily (AM)' },
  { value: '1x daily (PM/bedtime)', label: '1x daily (PM/bedtime)' },
  { value: '2x daily', label: '2x daily' },
  { value: '3x daily', label: '3x daily' },
  { value: '5 on / 2 off', label: '5 on / 2 off' },
  { value: 'Every other day', label: 'Every other day' },
  { value: 'Every 5 days', label: 'Every 5 days' },
  { value: '3x per week', label: '3x per week' },
  { value: '2x per week', label: '2x per week' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Every 10 days', label: 'Every 10 days' },
  { value: 'Every 2 weeks', label: 'Every 2 weeks' },
  { value: 'PRN', label: 'PRN (as needed)' },
  { value: 'After workout', label: 'After workout' },
  { value: 'Before tanning', label: 'Before tanning' },
  { value: 'As scheduled', label: 'As scheduled' }
];

// ================================================================
// VISIT FREQUENCY OPTIONS (In-Clinic)
// ================================================================
export const VISIT_FREQUENCY_OPTIONS = [
  { value: '2x_week', label: '2x per week' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' }
];

// ================================================================
// MEMBERSHIP FREQUENCY OPTIONS (Combo & Individual Memberships)
// ================================================================
export const MEMBERSHIP_FREQUENCY_OPTIONS = [
  { value: '1x_week', label: '1x per week', hbotSessions: 4, rltSessions: 4, period: 30 },
  { value: '2x_week', label: '2x per week', hbotSessions: 8, rltSessions: 8, period: 30 },
  { value: '3x_week', label: '3x per week', hbotSessions: 12, rltSessions: 12, period: 30 },
];

// ================================================================
// PROTOCOL STATUS OPTIONS
// ================================================================
export const PROTOCOL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' }
];

// ================================================================
// CATEGORY COLORS
// ================================================================
export const CATEGORY_COLORS = {
  hrt: { bg: '#f3e8ff', text: '#7c3aed', label: 'HRT' },
  weight_loss: { bg: '#dbeafe', text: '#1e40af', label: 'Weight Loss' },
  peptide: { bg: '#dcfce7', text: '#166534', label: 'Peptide' },
  iv: { bg: '#ffedd5', text: '#c2410c', label: 'IV' },
  hbot: { bg: '#e0e7ff', text: '#3730a3', label: 'HBOT' },
  rlt: { bg: '#fee2e2', text: '#dc2626', label: 'RLT' },
  combo_membership: { bg: '#f0e6ff', text: '#6d28d9', label: 'Combo' },
  injection: { bg: '#fef3c7', text: '#92400e', label: 'Injection' },
  labs: { bg: '#fdf2f8', text: '#9d174d', label: 'Labs' },
  other: { bg: '#f3f4f6', text: '#374151', label: 'Other' }
};

// ================================================================
// IV THERAPY TYPES
// ================================================================
export const IV_THERAPY_TYPES = [
  'Range IV',
  'Myers Cocktail',
  'NAD+ IV 250mg',
  'NAD+ IV 500mg',
  'NAD+ IV 750mg',
  'NAD+ IV 1000mg',
  'Glutathione IV 1g',
  'Glutathione IV 2g',
  'Glutathione IV 3g',
  'Vitamin C IV 25g',
  'Vitamin C IV 50g',
  'Vitamin C IV 75g',
  'Methylene Blue IV',
  'MB + Vit C + Mag Combo',
  'Exosome IV',
  'BYO IV',
  'Hydration IV',
  'Immunity',
  'Recovery',
  'Custom'
];

// ================================================================
// SESSION PACK OPTIONS
// ================================================================
export const SESSION_PACK_OPTIONS = [
  { value: 1, label: 'Single Session' },
  { value: 5, label: '5 Pack' },
  { value: 10, label: '10 Pack' },
  { value: 20, label: '20 Pack' }
];

// ================================================================
// PEPTIDE PROGRAM DURATIONS
// ================================================================
export const PEPTIDE_DURATIONS = [
  { value: '7 Day', label: '7 Day', days: 7 },
  { value: '10 Day', label: '10 Day', days: 10 },
  { value: '14 Day', label: '14 Day', days: 14 },
  { value: '20 Day', label: '20 Day', days: 20 },
  { value: '30 Day', label: '30 Day', days: 30 },
  { value: 'Vial', label: 'Vial', days: null }
];

// ================================================================
// LAB STAGES - Pipeline stages for lab protocols
// ================================================================
export const LAB_STAGES = [
  { id: 'blood_draw_complete', label: 'Blood Draw Complete', color: '#f59e0b', icon: '🩸' },
  { id: 'results_received', label: 'Results Received', color: '#8b5cf6', icon: '📋' },
  { id: 'provider_reviewed', label: 'Provider Reviewed', color: '#10b981', icon: '👨‍⚕️' },
  { id: 'consult_scheduled', label: 'Consult Scheduled', color: '#6366f1', icon: '🗓️' },
  { id: 'consult_complete', label: 'Consult Complete', color: '#3b82f6', icon: '✅' }
];

export const LAB_PANEL_TYPES = [
  { value: 'essential', label: 'Essential Panel' },
  { value: 'elite', label: 'Elite Panel' }
];

// ================================================================
// HELPER FUNCTIONS
// ================================================================

// Parse template name to extract protocol type and delivery method
export const parseTemplateName = (name) => {
  const deliveryMatch = name.match(/\((In Clinic|Take Home)\)/i);
  const delivery = deliveryMatch ? deliveryMatch[1] : null;

  let type = name
    .replace(/^(Injection Therapy|Peptide Therapy|IV Therapy|HBOT|HRT|Red Light|Weight Loss)\s*-?\s*/i, '')
    .replace(/\s*\((In Clinic|Take Home)\)\s*/i, '')
    .trim();

  return { type, delivery };
};

// Get unique protocol types for a category
export const getProtocolTypes = (templates, category) => {
  const categoryTemplates = templates.filter(t => t.category === category);
  const types = new Set();

  categoryTemplates.forEach(t => {
    const { type } = parseTemplateName(t.name);
    if (type) types.add(type);
  });

  return [...types].sort();
};

// Check if a protocol type has delivery options
export const hasDeliveryOptions = (templates, category, protocolType) => {
  const categoryTemplates = templates.filter(t => t.category === category);
  const matchingTemplates = categoryTemplates.filter(t => {
    const { type } = parseTemplateName(t.name);
    return type === protocolType;
  });

  return matchingTemplates.some(t => {
    const { delivery } = parseTemplateName(t.name);
    return delivery !== null;
  });
};

// Get delivery options for a protocol type
export const getDeliveryOptions = (templates, category, protocolType) => {
  const categoryTemplates = templates.filter(t => t.category === category);
  const options = new Set();

  categoryTemplates.forEach(t => {
    const { type, delivery } = parseTemplateName(t.name);
    if (type === protocolType && delivery) {
      options.add(delivery);
    }
  });

  return [...options].sort();
};

// Find template by category, protocol type, and delivery method
export const findTemplate = (templates, category, protocolType, deliveryMethod) => {
  return templates.find(t => {
    if (t.category !== category) return false;
    const { type, delivery } = parseTemplateName(t.name);
    if (type !== protocolType) return false;
    if (deliveryMethod && delivery !== deliveryMethod) return false;
    if (!deliveryMethod && delivery) return false;
    return true;
  }) || templates.find(t => {
    if (t.category !== category) return false;
    const { type } = parseTemplateName(t.name);
    return type === protocolType;
  });
};

// Format category name for display
export const formatCategoryName = (category) => {
  if (!category) return 'Other';
  if (category === 'iv_therapy' || category === 'iv') return 'IV Therapy';
  if (category === 'hrt') return 'HRT';
  if (category === 'hbot') return 'HBOT';
  if (category === 'rlt') return 'Red Light';
  if (category === 'combo_membership') return 'Combo Membership';
  if (category === 'labs') return 'Labs';
  if (category === 'weight_loss') return 'Weight Loss';
  return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// Get category style for badges
export const getCategoryStyle = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

// Get dose options for a medication
export const getDoseOptions = (category, medication) => {
  if (category === 'weight_loss' && WEIGHT_LOSS_DOSAGES[medication]) {
    return WEIGHT_LOSS_DOSAGES[medication];
  }

  // Find in peptide options
  const peptideInfo = findPeptideInfo(medication);
  if (peptideInfo) {
    if (peptideInfo.doses) return peptideInfo.doses;
    const doses = [peptideInfo.startingDose];
    if (peptideInfo.maxDose !== peptideInfo.startingDose) {
      doses.push(peptideInfo.maxDose);
    }
    return doses;
  }

  return null;
};
