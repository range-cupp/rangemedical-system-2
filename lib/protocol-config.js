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
      { value: '2X Blend: CJC No DAC / Ipamorelin', startingDose: '1mg', maxDose: '3mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water. 3 phases: 500mcg/500mcg → 1mg/1mg → 1.5mg/1.5mg', doses: ['500mcg/500mcg (Phase 1)', '1mg/1mg (Phase 2)', '1.5mg/1.5mg (Phase 3)'] },
      { value: '2X Blend: Tesamorelin / Ipamorelin', startingDose: '1mg', maxDose: '3mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water. 3 phases: 500mcg/500mcg → 1mg/1mg → 1.5mg/1.5mg', doses: ['500mcg/500mcg (Phase 1)', '1mg/1mg (Phase 2)', '1.5mg/1.5mg (Phase 3)'] },
      { value: '3X Blend: Tesa / MGF / Ipamorelin', startingDose: '0.8mg', maxDose: '2.4mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water. 3 phases', doses: ['500mcg/50mcg/250mcg (Phase 1)', '1mg/100mcg/500mcg (Phase 2)', '1.5mg/150mcg/750mcg (Phase 3)'] },
      { value: '4X Blend: GHRP-2 / Tesa / MGF / Ipa', startingDose: '1.3mg', maxDose: '3.9mg', frequency: '5 on / 2 off', notes: 'Reconstitute with 2mL BAC water. 3 phases', doses: ['500mcg/500mcg/50mcg/250mcg (Phase 1)', '1mg/1mg/100mcg/500mcg (Phase 2)', '1.5mg/1.5mg/150mcg/750mcg (Phase 3)'] },
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
      { value: 'Recovery 4-Blend (BPC-157/TB-4/KPV/MGF)', startingDose: '500mcg/125mcg/100mcg/50mcg', maxDose: '500mcg/125mcg/100mcg/50mcg', frequency: 'Daily', notes: 'Reconstitute with 2mL BAC water. 10mg BPC/10mg TB/2mg KPV/1mg MGF vial. 10-90 day programs.' },
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
      { value: 'Retatrutide', startingDose: '2mg', maxDose: '12mg', frequency: 'Weekly', notes: 'GLP-1 agonist - titrate monthly. 20mg vial, 1mL BAC water. Min 4 weeks per tier.', doses: ['2mg', '4mg', '6mg', '9mg', '12mg'] },
      { value: 'Tirzepatide', startingDose: '2.5mg', maxDose: '12.5mg', frequency: 'Weekly', notes: 'GLP-1 agonist - titrate monthly. 40mg vial, 2mL BAC water. Min 4 weeks per tier.', doses: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg'] },
    ]
  },
  {
    group: 'Skin/Hair',
    options: [
      { value: 'GHK-Cu', startingDose: '1mg', maxDose: '1mg', frequency: 'Daily', notes: 'Reconstitute with 3mL BAC water. 50mg vial.' },
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
      { value: 'MOTS-C', startingDose: '1mg', maxDose: '10mg', frequency: '5 on / 2 off or every 4 days', notes: 'Reconstitute with 2mL BAC water. Phase 1: 1mg (5on/2off) or 5mg (every 4 days). Phase 2: 2mg (5on/2off) or 10mg (every 4 days)', doses: ['1mg 5on/2off (Phase 1)', '5mg every 4 days (Phase 1)', '2mg 5on/2off (Phase 2)', '10mg every 4 days (Phase 2)'] },
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
      { value: 'NAD+', startingDose: '25mg', maxDose: '150mg', doseOptions: ['25mg', '50mg', '75mg', '100mg', '125mg', '150mg'], frequency: '3x weekly (Mon/Wed/Fri)', notes: 'Injectable. 125mg/mL ready-to-draw solution. 30/60/90-day programs.' },
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
      { value: 'peptide_30d', label: '30 days (1.67mg/day)', days: 30 },
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

// Helper: find vial info for any medication (peptide or injection)
export const getVialInfo = (medicationName, programName) => {
  if (!medicationName && !programName) return null;
  const searchTerms = [medicationName, programName].filter(Boolean);
  for (const term of searchTerms) {
    const peptide = PEPTIDE_VIAL_SUPPLY.find(v => v.match.test(term));
    if (peptide) return { label: peptide.label, vialSize: peptide.vialSize };
    const injection = INJECTION_VIAL_SUPPLY.find(v => v.match.test(term));
    if (injection) return { label: injection.label, vialSize: injection.vialSize, dosesPerVial: injection.dosesPerVial };
  }
  return null;
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
    lower.includes('igf') ||
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

// ================================================================
// PEPTIDE DURATION MATH — single source of truth
// ================================================================
// Given a frequency string, return doses per 7-day week.
// Returns null when the frequency is unrecognized.
export const getDosesPerWeek = (frequency) => {
  if (!frequency) return null;
  const f = String(frequency).toLowerCase().trim();

  if (f.includes('3x daily') || f.includes('3 times daily') || f.includes('tid')) return 21;
  if (f.includes('2x daily') || f.includes('twice daily') || f.includes('bid')) return 14;
  if (f === 'daily' || f === '7 days a week' || f.startsWith('1x daily') || f.includes('once daily') || f.includes('every day')) return 7;

  if (f.includes('5 on') || f.includes('5on') || f.includes('5 days on')) return 5;

  if (f.includes('every other day') || f.includes('eod')) return 3.5;
  const everyNMatch = f.match(/every\s+(\d+)\s*day/);
  if (everyNMatch) {
    const n = parseInt(everyNMatch[1]);
    if (n > 0) return 7 / n;
  }

  const perWeekMatch = f.match(/(\d+)(?:\s*-\s*\d+)?\s*x?\s*(?:per|\/|\s+a)\s*week/);
  if (perWeekMatch) return parseInt(perWeekMatch[1]);
  if (f === 'weekly' || f.includes('once weekly') || f.includes('once a week') || f.includes('1x per week')) return 1;

  if (f.includes('every 2 week') || f.includes('biweekly') || f.includes('every other week')) return 0.5;

  return null;
};

// Convert any of the legacy enum strings or human labels we store on
// protocol.frequency into a single human-friendly label. Handles the
// "every_3_5_days" / "2x_weekly" / "weekly" enums plus already-formatted
// strings ("Every 3.5 days", "Weekly", "Every 14 Days", "1x/week"). Returns
// the input unchanged when there's no match so we never blank out a custom
// frequency the operator typed.
export const formatProtocolFrequency = (frequency) => {
  if (!frequency) return '';
  const raw = String(frequency).trim();
  const lower = raw.toLowerCase();
  const map = {
    'every_3_5_days': 'Every 3.5 days',
    '2x_weekly': 'Every 3.5 days',
    '2x weekly': 'Every 3.5 days',
    '2x per week': 'Every 3.5 days',
    'twice weekly': 'Every 3.5 days',
    '2x/week': 'Every 3.5 days',
    'twice_weekly': 'Every 3.5 days',
    '3x_weekly': '3x per week',
    '3x weekly': '3x per week',
    '3x/week': '3x per week',
    '1x_weekly': 'Weekly',
    '1x weekly': 'Weekly',
    '1x/week': 'Weekly',
    'weekly': 'Weekly',
    'biweekly': 'Every 2 weeks',
    'bi-weekly': 'Every 2 weeks',
    'daily': 'Daily',
    'every other day': 'Every other day',
    'as needed': 'As needed',
  };
  if (map[lower]) return map[lower];
  // Already a human label like "Every 14 Days" — leave it alone.
  return raw;
};

// Parse the human-readable frequency LABEL stored on WL protocol records back
// into a numeric day interval. Handles "Weekly", "Biweekly", "Every N Days",
// "N-day". Falls back to 7 for anything else so weekly stays the safe default
// — including labels like "Monthly" which describe billing/program cadence in
// this system rather than injection cadence. To get a non-weekly projection,
// set frequency explicitly to "Every N Days".
export const parseFrequencyDays = (frequency) => {
  if (!frequency) return 7;
  const lower = String(frequency).toLowerCase().trim();
  const everyDayMatch = lower.match(/every\s+(\d+)\s*day/);
  if (everyDayMatch) {
    const n = parseInt(everyDayMatch[1], 10);
    if (n > 0) return n;
  }
  const everyWeekMatch = lower.match(/every\s+(\d+)\s*week/);
  if (everyWeekMatch) {
    const n = parseInt(everyWeekMatch[1], 10);
    if (n > 0) return n * 7;
  }
  const ndayMatch = lower.match(/\b(\d+)[\s-]?day\b/);
  if (ndayMatch) {
    const n = parseInt(ndayMatch[1], 10);
    if (n > 0) return n;
  }
  if (lower.includes('biweekly') || lower.includes('bi-weekly') || lower.includes('bi weekly')) return 14;
  return 7;
};

// Derive protocol duration in calendar days from total doses + frequency.
// Single source of truth for end_date math — used by every protocol type
// that has a session count + cadence (peptides, injections, NAD+, etc.).
// Returns null when totalDoses or cadence cannot be determined.
export const calculateProtocolDurationDays = (totalDoses, frequency) => {
  const doses = parseInt(totalDoses);
  if (!doses || doses <= 0) return null;
  const dpw = getDosesPerWeek(frequency);
  if (!dpw || dpw <= 0) return null;
  return Math.ceil((doses / dpw) * 7);
};

export const calculatePeptideDurationDays = calculateProtocolDurationDays;

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
    { value: '0.05ml/5mg', label: '0.05ml / 5mg' },
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
export const WEIGHT_LOSS_MEDICATIONS = ['Semaglutide', 'Tirzepatide', 'Retatrutide', 'Other'];

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

// Per-injection pricing (cents) — used by WL Injection Builder in checkout
// Doses not listed here use interpolation from nearest price points
export const WL_INJECTION_PRICING = {
  'Tirzepatide': {
    '2.5mg': 10000, '5mg': 13700, '7.5mg': 15000, '10mg': 16200, '12.5mg': 17500,
  },
  'Retatrutide': {
    '1mg': 6250, '2mg': 12500, '3mg': 13750, '4mg': 15000, '5mg': 16250,
    '6mg': 17500, '7mg': 18100, '8mg': 18700, '9mg': 19350, '10mg': 20000,
    '11mg': 20750, '12mg': 21500,
  },
};

// Dosage options shown in the WL Injection Builder (only priced doses)
export const WL_BUILDER_DOSES = {
  'Tirzepatide': ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg'],
  'Retatrutide': ['1mg', '2mg', '3mg', '4mg', '5mg', '6mg', '7mg', '8mg', '9mg', '10mg', '11mg', '12mg'],
};

// Look up per-injection price in cents; returns null if not found
export function getWlInjectionPrice(medication, dose) {
  const meds = WL_INJECTION_PRICING[medication];
  if (!meds) return null;
  // Normalize dose: "4 mg" → "4mg", "4.0mg" → "4mg"
  const normalized = (dose || '').replace(/\s+/g, '').replace(/\.0mg$/, 'mg');
  return meds[normalized] ?? null;
}

// ================================================================
// INJECTION BUILDER PRICING (cents per injection)
// Buy 10, Get 12: when quantity >= 10, charge for 10 but give 12
// ================================================================
export const INJECTION_PRICING = {
  standard: {
    price: 3500, // $35 per injection
    items: ['B12', 'B-Complex', 'Vitamin D3', 'Biotin', 'Amino Blend', 'BCAA', 'NAC'],
  },
  premium: {
    price: 5000, // $50 per injection
    items: ['L-Carnitine', 'Glutathione (200mg)', 'MIC-B12 (Skinny Shot)', 'MIC Injection'],
  },
  nad: {
    // NAD+ is priced by dosage at $0.50/mg
    doses: {
      '50mg': 2500, '75mg': 3750, '100mg': 5000, '125mg': 6250, '150mg': 7500,
    },
  },
};

export const BUY_10_GET_12_THRESHOLD = 10;
export const BUY_10_GET_12_BONUS = 12;

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
  'Skinny + Injection',
  'Skinny Shot',
  'MIC Injection',
  'Toradol',
  'Cortisone'
];

// ================================================================
// NAD+ INJECTION DOSAGES
// ================================================================
export const NAD_INJECTION_DOSAGES = ['25mg', '50mg', '75mg', '100mg', '125mg', '150mg', '175mg', '200mg'];

// Whole-vial dispense option for NAD+ — priced flat, bypasses per-mg dose math.
export const NAD_INJECTION_VIAL = { value: 'NAD+ 1g Vial', label: '1g Vial', price_cents: 50000 };

// ================================================================
// INJECTION VIAL SUPPLY - Non-peptide injectable vials
// ================================================================
export const INJECTION_VIAL_SUPPLY = [
  {
    match: /nad\+?\s*(vial)?/i,
    label: 'NAD+',
    vialSize: '1000mg',
    dosesPerVial: 10,
    defaultDose: '100mg',
  },
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

// Dosages and default frequencies for secondary HRT medications
export const HRT_SECONDARY_DOSAGES = {
  'HCG': {
    doses: ['250 IU', '500 IU', '750 IU', '1000 IU', '1500 IU', '2000 IU'],
    defaultFrequency: '2x/week',
    frequencies: ['2x/week', '3x/week', 'Daily', 'Every other day'],
  },
  'Gonadorelin': {
    doses: ['100mcg', '200mcg', '250mcg', '500mcg'],
    defaultFrequency: 'Daily',
    frequencies: ['Daily', '2x/week', '3x/week', 'Every other day'],
  },
  'Nandrolone': {
    doses: ['25mg', '50mg', '75mg', '100mg', '150mg', '200mg'],
    defaultFrequency: '1x/week',
    frequencies: ['1x/week', '2x/week', 'Every other week'],
  },
};

// ================================================================
// MEDICATION DEFAULTS — used by the guided Add/Edit Medication modal
// and by auto-protocol creation to pre-fill strength/form/route/sig.
// Keyed by canonical medication name.
//
// gender: 'male' | 'female' | 'all' — filters HRT dropdown options
// category: matches PROTOCOL_TYPES keys (hrt | weight_loss | peptide | injection | iv)
// strength / form / route / defaultSig: pre-fill values for the modal
// dosesKey: name of the dose list this med uses (lookups in code)
// frequencies: free-form labels staff pick from
// ================================================================
export const MEDICATION_DEFAULTS = {
  // ── HRT — Male ───────────────────────────────────────────────────────────
  'Testosterone Cypionate (Male)': {
    canonicalName: 'Testosterone Cypionate',
    category: 'hrt',
    gender: 'male',
    strength: '200mg/ml',
    form: 'Solution',
    route: 'Intramuscular',
    dosesKey: 'TESTOSTERONE_DOSES.male',
    frequencies: ['Every 3.5 days', 'Weekly', 'Twice weekly'],
    defaultFrequency: 'Every 3.5 days',
  },
  'Testosterone Enanthate (Male)': {
    canonicalName: 'Testosterone Enanthate',
    category: 'hrt',
    gender: 'male',
    strength: '250mg/ml',
    form: 'Solution',
    route: 'Intramuscular',
    dosesKey: 'TESTOSTERONE_DOSES.male',
    frequencies: ['Weekly', 'Every 3.5 days'],
    defaultFrequency: 'Weekly',
  },
  'HCG': {
    canonicalName: 'HCG',
    category: 'hrt',
    gender: 'all',
    strength: '5000 IU/vial',
    form: 'Solution',
    route: 'Subcutaneous',
    dosesKey: 'HRT_SECONDARY_DOSAGES.HCG',
    frequencies: ['2x/week', '3x/week', 'Daily', 'Every other day'],
    defaultFrequency: '2x/week',
  },
  'Gonadorelin': {
    canonicalName: 'Gonadorelin',
    category: 'hrt',
    gender: 'male',
    strength: '3mg/vial',
    form: 'Solution',
    route: 'Subcutaneous',
    dosesKey: 'HRT_SECONDARY_DOSAGES.Gonadorelin',
    frequencies: ['Daily', '2x/week', '3x/week', 'Every other day'],
    defaultFrequency: 'Daily',
  },
  'Anastrozole': {
    canonicalName: 'Anastrozole',
    category: 'hrt',
    gender: 'male',
    strength: '1mg',
    form: 'Tablet',
    route: 'Oral',
    doses: ['0.25mg', '0.5mg', '1mg'],
    frequencies: ['As needed', 'Every 3.5 days', '2x/week', '3x/week', 'Daily'],
    defaultFrequency: 'As needed',
  },
  'Nandrolone': {
    canonicalName: 'Nandrolone',
    category: 'hrt',
    gender: 'male',
    strength: '200mg/ml',
    form: 'Solution',
    route: 'Intramuscular',
    dosesKey: 'HRT_SECONDARY_DOSAGES.Nandrolone',
    frequencies: ['1x/week', '2x/week', 'Every other week'],
    defaultFrequency: '1x/week',
  },

  // ── HRT — Female ─────────────────────────────────────────────────────────
  'Testosterone Cypionate (Female)': {
    canonicalName: 'Testosterone Cypionate',
    category: 'hrt',
    gender: 'female',
    strength: '100mg/ml',
    form: 'Solution',
    route: 'Intramuscular',
    dosesKey: 'TESTOSTERONE_DOSES.female',
    frequencies: ['Weekly', 'Every 3.5 days', 'Every 2 weeks'],
    defaultFrequency: 'Weekly',
  },
  'Estradiol': {
    canonicalName: 'Estradiol',
    category: 'hrt',
    gender: 'female',
    strength: '0.1mg/24hr',
    form: 'Patch',
    route: 'Transdermal',
    doses: ['0.025mg', '0.05mg', '0.075mg', '0.1mg'],
    frequencies: ['Twice weekly', 'Weekly', 'Daily'],
    defaultFrequency: 'Twice weekly',
  },
  'Progesterone': {
    canonicalName: 'Progesterone',
    category: 'hrt',
    gender: 'female',
    strength: '100mg',
    form: 'Capsule',
    route: 'Oral',
    doses: ['100mg', '200mg', '300mg'],
    frequencies: ['Nightly', 'Days 14-28 monthly', 'Daily'],
    defaultFrequency: 'Nightly',
  },
  'DHEA': {
    canonicalName: 'DHEA',
    category: 'hrt',
    gender: 'all',
    strength: '25mg',
    form: 'Capsule',
    route: 'Oral',
    doses: ['10mg', '25mg', '50mg', '100mg'],
    frequencies: ['Daily', 'Twice daily'],
    defaultFrequency: 'Daily',
  },
  'Pregnenolone': {
    canonicalName: 'Pregnenolone',
    category: 'hrt',
    gender: 'all',
    strength: '50mg',
    form: 'Capsule',
    route: 'Oral',
    doses: ['25mg', '50mg', '100mg'],
    frequencies: ['Daily'],
    defaultFrequency: 'Daily',
  },

  // ── Weight Loss ──────────────────────────────────────────────────────────
  'Semaglutide': {
    canonicalName: 'Semaglutide',
    category: 'weight_loss',
    strength: '2.5mg/ml',
    form: 'Solution',
    route: 'Subcutaneous',
    dosesKey: 'WEIGHT_LOSS_DOSAGES.Semaglutide',
    frequencies: ['Weekly'],
    defaultFrequency: 'Weekly',
  },
  'Tirzepatide': {
    canonicalName: 'Tirzepatide',
    category: 'weight_loss',
    strength: '10mg/ml',
    form: 'Solution',
    route: 'Subcutaneous',
    dosesKey: 'WEIGHT_LOSS_DOSAGES.Tirzepatide',
    frequencies: ['Weekly'],
    defaultFrequency: 'Weekly',
  },
  'Retatrutide': {
    canonicalName: 'Retatrutide',
    category: 'weight_loss',
    strength: '10mg/ml',
    form: 'Solution',
    route: 'Subcutaneous',
    dosesKey: 'WEIGHT_LOSS_DOSAGES.Retatrutide',
    frequencies: ['Weekly'],
    defaultFrequency: 'Weekly',
  },

  // ── Recovery Peptides ────────────────────────────────────────────────────
  'BPC-157': {
    canonicalName: 'BPC-157',
    category: 'peptide',
    strength: '5mg/vial',
    form: 'Solution',
    route: 'Subcutaneous',
    doses: ['250mcg', '500mcg', '750mcg'],
    frequencies: ['Daily', 'Twice daily'],
    defaultFrequency: 'Daily',
  },
  'TB-500': {
    canonicalName: 'TB-500',
    category: 'peptide',
    strength: '5mg/vial',
    form: 'Solution',
    route: 'Subcutaneous',
    doses: ['250mcg', '500mcg', '1mg'],
    frequencies: ['Daily', 'Twice weekly'],
    defaultFrequency: 'Daily',
  },
  'BPC-157 / TB-500': {
    canonicalName: 'BPC-157 / TB-500',
    category: 'peptide',
    strength: '10mg/vial blend',
    form: 'Solution',
    route: 'Subcutaneous',
    doses: ['500mcg / 500mcg'],
    frequencies: ['Daily', 'Twice daily'],
    defaultFrequency: 'Daily',
  },
  'Tesamorelin / Ipamorelin': {
    canonicalName: 'Tesamorelin / Ipamorelin',
    category: 'peptide',
    strength: 'Blend vial',
    form: 'Solution',
    route: 'Subcutaneous',
    doses: ['100mcg / 200mcg', '200mcg / 200mcg', '300mcg / 200mcg'],
    frequencies: ['Nightly', 'Daily'],
    defaultFrequency: 'Nightly',
  },

  // ── Injections ───────────────────────────────────────────────────────────
  'B12': {
    canonicalName: 'B12',
    category: 'injection',
    strength: '1000mcg/ml',
    form: 'Solution',
    route: 'Intramuscular',
    doses: ['500mcg', '1000mcg'],
    frequencies: ['Weekly', 'Twice weekly', 'Monthly'],
    defaultFrequency: 'Weekly',
  },
  'Glutathione': {
    canonicalName: 'Glutathione',
    category: 'injection',
    strength: '200mg/ml',
    form: 'Solution',
    route: 'Intramuscular',
    doses: ['200mg'],
    frequencies: ['Weekly', 'Twice weekly'],
    defaultFrequency: 'Weekly',
  },
  'NAD+': {
    canonicalName: 'NAD+ Injection',
    category: 'injection',
    strength: '100mg/ml',
    form: 'Solution',
    route: 'Subcutaneous',
    doses: ['25mg', '50mg', '75mg', '100mg', '125mg', '150mg'],
    frequencies: ['Daily', 'MWF (3x per week)', 'Weekly'],
    defaultFrequency: 'MWF (3x per week)',
  },
  'L-Carnitine': {
    canonicalName: 'L-Carnitine',
    category: 'injection',
    strength: '200mg/ml',
    form: 'Solution',
    route: 'Intramuscular',
    doses: ['200mg'],
    frequencies: ['Weekly', 'Twice weekly'],
    defaultFrequency: 'Weekly',
  },
  'Skinny Shot (MIC-B12)': {
    canonicalName: 'Skinny Shot',
    category: 'injection',
    strength: 'MIC-B12 blend',
    form: 'Solution',
    route: 'Intramuscular',
    doses: ['1ml'],
    frequencies: ['Weekly', 'Twice weekly'],
    defaultFrequency: 'Weekly',
  },
  'Toradol': {
    canonicalName: 'Toradol',
    category: 'injection',
    strength: '30mg/ml',
    form: 'Solution',
    route: 'Intramuscular',
    doses: ['15mg', '30mg', '60mg'],
    frequencies: ['As needed', '1x daily for 2 days', '1x daily for 3 days'],
    defaultFrequency: 'As needed',
  },
  'Vitamin D3': {
    canonicalName: 'Vitamin D3',
    category: 'injection',
    strength: '50,000 IU/ml',
    form: 'Solution',
    route: 'Intramuscular',
    doses: ['50,000 IU'],
    frequencies: ['Monthly'],
    defaultFrequency: 'Monthly',
  },

  // ── Prescriptions ────────────────────────────────────────────────────────
  'Cyclobenzaprine': {
    canonicalName: 'Cyclobenzaprine',
    category: 'prescription',
    strength: '5mg',
    form: 'Tablet',
    route: 'Oral',
    doses: ['5mg', '10mg'],
    frequencies: ['Every 8 hours as needed', 'Every 6 hours as needed', 'Nightly as needed'],
    defaultFrequency: 'Every 8 hours as needed',
  },
  'Elevate T (Enclomiphene/Anastrozole)': {
    canonicalName: 'Elevate T (Enclomiphene/Anastrozole)',
    category: 'prescription',
    strength: '12.5mg/0.1mg',
    form: 'Tablet',
    route: 'Oral',
    doses: ['12.5/0.1mg'],
    frequencies: ['5 days on / 2 days off', 'Daily'],
    defaultFrequency: '5 days on / 2 days off',
  },
  'Meloxicam': {
    canonicalName: 'Meloxicam',
    category: 'prescription',
    strength: '15mg',
    form: 'Tablet',
    route: 'Oral',
    doses: ['7.5mg', '15mg'],
    frequencies: ['Daily as needed', 'Daily'],
    defaultFrequency: 'Daily as needed',
  },
  'Tadalafil': {
    canonicalName: 'Tadalafil',
    category: 'prescription',
    strength: '20mg',
    form: 'Tablet',
    route: 'Oral',
    doses: ['2.5mg', '5mg', '10mg', '20mg'],
    frequencies: ['As needed', 'Daily'],
    defaultFrequency: 'As needed',
  },
};

// ── Category labels for the modal dropdown ──────────────────────────────
export const MEDICATION_CATEGORIES = [
  { value: 'hrt', label: 'Hormone Replacement Therapy' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'peptide', label: 'Peptides' },
  { value: 'injection', label: 'Injections' },
  { value: 'prescription', label: 'Prescriptions' },
];

// Resolve a medication's dose list — config can either embed `doses` directly
// or reference one of the existing dose registries via `dosesKey`.
export function resolveDoseList(meta) {
  if (!meta) return [];
  if (Array.isArray(meta.doses)) return meta.doses.map(d => typeof d === 'string' ? { value: d, label: d } : d);
  if (!meta.dosesKey) return [];
  // Lazy resolve from this module's exported registries
  if (meta.dosesKey === 'TESTOSTERONE_DOSES.male') return TESTOSTERONE_DOSES.male;
  if (meta.dosesKey === 'TESTOSTERONE_DOSES.female') return TESTOSTERONE_DOSES.female;
  if (meta.dosesKey === 'HRT_SECONDARY_DOSAGES.HCG') return HRT_SECONDARY_DOSAGES.HCG.doses.map(d => ({ value: d, label: d }));
  if (meta.dosesKey === 'HRT_SECONDARY_DOSAGES.Gonadorelin') return HRT_SECONDARY_DOSAGES.Gonadorelin.doses.map(d => ({ value: d, label: d }));
  if (meta.dosesKey === 'HRT_SECONDARY_DOSAGES.Nandrolone') return HRT_SECONDARY_DOSAGES.Nandrolone.doses.map(d => ({ value: d, label: d }));
  if (meta.dosesKey === 'WEIGHT_LOSS_DOSAGES.Semaglutide') return WEIGHT_LOSS_DOSAGES.Semaglutide.map(d => ({ value: d, label: d }));
  if (meta.dosesKey === 'WEIGHT_LOSS_DOSAGES.Tirzepatide') return WEIGHT_LOSS_DOSAGES.Tirzepatide.map(d => ({ value: d, label: d }));
  if (meta.dosesKey === 'WEIGHT_LOSS_DOSAGES.Retatrutide') return WEIGHT_LOSS_DOSAGES.Retatrutide.map(d => ({ value: d, label: d }));
  return [];
}

// Filter MEDICATION_DEFAULTS by category and (for HRT) gender. Returns array of
// { key, ...meta } entries suitable for the modal dropdown.
export function getMedicationsByCategory(category, gender) {
  const items = [];
  for (const [key, meta] of Object.entries(MEDICATION_DEFAULTS)) {
    if (meta.category !== category) continue;
    if (category === 'hrt' && gender && meta.gender !== 'all' && meta.gender !== gender) continue;
    items.push({ key, ...meta });
  }
  return items;
}

// Weight loss sig has a fixed format the clinic prefers:
// "Administer 0.25mg subcutaneously one time weekly"
// Returns null when dose is missing so callers can fall through to defaults.
export function buildWeightLossSig(dose) {
  const cleaned = (dose || '').trim();
  if (!cleaned) return null;
  return `Administer ${cleaned} subcutaneously one time weekly`;
}

// Peptide sig has a fixed format the clinic prefers:
// "Administer 1 Prefilled Syringe Daily" (or whatever the frequency is)
// Returns null when frequency is missing so callers can fall through.
export function buildPeptideSig(frequency) {
  const freq = (frequency || '').trim();
  if (!freq) return null;
  return `Administer 1 Prefilled Syringe ${freq}`;
}

// Build a sig string from the building blocks. Mirrors the format the
// patient page already auto-generates for HRT injectables:
// "Administer 0.25ml (50mg) Intramuscularly every 3.5 days"
export function buildSig({ dose, route, frequency, form }) {
  if (!dose && !frequency) return '';
  const routeAdverb = (
    route === 'Intramuscular' ? 'Intramuscularly' :
    route === 'Subcutaneous' ? 'Subcutaneously' :
    route === 'Oral' ? 'by mouth' :
    route === 'Transdermal' ? 'topically' :
    null
  );

  // Injectable dose like "0.25ml/50mg" → "0.25ml (50mg)"
  const injMatch = (dose || '').match(/^([\d.]+ml)\/([\d.]+(?:\.\d+)?(?:mg|mcg|IU))$/i);
  if (injMatch && routeAdverb) {
    const freqText = (frequency || '').toLowerCase().replace(/^every /, 'every ');
    return `Administer ${injMatch[1]} (${injMatch[2]}) ${routeAdverb} ${freqText}.`.replace(/\s+\./, '.');
  }

  // Oral / patch / generic
  if (form === 'Tablet' || form === 'Capsule' || route === 'Oral') {
    return `Take ${dose} ${form ? form.toLowerCase() : ''} by mouth ${frequency ? frequency.toLowerCase() : ''}.`.replace(/\s+/g, ' ').replace(/\s+\./, '.').trim();
  }

  if (form === 'Patch') {
    return `Apply one ${dose} patch ${frequency ? frequency.toLowerCase() : ''}.`.replace(/\s+\./, '.');
  }

  // Fallback
  const parts = [];
  if (dose) parts.push(dose);
  if (routeAdverb) parts.push(routeAdverb);
  if (frequency) parts.push(frequency.toLowerCase());
  return parts.join(' ').trim();
}

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
  { value: 'prefilled', label: 'Pre-filled' },
  { value: 'vial_5ml', label: 'Vial 5ml' },
  { value: 'vial_10ml', label: 'Vial 10ml' }
];

// ================================================================
// PEPTIDE SUPPLY FORMATS - Vial vs Pre-filled
// ================================================================
export const PEPTIDE_SUPPLY_FORMATS = [
  { value: 'vial', label: 'Vial (patient reconstitutes)' },
  { value: 'prefilled_7d', label: 'Pre-filled 7 Day' },
  { value: 'prefilled_10d', label: 'Pre-filled 10 Day' },
  { value: 'prefilled_14d', label: 'Pre-filled 14 Day' },
  { value: 'prefilled_20d', label: 'Pre-filled 20 Day' },
  { value: 'prefilled_30d', label: 'Pre-filled 30 Day' },
];

// ================================================================
// FREQUENCY OPTIONS - Comprehensive
// ================================================================
export const FREQUENCY_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: '7 days a week', label: '7 days a week' },
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
// Core protocol statuses (used by most protocol types)
export const PROTOCOL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' }
];

