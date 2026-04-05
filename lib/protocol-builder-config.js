// lib/protocol-builder-config.js
// Protocol Builder — catalog configuration
// Defines all items available in the drag-and-drop protocol builder

// ── Category definitions ────────────────────────────────────────────────────
export const BUILDER_CATEGORIES = [
  { id: 'membership', label: 'Memberships', color: '#7c3aed', desc: 'Ongoing programs' },
  { id: 'weight_loss', label: 'Weight Loss', color: '#2563eb', desc: 'GLP-1 medications' },
  { id: 'peptide_90', label: 'Peptide — 90 Day', color: '#059669', desc: '90-day peptide protocols' },
  { id: 'peptide_recovery', label: 'Recovery', color: '#10b981', desc: '10/20/30-day peptide recovery' },
  { id: 'addon', label: 'Add-Ons', color: '#d97706', desc: 'Universal enhancements' },
  { id: 'session', label: 'Sessions & Packs', color: '#6366f1', desc: 'HBOT, RLT, IV, PRP' },
  { id: 'lab', label: 'Labs', color: '#ec4899', desc: 'Lab panels' },
];

export function getCategoryColor(catId) {
  return BUILDER_CATEGORIES.find(c => c.id === catId)?.color || '#808080';
}

// ── Range IV formulas (shown as included value in HRT) ──────────────────────
export const RANGE_IV_FORMULAS = [
  { name: 'Immune Defense IV', nutrients: ['Vitamin C', 'Zinc', 'Glutathione', 'B-Complex', 'Magnesium'] },
  { name: 'Energy & Vitality IV', nutrients: ['B12', 'B-Complex', 'L-Carnitine', 'Magnesium', 'Vitamin C'] },
  { name: 'Muscle Recovery & Performance IV', nutrients: ['Amino Acids', 'Magnesium', 'B-Complex', 'Vitamin C', 'Glutathione'] },
  { name: 'Detox & Cellular Repair IV', nutrients: ['Glutathione', 'Vitamin C', 'NAC', 'Zinc', 'Magnesium'] },
];

// ── Builder items ───────────────────────────────────────────────────────────
// priceCents = monthly price (for recurring) or total price (for flat)
// billingType: 'monthly' = ongoing/subscription, 'program' = fixed duration billed monthly, 'flat' = one-time
// paymentOptions: which payment toggles to show
//   - monthly/quarterly/annual for memberships
//   - monthly/upfront for fixed programs
//   - none for flat-rate items

