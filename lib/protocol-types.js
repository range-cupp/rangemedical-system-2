// /lib/protocol-types.js
// Single source of truth for protocol type configurations
// Used by: purchases page (create), protocol detail (edit), anywhere protocols are created
// Range Medical

export const PROTOCOL_TYPES = {
  peptide: {
    name: 'Recovery Peptide',
    category: 'Peptide',
    programTypes: ['recovery_jumpstart_10day', 'month_program_30day', 'maintenance_4week', 'peptide'],
    medications: [
      'BPC-157 / Thymosin Beta-4',
      'BPC-157',
      'Thymosin Beta-4',
      'Wolverine Blend (BPC-157/TB500)',
      'KPV',
      'GHK-Cu',
    ],
    dosages: ['500mcg / 500mcg', '500mcg', '250mcg', '100mcg', '200mcg', '1mg', '2mg'],
    frequencies: [
      { value: 'daily', label: 'Daily' },
      { value: '2x_daily', label: 'Twice Daily' },
    ],
    durations: [
      { value: 7, label: '7 days' },
      { value: 10, label: '10 days' },
      { value: 14, label: '14 days' },
      { value: 20, label: '20 days' },
      { value: 30, label: '30 days' },
    ],
  },
  gh_peptide: {
    name: 'GH Peptide',
    category: 'Peptide',
    programTypes: ['gh_peptide'],
    medications: [
      'Tesamorelin / Ipamorelin',
      'Ipamorelin / CJC-1295',
      'Tesamorelin',
      'Ipamorelin',
      'CJC-1295',
      'Sermorelin',
      'MK-677 (Ibutamoren)',
    ],
    dosages: ['300mcg / 300mcg', '300mcg', '200mcg', '100mcg', '500mcg'],
    frequencies: [
      { value: 'daily', label: 'Daily' },
      { value: '5on2off', label: '5 days on / 2 off' },
    ],
    durations: [
      { value: 30, label: '30 days' },
      { value: 60, label: '60 days' },
      { value: 90, label: '90 days' },
    ],
  },
  peptide_vial: {
    name: 'Peptide Vial',
    category: 'Peptide',
    programTypes: ['peptide_vial', 'peptide'],
    medications: [
      'NAD+ 1000mg',
      'BPC-157 / Thymosin Beta-4',
      'MOTS-c',
      'Tesamorelin / Ipamorelin',
      'CJC-1295 / Ipamorelin',
      'AOD-9604',
      'GLOW (GHK-Cu / Thymosin Beta-4)',
    ],
    frequencies: [
      { value: 'daily', label: 'Daily' },
      { value: '5on2off', label: '5 days on / 2 off' },
      { value: 'eod', label: 'Every other day' },
    ],
    vialBased: true,
    defaultDosesPerVial: 10,
    vialOptions: [1, 2, 3, 4],
  },
  hrt_male: {
    name: 'Male HRT',
    category: 'HRT',
    programTypes: ['hrt_male_membership', 'hrt_male'],
    medications: ['Testosterone Cypionate 200mg/ml'],
    dosages: [
      { value: '0.2ml/40mg', label: '0.2ml (40mg)' },
      { value: '0.25ml/50mg', label: '0.25ml (50mg)' },
      { value: '0.3ml/60mg', label: '0.3ml (60mg)' },
      { value: '0.35ml/70mg', label: '0.35ml (70mg)' },
      { value: '0.4ml/80mg', label: '0.4ml (80mg)' },
      { value: '0.45ml/90mg', label: '0.45ml (90mg)' },
      { value: '0.5ml/100mg', label: '0.5ml (100mg)' },
      { value: '0.6ml/120mg', label: '0.6ml (120mg)' },
      { value: '0.7ml/140mg', label: '0.7ml (140mg)' },
      { value: '0.75ml/150mg', label: '0.75ml (150mg)' },
      { value: '0.8ml/160mg', label: '0.8ml (160mg)' },
      { value: '1.0ml/200mg', label: '1.0ml (200mg)' },
      { value: 'custom', label: 'Custom dose' },
    ],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    deliveryMethods: [
      { value: 'in_clinic', label: 'In Clinic' },
      { value: 'prefilled_1', label: 'Pre-filled — 1 injection' },
      { value: 'prefilled_2', label: 'Pre-filled — 2 injections' },
      { value: 'prefilled_4', label: 'Pre-filled — 4 injections' },
      { value: 'prefilled_5', label: 'Pre-filled — 5 injections' },
      { value: 'prefilled_6', label: 'Pre-filled — 6 injections' },
      { value: 'prefilled_7', label: 'Pre-filled — 7 injections' },
      { value: 'prefilled_8', label: 'Pre-filled — 8 injections (1 month)' },
      { value: 'vial_5ml', label: 'Vial — 5ml' },
      { value: 'vial_10ml', label: 'Vial — 10ml' },
    ],
    ongoing: true,
  },
  hrt_female: {
    name: 'Female HRT',
    category: 'HRT',
    programTypes: ['hrt_female_membership', 'hrt_female'],
    medications: ['Testosterone Cypionate 100mg/ml'],
    dosages: [
      { value: '0.1ml/10mg', label: '0.1ml (10mg)' },
      { value: '0.15ml/15mg', label: '0.15ml (15mg)' },
      { value: '0.2ml/20mg', label: '0.2ml (20mg)' },
      { value: '0.25ml/25mg', label: '0.25ml (25mg)' },
      { value: '0.3ml/30mg', label: '0.3ml (30mg)' },
      { value: '0.4ml/40mg', label: '0.4ml (40mg)' },
      { value: '0.5ml/50mg', label: '0.5ml (50mg)' },
      { value: '0.6ml/60mg', label: '0.6ml (60mg)' },
      { value: '0.7ml/70mg', label: '0.7ml (70mg)' },
      { value: '0.8ml/80mg', label: '0.8ml (80mg)' },
      { value: '1.0ml/100mg', label: '1.0ml (100mg)' },
      { value: 'custom', label: 'Custom dose' },
    ],
    frequencies: [{ value: '2x_weekly', label: '2x per week' }],
    deliveryMethods: [
      { value: 'in_clinic', label: 'In Clinic' },
      { value: 'prefilled_1', label: 'Pre-filled — 1 injection' },
      { value: 'prefilled_2', label: 'Pre-filled — 2 injections' },
      { value: 'prefilled_4', label: 'Pre-filled — 4 injections' },
      { value: 'prefilled_5', label: 'Pre-filled — 5 injections' },
      { value: 'prefilled_6', label: 'Pre-filled — 6 injections' },
      { value: 'prefilled_7', label: 'Pre-filled — 7 injections' },
      { value: 'prefilled_8', label: 'Pre-filled — 8 injections (1 month)' },
      { value: 'vial_5ml', label: 'Vial — 5ml' },
      { value: 'vial_10ml', label: 'Vial — 10ml' },
    ],
    ongoing: true,
  },
  weight_loss_semaglutide: {
    name: 'Semaglutide',
    category: 'Weight Loss',
    programTypes: ['weight_loss_program', 'weight_loss_semaglutide'],
    medications: ['Semaglutide'],
    dosages: ['0.25mg', '0.5mg', '1.0mg', '1.7mg', '2.4mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    injections: [
      { value: 1, label: '1 injection' },
      { value: 2, label: '2 injections' },
      { value: 3, label: '3 injections' },
      { value: 4, label: '4 injections (1 month)' },
      { value: 8, label: '8 injections (2 months)' },
      { value: 12, label: '12 injections (3 months)' },
    ],
  },
  weight_loss_tirzepatide: {
    name: 'Tirzepatide',
    category: 'Weight Loss',
    programTypes: ['weight_loss_tirzepatide'],
    medications: ['Tirzepatide'],
    dosages: ['0.25mg', '0.5mg', '0.75mg', '1mg', '1.25mg', '1.5mg', '1.75mg', '2mg', '2.25mg', '2.5mg', '2.75mg', '3mg', '3.25mg', '3.5mg', '3.75mg', '4mg', '4.25mg', '4.5mg', '4.75mg', '5mg', '5.25mg', '5.5mg', '5.75mg', '6mg', '6.25mg', '6.5mg', '6.75mg', '7mg', '7.25mg', '7.5mg', '7.75mg', '8mg', '8.25mg', '8.5mg', '8.75mg', '9mg', '9.25mg', '9.5mg', '9.75mg', '10mg', '10.25mg', '10.5mg', '10.75mg', '11mg', '11.25mg', '11.5mg', '11.75mg', '12mg', '12.25mg', '12.5mg', '12.75mg', '13mg', '13.25mg', '13.5mg', '13.75mg', '14mg', '14.25mg', '14.5mg', '14.75mg', '15mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    injections: [
      { value: 1, label: '1 injection' },
      { value: 2, label: '2 injections' },
      { value: 3, label: '3 injections' },
      { value: 4, label: '4 injections (1 month)' },
      { value: 8, label: '8 injections (2 months)' },
      { value: 12, label: '12 injections (3 months)' },
    ],
  },
  weight_loss_retatrutide: {
    name: 'Retatrutide',
    category: 'Weight Loss',
    programTypes: ['weight_loss_retatrutide'],
    medications: ['Retatrutide'],
    dosages: ['0.25mg', '0.5mg', '0.75mg', '1mg', '1.25mg', '1.5mg', '1.75mg', '2mg', '2.25mg', '2.5mg', '2.75mg', '3mg', '3.25mg', '3.5mg', '3.75mg', '4mg', '4.25mg', '4.5mg', '4.75mg', '5mg', '5.25mg', '5.5mg', '5.75mg', '6mg', '6.25mg', '6.5mg', '6.75mg', '7mg', '7.25mg', '7.5mg', '7.75mg', '8mg', '8.25mg', '8.5mg', '8.75mg', '9mg', '9.25mg', '9.5mg', '9.75mg', '10mg', '10.25mg', '10.5mg', '10.75mg', '11mg', '11.25mg', '11.5mg', '11.75mg', '12mg', '12.25mg', '12.5mg', '12.75mg', '13mg', '13.25mg', '13.5mg', '13.75mg', '14mg', '14.25mg', '14.5mg', '14.75mg', '15mg'],
    frequencies: [{ value: 'weekly', label: 'Once per week' }],
    injections: [
      { value: 1, label: '1 injection' },
      { value: 2, label: '2 injections' },
      { value: 3, label: '3 injections' },
      { value: 4, label: '4 injections (1 month)' },
      { value: 8, label: '8 injections (2 months)' },
      { value: 12, label: '12 injections (3 months)' },
    ],
  },
  single_injection: {
    name: 'Single Injection',
    category: 'Injection',
    programTypes: ['single_injection'],
    medications: ['Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3', 'NAC', 'BCAA', 'L-Carnitine', 'Glutathione', 'NAD+'],
    injections: [1],
    frequencies: [{ value: 'single', label: 'Single injection' }],
    hasDosageNotes: true,
  },
  injection_pack: {
    name: 'Injection Pack',
    category: 'Injection',
    programTypes: ['injection_pack', 'injection'],
    medications: ['Amino Blend', 'B12', 'B-Complex', 'Biotin', 'Vitamin D3', 'NAC', 'BCAA', 'L-Carnitine', 'Glutathione', 'NAD+'],
    injections: [5, 10, 12, 20, 24],
    frequencies: [
      { value: '1x_weekly', label: '1x per week' },
      { value: '2x_weekly', label: '2x per week' },
      { value: '3x_weekly', label: '3x per week' },
      { value: '4x_weekly', label: '4x per week' },
      { value: '5x_weekly', label: '5x per week' },
      { value: '6x_weekly', label: '6x per week' },
      { value: '7x_weekly', label: '7x per week' },
    ],
    hasDosageNotes: true,
  },
  red_light: {
    name: 'Red Light Therapy',
    category: 'Red Light',
    programTypes: ['red_light_sessions', 'red_light'],
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
  },
  hbot: {
    name: 'HBOT',
    category: 'Hyperbaric',
    programTypes: ['hbot_sessions', 'hbot'],
    sessions: [1, 5, 10, 20],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
  },
  iv_therapy: {
    name: 'IV Therapy',
    category: 'IV Therapy',
    programTypes: ['iv_therapy'],
    medications: [
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
      'Methylene Blue IV',
      'MB + Vit C + Mag Combo',
      'Exosome IV',
      'BYO IV',
      'Hydration IV',
    ],
    sessions: [1, 5, 10],
    frequencies: [{ value: 'per_session', label: 'Per session' }],
  },
};