// Lab pipeline statuses (used by lab-type protocols)
export const LAB_PIPELINE_STATUSES = [
  { value: 'queued', label: 'Queued' },
  { value: 'ready_to_schedule', label: 'Ready to Schedule' },
  { value: 'draw_scheduled', label: 'Draw Scheduled' },
  { value: 'awaiting_results', label: 'Awaiting Results' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'in_treatment', label: 'In Treatment' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'consult_scheduled', label: 'Consult Scheduled' },
  { value: 'merged', label: 'Merged' }
];

// All valid protocol statuses (matches DB CHECK constraint)
export const ALL_PROTOCOL_STATUSES = [...PROTOCOL_STATUS_OPTIONS, ...LAB_PIPELINE_STATUSES];

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
  injection: { bg: '#fef3c7', text: '#92400e', label: 'Range Injection' },
  prescription: { bg: '#cffafe', text: '#0e7490', label: 'Rx' },
  labs: { bg: '#fdf2f8', text: '#9d174d', label: 'Labs' },
  phlebotomy: { bg: '#fce7f3', text: '#be185d', label: 'Phlebotomy' },
  medication_pickup: { bg: '#ecfdf5', text: '#047857', label: 'Pickup' },
  other: { bg: '#f3f4f6', text: '#374151', label: 'Other' }
};