export const BUILDER_ITEMS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MEMBERSHIPS (ongoing)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'hrt-membership',
    name: 'HRT Membership',
    category: 'membership',
    description: 'Complete hormone replacement therapy',
    included: [
      'All hormone medications',
      'Monthly Range IV — choose from 4 signature formulas ($225 value)',
      'Follow-up labs at 8 weeks, then every 12 weeks',
      'Ongoing protocol adjustments',
      'Direct provider access',
    ],
    priceCents: 25000,
    billingType: 'monthly',
    duration: null,
    durationLabel: 'Ongoing',
    paymentOptions: { monthly: true, quarterly: { discount: 0.05 }, annual: { discount: 0.10 } },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WEIGHT LOSS (variable duration, monthly billing)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'wl-semaglutide',
    name: 'Semaglutide',
    category: 'weight_loss',
    description: 'GLP-1 receptor agonist',
    included: [
      'Weekly GLP-1 injection (in-clinic or take-home)',
      'Vitamin injection with each weight loss injection',
      'Monthly provider check-in',
      'Dose titration management',
    ],
    priceCents: 35000,
    billingType: 'program',
    duration: 6,
    durationLabel: '6 months (typical)',
    durationEditable: true,
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'wl-tirzepatide',
    name: 'Tirzepatide',
    category: 'weight_loss',
    description: 'Dual GIP/GLP-1 receptor agonist — most popular',
    included: [
      'Weekly GLP-1 injection (in-clinic or take-home)',
      'Vitamin injection with each weight loss injection',
      'Monthly provider check-in',
      'Dose titration management',
    ],
    priceCents: 39900,
    billingType: 'program',
    duration: 6,
    durationLabel: '6 months (typical)',
    durationEditable: true,
    options: [
      { label: 'Dose 1', priceCents: 39900 },
      { label: 'Dose 2', priceCents: 54900 },
      { label: 'Dose 3', priceCents: 59900 },
      { label: 'Dose 4', priceCents: 64900 },
      { label: 'Dose 5', priceCents: 69900 },
    ],
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'wl-retatrutide',
    name: 'Retatrutide',
    category: 'weight_loss',
    description: 'Triple agonist (GIP/GLP-1/Glucagon) — strongest available',
    included: [
      'Weekly GLP-1 injection (in-clinic or take-home)',
      'Vitamin injection with each weight loss injection',
      'Monthly provider check-in',
      'Dose titration management',
    ],
    priceCents: 49900,
    billingType: 'program',
    duration: 6,
    durationLabel: '6 months (typical)',
    durationEditable: true,
    options: [
      { label: 'Dose 1', priceCents: 49900 },
      { label: 'Dose 2', priceCents: 59900 },
      { label: 'Dose 3', priceCents: 69900 },
      { label: 'Dose 4', priceCents: 74900 },
      { label: 'Dose 5', priceCents: 79900 },
      { label: 'Dose 6', priceCents: 85900 },
    ],
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PEPTIDE — 90-DAY PROTOCOLS (3 months, billed monthly)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'pep90-2x-cjc',
    name: '2X Blend — CJC/Ipamorelin',
    category: 'peptide_90',
    description: 'Growth hormone secretagogue blend',
    included: ['90-day protocol', 'Take-home vial', 'Provider monitoring'],
    priceCents: 40000,
    billingType: 'program',
    duration: 3,
    durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-2x-tesa',
    name: '2X Blend — Tesa/Ipamorelin',
    category: 'peptide_90',
    description: 'Growth hormone secretagogue blend',
    included: ['90-day protocol', 'Take-home vial', 'Provider monitoring'],
    priceCents: 40000,
    billingType: 'program',
    duration: 3,
    durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-3x',
    name: '3X Blend — Tesa/MGF/Ipa',
    category: 'peptide_90',
    description: 'Enhanced growth hormone blend',
    included: ['90-day protocol', 'Take-home vial', 'Provider monitoring'],
    priceCents: 42500,
    billingType: 'program',
    duration: 3,
    durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-4x',
    name: '4X Blend — GHRP-2/Tesa/MGF/Ipa',
    category: 'peptide_90',
    description: 'Maximum growth hormone blend',
    included: ['90-day protocol', 'Take-home vial', 'Provider monitoring'],
    priceCents: 45000,
    billingType: 'program',
    duration: 3,
    durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-bdnf',
    name: 'BDNF',
    category: 'peptide_90',
    description: 'Cognitive enhancement peptide',
    included: ['90-day protocol (3 phases)', 'Take-home vial', 'Provider monitoring'],
    priceCents: 20000,
    billingType: 'program',
    duration: 3,
    durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-ghkcu',
    name: 'GHK-Cu',
    category: 'peptide_90',
    description: 'Skin, hair, and tissue repair peptide',
    included: ['90-day protocol', 'Take-home vial', 'Provider monitoring'],
    priceCents: 40000,
    billingType: 'program',
    duration: 3,
    durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-aod',
    name: 'AOD-9604',
    category: 'peptide_90',
    description: 'Fat-loss peptide (HGH fragment)',
    included: ['90-day protocol', 'Take-home vial', 'Provider monitoring'],
    priceCents: 40000,
    billingType: 'program',
    duration: 3,
    durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-nad',
    name: 'NAD+ 100mg',
    category: 'peptide_90',
    description: 'Cellular energy and longevity',
    included: ['90-day protocol', 'Take-home vial', 'Provider monitoring'],
    priceCents: 60000,
    billingType: 'program',
    duration: 3,
    durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PEPTIDE — RECOVERY (fixed price, fixed duration)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'pep-recovery-10',
    name: 'Recovery — 10 Day',
    category: 'peptide_recovery',
    description: 'Short recovery protocol',
    included: ['Choice of peptide: BPC-157/TB-4, 4X Blend, KLOW, or GLOW', 'Pre-filled syringes', 'Provider guidance'],
    priceCents: 25000,
    billingType: 'flat',
    duration: null,
    durationLabel: '10 Days',
    paymentOptions: {},
  },
  {
    id: 'pep-recovery-20',
    name: 'Recovery — 20 Day',
    category: 'peptide_recovery',
    description: 'Standard recovery protocol',
    included: ['Choice of peptide: BPC-157/TB-4, 4X Blend, KLOW, or GLOW', 'Pre-filled syringes', 'Provider guidance'],
    priceCents: 45000,
    billingType: 'flat',
    duration: null,
    durationLabel: '20 Days',
    paymentOptions: {},
  },
  {
    id: 'pep-recovery-30',
    name: 'Recovery — 30 Day',
    category: 'peptide_recovery',
    description: 'Extended recovery protocol',
    included: ['Choice of peptide: BPC-157/TB-4, 4X Blend, KLOW, or GLOW', 'Pre-filled syringes', 'Provider guidance'],
    priceCents: 67500,
    billingType: 'flat',
    duration: null,
    durationLabel: '30 Days',
    paymentOptions: {},
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD-ONS (universal — can be added to any protocol)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'addon-vitamin-package',
    name: 'Vitamin Injection Package',
    category: 'addon',
    description: 'Mon/Wed/Fri vitamin injections',
    included: ['3x weekly injections (rotating: B12, MIC-B12, L-Carnitine)', '~12 injections per month'],
    priceCents: 30000,
    billingType: 'monthly',
    duration: null,
    durationLabel: 'Monthly',
    paymentOptions: { monthly: true, quarterly: { discount: 0.05 } },
  },
  {
    id: 'addon-nad-12pack',
    name: 'NAD+ Injection 12-Pack',
    category: 'addon',
    description: 'Mon/Wed/Fri NAD+ injections (pay for 10, get 12)',
    included: ['12 NAD+ IM injections', 'Mon/Wed/Fri schedule'],
    priceCents: 50000,
    billingType: 'flat',
    duration: null,
    durationLabel: '4 weeks',
    options: [
      { label: '50mg', priceCents: 25000 },
      { label: '75mg', priceCents: 37500 },
      { label: '100mg', priceCents: 50000 },
      { label: '125mg', priceCents: 62500 },
      { label: '150mg', priceCents: 75000 },
    ],
    paymentOptions: {},
  },
  {
    id: 'addon-dsip',
    name: 'DSIP (Sleep Peptide)',
    category: 'addon',
    description: 'Deep sleep-inducing peptide — as-needed',
    included: ['Monthly supply', 'As-needed dosing for sleep support'],
    priceCents: 20000,
    billingType: 'monthly',
    duration: null,
    durationLabel: 'Monthly',
    paymentOptions: { monthly: true },
  },
  {
    id: 'addon-motsc',
    name: 'MOTS-C',
    category: 'addon',
    description: 'Metabolic peptide — exercise mimetic, great for plateaus',
    included: ['20-day or 30-day protocol', 'Mitochondrial support', 'Metabolic enhancement'],
    priceCents: 40000,
    billingType: 'flat',
    duration: null,
    durationLabel: '20–30 Days',
    paymentOptions: {},
  },
  {
    id: 'addon-5amino',
    name: '5-Amino-1MQ',
    category: 'addon',
    description: 'Fat cell metabolism — NNMT inhibitor',
    included: ['Oral capsules', 'Shifts fat cells from storage to active metabolism'],
    priceCents: 20000,
    billingType: 'monthly',
    duration: null,
    durationLabel: 'Monthly',
    paymentOptions: { monthly: true },
  },
  {
    id: 'addon-ghkcu-cream',
    name: 'GHK-Cu Cream',
    category: 'addon',
    description: 'Topical copper peptide — skin, hair, tissue',
    included: ['Monthly supply', 'Topical application'],
    priceCents: 29900,
    billingType: 'monthly',
    duration: null,
    durationLabel: 'Monthly',
    paymentOptions: { monthly: true },
  },
  {
    id: 'addon-range-iv',
    name: 'Range IV Session',
    category: 'addon',
    description: 'Signature IV — choose from 4 formulas + add-ons available',
    included: ['Choice of: Immune Defense, Energy & Vitality, Muscle Recovery, or Detox & Cellular Repair', '5 curated vitamins/minerals per formula', 'Additional nutrients available at $35 each'],
    priceCents: 22500,
    billingType: 'flat',
    duration: null,
    durationLabel: 'Per session',
    paymentOptions: {},
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSIONS & PACKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'hbot-intro',
    name: 'HBOT — Intro (3 Sessions)',
    category: 'session',
    description: 'Try hyperbaric oxygen therapy',
    included: ['3 HBOT sessions over 10 days', '60–90 min each'],
    priceCents: 14900,
    billingType: 'flat',
    duration: null,
    durationLabel: '10 Days',
    paymentOptions: {},
  },
  {
    id: 'hbot-5pack',
    name: 'HBOT — 5-Session Pack',
    category: 'session',
    description: '$170/session',
    included: ['5 HBOT sessions', '60–90 min each'],
    priceCents: 85000,
    billingType: 'flat',
    duration: null,
    durationLabel: '5 Sessions',
    paymentOptions: {},
  },
  {
    id: 'hbot-10pack',
    name: 'HBOT — 10-Session Pack',
    category: 'session',
    description: '$160/session',
    included: ['10 HBOT sessions', '60–90 min each'],
    priceCents: 160000,
    billingType: 'flat',
    duration: null,
    durationLabel: '10 Sessions',
    paymentOptions: {},
  },
  {
    id: 'hbot-1x',
    name: 'HBOT Membership — 1x/Week',
    category: 'session',
    description: '4 sessions/mo — $137/session',
    included: ['4 HBOT sessions per month', '3-month minimum commitment'],
    priceCents: 54900,
    billingType: 'monthly',
    duration: 3,
    durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'hbot-2x',
    name: 'HBOT Membership — 2x/Week',
    category: 'session',
    description: '8 sessions/mo — $125/session',
    included: ['8 HBOT sessions per month', '3-month minimum commitment'],
    priceCents: 99900,
    billingType: 'monthly',
    duration: 3,
    durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'hbot-3x',
    name: 'HBOT Membership — 3x/Week',
    category: 'session',
    description: '12 sessions/mo — $117/session',
    included: ['12 HBOT sessions per month', '3-month minimum commitment'],
    priceCents: 139900,
    billingType: 'monthly',
    duration: 3,
    durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'rlt-intro',
    name: 'RLT — Intro (3 Sessions)',
    category: 'session',
    description: 'Try red light therapy',
    included: ['3 RLT sessions over 7 days', '10–20 min each'],
    priceCents: 4900,
    billingType: 'flat',
    duration: null,
    durationLabel: '7 Days',
    paymentOptions: {},
  },
  {
    id: 'rlt-5pack',
    name: 'RLT — 5-Session Pack',
    category: 'session',
    description: '$75/session',
    included: ['5 RLT sessions', '10–20 min each'],
    priceCents: 37500,
    billingType: 'flat',
    duration: null,
    durationLabel: '5 Sessions',
    paymentOptions: {},
  },
  {
    id: 'rlt-10pack',
    name: 'RLT — 10-Session Pack',
    category: 'session',
    description: '$60/session',
    included: ['10 RLT sessions', '10–20 min each'],
    priceCents: 60000,
    billingType: 'flat',
    duration: null,
    durationLabel: '10 Sessions',
    paymentOptions: {},
  },
  {
    id: 'rlt-membership',
    name: 'RLT Membership',
    category: 'session',
    description: 'Up to 12 sessions/mo — $33/session',
    included: ['Up to 12 RLT sessions per month', '3-month minimum commitment'],
    priceCents: 39900,
    billingType: 'monthly',
    duration: 3,
    durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'combo-1x',
    name: 'HBOT + RLT — 1x/Week',
    category: 'session',
    description: '4 HBOT + 4 RLT per month',
    included: ['4 HBOT sessions per month', '4 RLT sessions per month', '3-month minimum commitment'],
    priceCents: 89900,
    billingType: 'monthly',
    duration: 3,
    durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'combo-2x',
    name: 'HBOT + RLT — 2x/Week',
    category: 'session',
    description: '8 HBOT + 8 RLT per month',
    included: ['8 HBOT sessions per month', '8 RLT sessions per month', '3-month minimum commitment'],
    priceCents: 149900,
    billingType: 'monthly',
    duration: 3,
    durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'combo-3x',
    name: 'HBOT + RLT — 3x/Week',
    category: 'session',
    description: '12 HBOT + 12 RLT per month',
    included: ['12 HBOT sessions per month', '12 RLT sessions per month', '3-month minimum commitment'],
    priceCents: 199900,
    billingType: 'monthly',
    duration: 3,
    durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'cellular-reset',
    name: 'Six-Week Cellular Energy Reset',
    category: 'session',
    description: '18 HBOT + 18 RLT + weekly check-ins',
    included: ['18 HBOT sessions', '18 RLT sessions', 'Weekly provider check-ins', 'Money-back guarantee'],
    priceCents: 399900,
    billingType: 'flat',
    duration: null,
    durationLabel: '6 Weeks',
    paymentOptions: {},
  },
  {
    id: 'prp-single',
    name: 'PRP — Single Injection',
    category: 'session',
    description: 'Joint, tendon, hair, or facial',
    included: ['Single PRP injection', 'Blood draw + processing on-site'],
    priceCents: 75000,
    billingType: 'flat',
    duration: null,
    durationLabel: 'Single',
    paymentOptions: {},
  },
  {
    id: 'prp-3pack',
    name: 'PRP — 3-Injection Pack',
    category: 'session',
    description: '$600/session — save $450',
    included: ['3 PRP injections', 'Blood draw + processing on-site'],
    priceCents: 180000,
    billingType: 'flat',
    duration: null,
    durationLabel: '3 Sessions',
    paymentOptions: {},
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIALTY IVs
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'iv-nad-225',
    name: 'NAD+ IV — 225mg',
    category: 'session',
    description: '2–4 hour infusion',
    included: ['NAD+ 225mg IV infusion', '2–4 hour session'],
    priceCents: 37500,
    billingType: 'flat',
    duration: null,
    durationLabel: 'Per session',
    paymentOptions: {},
  },
  {
    id: 'iv-nad-500',
    name: 'NAD+ IV — 500mg',
    category: 'session',
    description: '2–4 hour infusion',
    included: ['NAD+ 500mg IV infusion', '2–4 hour session'],
    priceCents: 52500,
    billingType: 'flat',
    duration: null,
    durationLabel: 'Per session',
    paymentOptions: {},
  },
  {
    id: 'iv-nad-750',
    name: 'NAD+ IV — 750mg',
    category: 'session',
    description: '3–4 hour infusion',
    included: ['NAD+ 750mg IV infusion', '3–4 hour session'],
    priceCents: 65000,
    billingType: 'flat',
    duration: null,
    durationLabel: 'Per session',
    paymentOptions: {},
  },
  {
    id: 'iv-nad-1000',
    name: 'NAD+ IV — 1000mg',
    category: 'session',
    description: '4 hour infusion',
    included: ['NAD+ 1000mg IV infusion', '4 hour session'],
    priceCents: 77500,
    billingType: 'flat',
    duration: null,
    durationLabel: 'Per session',
    paymentOptions: {},
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LABS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lab-essential',
    name: 'Essential Lab Panel',
    category: 'lab',
    description: 'Hormones, thyroid, metabolic, lipids, CBC, vitamins, cortisol',
    included: ['Comprehensive hormone panel', 'Thyroid panel', 'Metabolic panel', 'Lipid panel', 'CBC', 'Vitamins', 'Cortisol', 'PSA (men)'],
    priceCents: 35000,
    billingType: 'flat',
    duration: null,
    durationLabel: 'One-time',
    paymentOptions: {},
  },
  {
    id: 'lab-elite',
    name: 'Elite Lab Panel',
    category: 'lab',
    description: 'Everything in Essential + cardiovascular, inflammation, IGF-1, ferritin',
    included: ['Everything in Essential Panel', 'Cardiovascular markers', 'Inflammation markers', 'IGF-1', 'Ferritin'],
    priceCents: 75000,
    billingType: 'flat',
    duration: null,
    durationLabel: 'One-time',
    paymentOptions: {},
  },
];