// Map purchase categories to default protocol type
export const CATEGORY_TO_TYPE = {
  'Peptide': 'peptide',
  'HRT': 'hrt_male',
  'Weight Loss': 'weight_loss_semaglutide',
  'Red Light': 'red_light',
  'Hyperbaric': 'hbot',
  'IV Therapy': 'iv_therapy',
  'Injection': 'single_injection',
  'vials': 'peptide_vial',
};

// Detect protocol type from program_type and medication columns
export function detectProtocolType(programType, medication) {
  if (!programType) return 'peptide';
  const pt = programType.toLowerCase();
  const med = (medication || '').toLowerCase();

  // Weight loss by medication first
  if (pt.includes('weight_loss') || med.includes('semaglutide') || med.includes('tirzepatide') || med.includes('retatrutide')) {
    if (med.includes('tirzepatide')) return 'weight_loss_tirzepatide';
    if (med.includes('retatrutide')) return 'weight_loss_retatrutide';
    return 'weight_loss_semaglutide';
  }

  // HRT by gender hint
  if (pt.includes('hrt')) {
    if (pt.includes('female') || med.includes('100mg/ml')) return 'hrt_female';
    return 'hrt_male';
  }

  // Peptide vials
  if (pt.includes('peptide_vial') || pt.includes('vial')) {
    return 'peptide_vial';
  }

  // GH peptides
  if (pt.includes('gh_peptide') || ['tesamorelin', 'ipamorelin', 'cjc-1295', 'sermorelin', 'mk-677'].some(m => med.includes(m))) {
    return 'gh_peptide';
  }

  // Check programTypes arrays
  for (const [key, config] of Object.entries(PROTOCOL_TYPES)) {
    if (config.programTypes?.some(t => pt.includes(t.toLowerCase()))) {
      return key;
    }
  }

  return 'peptide';
}

