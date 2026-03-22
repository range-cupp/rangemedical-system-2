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
      { value: 'BPC-157/TB-500/KPV/MGF', startingDose: '500mcg/125mcg/100mcg/50mcg', maxDose: '500mcg/125mcg/100mcg/50mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
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
      { value: 'Retatrutide', startingDose: '0.25mg', maxDose: '15mg', frequency: 'Weekly', notes: 'GLP-1 agonist - titrate monthly', doses: ['0.25mg', '0.5mg', '0.75mg', '1mg', '1.25mg', '1.5mg', '1.75mg', '2mg', '2.25mg', '2.5mg', '2.75mg', '3mg', '3.25mg', '3.5mg', '3.75mg', '4mg', '4.25mg', '4.5mg', '4.75mg', '5mg', '5.25mg', '5.5mg', '5.75mg', '6mg', '6.25mg', '6.5mg', '6.75mg', '7mg', '7.25mg', '7.5mg', '7.75mg', '8mg', '8.25mg', '8.5mg', '8.75mg', '9mg', '9.25mg', '9.5mg', '9.75mg', '10mg', '10.25mg', '10.5mg', '10.75mg', '11mg', '11.25mg', '11.5mg', '11.75mg', '12mg', '12.25mg', '12.5mg', '12.75mg', '13mg', '13.25mg', '13.5mg', '13.75mg', '14mg', '14.25mg', '14.5mg', '14.75mg', '15mg'] },
      { value: 'Tirzepatide', startingDose: '0.25mg', maxDose: '15mg', frequency: 'Weekly', notes: 'GLP-1 agonist - titrate monthly', doses: ['0.25mg', '0.5mg', '0.75mg', '1mg', '1.25mg', '1.5mg', '1.75mg', '2mg', '2.25mg', '2.5mg', '2.75mg', '3mg', '3.25mg', '3.5mg', '3.75mg', '4mg', '4.25mg', '4.5mg', '4.75mg', '5mg', '5.25mg', '5.5mg', '5.75mg', '6mg', '6.25mg', '6.5mg', '6.75mg', '7mg', '7.25mg', '7.5mg', '7.75mg', '8mg', '8.25mg', '8.5mg', '8.75mg', '9mg', '9.25mg', '9.5mg', '9.75mg', '10mg', '10.25mg', '10.5mg', '10.75mg', '11mg', '11.25mg', '11.5mg', '11.75mg', '12mg', '12.25mg', '12.5mg', '12.75mg', '13mg', '13.25mg', '13.5mg', '13.75mg', '14mg', '14.25mg', '14.5mg', '14.75mg', '15mg'] },
    ]
  },
  {
    group: 'Skin/Hair',
    options: [
      { value: 'GHK-Cu', startingDose: '1mg', maxDose: '2mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'GHK-Cu Face Cream', startingDose: 'Apply thin layer', maxDose: '2x daily', frequency: 'Daily', notes: 'Topical application' },
      { value: 'GLOW (GHK-Cu / BPC / TB500)', startingDose: '1.67mg/333mcg/333mcg', maxDose: '1.67mg/333mcg/333mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'GLOW 50', startingDose: '1.67mg/333mcg/333mcg', maxDose: '1.67mg/333mcg/333mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
      { value: 'KLOW (GHK-Cu / KPV / BPC / TB)', startingDose: '1.67mg/83mcg/333mcg/333mcg', maxDose: '1.67mg/83mcg/333mcg/333mcg', frequency: 'Daily x 30 days', notes: 'Reconstitute with 2mL BAC water' },
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
      { value: 'BDNF', startingDose: '200mcg', maxDose: '600mcg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water. 3 phases: 200mcg → 400mcg → 600mcg (4 weeks each)', doses: ['200mcg (Phase 1)', '400mcg (Phase 2)', '600mcg (Phase 3)'] },
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
    group: 'Mitochondrial',
    options: [
      { value: 'SS-31 (Elamipretide)', startingDose: '1mg', maxDose: '2mg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water' },
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
// PEPTIDE VIAL SUPPLY — Vial sizes and duration options for dispensing
// Used by medications page to calculate next refill date
// ================================================================
export const PEPTIDE_VIAL_SUPPLY = [
  {
    match: /^ghk-?cu$/i,
    label: 'GHK-Cu',
    vialSize: '50mg',
    options: [
      { value: 'peptide_50d', label: '50 days (1mg/day)', days: 50 },
      { value: 'peptide_25d', label: '25 days (2mg/day)', days: 25 },
    ],
  },
  {
    match: /^glow/i,
    label: 'GLOW',
    vialSize: '50mg/10mg/10mg',
    options: [
      { value: 'peptide_30d', label: '30 days', days: 30 },
    ],
  },
  {
    match: /^klow/i,
    label: 'KLOW',
    vialSize: '50mg/2.5mg/10mg/10mg',
    options: [
      { value: 'peptide_30d', label: '30 days', days: 30 },
    ],
  },
  {
    match: /ss-?31|elamipretide/i,
    label: 'SS-31',
    vialSize: '50mg',
    options: [
      { value: 'peptide_50d', label: '50 days (1mg/day)', days: 50 },
      { value: 'peptide_25d', label: '25 days (2mg/day)', days: 25 },
    ],
  },
  {
    match: /2x.*cjc|cjc.*ipa/i,
    label: '2X Blend: CJC/Ipa',
    vialSize: '5mg/5mg',
    options: [
      { value: 'peptide_30d', label: '30 days (20 injections)', days: 30 },
    ],
  },
  {
    match: /2x.*tesa|tesa.*ipa/i,
    label: '2X Blend: Tesa/Ipa',
    vialSize: '5mg/5mg',
    options: [
      { value: 'peptide_30d', label: '30 days (20 injections)', days: 30 },
    ],
  },
  {
    match: /3x.*blend/i,
    label: '3X Blend',
    vialSize: 'varies by phase',
    options: [
      { value: 'peptide_30d', label: '30 days (20 injections)', days: 30 },
    ],
  },
  {
    match: /4x.*blend/i,
    label: '4X Blend',
    vialSize: 'varies by phase',
    options: [
      { value: 'peptide_30d', label: '30 days (20 injections)', days: 30 },
    ],
  },
  {
    match: /recovery.*blend|bpc.*tb.*kpv.*mgf|bpc.*157.*tb.*500.*kpv/i,
    label: 'Recovery 4-Blend',
    vialSize: '10mg BPC/10mg TB/2mg KPV/1mg MGF',
    options: [
      { value: 'peptide_10d', label: '10 days', days: 10 },
      { value: 'peptide_20d', label: '20 days', days: 20 },
      { value: 'peptide_30d', label: '30 days', days: 30 },
    ],
  },
  {
    match: /bpc.*157.*tb4|bpc.*tb4|bpc-157\/tb4/i,
    label: 'BPC-157/TB4',
    vialSize: '10mg/10mg',
    options: [
      { value: 'peptide_20d', label: '20 days', days: 20 },
    ],
  },
  {
    match: /mots-?c/i,
    label: 'MOTS-C',
    vialSize: '10mg',
    options: [
      { value: 'peptide_20d', label: '20 days', days: 20 },
      { value: 'peptide_30d', label: '30 days', days: 30 },
    ],
  },
];

// Helper: find peptide vial supply options by medication name
export const getPeptideVialSupply = (medicationName) => {
  if (!medicationName) return null;
  const name = medicationName.toLowerCase();
  return PEPTIDE_VIAL_SUPPLY.find(v => v.match.test(name)) || null;
};

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
    { value: '0.45ml/90mg', label: '0.45ml / 90mg' },
    { value: '0.5ml/100mg', label: '0.5ml / 100mg' },
    { value: '0.6ml/120mg', label: '0.6ml / 120mg' },
    { value: '0.7ml/140mg', label: '0.7ml / 140mg' },
    { value: '0.75ml/150mg', label: '0.75ml / 150mg' },
    { value: '0.8ml/160mg', label: '0.8ml / 160mg' },
    { value: '1.0ml/200mg', label: '1.0ml / 200mg' },
  ],
  female: [
    { value: '0.1ml/10mg', label: '0.1ml / 10mg' },
    { value: '0.15ml/15mg', label: '0.15ml / 15mg' },
    { value: '0.2ml/20mg', label: '0.2ml / 20mg' },
    { value: '0.25ml/25mg', label: '0.25ml / 25mg' },
    { value: '0.3ml/30mg', label: '0.3ml / 30mg' },
    { value: '0.4ml/40mg', label: '0.4ml / 40mg' },
    { value: '0.5ml/50mg', label: '0.5ml / 50mg' },
    { value: '0.6ml/60mg', label: '0.6ml / 60mg' },
    { value: '0.7ml/70mg', label: '0.7ml / 70mg' },
    { value: '0.8ml/80mg', label: '0.8ml / 80mg' },
    { value: '1.0ml/100mg', label: '1.0ml / 100mg' },
  ]
};

// ================================================================
// WEIGHT LOSS
// ================================================================
export const WEIGHT_LOSS_MEDICATIONS = ['Semaglutide', 'Tirzepatide', 'Retatrutide'];

export const WEIGHT_LOSS_DOSAGES = {
  'Semaglutide': ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'],
  'Tirzepatide': ['0.25mg', '0.5mg', '0.75mg', '1mg', '1.25mg', '1.5mg', '1.75mg', '2mg', '2.25mg', '2.5mg', '2.75mg', '3mg', '3.25mg', '3.5mg', '3.75mg', '4mg', '4.25mg', '4.5mg', '4.75mg', '5mg', '5.25mg', '5.5mg', '5.75mg', '6mg', '6.25mg', '6.5mg', '6.75mg', '7mg', '7.25mg', '7.5mg', '7.75mg', '8mg', '8.25mg', '8.5mg', '8.75mg', '9mg', '9.25mg', '9.5mg', '9.75mg', '10mg', '10.25mg', '10.5mg', '10.75mg', '11mg', '11.25mg', '11.5mg', '11.75mg', '12mg', '12.25mg', '12.5mg', '12.75mg', '13mg', '13.25mg', '13.5mg', '13.75mg', '14mg', '14.25mg', '14.5mg', '14.75mg', '15mg'],
  'Retatrutide': ['0.25mg', '0.5mg', '0.75mg', '1mg', '1.25mg', '1.5mg', '1.75mg', '2mg', '2.25mg', '2.5mg', '2.75mg', '3mg', '3.25mg', '3.5mg', '3.75mg', '4mg', '4.25mg', '4.5mg', '4.75mg', '5mg', '5.25mg', '5.5mg', '5.75mg', '6mg', '6.25mg', '6.5mg', '6.75mg', '7mg', '7.25mg', '7.5mg', '7.75mg', '8mg', '8.25mg', '8.5mg', '8.75mg', '9mg', '9.25mg', '9.5mg', '9.75mg', '10mg', '10.25mg', '10.5mg', '10.75mg', '11mg', '11.25mg', '11.5mg', '11.75mg', '12mg', '12.25mg', '12.5mg', '12.75mg', '13mg', '13.25mg', '13.5mg', '13.75mg', '14mg', '14.25mg', '14.5mg', '14.75mg', '15mg']
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
  'Toradol',
  'Cortisone'
];

// ================================================================
// HRT MEDICATIONS
// ================================================================
export const HRT_MEDICATIONS = [
  'Testosterone Cypionate',
  'Testosterone Enanthate',
  'Nandrolone',
  'HCG',
  'Testosterone Booster (Oral)',
  // Female HRT medications
  'Estradiol',
  'Progesterone',
  'Thyroid (T3/T4/Armour)',
  'DHEA',
  'Pregnenolone'
];

export const HRT_SECONDARY_MEDICATIONS = ['Gonadorelin', 'HCG', 'Nandrolone'];

// ================================================================
// INJECTION METHODS (HRT Take-Home)
// ================================================================
export const INJECTION_METHODS = [
  { value: 'im', label: 'Intramuscular (IM)' },
  { value: 'subq', label: 'Subcutaneous (SubQ)' }
];

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
  phlebotomy: { bg: '#fce7f3', text: '#be185d', label: 'Phlebotomy' },
  medication_pickup: { bg: '#ecfdf5', text: '#047857', label: 'Pickup' },
  other: { bg: '#f3f4f6', text: '#374151', label: 'Other' }
};

// ================================================================
// IV THERAPY TYPES
// ================================================================
export const IV_THERAPY_TYPES = [
  'Range IV',
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
  'MB + Vit C + Mag Combo',
  'Exosome IV',
  'BYO IV',
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
  { value: '12 Week', label: '12 Week', days: 84 },
  { value: 'Vial', label: 'Vial', days: null }
];

// ================================================================
// PEPTIDE PRODUCT CATALOG — Single source of truth for Stripe products
// Maps product names → protocol data for auto-creation
// ================================================================
export const PEPTIDE_PRODUCT_CATALOG = [
  // ── BPC-157/TB4 (Recovery) ──────────────────────────────────────
  {
    category: 'recovery',
    medication: 'BPC-157/TB4 (Thymosin Beta 4)',
    dose: '500mcg/500mcg',
    frequencyOptions: ['Daily', '2x daily'],
    defaultFrequency: 'Daily',
    deliveryOptions: ['in_clinic', 'take_home'],
    guideSlug: '/bpc-tb4-guide',
    durations: [
      { days: 10, label: '10 Day', price: 250 },
      { days: 20, label: '20 Day', price: 450 },
      { days: 30, label: '30 Day', price: 675 },
    ],
    // Product name patterns to match from Stripe purchases
    matchPatterns: [
      /^bpc-?157\/tb4?\b/i, /bpc.*tb.*\d+.*day/i,
      /\d+.*day.*bpc/i, /\d+.*day.*healing/i,
      /wolverine/i,
      /peptide.*protocol.*\d+.*day.*bpc/i,
      /peptide.*protocol.*\d+.*day$/i,
      /bpc.*157.*tb/i, /bpc-157\/tb4/i,
      /peptide protocol$/i,
    ],
  },

  // ── Recovery 4-Blend (BPC/TB4/KPV/MGF) ─────────────────────────
  {
    category: 'recovery',
    medication: 'BPC-157/TB4/KPV/MGF (Recovery 4-Blend)',
    dose: '500mcg/125mcg/100mcg/50mcg',
    frequencyOptions: ['Daily', '2x daily'],
    defaultFrequency: 'Daily',
    deliveryOptions: ['in_clinic', 'take_home'],
    guideSlug: '/recovery-blend-guide',
    durations: [
      { days: 10, label: '10 Day', price: 250 },
      { days: 20, label: '20 Day', price: 450 },
      { days: 30, label: '30 Day', price: 675 },
    ],
    matchPatterns: [
      /^recovery\s*4-?blend/i, /recovery.*4.*blend/i,
      /^4x\s*recovery/i, /4x.*recovery.*blend/i,
      /4-?blend.*\d+.*day/i,
      /bpc.*tb.*kpv.*mgf/i, /bpc.*157.*tb.*500.*kpv/i,
      /all.*in.*one/i,
    ],
  },

  // ── KLOW (GHK-Cu/KPV/BPC-157/TB-4) ───────────────────────────
  {
    category: 'recovery',
    medication: 'KLOW (GHK-Cu / KPV / BPC-157 / TB-4)',
    dose: '1.67mg/83mcg/333mcg/333mcg',
    frequencyOptions: ['Daily'],
    defaultFrequency: 'Daily',
    deliveryOptions: ['in_clinic', 'take_home'],
    guideSlug: '/klow-guide',
    durations: [
      { days: 10, label: '10 Day', price: 250 },
      { days: 20, label: '20 Day', price: 450 },
      { days: 30, label: '30 Day', price: 675 },
    ],
    matchPatterns: [
      /^klow/i, /klow.*\d+.*day/i, /klow.*protocol/i,
    ],
  },

  // ── BDNF (Cognitive) ───────────────────────────────────────────
  {
    category: 'peptide',
    medication: 'BDNF',
    defaultFrequency: '5 on / 2 off',
    deliveryOptions: ['take_home'],
    durations: [
      { days: 30, label: '30 Day' },
    ],
    totalInjections: 20,
    phases: [
      { phase: 1, label: 'Phase 1 (4 weeks)', dose: '200mcg', price: 150 },
      { phase: 2, label: 'Phase 2 (4 weeks)', dose: '400mcg', price: 200 },
      { phase: 3, label: 'Phase 3 (4 weeks)', dose: '600mcg', price: 250 },
    ],
    matchPatterns: [
      /^bdnf/i, /bdnf.*protocol/i, /bdnf.*phase/i,
    ],
  },

  // ── MOTS-C (Longevity) ─────────────────────────────────────────
  {
    category: 'longevity',
    medication: 'MOTS-C',
    guideSlug: '/mots-c-guide',
    deliveryOptions: ['in_clinic', 'take_home'],
    durations: [
      { days: 20, label: '20 Day', price: 400 },
      { days: 30, label: '30 Day', price: 400 },
    ],
    phases: [
      {
        phase: 1, label: 'Phase 1 (20mg total)',
        doses: { 20: '5mg', 30: '1mg' },           // dose per injection by duration
        frequencies: { 20: 'Every 5 days', 30: '5 on / 2 off' },
        injections: { 20: 4, 30: 20 },
        price: 400,
      },
      {
        phase: 2, label: 'Phase 2 (40mg total)',
        doses: { 20: '10mg', 30: '2mg' },
        frequencies: { 20: 'Every 5 days', 30: '5 on / 2 off' },
        injections: { 20: 4, 30: 20 },
        price: 700,
      },
    ],
    matchPatterns: [
      /mots.*20/i, /mots.*30/i, /mots.*protocol/i, /mots.*c/i,
      /^mots-c/i,
    ],
  },

  // ── GHK-Cu (Skin/Hair) ─────────────────────────────────────────
  {
    category: 'skin',
    medication: 'GHK-Cu',
    dose: '1mg',
    frequencyOptions: ['Daily'],
    defaultFrequency: 'Daily',
    deliveryOptions: ['in_clinic', 'take_home'],
    guideSlug: '/ghk-cu-guide',
    durations: [
      { days: 30, label: '30 Day', price: 250 },
    ],
    matchPatterns: [
      /^ghk-?cu/i, /ghk.*cu.*protocol/i, /ghk.*cu.*\d+/i,
    ],
  },

  // ── GLOW (GHK-Cu/BPC-157/TB-4) ─────────────────────────────────
  {
    category: 'recovery',
    medication: 'GLOW (GHK-Cu / BPC-157 / TB-4)',
    dose: '1.67mg/333mcg/333mcg',
    frequencyOptions: ['Daily'],
    defaultFrequency: 'Daily',
    deliveryOptions: ['in_clinic', 'take_home'],
    guideSlug: '/glow-guide',
    durations: [
      { days: 10, label: '10 Day', price: 250 },
      { days: 20, label: '20 Day', price: 450 },
      { days: 30, label: '30 Day', price: 675 },
    ],
    matchPatterns: [
      /^glow\b/i, /glow.*\d+.*day/i, /glow.*protocol/i,
    ],
  },

  // ── 2X Blend: CJC-1295 / Ipamorelin (GH) ──────────────────────
  {
    category: 'gh_blend',
    medication: '2X Blend: CJC-1295 No DAC / Ipamorelin',
    defaultFrequency: '5 on / 2 off',
    guideSlug: '/cjc-ipamorelin-guide',
    deliveryOptions: ['take_home'],
    durations: [
      { days: 30, label: '30 Day' },
    ],
    totalInjections: 20,
    phases: [
      { phase: 1, label: 'Phase 1', dose: '500mcg/500mcg (1mg total)', price: 400 },
      { phase: 2, label: 'Phase 2', dose: '1mg/1mg (2mg total)', price: 450 },
      { phase: 3, label: 'Phase 3', dose: '1.5mg/1.5mg (3mg total)', price: 500 },
    ],
    matchPatterns: [
      /2x.*cjc/i, /cjc.*ipa.*vial/i, /cjc.*1295.*ipa/i,
      /cjc.*no\s*dac.*ipa/i, /2x.*blend.*cjc/i,
    ],
  },

  // ── 2X Blend: Tesamorelin / Ipamorelin (GH) ───────────────────
  {
    category: 'gh_blend',
    medication: '2X Blend: Tesamorelin / Ipamorelin',
    defaultFrequency: '5 on / 2 off',
    guideSlug: '/tesamorelin-ipamorelin-guide',
    deliveryOptions: ['take_home'],
    durations: [
      { days: 30, label: '30 Day' },
    ],
    totalInjections: 20,
    phases: [
      { phase: 1, label: 'Phase 1', dose: '500mcg/500mcg (1mg total)', price: 400 },
      { phase: 2, label: 'Phase 2', dose: '1mg/1mg (2mg total)', price: 450 },
      { phase: 3, label: 'Phase 3', dose: '1.5mg/1.5mg (3mg total)', price: 500 },
    ],
    matchPatterns: [
      /2x.*tesa/i, /tesa.*ipa.*blend/i, /tesa.*ipa.*vial/i, /tesa.*ipa.*30/i,
      /2x.*blend.*tesa/i, /tesamorelin.*ipa/i,
    ],
  },

  // ── 3X Blend: Tesamorelin / MGF / Ipamorelin (GH) ─────────────
  {
    category: 'gh_blend',
    medication: '3X Blend: Tesa / MGF / Ipamorelin',
    defaultFrequency: '5 on / 2 off',
    guideSlug: '/3x-blend-guide',
    deliveryOptions: ['take_home'],
    durations: [
      { days: 30, label: '30 Day' },
    ],
    totalInjections: 20,
    phases: [
      { phase: 1, label: 'Phase 1', dose: '500mcg/50mcg/250mcg (1mg total)', price: 425 },
      { phase: 2, label: 'Phase 2', dose: '1mg/100mcg/500mcg (2mg total)', price: 475 },
      { phase: 3, label: 'Phase 3', dose: '1.5mg/150mcg/750mcg (3mg total)', price: 525 },
    ],
    matchPatterns: [
      /3x.*blend/i, /3x.*tesa/i, /3x\s*blend/i,
    ],
  },

  // ── 4X Blend: GHRP-2 / Tesamorelin / MGF / Ipamorelin (GH) ───
  {
    category: 'gh_blend',
    medication: '4X Blend: GHRP-2 / Tesa / MGF / Ipa',
    defaultFrequency: '5 on / 2 off',
    guideSlug: '/3x-blend-guide',
    deliveryOptions: ['take_home'],
    durations: [
      { days: 30, label: '30 Day' },
    ],
    totalInjections: 20,
    phases: [
      { phase: 1, label: 'Phase 1', dose: '500mcg/500mcg/50mcg/250mcg (1mg total)', price: 450 },
      { phase: 2, label: 'Phase 2', dose: '1mg/1mg/100mcg/500mcg (2mg total)', price: 500 },
      { phase: 3, label: 'Phase 3', dose: '1.5mg/1.5mg/150mcg/750mcg (3mg total)', price: 550 },
    ],
    matchPatterns: [
      /4x.*blend/i, /4x.*ghrp/i, /4x\s*blend/i,
    ],
  },

  // ── NAD+ 100mg (Longevity / Cellular Health) ─────────────────────
  {
    category: 'longevity',
    medication: 'NAD+ 100mg',
    dose: '100mg',
    defaultFrequency: 'Daily',
    frequencyOptions: ['Daily', '5 on / 2 off'],
    deliveryOptions: ['in_clinic', 'take_home'],
    guideSlug: '/nad-guide',
    durations: [
      { days: 30, label: '30 Day', price: 600 },
      { days: 84, label: '12 Week', price: 1500 },
    ],
    matchPatterns: [
      /^nad\+?\s*100/i, /nad.*100\s*mg/i, /nad\+?\s*12\s*week/i,
      /nad\+?\s*protocol/i,
    ],
  },

  // ── AOD-9604 (Fat Loss) ──────────────────────────────────────────
  {
    category: 'peptide',
    medication: 'AOD-9604',
    dose: '500mcg',
    defaultFrequency: 'Daily',
    frequencyOptions: ['Daily'],
    deliveryOptions: ['take_home'],
    durations: [
      { days: 30, label: '30 Day', price: 400 },
    ],
    totalInjections: 30,
    matchPatterns: [
      /^aod/i, /aod.*9604/i, /aod-?9604/i,
    ],
  },

  // ── DSIP (Sleep — As Needed) ─────────────────────────────────────
  {
    category: 'peptide',
    medication: 'DSIP',
    dose: '500mcg',
    defaultFrequency: 'As Needed',
    frequencyOptions: ['As Needed', 'Daily'],
    deliveryOptions: ['take_home'],
    durations: [
      { days: 30, label: '30 Day', price: 200 },
    ],
    matchPatterns: [
      /^dsip/i, /dsip.*protocol/i,
    ],
  },
];

// Helper: find catalog entry by Stripe product name or peptide identifier
export const findPeptideProduct = (productName) => {
  if (!productName) return null;
  const lower = productName.toLowerCase();

  // Try matching the full product name first
  for (const product of PEPTIDE_PRODUCT_CATALOG) {
    for (const pattern of product.matchPatterns) {
      if (pattern.test(lower)) return product;
    }
  }

  // If full name didn't match, try extracting the peptide identifier part
  // Handles names like "Peptide Therapy — Recovery 30 Day — KLOW"
  // or "Peptide Therapy — Monthly — 2X Blend — CJC/IPA"
  const parts = productName.split('—').map(s => s.trim());
  if (parts.length >= 3) {
    // Try the last part (e.g., "KLOW", "CJC/IPA")
    const lastPart = parts[parts.length - 1].toLowerCase();
    for (const product of PEPTIDE_PRODUCT_CATALOG) {
      for (const pattern of product.matchPatterns) {
        if (pattern.test(lastPart)) return product;
      }
    }
    // Try from the 3rd part onward joined (e.g., "2X Blend — CJC/IPA")
    const peptidePart = parts.slice(2).join(' — ').toLowerCase();
    for (const product of PEPTIDE_PRODUCT_CATALOG) {
      for (const pattern of product.matchPatterns) {
        if (pattern.test(peptidePart)) return product;
      }
    }
  }

  return null;
};

// Helper: parse duration from product name
export const parseDurationFromName = (productName) => {
  if (!productName) return null;
  const match = productName.match(/(\d+)[\s-]*day/i);
  if (match) return parseInt(match[1]);
  // "Monthly" or "As Needed" = 30 days
  const lower = productName.toLowerCase();
  if (lower.includes('monthly') || lower.includes('as needed')) return 30;
  return null;
};

// Helper: parse delivery method from product name
export const parseDeliveryFromName = (productName) => {
  if (!productName) return null;
  const lower = productName.toLowerCase();
  if (lower.includes('in-clinic') || lower.includes('in_clinic') || lower.includes('(in clinic)')) return 'in_clinic';
  if (lower.includes('take-home') || lower.includes('take_home') || lower.includes('(take home)') || lower.includes('(take-home)')) return 'take_home';
  return null;
};

// Helper: get guide slug from medication or program name
export const getGuideSlug = (medication, programName) => {
  // Try matching via catalog first
  const product = findPeptideProduct(medication) || findPeptideProduct(programName);
  if (product?.guideSlug) return product.guideSlug;

  // Fallback matching for older/generic names
  const text = `${medication || ''} ${programName || ''}`.toLowerCase();
  if ((text.includes('kpv') || text.includes('mgf')) && (text.includes('bpc') || text.includes('tb'))) return '/recovery-blend-guide';
  if (text.includes('glow')) return '/glow-guide';
  if (text.includes('mots')) return '/mots-c-guide';
  if (text.includes('nad')) return '/nad-guide';
  if (text.includes('ghk') && text.includes('cu')) return '/ghk-cu-guide';
  if (text.includes('3x') && text.includes('blend')) return '/3x-blend-guide';
  if (text.includes('4x') && text.includes('blend')) return '/3x-blend-guide';
  if (text.includes('cjc') && text.includes('ipa')) return '/cjc-ipamorelin-guide';
  if (text.includes('tesa') && text.includes('ipa')) return '/tesamorelin-ipamorelin-guide';
  if (text.includes('bpc') || text.includes('tb4') || text.includes('tb-4') || text.includes('thymosin')) return '/bpc-tb4-guide';
  // Default fallback
  return '/bpc-tb4-guide';
};

// Helper: parse phase from product name
export const parsePhaseFromName = (productName) => {
  if (!productName) return null;
  const match = productName.match(/phase\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
};

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

// ============================================
// TYPE DETECTION HELPERS
// Use these everywhere instead of exact === 'weight_loss' / === 'hrt' checks
// so that variant program_types (weight_loss_retatrutide, hrt_male_membership, etc.) work
// ============================================

/**
 * Check if a program_type or category is a weight loss type.
 * Matches: 'weight_loss', 'weight_loss_retatrutide', 'weight_loss_tirzepatide', 'weight_loss_semaglutide', 'weight_loss_program', etc.
 */
export function isWeightLossType(type) {
  if (!type) return false;
  const t = type.toLowerCase();
  return t.includes('weight_loss') || t === 'weight_loss';
}

/**
 * Check if a program_type or category is an HRT type.
 * Matches: 'hrt', 'hrt_male_membership', 'hrt_female_membership', etc.
 */
export function isHRTType(type) {
  if (!type) return false;
  const t = type.toLowerCase();
  return t === 'hrt' || t.startsWith('hrt_') || t.includes('hrt');
}

// Format category name for display
export const formatCategoryName = (category) => {
  if (!category) return 'Other';
  if (category === 'iv_therapy' || category === 'iv') return 'IV Therapy';
  if (category === 'hrt') return 'HRT';
  if (category === 'hbot') return 'HBOT';
  if (category === 'rlt') return 'Red Light';
  if (category === 'combo_membership') return 'Combo Membership';
  if (category === 'labs') return 'Labs';
  if (isWeightLossType(category)) return 'Weight Loss';
  if (isHRTType(category)) return 'HRT';
  return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// Get category style for badges
export const getCategoryStyle = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

// Get dose options for a medication
export const getDoseOptions = (category, medication) => {
  if (isWeightLossType(category) && WEIGHT_LOSS_DOSAGES[medication]) {
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