// ================================================================
// IV THERAPY TYPES (legacy flat list — kept for back-compat)
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
// RANGE IV MENU — four signature drips, all $225
// Used by checkout modal for conditional price lookup.
// ================================================================
export const RANGE_IV_OPTIONS = [
  { value: 'Range IV — Signature',          label: 'Signature',                 price_cents: 22500 },
  { value: 'Range IV — Immune Defense',     label: 'Immune Defense',            price_cents: 22500 },
  { value: 'Range IV — Energy & Vitality',  label: 'Energy & Vitality',         price_cents: 22500 },
  { value: 'Range IV — Muscle Recovery',    label: 'Muscle Recovery',           price_cents: 22500 },
  { value: 'Range IV — Detox & Cellular',   label: 'Detox & Cellular Repair',   price_cents: 22500 },
];

// ================================================================
// SPECIALTY IV MENU — dose-based pricing
// ================================================================
export const SPECIALTY_IV_OPTIONS = [
  {
    value: 'NAD+',
    label: 'NAD+ IV',
    doses: [
      { value: '225mg',  label: '225mg',  price_cents: 37500 },
      { value: '500mg',  label: '500mg',  price_cents: 52500 },
      { value: '750mg',  label: '750mg',  price_cents: 65000 },
      { value: '1000mg', label: '1000mg', price_cents: 77500 },
    ],
  },
  {
    value: 'Vitamin C',
    label: 'Vitamin C IV',
    doses: [
      { value: '25g', label: '25g', price_cents: 21500 },
      { value: '50g', label: '50g', price_cents: 25500 },
      { value: '75g', label: '75g', price_cents: 33000 },
    ],
  },
  {
    value: 'Glutathione',
    label: 'Glutathione IV',
    doses: [
      { value: '1g', label: '1g', price_cents: 17000 },
      { value: '2g', label: '2g', price_cents: 19000 },
      { value: '3g', label: '3g', price_cents: 21500 },
    ],
  },
  {
    value: 'Methylene Blue',
    label: 'Methylene Blue IV',
    doses: [
      { value: 'Standard', label: 'Standard', price_cents: 45000 },
    ],
  },
  {
    value: 'MB + Vit C + Mag',
    label: 'MB + Vit C + Mag Combo',
    doses: [
      { value: 'Combo', label: 'Combo', price_cents: 75000 },
    ],
  },
];