// Map protocol type key to program_type DB value
export function getDBProgramType(protocolType, duration) {
  const map = {
    'peptide': 'peptide',
    'gh_peptide': 'gh_peptide',
    'peptide_vial': 'peptide',
    'hrt_male': 'hrt_male_membership',
    'hrt_female': 'hrt_female_membership',
    'weight_loss_semaglutide': 'weight_loss_program',
    'weight_loss_tirzepatide': 'weight_loss_tirzepatide',
    'weight_loss_retatrutide': 'weight_loss_retatrutide',
    'single_injection': 'single_injection',
    'injection_pack': 'injection_pack',
    'red_light': 'red_light_sessions',
    'hbot': 'hbot_sessions',
    'iv_therapy': 'iv_therapy',
  };
  return map[protocolType] || protocolType;
}

// Get display label for a delivery_method value
export function getDeliveryLabel(deliveryMethod, protocolType) {
  if (!deliveryMethod) return null;
  const config = PROTOCOL_TYPES[protocolType];
  if (config?.deliveryMethods) {
    const match = config.deliveryMethods.find(d => d.value === deliveryMethod);
    if (match) return match.label;
  }
  // Fallback labels
  if (deliveryMethod === 'take_home') return 'Take Home';
  if (deliveryMethod === 'in_clinic') return 'In Clinic';
  if (deliveryMethod === 'vial') return 'Vial';
  if (deliveryMethod.startsWith('prefilled_')) {
    const count = deliveryMethod.replace('prefilled_', '');
    return `Pre-filled — ${count} injection${count === '1' ? '' : 's'}`;
  }
  return deliveryMethod;
}