// ── Price helpers ────────────────────────────────────────────────────────────

export function formatPrice(cents) {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString()}`
    : `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Calculate the displayed price based on payment option selection
// Returns { monthly, total, savings, label }
export function calculatePricing(item, selectedOption, selectedDose, customDuration) {
  const baseCents = selectedDose?.priceCents || item.priceCents;
  const duration = customDuration || item.duration;

  if (item.billingType === 'flat') {
    return { monthly: null, total: baseCents, savings: 0, label: 'One-time' };
  }

  if (item.billingType === 'monthly' && !item.duration) {
    // Ongoing membership
    if (selectedOption === 'quarterly') {
      const discount = item.paymentOptions.quarterly?.discount || 0;
      const quarterlyTotal = Math.round(baseCents * 3 * (1 - discount));
      const savings = baseCents * 3 - quarterlyTotal;
      return { monthly: Math.round(quarterlyTotal / 3), total: quarterlyTotal, savings, label: 'Per quarter' };
    }
    if (selectedOption === 'annual') {
      const discount = item.paymentOptions.annual?.discount || 0;
      const annualTotal = Math.round(baseCents * 12 * (1 - discount));
      const savings = baseCents * 12 - annualTotal;
      return { monthly: Math.round(annualTotal / 12), total: annualTotal, savings, label: 'Per year' };
    }
    return { monthly: baseCents, total: baseCents, savings: 0, label: 'Per month' };
  }

  // Fixed-duration program
  if (selectedOption === 'upfront') {
    const discount = item.paymentOptions.upfront?.discount || 0;
    const totalMonthly = baseCents * duration;
    const upfrontTotal = Math.round(totalMonthly * (1 - discount));
    const savings = totalMonthly - upfrontTotal;
    return { monthly: null, total: upfrontTotal, savings, label: `Upfront (${duration} months)` };
  }

  // Monthly for fixed program
  const totalMonthly = baseCents * duration;
  return { monthly: baseCents, total: totalMonthly, savings: 0, label: `${duration} months` };
}