// ================================================================
// HBOT VOLUME PRICING — per-session cents by pack size
// qty === 5 triggers 5-pack rate, qty === 10 triggers 10-pack rate.
// Any other qty uses the single-session rate.
// ================================================================
export const HBOT_VOLUME_PRICING = [
  { qty: 1,  per_session_cents: 18500, total_cents: 18500,  label: 'Single Session' },
  { qty: 5,  per_session_cents: 17000, total_cents: 85000,  label: '5-Pack' },
  { qty: 10, per_session_cents: 16000, total_cents: 160000, label: '10-Pack' },
];

// ================================================================
// RED LIGHT VOLUME PRICING
// ================================================================
export const RLT_VOLUME_PRICING = [
  { qty: 1,  per_session_cents: 8500, total_cents: 8500,  label: 'Single Session' },
  { qty: 5,  per_session_cents: 7500, total_cents: 37500, label: '5-Pack' },
  { qty: 10, per_session_cents: 6000, total_cents: 60000, label: '10-Pack' },
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
    vialId: 'bpc157_tb4',
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
      /bpc.*157.*tb/i, /bpc-157\/tb4/i,
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
    vialId: 'recovery_4blend',
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
    vialId: 'klow',
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
    guideSlug: '/bdnf-guide',
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
    vialId: 'motsc',
    deliveryOptions: ['in_clinic', 'take_home'],
    // Allow custom injection counts (1..N per phase+duration). Price scales
    // linearly from the phase package price.
    allowCustomCount: true,
    durations: [
      { days: 20, label: '20 Day', price: 500 },
      { days: 30, label: '30 Day', price: 500 },
    ],
    phases: [
      {
        phase: 1, label: 'Phase 1 (20mg total)',
        doses: { 20: '5mg', 30: '1mg' },           // dose per injection by duration
        frequencies: { 20: 'Every 5 days', 30: '5 on / 2 off' },
        injections: { 20: 4, 30: 20 },
        price: 500,
      },
      {
        phase: 2, label: 'Phase 2 (40mg total)',
        doses: { 20: '10mg', 30: '2mg' },
        frequencies: { 20: 'Every 5 days', 30: '5 on / 2 off' },
        injections: { 20: 4, 30: 20 },
        price: 800,
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
    vialId: 'ghk_cu',
    durations: [
      { days: 30, label: '30 Day', price: 400 },
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
    vialId: 'glow',
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
    vialId: 'gh_2x',
    deliveryOptions: ['take_home'],
    durations: [
      { days: 30, label: '30 Day' },
    ],
    totalInjections: 20,
    phases: [
      { phase: 1, label: 'Phase 1', dose: '500mcg / 500mcg', price: 400 },
      { phase: 2, label: 'Phase 2', dose: '1mg / 1mg', price: 450 },
      { phase: 3, label: 'Phase 3', dose: '1.5mg / 1.5mg', price: 500 },
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
    vialId: 'gh_2x_tesa',
    deliveryOptions: ['take_home'],
    durations: [
      { days: 30, label: '30 Day' },
    ],
    totalInjections: 20,
    phases: [
      { phase: 1, label: 'Phase 1', dose: '500mcg / 500mcg', price: 400 },
      { phase: 2, label: 'Phase 2', dose: '1mg / 1mg', price: 450 },
      { phase: 3, label: 'Phase 3', dose: '1.5mg / 1.5mg', price: 500 },
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
    vialId: 'gh_3x',
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
      /tesa.*mgf.*ipa/i, /tesa.*ipa.*mgf/i, /mgf.*tesa.*ipa/i,
    ],
  },

  // ── 4X Blend: GHRP-2 / Tesamorelin / MGF / Ipamorelin (GH) ───
  {
    category: 'gh_blend',
    medication: '4X Blend: GHRP-2 / Tesa / MGF / Ipa',
    defaultFrequency: '5 on / 2 off',
    guideSlug: '/4x-blend-guide',
    vialId: 'gh_4x',
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
    vialId: 'nad_1000',
    durations: [
      { days: 30, label: '30 Day', price: 600 },
      { days: 84, label: '12 Week', price: 1500 },
    ],
    matchPatterns: [
      /^nad\+?\s*100/i, /nad.*100\s*mg/i, /nad\+?\s*12\s*week/i,
      /nad\+?\s*protocol/i,
    ],
  },

  // ── NAD+ 50mg (Longevity / Cellular Health) ──────────────────────
  {
    category: 'longevity',
    medication: 'NAD+ 50mg',
    dose: '50mg',
    defaultFrequency: 'Daily',
    frequencyOptions: ['Daily', '5 on / 2 off'],
    deliveryOptions: ['in_clinic', 'take_home'],
    guideSlug: '/nad-guide',
    vialId: 'nad_1000',
    durations: [
      { days: 30, label: '30 Day', price: 600 },
    ],
    totalInjections: 30,
    matchPatterns: [
      /^nad\+?\s*50/i, /nad.*50\s*mg/i,
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
    guideSlug: '/aod-9604-guide',
    vialId: 'aod9604',
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
    guideSlug: '/dsip-guide',
    vialId: 'dsip',
    durations: [
      { days: 30, label: '30 Day', price: 200 },
    ],
    matchPatterns: [
      /^dsip/i, /dsip.*protocol/i,
    ],
  },

  // ── IGF-LR3 (Growth Hormone) ─────────────────────────────────────
  {
    category: 'gh_blend',
    medication: 'IGF-1 LR3',
    dose: '100mcg',
    defaultFrequency: '5 on / 2 off',
    frequencyOptions: ['5 on / 2 off', 'Daily'],
    deliveryOptions: ['take_home'],
    guideSlug: '/igf1-lr3-guide',
    durations: [
      { days: 7, label: '7 Day', price: 200 },
    ],
    matchPatterns: [
      /^igf/i, /igf.*lr3/i, /igf-?1?\s*lr3/i,
    ],
  },

  // ── 5-Amino-1MQ / SLUPP (Oral Tablet Blend) ─────────────────────
  {
    category: 'peptide',
    medication: '5-Amino-1MQ / SLUPP',
    dose: '50mg / 1mg',
    defaultFrequency: 'Daily',
    frequencyOptions: ['Daily'],
    deliveryOptions: ['in_clinic', 'take_home'],
    guideSlug: '/slupp-guide',
    durations: [
      { days: 30, label: '30 Day', price: 197 },
    ],
    totalDays: 30,
    matchPatterns: [
      /5-?amino-?1mq/i, /slupp/i, /5.*amino.*1mq/i,
      /amino.*1mq.*slupp/i, /slupp.*1mg/i,
    ],
  },

  // ── SS-31 / Elamipretide (Mitochondrial) ─────────────────────────
  {
    category: 'longevity',
    medication: 'SS-31 (Elamipretide)',
    dose: '1mg',
    defaultFrequency: 'Daily',
    frequencyOptions: ['Daily'],
    deliveryOptions: ['take_home'],
    guideSlug: '/ss31-guide',
    vialId: 'ss31',
    durations: [
      { days: 50, label: '50 Day (1mg/day)', price: 500 },
      { days: 25, label: '25 Day (2mg/day)', price: 500 },
    ],
    matchPatterns: [
      /^ss-?31/i, /elamipretide/i, /ss.*31.*protocol/i,
    ],
  },

  // ── Semax (Nootropic / Cognitive) ────────────────────────────────
  {
    category: 'peptide',
    medication: 'Semax',
    dose: '500mcg–1mg',
    defaultFrequency: 'Daily',
    frequencyOptions: ['Daily'],
    deliveryOptions: ['in_clinic', 'take_home'],
    guideSlug: '/semax-guide',
    vialId: 'semax',
    durations: [
      { days: 30, label: '30 Day', price: 295 },
    ],
    matchPatterns: [
      /^semax/i, /semax.*protocol/i, /semax.*30/i,
    ],
  },
];

// Patient-facing program names (hide specific peptide identity on cart/receipts).
// Map by PEPTIDE_PRODUCT_CATALOG category → program name.
export const PEPTIDE_PROGRAM_NAMES = {
  recovery:  'Injury & Recovery Program',
  gh_blend:  'Energy & Optimization Program',
  longevity: 'Energy & Optimization Program',
  skin:      'Energy & Optimization Program',
  peptide:   'Energy & Optimization Program',
};

export const getPeptideProgramName = (category) =>
  PEPTIDE_PROGRAM_NAMES[category] || 'Energy & Optimization Program';

// Helper: find catalog entry by Stripe product name or peptide identifier
export const findPeptideProduct = (productName) => {
  if (!productName) return null;
  const lower = productName.toLowerCase();

  // 1. Exact medication match wins — protects named blends (GLOW / KLOW / Recovery
  //    4-Blend) whose medication strings contain BPC-157/TB-4 as components and
  //    would otherwise be swallowed by the broader BPC-157/TB4 patterns below.
  for (const product of PEPTIDE_PRODUCT_CATALOG) {
    if (product.medication && product.medication.toLowerCase() === lower) return product;
  }

  // 2. Named-blend prefix match (pre-pattern guard) — if the input starts with a
  //    distinctive blend name, return that blend before falling into fuzzy
  //    component matching. Keeps the guide/vial resolver stable even as
  //    medication strings gain/lose component lists.
  const blendPrefixes = [
    { prefix: /^glow\b/, slug: '/glow-guide' },
    { prefix: /^klow\b/, slug: '/klow-guide' },
    { prefix: /^recovery\s*4-?blend\b/, slug: '/recovery-blend-guide' },
  ];
  for (const { prefix, slug } of blendPrefixes) {
    if (prefix.test(lower)) {
      const match = PEPTIDE_PRODUCT_CATALOG.find(p => p.guideSlug === slug);
      if (match) return match;
    }
  }

  // 3. Pattern match — iterate catalog in order, first match wins
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

// Map a protocol medication to a vial catalog ID (from lib/vial-catalog.js)
export const getVialIdForMedication = (medication, programName) => {
  const product = findPeptideProduct(medication) || findPeptideProduct(programName);
  if (product?.vialId) return product.vialId;

  // Fallback matching
  const text = `${medication || ''} ${programName || ''}`.toLowerCase();
  if (text.includes('mots')) return 'motsc';
  if (text.includes('hcg') || text.includes('chorionic')) return 'hcg';
  if (text.includes('ghk') && text.includes('cu')) return 'ghk_cu';
  if (text.includes('nad')) return 'nad_1000';
  if (text.includes('aod')) return 'aod9604';
  if (text.includes('dsip')) return 'dsip';
  if (text.includes('4x') && text.includes('blend')) return 'gh_4x';
  if (text.includes('3x') && text.includes('blend')) return 'gh_3x';
  // 4X by compound names: GHRP + Tesa + MGF + Ipa (check before 3X/2X)
  if (text.includes('ghrp') && text.includes('tesa') && text.includes('mgf')) return 'gh_4x';
  // 3X by compound names: Tesa + MGF + Ipa (check before 2X since 2X also has tesa+ipa)
  if (text.includes('tesa') && text.includes('mgf') && text.includes('ipa')) return 'gh_3x';
  if (text.includes('tesa') && text.includes('mgf')) return 'gh_3x';
  // 2X: CJC/Ipa or Tesa/Ipa (without MGF)
  if (text.includes('cjc') && text.includes('ipa')) return 'gh_2x';
  if (text.includes('tesa') && text.includes('ipa')) return 'gh_2x';
  if (text.includes('epithalon')) return 'epithalon';
  if (text.includes('ss-31') || text.includes('elamipretide')) return 'ss31';
  if (text.includes('follistatin')) return 'follistatin';
  if (text.includes('selank')) return 'selank';
  if (text.includes('semax')) return 'semax';
  if (text.includes('ta1') || text.includes('thymosin alpha')) return 'ta1';
  if (text.includes('pt-141') || text.includes('pt141') || text.includes('bremelanotide')) return 'pt141';
  if ((text.includes('kpv') || text.includes('mgf')) && (text.includes('bpc') || text.includes('tb'))) return 'recovery_4blend';
  if (text.includes('bpc') || text.includes('tb4') || text.includes('tb-4') || text.includes('thymosin beta')) return 'bpc157_tb4';
  return null;
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
  { id: 'awaiting_results', label: 'Awaiting Results', color: '#f59e0b', icon: '🩸', owner: 'Primex' },
  { id: 'uploaded', label: 'Uploaded', color: '#8b5cf6', icon: '📋', owner: 'Chris / Evan' },
  { id: 'under_review', label: 'Under Review', color: '#3b82f6', icon: '👨‍⚕️', owner: 'Damien / Evan' },
  { id: 'ready_to_schedule', label: 'Ready to Schedule', color: '#f97316', icon: '📅', owner: 'Tara' },
  { id: 'consult_scheduled', label: 'Consult Booked', color: '#6366f1', icon: '🗓️' },
  { id: 'in_treatment', label: 'In Treatment', color: '#10b981', icon: '✅' }
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

// Program type groups — use these instead of hardcoding arrays in API queries
// Core peptide types used in most queries
export const PEPTIDE_PROGRAM_TYPES = ['peptide', 'gh_peptide', 'peptide_vial'];
// Extended list including legacy program names (for dashboards/stats that need to catch everything)
export const PEPTIDE_PROGRAM_TYPES_ALL = ['peptide', 'gh_peptide', 'peptide_vial', 'recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'injection_clinic', 'jumpstart_10day', 'recovery_10day', 'month_30day'];
export const HRT_PROGRAM_TYPES = ['hrt', 'hrt_male', 'hrt_female'];
export const WEIGHT_LOSS_PROGRAM_TYPES = ['weight_loss', 'weight_loss_program', 'weight_loss_injection'];
export const BODY_THERAPY_TYPES = ['hbot', 'rlt', 'iv', 'injection', 'iv_therapy', 'red_light', 'injection_pack'];
export const IV_PROGRAM_TYPES = ['iv', 'iv_therapy', 'iv_sessions'];

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

/**
 * Check if a program_type or category is a peptide type.
 * Matches: 'peptide', 'gh_peptide', 'peptide_vial', etc.
 */
export function isPeptideType(type) {
  if (!type) return false;
  const t = type.toLowerCase();
  return PEPTIDE_PROGRAM_TYPES.includes(t) || t.includes('peptide');
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
