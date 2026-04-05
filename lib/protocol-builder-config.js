// lib/protocol-builder-config.js
// Protocol Builder — catalog configuration
// Defines all items available in the drag-and-drop protocol builder
// Each item includes benefits (patient-facing reasoning) and bestFor (who it helps)

// ── Category definitions ────────────────────────────────────────────────────
export const BUILDER_CATEGORIES = [
  { id: 'membership', label: 'Memberships', color: '#7c3aed', desc: 'Ongoing programs' },
  { id: 'weight_loss', label: 'Weight Loss', color: '#2563eb', desc: 'GLP-1 medications' },
  { id: 'peptide', label: 'Peptides', color: '#059669', desc: 'All peptide protocols' },
  { id: 'nad', label: 'NAD+', color: '#0891b2', desc: 'NAD+ IV programs & injections' },
  { id: 'addon', label: 'Add-Ons', color: '#d97706', desc: 'Universal enhancements' },
  { id: 'session', label: 'Sessions & Packs', color: '#6366f1', desc: 'HBOT, RLT, IV, PRP' },
  { id: 'lab', label: 'Labs', color: '#ec4899', desc: 'Lab panels' },
];

export const PEPTIDE_SUBCATEGORIES = [
  { id: 'recovery', label: 'Recovery & Healing', desc: 'Tissue repair, injury recovery, joint support' },
  { id: 'growth_hormone', label: 'Growth Hormone Optimization', desc: 'GH secretagogues, muscle, anti-aging' },
  { id: 'cognitive', label: 'Brain & Cognitive', desc: 'Focus, memory, neuroprotection' },
  { id: 'fat_loss', label: 'Fat Loss & Metabolism', desc: 'Metabolic support, fat cell targeting' },
  { id: 'skin_hair', label: 'Skin, Hair & Tissue', desc: 'Collagen, repair, aesthetics' },
  { id: 'longevity', label: 'Longevity & Immune', desc: 'Anti-aging, telomeres, immune defense' },
  { id: 'sleep', label: 'Sleep', desc: 'Deep sleep support' },
  { id: 'sexual_health', label: 'Sexual Health', desc: 'Libido, performance' },
  { id: 'mitochondrial', label: 'Mitochondrial & Energy', desc: 'Cellular energy, NAD+, mitochondrial repair' },
  { id: 'vial', label: 'Vials (Self-Administer)', desc: 'Take-home vials — mix and inject at home' },
];

export function getCategoryColor(catId) {
  return BUILDER_CATEGORIES.find(c => c.id === catId)?.color || '#808080';
}

export const RANGE_IV_FORMULAS = [
  { name: 'Immune Defense IV', nutrients: ['Vitamin C', 'Zinc', 'Glutathione', 'B-Complex', 'Magnesium'] },
  { name: 'Energy & Vitality IV', nutrients: ['B12', 'B-Complex', 'L-Carnitine', 'Magnesium', 'Vitamin C'] },
  { name: 'Muscle Recovery & Performance IV', nutrients: ['Amino Acids', 'Magnesium', 'B-Complex', 'Vitamin C', 'Glutathione'] },
  { name: 'Detox & Cellular Repair IV', nutrients: ['Glutathione', 'Vitamin C', 'NAC', 'Zinc', 'Magnesium'] },
];

// ── Builder items ───────────────────────────────────────────────────────────

export const BUILDER_ITEMS = [

  // ═══ MEMBERSHIPS ══════════════════════════════════════════════════════════
  {
    id: 'hrt-membership',
    name: 'HRT Membership',
    category: 'membership',
    description: 'Complete hormone replacement therapy',
    benefits: [
      'Restores testosterone, estrogen, or thyroid to optimal levels — not just "normal range"',
      'Improves energy, sleep, mood, libido, and body composition',
      'Reduces long-term risk of cardiovascular disease, osteoporosis, and cognitive decline',
      'Includes monthly IV therapy and ongoing lab monitoring at no extra cost',
    ],
    bestFor: 'Men and women with suboptimal hormone levels confirmed by labs',
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

  // ═══ WEIGHT LOSS ══════════════════════════════════════════════════════════
  // All GLP-1s titrate every 4 weeks. Duration tiers based on clinical trial data.
  // The page uses clinicalData.weightLossTimeline to personalize projections
  // based on the patient's actual starting weight and goal weight.
  {
    id: 'wl-semaglutide',
    name: 'Semaglutide',
    category: 'weight_loss',
    description: 'GLP-1 receptor agonist',
    benefits: [
      'Reduces appetite naturally by targeting brain hunger centers — less willpower needed',
      'STEP trial: ~11% body weight loss at 6 months, ~15% at 12 months (2.4 mg dose)',
      'Improves insulin sensitivity, blood sugar, and cardiovascular markers',
      '4-week dose titration (0.25 → 0.5 → 1.0 → 1.7 → 2.4 mg) minimizes side effects',
    ],
    bestFor: 'Patients with 20–35 lbs to lose, especially with metabolic concerns',
    included: [
      'Weekly GLP-1 injection (in-clinic or take-home)',
      'Vitamin injection with each weight loss injection',
      'Monthly provider check-in + weigh-in',
      'Dose titration management every 4 weeks',
    ],
    titration: {
      frequency: 'Every 4 weeks',
      steps: ['0.25 mg (wk 1–4)', '0.5 mg (wk 5–8)', '1.0 mg (wk 9–12)', '1.7 mg (wk 13–16)', '2.4 mg (wk 17+)'],
      weeksToMaintenance: 16,
      maintenanceDose: '2.4 mg',
    },
    // pctLoss values are from STEP 1 trial at each timepoint — used to project patient-specific lbs
    clinicalData: {
      source: 'STEP 1 (Wegovy 2.4 mg, 68 wk)',
      weightLossTimeline: [
        { months: 3, pctLoss: 6, note: 'Titrating — early response' },
        { months: 6, pctLoss: 11, note: 'At maintenance dose, steady loss' },
        { months: 9, pctLoss: 14, note: 'Peak loss rate' },
        { months: 12, pctLoss: 15, note: 'Approaching plateau' },
      ],
      plateau: 'Months 12–14',
      maxLoss: '15–17%',
      avgMonthlyLoss: '2–3 lbs/mo at maintenance',
    },
    durationTiers: [
      { months: 3, label: '3-Month Starter', lbsMin: 10, lbsMax: 15, description: 'Titration + early results. Best for <20 lbs to lose or trial period.' },
      { months: 6, label: '6-Month Program', lbsMin: 20, lbsMax: 30, description: 'Full titration + 2 months at maintenance dose. Most common.' },
      { months: 9, label: '9-Month Program', lbsMin: 30, lbsMax: 40, description: 'Extended maintenance, near-maximum results.' },
      { months: 12, label: '12-Month Program', lbsMin: 35, lbsMax: 50, description: 'Full clinical trial duration. Recommended minimum per guidelines.' },
    ],
    // Stepped pricing follows titration: price increases as dose goes up
    // Last value repeats for all maintenance months beyond the array
    steppedPricing: [35000, 35000, 35000, 35000], // sema is flat-priced across doses
    priceCents: 35000,
    billingType: 'program',
    duration: 6,
    durationLabel: '6 months',
    durationEditable: true,
    paymentOptions: {
      monthly: true,
      upfront: { monthsFree: { 3: 0, 6: 1, 9: 1, 12: 2 } }, // 6mo=pay 5, 12mo=pay 10
    },
  },
  {
    id: 'wl-tirzepatide',
    name: 'Tirzepatide',
    category: 'weight_loss',
    description: 'Dual GIP/GLP-1 receptor agonist — most popular',
    benefits: [
      'Targets two pathways (GIP + GLP-1) for ~1.5x the weight loss of semaglutide',
      'SURMOUNT-1: ~14% loss at 6 months, ~22.5% at 17 months (15 mg dose)',
      'Significant improvement in A1C, insulin resistance, and metabolic syndrome markers',
      'Most patients report reduced food noise and cravings within 2–3 weeks',
    ],
    bestFor: 'Patients wanting maximum efficacy, especially with insulin resistance or 35+ lbs to lose',
    included: [
      'Weekly GLP-1 injection (in-clinic or take-home)',
      'Vitamin injection with each weight loss injection',
      'Monthly provider check-in + weigh-in',
      'Dose titration management every 4 weeks',
    ],
    titration: {
      frequency: 'Every 4 weeks',
      steps: ['2.5 mg (wk 1–4)', '5 mg (wk 5–8)', '7.5 mg (wk 9–12)', '10 mg (wk 13–16)', '12.5 mg (wk 17–20)', '15 mg (wk 21+)'],
      weeksToMaintenance: 20,
      maintenanceDose: '5, 10, or 15 mg',
    },
    clinicalData: {
      source: 'SURMOUNT-1 (Zepbound 15 mg, 72 wk)',
      weightLossTimeline: [
        { months: 3, pctLoss: 7, note: 'Titrating — stronger early response than semaglutide' },
        { months: 6, pctLoss: 14, note: 'At or near maintenance dose' },
        { months: 9, pctLoss: 19, note: 'Rapid loss continues' },
        { months: 12, pctLoss: 21, note: 'Approaching plateau' },
      ],
      plateau: 'Months 14–17',
      maxLoss: '22–25%',
      avgMonthlyLoss: '3–4.5 lbs/mo at maintenance',
    },
    durationTiers: [
      { months: 3, label: '3-Month Starter', lbsMin: 10, lbsMax: 20, description: 'Titration + initial response. Assess fit before full program.' },
      { months: 6, label: '6-Month Program', lbsMin: 25, lbsMax: 40, description: 'Full titration + maintenance. Most popular choice.' },
      { months: 9, label: '9-Month Program', lbsMin: 40, lbsMax: 55, description: 'Extended maintenance at therapeutic dose.' },
      { months: 12, label: '12-Month Program', lbsMin: 50, lbsMax: 75, description: 'Maximum clinical duration. Best outcomes for 50+ lbs.' },
    ],
    // Stepped pricing: 2.5mg→5mg→7.5mg→10mg→12.5mg→15mg (maintenance)
    steppedPricing: [39900, 54900, 59900, 64900, 69900, 69900],
    priceCents: 39900,
    billingType: 'program',
    duration: 6,
    durationLabel: '6 months',
    durationEditable: true,
    options: [
      { label: 'Dose 1 (2.5mg)', priceCents: 39900 },
      { label: 'Dose 2 (5mg)', priceCents: 54900 },
      { label: 'Dose 3 (7.5mg)', priceCents: 59900 },
      { label: 'Dose 4 (10mg)', priceCents: 64900 },
      { label: 'Dose 5 (15mg)', priceCents: 69900 },
    ],
    paymentOptions: {
      monthly: true,
      upfront: { monthsFree: { 3: 0, 6: 1, 9: 1, 12: 2 } },
    },
  },
  {
    id: 'wl-retatrutide',
    name: 'Retatrutide',
    category: 'weight_loss',
    description: 'Triple agonist (GIP/GLP-1/Glucagon) — strongest available',
    benefits: [
      'Only triple-action weight loss medication — targets GIP, GLP-1, and glucagon receptors',
      'Phase 2 trial: ~17% loss at 6 months, ~24% at 12 months — no plateau at 48 weeks',
      'Glucagon receptor activation increases energy expenditure and fat burning directly',
      'Fastest titration (12 weeks to maintenance vs 16–20 for others)',
    ],
    bestFor: 'Patients with 50+ lbs to lose, or who plateaued on semaglutide/tirzepatide',
    included: [
      'Weekly GLP-1 injection (in-clinic or take-home)',
      'Vitamin injection with each weight loss injection',
      'Monthly provider check-in + weigh-in',
      'Dose titration management every 4 weeks',
    ],
    titration: {
      frequency: 'Every 4 weeks',
      steps: ['2 mg (wk 1–4)', '4 mg (wk 5–8)', '8 mg (wk 9–12)', '12 mg (wk 13+)'],
      weeksToMaintenance: 12,
      maintenanceDose: '12 mg',
    },
    clinicalData: {
      source: 'Phase 2 (NEJM 2023, 12 mg, 48 wk)',
      weightLossTimeline: [
        { months: 3, pctLoss: 9, note: 'Fastest early loss — just reaching maintenance' },
        { months: 6, pctLoss: 17, note: 'Exceeding semaglutide 12-month results in half the time' },
        { months: 9, pctLoss: 22, note: 'Still in steep loss curve — no plateau' },
        { months: 12, pctLoss: 24, note: 'Trial endpoint — curve still trending down' },
      ],
      plateau: 'Not reached at 48 weeks',
      maxLoss: '24%+ (ceiling unknown)',
      avgMonthlyLoss: '4–5.5 lbs/mo at maintenance',
    },
    durationTiers: [
      { months: 3, label: '3-Month Starter', lbsMin: 15, lbsMax: 25, description: 'Full titration + first month at maintenance. Fastest results.' },
      { months: 6, label: '6-Month Program', lbsMin: 30, lbsMax: 50, description: 'Already exceeding semaglutide 12-month results.' },
      { months: 9, label: '9-Month Program', lbsMin: 50, lbsMax: 70, description: 'Deep into active loss — no plateau expected yet.' },
      { months: 12, label: '12-Month Program', lbsMin: 70, lbsMax: 100, description: 'For the most significant goals — results still accelerating.' },
    ],
    // Stepped pricing: 2mg→4mg→8mg→12mg (maintenance)
    steppedPricing: [49900, 59900, 69900, 74900],
    priceCents: 49900,
    billingType: 'program',
    duration: 6,
    durationLabel: '6 months',
    durationEditable: true,
    options: [
      { label: 'Dose 1 (2mg)', priceCents: 49900 },
      { label: 'Dose 2 (4mg)', priceCents: 59900 },
      { label: 'Dose 3 (8mg)', priceCents: 69900 },
      { label: 'Dose 4 (12mg)', priceCents: 74900 },
      { label: 'Dose 5 (16mg)', priceCents: 79900 },
      { label: 'Dose 6 (24mg)', priceCents: 85900 },
    ],
    paymentOptions: {
      monthly: true,
      upfront: { monthsFree: { 3: 0, 6: 1, 9: 1, 12: 2 } },
    },
  },

  // ═══ PEPTIDES — RECOVERY & HEALING ════════════════════════════════════════
  {
    id: 'pep-bpc-tb4-10',
    name: 'BPC-157 / TB-4 — 10 Day',
    category: 'peptide', subcategory: 'recovery',
    description: 'Joint repair, gut healing, tissue recovery',
    benefits: [
      'Accelerates tendon, ligament, and muscle healing — clinically studied in tissue repair',
      'Reduces inflammation at injury sites without NSAIDs',
      'BPC-157 supports gut lining repair (leaky gut, IBS, post-antibiotic recovery)',
      'TB-4 promotes new blood vessel formation and cellular migration to damaged tissue',
    ],
    bestFor: 'Post-surgery, chronic joint pain, tendon injuries, gut issues',
    included: ['Pre-filled syringes', 'Daily injections', 'Provider guidance'],
    priceCents: 25000, billingType: 'flat', duration: null, durationLabel: '10 Days', paymentOptions: {},
  },
  {
    id: 'pep-bpc-tb4-20',
    name: 'BPC-157 / TB-4 — 20 Day',
    category: 'peptide', subcategory: 'recovery',
    description: 'Joint repair, gut healing, tissue recovery',
    benefits: [
      'Extended protocol for deeper tissue repair and chronic conditions',
      'Accelerates tendon, ligament, and muscle healing',
      'Reduces inflammation and supports gut lining repair',
      'Most popular duration for moderate injuries and surgical recovery',
    ],
    bestFor: 'Moderate injuries, surgical recovery, ongoing joint issues',
    included: ['Pre-filled syringes', 'Daily injections', 'Provider guidance'],
    priceCents: 45000, billingType: 'flat', duration: null, durationLabel: '20 Days', paymentOptions: {},
  },
  {
    id: 'pep-bpc-tb4-30',
    name: 'BPC-157 / TB-4 — 30 Day',
    category: 'peptide', subcategory: 'recovery',
    description: 'Joint repair, gut healing, tissue recovery',
    benefits: [
      'Full 30-day protocol for maximum tissue repair and systemic healing',
      'Best for chronic conditions requiring sustained peptide exposure',
      'Can be cycled (30 on, 14 off) for ongoing injury management',
      'Combines both healing peptides for synergistic recovery',
    ],
    bestFor: 'Chronic injuries, severe tissue damage, long-term recovery programs',
    included: ['Pre-filled syringes', 'Daily injections', 'Provider guidance'],
    priceCents: 67500, billingType: 'flat', duration: null, durationLabel: '30 Days', paymentOptions: {},
  },
  {
    id: 'pep-4x-recovery-10',
    name: '4X Recovery Blend — 10 Day',
    category: 'peptide', subcategory: 'recovery',
    description: 'BPC/TB-4/KPV/MGF — maximum recovery stack',
    benefits: [
      'Four peptides working together: healing (BPC/TB-4) + anti-inflammatory (KPV) + growth (MGF)',
      'KPV reduces systemic inflammation beyond what BPC alone achieves',
      'MGF (Mechano Growth Factor) specifically targets muscle and connective tissue repair',
      'Most comprehensive recovery protocol available',
    ],
    bestFor: 'Athletes, post-surgery, significant injuries requiring aggressive recovery',
    included: ['Pre-filled syringes', '4-peptide recovery blend', 'Take-home'],
    priceCents: 25000, billingType: 'flat', duration: null, durationLabel: '10 Days', paymentOptions: {},
  },
  {
    id: 'pep-4x-recovery-20',
    name: '4X Recovery Blend — 20 Day',
    category: 'peptide', subcategory: 'recovery',
    description: 'BPC/TB-4/KPV/MGF — maximum recovery stack',
    benefits: ['Extended 4-peptide recovery for deeper healing', 'Anti-inflammatory + tissue repair + growth factor support', 'Most popular duration for surgical recovery'],
    bestFor: 'Surgical recovery, chronic pain, athletic injuries',
    included: ['Pre-filled syringes', '4-peptide recovery blend', 'Take-home'],
    priceCents: 45000, billingType: 'flat', duration: null, durationLabel: '20 Days', paymentOptions: {},
  },
  {
    id: 'pep-4x-recovery-30',
    name: '4X Recovery Blend — 30 Day',
    category: 'peptide', subcategory: 'recovery',
    description: 'BPC/TB-4/KPV/MGF — maximum recovery stack',
    benefits: ['Full 30-day protocol with all 4 recovery peptides', 'Maximum duration for chronic conditions', 'Can be cycled for ongoing injury management'],
    bestFor: 'Severe injuries, complex surgical recovery, chronic inflammatory conditions',
    included: ['Pre-filled syringes', '4-peptide recovery blend', 'Take-home'],
    priceCents: 67500, billingType: 'flat', duration: null, durationLabel: '30 Days', paymentOptions: {},
  },
  {
    id: 'pep-klow-10',
    name: 'KLOW — 10 Day',
    category: 'peptide', subcategory: 'recovery',
    description: 'GHK-Cu/KPV/BPC-157/TB-4 — recovery + skin rejuvenation',
    benefits: [
      'Unique blend combining tissue recovery with skin/collagen benefits',
      'GHK-Cu stimulates collagen production while BPC/TB-4 handle deep tissue repair',
      'KPV provides anti-inflammatory support',
      'Dual benefit: heal injuries while improving skin quality',
    ],
    bestFor: 'Patients wanting recovery benefits plus skin/anti-aging improvement',
    included: ['Pre-filled syringes', 'Hybrid recovery + skin blend', 'Take-home'],
    priceCents: 25000, billingType: 'flat', duration: null, durationLabel: '10 Days', paymentOptions: {},
  },
  {
    id: 'pep-klow-20',
    name: 'KLOW — 20 Day',
    category: 'peptide', subcategory: 'recovery',
    description: 'GHK-Cu/KPV/BPC-157/TB-4 — recovery + skin rejuvenation',
    benefits: ['Extended recovery + collagen blend', 'GHK-Cu builds collagen while BPC/TB-4 repair tissue', 'Anti-inflammatory + skin improvement'],
    bestFor: 'Recovery with anti-aging benefits, post-procedure skin repair',
    included: ['Pre-filled syringes', 'Hybrid recovery + skin blend', 'Take-home'],
    priceCents: 45000, billingType: 'flat', duration: null, durationLabel: '20 Days', paymentOptions: {},
  },
  {
    id: 'pep-klow-30',
    name: 'KLOW — 30 Day',
    category: 'peptide', subcategory: 'recovery',
    description: 'GHK-Cu/KPV/BPC-157/TB-4 — recovery + skin rejuvenation',
    benefits: ['Full 30-day recovery + skin protocol', 'Maximum collagen and tissue repair benefits', 'Best results for visible skin improvement'],
    bestFor: 'Comprehensive recovery + skin rejuvenation, chronic conditions',
    included: ['Pre-filled syringes', 'Hybrid recovery + skin blend', 'Take-home'],
    priceCents: 67500, billingType: 'flat', duration: null, durationLabel: '30 Days', paymentOptions: {},
  },

  // ═══ PEPTIDES — GROWTH HORMONE ════════════════════════════════════════════
  {
    id: 'pep90-2x-cjc',
    name: '2X Blend — CJC/Ipamorelin',
    category: 'peptide', subcategory: 'growth_hormone',
    description: 'GH secretagogue — lean mass, recovery, sleep quality',
    benefits: [
      'Stimulates natural growth hormone release without suppressing your own production',
      'Improves sleep quality (GH pulses during deep sleep) — patients notice better rest within 1–2 weeks',
      'Supports lean muscle gain and fat loss, especially around the midsection',
      'CJC extends the GH pulse while Ipamorelin triggers it — synergistic combination',
    ],
    bestFor: 'Anti-aging, body composition, sleep improvement, recovery between workouts',
    included: ['90-day protocol (3 phases with dose escalation)', 'Pre-filled syringes — 5 on / 2 off schedule', 'Provider monitoring'],
    priceCents: 40000, billingType: 'program', duration: 3, durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-2x-tesa',
    name: '2X Blend — Tesa/Ipamorelin',
    category: 'peptide', subcategory: 'growth_hormone',
    description: 'GH secretagogue — visceral fat reduction, lean mass',
    benefits: [
      'Tesamorelin is the only FDA-approved peptide for reducing visceral (organ) fat',
      'Specifically targets dangerous belly fat that wraps around organs',
      'Preserves lean muscle mass while reducing fat stores',
      'Combined with Ipamorelin for enhanced GH release and recovery benefits',
    ],
    bestFor: 'Visceral fat reduction, body recomposition, patients with metabolic concerns',
    included: ['90-day protocol (3 phases with dose escalation)', 'Pre-filled syringes — 5 on / 2 off schedule', 'Provider monitoring'],
    priceCents: 40000, billingType: 'program', duration: 3, durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-3x',
    name: '3X Blend — Tesa/MGF/Ipa',
    category: 'peptide', subcategory: 'growth_hormone',
    description: 'Enhanced GH blend — muscle growth, tissue repair',
    benefits: [
      'Three-peptide synergy: Tesamorelin (fat loss) + MGF (muscle growth) + Ipamorelin (GH release)',
      'MGF (Mechano Growth Factor) specifically promotes muscle fiber repair and growth',
      'Superior body recomposition — build muscle while losing fat simultaneously',
      'Dose escalation across 3 phases maximizes results while managing tolerance',
    ],
    bestFor: 'Athletes, body recomposition, patients wanting muscle + fat loss together',
    included: ['90-day protocol (3 phases with dose escalation)', 'Pre-filled syringes — 5 on / 2 off schedule', 'Provider monitoring'],
    priceCents: 42500, billingType: 'program', duration: 3, durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep90-4x',
    name: '4X Blend — GHRP-2/Tesa/MGF/Ipa',
    category: 'peptide', subcategory: 'growth_hormone',
    description: 'Maximum GH blend — peak performance, recovery',
    benefits: [
      'Four-peptide stack for maximum growth hormone optimization',
      'GHRP-2 is the strongest GH secretagogue — amplifies the entire stack',
      'Combines fat loss (Tesa), muscle growth (MGF), and GH pulse amplification (GHRP-2/Ipa)',
      'Most aggressive body recomposition protocol available',
    ],
    bestFor: 'Serious athletes, maximum body recomposition, patients who want the strongest option',
    included: ['90-day protocol (3 phases with dose escalation)', 'Pre-filled syringes — 5 on / 2 off schedule', 'Provider monitoring'],
    priceCents: 45000, billingType: 'program', duration: 3, durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep-igf-lr3',
    name: 'IGF-LR3',
    category: 'peptide', subcategory: 'growth_hormone',
    description: 'Growth factor — muscle hypertrophy, recovery',
    benefits: [
      'Direct growth factor — doesn\'t need GH conversion, acts immediately on muscle tissue',
      'Promotes muscle cell hyperplasia (new muscle cells) not just hypertrophy (bigger cells)',
      'Extended half-life (20+ hours) vs regular IGF-1 — sustained anabolic effect',
      'Used in 7-day cycles to prevent receptor desensitization',
    ],
    bestFor: 'Advanced athletes, targeted muscle growth, recovery from muscle injuries',
    included: ['7-day protocol ($200/week)', '4-week total program: $800', 'Provider monitoring'],
    priceCents: 20000, billingType: 'flat', duration: null, durationLabel: '7 Days (per cycle)', paymentOptions: {},
  },

  // ═══ PEPTIDES — BRAIN & COGNITIVE ═════════════════════════════════════════
  {
    id: 'pep90-bdnf',
    name: 'BDNF',
    category: 'peptide', subcategory: 'cognitive',
    description: 'Brain-derived neurotrophic factor — neuroplasticity, focus',
    benefits: [
      'BDNF is called "Miracle-Gro for the brain" — promotes new neural connections',
      'Enhances learning, memory formation, and cognitive processing speed',
      'Supports recovery from TBI, concussion, and age-related cognitive decline',
      '3-phase protocol with dose escalation for progressive neurological benefit',
    ],
    bestFor: 'Brain fog, cognitive decline, post-concussion, learning/memory enhancement',
    included: ['90-day protocol (3 phases: 200mcg → 400mcg → 600mcg)', 'Pre-filled syringes — 5 on / 2 off', 'Provider monitoring'],
    priceCents: 20000, billingType: 'program', duration: 3, durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep-selank',
    name: 'Selank',
    category: 'peptide', subcategory: 'cognitive',
    description: 'Anxiolytic peptide — focus, calm, cognitive clarity',
    benefits: [
      'Reduces anxiety without sedation or cognitive impairment (unlike benzodiazepines)',
      'Enhances focus and mental clarity by modulating GABA and serotonin systems',
      'Boosts BDNF expression — synergistic when stacked with BDNF peptide',
      'Non-addictive with no withdrawal symptoms',
    ],
    bestFor: 'Anxiety, stress-related brain fog, focus enhancement, BDNF stack partner',
    included: ['Take-home vial', 'Nasal or subcutaneous administration'],
    priceCents: 19800, billingType: 'flat', duration: null, durationLabel: 'Per vial', paymentOptions: {},
  },
  {
    id: 'pep-semax',
    name: 'Semax',
    category: 'peptide', subcategory: 'cognitive',
    description: 'Nootropic peptide — memory, learning, neuroprotection',
    benefits: [
      'Originally developed in Russia for stroke recovery — potent neuroprotective effects',
      'Enhances memory consolidation and learning speed',
      'Increases dopamine and serotonin metabolism — improves motivation and mood',
      'Protects neurons from oxidative stress and excitotoxicity',
    ],
    bestFor: 'Memory enhancement, neuroprotection, cognitive performance, mood support',
    included: ['Take-home vial', 'Nasal or subcutaneous administration'],
    priceCents: 19800, billingType: 'flat', duration: null, durationLabel: 'Per vial', paymentOptions: {},
  },

  // ═══ PEPTIDES — FAT LOSS & METABOLISM ═════════════════════════════════════
  {
    id: 'pep90-aod',
    name: 'AOD-9604',
    category: 'peptide', subcategory: 'fat_loss',
    description: 'HGH fragment — fat loss without GH side effects',
    benefits: [
      'Fragment of human growth hormone that targets ONLY fat metabolism — no other GH effects',
      'Stimulates lipolysis (fat breakdown) and inhibits lipogenesis (fat creation)',
      'No impact on blood sugar, insulin, or IGF-1 — GRAS status from FDA',
      'Can be safely combined with GLP-1 medications for enhanced fat loss',
    ],
    bestFor: 'Targeted fat loss, stacking with weight loss medications, metabolic support',
    included: ['90-day protocol', 'Pre-filled syringes — daily injections', 'Provider monitoring'],
    priceCents: 40000, billingType: 'program', duration: 3, durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep-motsc',
    name: 'MOTS-C',
    category: 'peptide', subcategory: 'fat_loss',
    description: 'Exercise mimetic — metabolic reset, plateau breaker',
    benefits: [
      'Activates AMPK pathway (same pathway activated by exercise and metformin)',
      'Mimics the metabolic benefits of exercise at the cellular level',
      'Particularly effective for breaking weight loss plateaus on GLP-1 medications',
      'Improves insulin sensitivity and glucose metabolism independent of weight loss',
    ],
    bestFor: 'Weight loss plateaus, metabolic dysfunction, patients who can\'t exercise',
    included: ['20-day or 30-day protocol', 'Phase 1: 1mg/day, Phase 2: 2mg/day'],
    priceCents: 40000, billingType: 'flat', duration: null, durationLabel: '20–30 Days', paymentOptions: {},
  },
  {
    id: 'pep-5amino',
    name: '5-Amino-1MQ',
    category: 'peptide', subcategory: 'fat_loss',
    description: 'NNMT inhibitor — shifts fat cells from storage to active',
    benefits: [
      'Inhibits NNMT enzyme that makes fat cells efficient at storing fat',
      'Increases NAD+ and SAM levels inside fat cells — reactivates fat metabolism',
      'Oral capsule — no injection required',
      'Works differently than GLP-1s (targets fat cells, not appetite) — complementary stack',
    ],
    bestFor: 'Stubborn fat, GLP-1 plateau support, patients preferring oral over injectable',
    included: ['Oral capsules', 'Monthly supply'],
    priceCents: 20000, billingType: 'monthly', duration: null, durationLabel: 'Monthly',
    paymentOptions: { monthly: true },
  },
  {
    id: 'pep-tesofensine',
    name: 'Tesofensine',
    category: 'peptide', subcategory: 'fat_loss',
    description: 'Triple reuptake inhibitor — appetite + metabolic boost',
    benefits: [
      'Inhibits reuptake of serotonin, norepinephrine, and dopamine — triple mechanism',
      'Phase 2 trials showed 2x the weight loss of existing medications at the time',
      'Reduces appetite AND increases resting metabolic rate simultaneously',
      'Oral capsule — no injection required',
    ],
    bestFor: 'Significant appetite control needed, metabolic rate support, GLP-1 complement',
    included: ['Oral capsules', 'Monthly supply'],
    priceCents: 20000, billingType: 'monthly', duration: null, durationLabel: 'Monthly',
    paymentOptions: { monthly: true },
  },

  // ═══ PEPTIDES — SKIN, HAIR & TISSUE ═══════════════════════════════════════
  {
    id: 'pep90-ghkcu',
    name: 'GHK-Cu (Injectable) — 90 Day',
    category: 'peptide', subcategory: 'skin_hair',
    description: 'Copper peptide — collagen, skin elasticity, hair growth',
    benefits: [
      'Stimulates collagen and elastin production — tighter, more youthful skin',
      'Promotes hair follicle growth and thickness — studied for hair restoration',
      'Reduces fine lines, age spots, and skin laxity from the inside out',
      'Anti-inflammatory and antioxidant properties protect against further aging',
    ],
    bestFor: 'Anti-aging skin improvement, hair thinning, skin elasticity, post-procedure healing',
    included: ['90-day protocol', 'Pre-filled syringes — daily injections', 'Provider monitoring'],
    priceCents: 40000, billingType: 'program', duration: 3, durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },
  {
    id: 'pep-ghkcu-cream',
    name: 'GHK-Cu Cream (Topical)',
    category: 'peptide', subcategory: 'skin_hair',
    description: 'Topical copper peptide — skin repair, anti-aging',
    benefits: [
      'Apply directly to face, neck, or areas of concern for targeted collagen stimulation',
      'Non-invasive alternative to injectable GHK-Cu — great for needle-averse patients',
      'Can be combined with injectable protocol for maximum results',
      'Visible improvement in skin texture and tone within 4–6 weeks',
    ],
    bestFor: 'Patients wanting skin benefits without injections, combo with injectable GHK-Cu',
    included: ['Monthly supply', 'Topical application — face, neck, hands'],
    priceCents: 29900, billingType: 'monthly', duration: null, durationLabel: 'Monthly',
    paymentOptions: { monthly: true },
  },
  {
    id: 'pep-glow-10',
    name: 'GLOW — 10 Day',
    category: 'peptide', subcategory: 'skin_hair',
    description: 'GHK-Cu/BPC-157/TB-4 — skin recovery blend',
    benefits: ['Combines collagen stimulation (GHK-Cu) with tissue healing (BPC/TB-4)', 'Accelerates skin repair post-procedure or post-injury', 'Dual benefit: structural repair + cosmetic improvement'],
    bestFor: 'Post-procedure skin recovery, combination skin repair + rejuvenation',
    included: ['Pre-filled syringes', 'Skin-focused recovery blend', 'Take-home'],
    priceCents: 25000, billingType: 'flat', duration: null, durationLabel: '10 Days', paymentOptions: {},
  },
  {
    id: 'pep-glow-20',
    name: 'GLOW — 20 Day',
    category: 'peptide', subcategory: 'skin_hair',
    description: 'GHK-Cu/BPC-157/TB-4 — skin recovery blend',
    benefits: ['Extended collagen + recovery protocol', 'Most popular GLOW duration', 'Visible skin improvement by day 14–20'],
    bestFor: 'Deeper skin rejuvenation, extended post-procedure recovery',
    included: ['Pre-filled syringes', 'Skin-focused recovery blend', 'Take-home'],
    priceCents: 45000, billingType: 'flat', duration: null, durationLabel: '20 Days', paymentOptions: {},
  },
  {
    id: 'pep-glow-30',
    name: 'GLOW — 30 Day',
    category: 'peptide', subcategory: 'skin_hair',
    description: 'GHK-Cu/BPC-157/TB-4 — skin recovery blend',
    benefits: ['Full 30-day skin rejuvenation protocol', 'Maximum collagen and healing response', 'Best results for comprehensive anti-aging'],
    bestFor: 'Comprehensive skin transformation, maximum anti-aging results',
    included: ['Pre-filled syringes', 'Skin-focused recovery blend', 'Take-home'],
    priceCents: 67500, billingType: 'flat', duration: null, durationLabel: '30 Days', paymentOptions: {},
  },

  // ═══ PEPTIDES — LONGEVITY & IMMUNE ════════════════════════════════════════
  {
    id: 'pep-ta1',
    name: 'Thymosin Alpha-1',
    category: 'peptide', subcategory: 'longevity',
    description: 'Immune modulator — chronic illness, immune defense',
    benefits: [
      'FDA-approved in 35+ countries for immune modulation (hepatitis, cancer support)',
      'Restores T-cell function — critical for immune surveillance and pathogen defense',
      'Used preventatively during cold/flu season or when immunocompromised',
      'Safe for long-term use with minimal side effects',
    ],
    bestFor: 'Chronic illness, autoimmune conditions, frequent infections, immune optimization',
    included: ['Take-home vial', '2x/week dosing or as-needed when sick'],
    priceCents: 36300, billingType: 'flat', duration: null, durationLabel: 'Per vial', paymentOptions: {},
  },
  {
    id: 'pep-epithalon',
    name: 'Epithalon',
    category: 'peptide', subcategory: 'longevity',
    description: 'Telomere peptide — telomerase activation, anti-aging',
    benefits: [
      'Activates telomerase — the enzyme that lengthens protective caps on chromosomes',
      'Telomere shortening is a primary driver of biological aging',
      'Russian clinical studies showed improved cardiovascular and immune function in elderly',
      'Typically used in 10–20 day cycles, 2–3 times per year',
    ],
    bestFor: 'Longevity-focused patients, biological age optimization, preventative anti-aging',
    included: ['Take-home vial', '10mg daily for 10–20 days'],
    priceCents: 29700, billingType: 'flat', duration: null, durationLabel: 'Per vial', paymentOptions: {},
  },
  {
    id: 'pep-follistatin',
    name: 'Follistatin',
    category: 'peptide', subcategory: 'longevity',
    description: 'Myostatin inhibitor — lean muscle growth, body composition',
    benefits: [
      'Blocks myostatin — the protein that limits muscle growth — unlocking your genetic ceiling',
      'Promotes lean muscle gain without androgenic (hormonal) side effects',
      'Improves body composition by shifting the muscle-to-fat ratio',
      '20-day protocol cycles — run 2–3 times per year for cumulative results',
    ],
    bestFor: 'Athletes wanting lean mass, body recomposition, patients plateauing on GH protocols',
    included: ['Take-home vial', '200mcg daily x 20 days', 'Provider monitoring'],
    priceCents: 52800, billingType: 'flat', duration: null, durationLabel: '20 Days', paymentOptions: {},
  },
  {
    id: 'pep-ara290',
    name: 'ARA-290',
    category: 'peptide', subcategory: 'longevity',
    description: 'Neuroprotective — tissue repair, chronic inflammation',
    benefits: [
      'EPO-derived peptide that provides neuroprotection without blood-thickening effects of EPO',
      'Reduces chronic inflammation through innate repair receptor (IRR) activation',
      'Studied for diabetic neuropathy, sarcoidosis, and tissue repair',
      'Promotes healing in damaged nerves and tissues — complements BPC/TB-4 for complex cases',
    ],
    bestFor: 'Neuropathy, chronic inflammation, complex tissue damage, post-surgical nerve repair',
    included: ['Take-home vial', 'Daily injections', 'Provider monitoring'],
    priceCents: 29700, billingType: 'flat', duration: null, durationLabel: 'Per vial', paymentOptions: {},
  },
  {
    id: 'pep-hgh',
    name: 'HGH (Human Growth Hormone)',
    category: 'peptide', subcategory: 'longevity',
    description: 'Recombinant HGH — provider-directed optimization',
    benefits: [
      'Direct growth hormone replacement — most potent approach to GH optimization',
      'Improves body composition, bone density, exercise capacity, and skin quality',
      'Provider-directed dosing based on labs (IGF-1 levels) for safety and efficacy',
      'Gold standard for patients with confirmed GH deficiency or severe decline',
    ],
    bestFor: 'Confirmed GH deficiency, severe age-related decline, patients who need direct HGH vs secretagogues',
    included: ['100iu vial', 'Provider-directed dosing protocol', 'Lab monitoring (IGF-1)'],
    priceCents: 99000, billingType: 'flat', duration: null, durationLabel: 'Per vial', paymentOptions: {},
  },

  // ═══ PEPTIDES — SLEEP ═════════════════════════════════════════════════════
  {
    id: 'pep-dsip',
    name: 'DSIP',
    category: 'peptide', subcategory: 'sleep',
    description: 'Delta sleep-inducing peptide — deep sleep support',
    benefits: [
      'Promotes delta wave (deep) sleep — the most restorative sleep phase',
      'Non-addictive alternative to sleep medications with no morning grogginess',
      'Helps reset disrupted circadian rhythms (shift workers, travel, insomnia)',
      'As-needed dosing — take only on nights you need it',
    ],
    bestFor: 'Insomnia, poor sleep quality, shift workers, patients wanting to avoid sleep meds',
    included: ['Monthly supply', 'As-needed dosing before bed'],
    priceCents: 20000, billingType: 'monthly', duration: null, durationLabel: 'Monthly',
    paymentOptions: { monthly: true },
  },

  // ═══ PEPTIDES — SEXUAL HEALTH ═════════════════════════════════════════════
  {
    id: 'pep-pt141',
    name: 'PT-141 (Bremelanotide)',
    category: 'peptide', subcategory: 'sexual_health',
    description: 'Libido & sexual function — men and women',
    benefits: [
      'FDA-approved (as Vyleesi) for hypoactive sexual desire disorder in women',
      'Works on the brain\'s melanocortin system — targets desire itself, not just blood flow',
      'Effective in both men and women, unlike PDE5 inhibitors (Viagra/Cialis)',
      'As-needed dosing — take 45 minutes before activity',
    ],
    bestFor: 'Low libido (men or women), sexual dysfunction, ED not responsive to PDE5 inhibitors',
    included: ['Take-home vial', 'As-needed dosing — 45 min before activity'],
    priceCents: 13200, billingType: 'flat', duration: null, durationLabel: 'Per vial', paymentOptions: {},
  },

  // ═══ PEPTIDES — MITOCHONDRIAL & ENERGY ════════════════════════════════════
  {
    id: 'pep-ss31-30',
    name: 'SS-31 (Elamipretide) — 30 Day',
    category: 'peptide', subcategory: 'mitochondrial',
    description: 'Mitochondrial repair — cellular energy, anti-aging',
    benefits: [
      'Directly targets and repairs the inner mitochondrial membrane (cardiolipin)',
      'Restores cellular energy production at the source — every cell benefits',
      'Clinical trials for Barth syndrome, heart failure, and age-related mitochondrial decline',
      'One of the most promising longevity peptides — addresses root cause of aging',
    ],
    bestFor: 'Chronic fatigue, aging-related energy decline, mitochondrial dysfunction, longevity',
    included: ['Pre-filled syringes — 30 day supply', 'Daily 1mg injections', 'Provider monitoring'],
    priceCents: 75000, billingType: 'flat', duration: null, durationLabel: '30 Days', paymentOptions: {},
  },
  {
    id: 'pep90-nad-inj',
    name: 'NAD+ 100mg (Injectable) — 90 Day',
    category: 'peptide', subcategory: 'mitochondrial',
    description: 'Cellular energy, DNA repair, longevity',
    benefits: [
      'NAD+ is required by every cell for energy production — levels decline 50%+ by age 60',
      'Supports sirtuin activation — the "longevity genes" that regulate aging',
      'Daily injections maintain steady NAD+ levels vs single IV sessions',
      'Improves energy, mental clarity, and exercise recovery within 2–4 weeks',
    ],
    bestFor: 'Energy optimization, anti-aging, NAD+ maintenance between IV protocols',
    included: ['90-day protocol', 'Take-home vial', 'Provider monitoring'],
    priceCents: 60000, billingType: 'program', duration: 3, durationLabel: '90 Days',
    paymentOptions: { monthly: true, upfront: { discount: 0.20 } },
  },

  // ═══ PEPTIDES — VIALS (Self-Administer) ═══════════════════════════════════
  {
    id: 'vial-bpc-tb4',
    name: 'BPC-157 / TB-4 Vial',
    category: 'peptide', subcategory: 'vial',
    description: '10mg/10mg — 20 doses at 500mcg each',
    benefits: ['Same peptide, self-administered', '~20 days of daily use per vial', 'Most cost-effective option for experienced patients'],
    bestFor: 'Experienced patients comfortable with reconstitution and self-injection',
    included: ['10mg BPC-157 + 10mg TB-4 vial', 'Reconstitution supplies', 'Dosing guide'],
    priceCents: 33000, billingType: 'flat', duration: null, durationLabel: '~20 days', paymentOptions: {},
  },
  {
    id: 'vial-recovery-4blend',
    name: 'Recovery 4-Blend Vial',
    category: 'peptide', subcategory: 'vial',
    description: 'KPV/BPC/TB-4/MGF — 20 doses',
    benefits: ['Full 4-peptide recovery stack in one vial', '~20 days of daily use', 'Cost-effective alternative to pre-filled'],
    bestFor: 'Self-injecting patients wanting the full recovery stack',
    included: ['4-peptide blend vial', 'Reconstitution supplies', 'Dosing guide'],
    priceCents: 33000, billingType: 'flat', duration: null, durationLabel: '~20 days', paymentOptions: {},
  },
  {
    id: 'vial-2x-cjc',
    name: '2X Blend Vial — CJC/Ipa',
    category: 'peptide', subcategory: 'vial',
    description: '5mg/5mg — 10 doses, covers ~30 days (5 on / 2 off)',
    benefits: ['One vial covers a full 30-day phase', 'Significant savings vs pre-filled ($175 vs $400/month)', 'Requires reconstitution'],
    bestFor: 'Cost-conscious patients on 90-day GH protocols',
    included: ['CJC-1295/Ipamorelin vial', 'Reconstitution supplies', '30-day dosing guide'],
    priceCents: 17500, billingType: 'flat', duration: null, durationLabel: '~30 days', paymentOptions: {},
  },
  {
    id: 'vial-3x',
    name: '3X Blend Vial — Tesa/MGF/Ipa',
    category: 'peptide', subcategory: 'vial',
    description: '10 doses — covers ~30 days (5 on / 2 off)',
    benefits: ['Enhanced GH blend in vial form', 'One vial per 30-day phase', 'Significant savings vs pre-filled'],
    bestFor: 'Self-injecting patients on 3X blend protocol',
    included: ['3X blend vial', 'Reconstitution supplies', '30-day dosing guide with phase escalation'],
    priceCents: 17500, billingType: 'flat', duration: null, durationLabel: '~30 days', paymentOptions: {},
  },
  {
    id: 'vial-4x',
    name: '4X Blend Vial — GHRP-2/Tesa/MGF/Ipa',
    category: 'peptide', subcategory: 'vial',
    description: '10 doses — covers ~30 days (5 on / 2 off)',
    benefits: ['Maximum GH stack in vial form', 'One vial per 30-day phase', 'Best value for aggressive protocols'],
    bestFor: 'Self-injecting patients on 4X blend protocol',
    included: ['4X blend vial', 'Reconstitution supplies', '30-day dosing guide with phase escalation'],
    priceCents: 17500, billingType: 'flat', duration: null, durationLabel: '~30 days', paymentOptions: {},
  },
  {
    id: 'vial-ghkcu',
    name: 'GHK-Cu Vial',
    category: 'peptide', subcategory: 'vial',
    description: '50mg — 25-50 doses at 1-2mg each',
    benefits: ['25-50 day supply depending on dose', 'Same skin/hair/tissue benefits as pre-filled', 'Most cost-effective for extended protocols'],
    bestFor: 'Long-term GHK-Cu users, experienced self-injectors',
    included: ['50mg GHK-Cu vial', 'Reconstitution supplies', 'Dosing guide'],
    priceCents: 16500, billingType: 'flat', duration: null, durationLabel: '25-50 days', paymentOptions: {},
  },
  {
    id: 'vial-motsc',
    name: 'MOTS-C Vial',
    category: 'peptide', subcategory: 'vial',
    description: '10mg — 2-10 doses depending on protocol',
    benefits: ['Flexible dosing for metabolic optimization', 'Can run 20-day or 30-day protocol from one vial', 'Exercise mimetic at a fraction of pre-filled cost'],
    bestFor: 'Self-administering patients on metabolic protocols',
    included: ['10mg MOTS-C vial', 'Reconstitution supplies', 'Dosing guide'],
    priceCents: 17500, billingType: 'flat', duration: null, durationLabel: 'Variable', paymentOptions: {},
  },
  {
    id: 'vial-aod',
    name: 'AOD-9604 Vial',
    category: 'peptide', subcategory: 'vial',
    description: '~30 doses at 500mcg-1mg daily',
    benefits: ['30-day supply of fat-loss peptide', 'Significantly cheaper than pre-filled protocol', 'Can stack with GLP-1 at home'],
    bestFor: 'Self-injecting weight loss patients, GLP-1 stack complement',
    included: ['AOD-9604 vial', 'Reconstitution supplies', 'Dosing guide'],
    priceCents: 29700, billingType: 'flat', duration: null, durationLabel: '~30 days', paymentOptions: {},
  },
  {
    id: 'vial-nad',
    name: 'NAD+ Vial (1000mg)',
    category: 'peptide', subcategory: 'vial',
    description: '1000mg — 5-20 doses depending on injection dose',
    benefits: ['Self-administered NAD+ injections at home', 'Bridge between IV sessions', 'Flexible dosing (50-200mg per injection)'],
    bestFor: 'NAD+ maintenance between IV protocols, daily energy support',
    included: ['1000mg NAD+ vial', 'Dosing guide'],
    priceCents: 50000, billingType: 'flat', duration: null, durationLabel: '5-20 doses', paymentOptions: {},
  },
  {
    id: 'vial-dsip',
    name: 'DSIP Vial',
    category: 'peptide', subcategory: 'vial',
    description: '10mg — 10-20 doses as-needed',
    benefits: ['As-needed sleep support in vial form', '10-20 nights of use per vial', 'Non-addictive deep sleep aid'],
    bestFor: 'Self-injecting patients with intermittent sleep issues',
    included: ['10mg DSIP vial', 'Dosing guide'],
    priceCents: 13200, billingType: 'flat', duration: null, durationLabel: '10-20 doses', paymentOptions: {},
  },
  {
    id: 'vial-ss31',
    name: 'SS-31 Vial',
    category: 'peptide', subcategory: 'vial',
    description: '50mg — 25-50 doses at 1-2mg daily',
    benefits: ['25-50 day mitochondrial repair protocol', 'Premium longevity peptide', 'Direct mitochondrial membrane targeting'],
    bestFor: 'Longevity-focused patients, chronic fatigue, self-injectors',
    included: ['50mg SS-31 vial', 'Dosing guide'],
    priceCents: 46200, billingType: 'flat', duration: null, durationLabel: '25-50 days', paymentOptions: {},
  },
  {
    id: 'vial-epithalon',
    name: 'Epithalon Vial',
    category: 'peptide', subcategory: 'vial',
    description: '50mg — 5 doses at 10mg daily (10-day protocol)',
    benefits: ['Telomerase activation protocol', 'Run 2-3 cycles per year for longevity', '10-day intensive, then months off'],
    bestFor: 'Longevity-focused patients running periodic telomere protocols',
    included: ['50mg Epithalon vial', '10-20 day protocol guide'],
    priceCents: 29700, billingType: 'flat', duration: null, durationLabel: '10-20 days', paymentOptions: {},
  },
  {
    id: 'vial-pt141',
    name: 'PT-141 Vial',
    category: 'peptide', subcategory: 'vial',
    description: 'Multiple doses — as needed before activity',
    benefits: ['Libido support in vial form', 'As-needed dosing at home', 'Works for both men and women'],
    bestFor: 'Patients wanting at-home sexual health peptide access',
    included: ['PT-141 vial', 'Dosing guide'],
    priceCents: 13200, billingType: 'flat', duration: null, durationLabel: 'As needed', paymentOptions: {},
  },
  {
    id: 'vial-bpc157',
    name: 'BPC-157 Vial (Standalone)',
    category: 'peptide', subcategory: 'vial',
    description: '5mg — 10-20 doses at 250-500mcg',
    benefits: ['Targeted gut healing or tissue repair', 'Lower cost entry point vs combo vials', 'Flexible dosing'],
    bestFor: 'Gut-focused patients, single-peptide preference, budget-conscious',
    included: ['5mg BPC-157 vial', 'Reconstitution supplies', 'Dosing guide'],
    priceCents: 13200, billingType: 'flat', duration: null, durationLabel: '10-20 days', paymentOptions: {},
  },
  {
    id: 'vial-follistatin',
    name: 'Follistatin Vial',
    category: 'peptide', subcategory: 'vial',
    description: '200mcg daily x 20 days — myostatin inhibitor',
    benefits: ['Blocks myostatin to unlock muscle growth potential', '20-day protocol cycle', 'Run 2-3 cycles per year'],
    bestFor: 'Self-injecting athletes and body composition patients',
    included: ['Follistatin vial', 'Reconstitution supplies', '20-day protocol guide'],
    priceCents: 52800, billingType: 'flat', duration: null, durationLabel: '20 days', paymentOptions: {},
  },
  {
    id: 'vial-hgh',
    name: 'HGH Vial (100iu)',
    category: 'peptide', subcategory: 'vial',
    description: '100iu — provider-directed dosing',
    benefits: ['Direct growth hormone replacement', 'Provider-directed protocol', 'Gold standard for GH optimization'],
    bestFor: 'Confirmed GH deficiency, provider-directed HGH protocols',
    included: ['100iu HGH vial', 'Provider-directed dosing plan'],
    priceCents: 99000, billingType: 'flat', duration: null, durationLabel: 'Provider-directed', paymentOptions: {},
  },
  {
    id: 'vial-ara290',
    name: 'ARA-290 Vial',
    category: 'peptide', subcategory: 'vial',
    description: '1.6-4mg daily — neuroprotective',
    benefits: ['Neuroprotection and tissue repair', 'Reduces chronic inflammation', 'Complements recovery peptides'],
    bestFor: 'Self-injecting patients with neuropathy or chronic inflammation',
    included: ['ARA-290 vial', 'Reconstitution supplies', 'Dosing guide'],
    priceCents: 29700, billingType: 'flat', duration: null, durationLabel: 'Per vial', paymentOptions: {},
  },
  {
    id: 'vial-igf-lr3',
    name: 'IGF-LR3 Vial',
    category: 'peptide', subcategory: 'vial',
    description: '100-200mcg daily — growth factor',
    benefits: ['Direct growth factor for muscle hypertrophy', 'Long-acting IGF-1 analog', '7-day cycle protocol'],
    bestFor: 'Self-injecting athletes, targeted muscle growth',
    included: ['IGF-LR3 vial', 'Reconstitution supplies', 'Cycle guide'],
    priceCents: 29700, billingType: 'flat', duration: null, durationLabel: '7-day cycles', paymentOptions: {},
  },

  // ═══ NAD+ IV PROGRAMS ═════════════════════════════════════════════════════
  {
    id: 'nad-recharge',
    name: 'NAD+ Recharge — 3 Session',
    category: 'nad',
    description: 'Starter protocol — energy reset, brain fog relief',
    benefits: [
      'Three 500mg IV sessions over 7-10 days — 1,500mg total NAD+ delivered directly to bloodstream',
      'Most patients notice improved energy and mental clarity within the first week',
      'Ideal introduction to NAD+ therapy with manageable time commitment (2-3 hours per session)',
      'Significantly more effective than oral NAD+ supplements (which have ~5% bioavailability)',
    ],
    bestFor: 'First-time NAD+ patients, general energy boost, brain fog, mild fatigue',
    included: ['3 NAD+ IV sessions (500mg each)', '7-10 day protocol', 'Post-protocol maintenance plan'],
    priceCents: 150000,
    billingType: 'flat',
    duration: null,
    durationLabel: '7-10 Days',
    paymentOptions: {},
  },
  {
    id: 'nad-restore',
    name: 'NAD+ Restore — 5 Session',
    category: 'nad',
    description: 'Koniver-style protocol — cognitive restoration, anti-aging',
    benefits: [
      'Five 750mg sessions over 10-14 days — 3,750mg total (Dr. Koniver\'s recommended loading dose)',
      'Restores NAD+ levels that have declined 50%+ since age 20',
      'Supports sirtuin activation, DNA repair, and mitochondrial function systemically',
      'Patients report sustained energy, sharper cognition, and improved sleep for 4-6 weeks post-protocol',
    ],
    bestFor: 'Age-related cognitive decline, chronic fatigue, anti-aging, longevity optimization',
    included: ['5 NAD+ IV sessions (750mg each)', '10-14 day protocol', 'Post-protocol maintenance plan'],
    priceCents: 300000,
    billingType: 'flat',
    duration: null,
    durationLabel: '10-14 Days',
    paymentOptions: {},
  },
  {
    id: 'nad-reset',
    name: 'NAD+ Reset — 10 Session Intensive',
    category: 'nad',
    description: 'Deep recovery — severe depletion, post-COVID, neurological',
    benefits: [
      'Ten 750mg sessions over 3-4 weeks — 7,500mg total for complete cellular NAD+ restoration',
      'Based on protocols from Springfield Wellness Center and Koniver Wellness intensive programs',
      'Addresses severe NAD+ depletion from chronic illness, long COVID, or substance recovery',
      'Most comprehensive NAD+ protocol available — rebuilds cellular energy from the ground up',
    ],
    bestFor: 'Severe chronic fatigue, post-COVID recovery, substance recovery support, neurodegenerative conditions',
    included: ['10 NAD+ IV sessions (750mg each)', '3-4 week protocol', 'Post-protocol maintenance plan'],
    priceCents: 600000,
    billingType: 'flat',
    duration: null,
    durationLabel: '3-4 Weeks',
    paymentOptions: {},
  },
  {
    id: 'nad-maintenance',
    name: 'NAD+ Monthly Maintenance IV',
    category: 'nad',
    description: 'Monthly 500mg session to maintain elevated NAD+ levels',
    benefits: [
      'Sustains the NAD+ levels achieved during loading protocol',
      'Monthly session keeps cellular energy and cognitive benefits active',
      'Pairs perfectly with at-home NAD+ injection packs between visits',
      'Benefits typically last 4-6 weeks per session',
    ],
    bestFor: 'Post-loading maintenance, ongoing longevity optimization, monthly wellness ritual',
    included: ['1 NAD+ IV session (500mg)', '2-3 hour clinic visit'],
    priceCents: 52500,
    billingType: 'monthly',
    duration: null,
    durationLabel: 'Monthly',
    paymentOptions: { monthly: true, quarterly: { discount: 0.05 } },
  },

  // ═══ ADD-ONS ══════════════════════════════════════════════════════════════
  {
    id: 'addon-vitamin-package',
    name: 'Vitamin Injection Package',
    category: 'addon',
    description: 'Mon/Wed/Fri vitamin injections',
    benefits: [
      'Rotating vitamin injections bypass digestive absorption — 100% bioavailability',
      'Supports energy, metabolism, and immune function consistently throughout the week',
      'Most patients notice improved energy within the first week of 3x/week injections',
      'Creates regular clinic touchpoints for monitoring and accountability',
    ],
    bestFor: 'Any patient wanting enhanced energy and immune support, especially weight loss patients',
    included: ['3x weekly injections (rotating: B12, MIC-B12, L-Carnitine)', '~12 injections per month'],
    priceCents: 30000, billingType: 'monthly', duration: null, durationLabel: 'Monthly',
    paymentOptions: { monthly: true, quarterly: { discount: 0.05 } },
  },
  {
    id: 'addon-nad-12pack',
    name: 'NAD+ Injection 12-Pack',
    category: 'addon',
    description: 'Mon/Wed/Fri NAD+ injections (pay for 10, get 12)',
    benefits: [
      'Maintains elevated NAD+ levels between monthly IV sessions',
      'Quick IM injection — 2 minutes vs 2-4 hours for IV',
      'Pay for 10, get 12 — built-in savings',
      'Perfect maintenance bridge after NAD+ IV loading protocols',
    ],
    bestFor: 'NAD+ IV maintenance, energy support, patients wanting daily NAD+ without IV time',
    included: ['12 NAD+ IM injections', 'Mon/Wed/Fri schedule'],
    priceCents: 50000, billingType: 'flat', duration: null, durationLabel: '4 weeks',
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
    id: 'addon-range-iv',
    name: 'Range IV Session',
    category: 'addon',
    description: 'Signature IV — choose from 4 formulas',
    benefits: [
      'Direct-to-bloodstream hydration and nutrient delivery — bypasses GI tract entirely',
      'Choose from 4 goal-specific formulas curated by our providers',
      'Each formula includes 5 vitamins/minerals — add more at $35 each',
      'Most patients feel improvement within hours of infusion',
    ],
    bestFor: 'Immune support, energy boost, recovery, detox, or general wellness',
    included: ['Choice of 4 signature formulas', '5 curated vitamins/minerals', 'Additional nutrients available at $35 each'],
    priceCents: 22500, billingType: 'flat', duration: null, durationLabel: 'Per session', paymentOptions: {},
  },

  // ═══ SESSIONS & PACKS ════════════════════════════════════════════════════
  {
    id: 'hbot-intro',
    name: 'HBOT — Intro (3 Sessions)',
    category: 'session',
    description: 'Try hyperbaric oxygen therapy',
    benefits: ['Experience HBOT with no long-term commitment', 'Three sessions give you a real sense of how your body responds', 'Most patients notice improved sleep and energy by session 3'],
    bestFor: 'First-time HBOT patients, trial before committing to a pack or membership',
    included: ['3 HBOT sessions over 10 days', '60–90 min each'],
    priceCents: 14900, billingType: 'flat', duration: null, durationLabel: '10 Days', paymentOptions: {},
  },
  {
    id: 'hbot-5pack',
    name: 'HBOT — 5-Session Pack',
    category: 'session',
    description: '$170/session',
    benefits: ['Enough sessions for meaningful recovery or cognitive benefit', 'Save $75 vs single sessions', 'Flexible scheduling — use within 90 days'],
    bestFor: 'Targeted recovery, sports performance, post-surgery healing',
    included: ['5 HBOT sessions', '60–90 min each'],
    priceCents: 85000, billingType: 'flat', duration: null, durationLabel: '5 Sessions', paymentOptions: {},
  },
  {
    id: 'hbot-10pack',
    name: 'HBOT — 10-Session Pack',
    category: 'session',
    description: '$160/session',
    benefits: ['Research-backed session count for TBI, inflammation, and tissue repair', 'Save $250 vs single sessions', 'Best value for committed HBOT patients'],
    bestFor: 'TBI recovery, chronic inflammation, serious athletic recovery',
    included: ['10 HBOT sessions', '60–90 min each'],
    priceCents: 160000, billingType: 'flat', duration: null, durationLabel: '10 Sessions', paymentOptions: {},
  },
  {
    id: 'hbot-1x',
    name: 'HBOT Membership — 1x/Week',
    category: 'session',
    description: '4 sessions/mo — $137/session',
    benefits: ['Consistent weekly HBOT for cumulative anti-inflammatory and recovery benefits', 'Lowest per-session cost ($137)', '3-month commitment ensures therapeutic consistency'],
    bestFor: 'Ongoing recovery, longevity optimization, chronic conditions',
    included: ['4 HBOT sessions per month', '3-month minimum'],
    priceCents: 54900, billingType: 'monthly', duration: 3, durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'hbot-2x',
    name: 'HBOT Membership — 2x/Week',
    category: 'session',
    description: '8 sessions/mo — $125/session',
    benefits: ['Aggressive protocol for faster results', '$125/session — best per-session value', '2x/week is the most studied frequency for TBI and wound healing'],
    bestFor: 'Active recovery, TBI protocols, accelerated healing',
    included: ['8 HBOT sessions per month', '3-month minimum'],
    priceCents: 99900, billingType: 'monthly', duration: 3, durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'hbot-3x',
    name: 'HBOT Membership — 3x/Week',
    category: 'session',
    description: '12 sessions/mo — $117/session',
    benefits: ['Maximum frequency for fastest possible results', '$117/session — lowest rate available', 'Clinical trial protocols typically use 3-5x/week'],
    bestFor: 'Intensive recovery programs, severe injuries, performance athletes',
    included: ['12 HBOT sessions per month', '3-month minimum'],
    priceCents: 139900, billingType: 'monthly', duration: 3, durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'rlt-intro',
    name: 'RLT — Intro (3 Sessions)',
    category: 'session',
    description: 'Try red light therapy',
    benefits: ['Experience RLT with no commitment', 'Quick 10-20 min sessions', 'Most notice skin and energy improvements by session 3'],
    bestFor: 'First-time RLT patients',
    included: ['3 RLT sessions over 7 days', '10–20 min each'],
    priceCents: 4900, billingType: 'flat', duration: null, durationLabel: '7 Days', paymentOptions: {},
  },
  {
    id: 'rlt-5pack',
    name: 'RLT — 5-Session Pack',
    category: 'session',
    description: '$75/session',
    benefits: ['Save $50 vs single sessions', 'Enough for meaningful skin and recovery results'],
    bestFor: 'Skin improvement, inflammation, recovery support',
    included: ['5 RLT sessions', '10–20 min each'],
    priceCents: 37500, billingType: 'flat', duration: null, durationLabel: '5 Sessions', paymentOptions: {},
  },
  {
    id: 'rlt-10pack',
    name: 'RLT — 10-Session Pack',
    category: 'session',
    description: '$60/session',
    benefits: ['Save $250 vs single sessions', 'Best value for committed RLT therapy'],
    bestFor: 'Chronic inflammation, pain management, skin rejuvenation programs',
    included: ['10 RLT sessions', '10–20 min each'],
    priceCents: 60000, billingType: 'flat', duration: null, durationLabel: '10 Sessions', paymentOptions: {},
  },
  {
    id: 'rlt-membership',
    name: 'RLT Membership',
    category: 'session',
    description: 'Up to 12 sessions/mo — $33/session',
    benefits: ['Unlimited access up to 12 sessions/month', '$33/session — fraction of single-session cost', 'Consistent RLT delivers the best long-term results'],
    bestFor: 'Patients wanting regular RLT for skin, pain, or general wellness',
    included: ['Up to 12 RLT sessions per month', '3-month minimum'],
    priceCents: 39900, billingType: 'monthly', duration: 3, durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'combo-1x',
    name: 'HBOT + RLT — 1x/Week',
    category: 'session',
    description: '4 HBOT + 4 RLT per month',
    benefits: ['Synergistic combination: HBOT delivers oxygen, RLT activates mitochondria', 'Save vs purchasing separately', 'Both therapies enhance each other\'s benefits'],
    bestFor: 'Comprehensive recovery, anti-aging, cellular optimization',
    included: ['4 HBOT + 4 RLT sessions per month', '3-month minimum'],
    priceCents: 89900, billingType: 'monthly', duration: 3, durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'combo-2x',
    name: 'HBOT + RLT — 2x/Week',
    category: 'session',
    description: '8 HBOT + 8 RLT per month',
    benefits: ['Aggressive dual-therapy protocol', 'Maximum synergy between oxygen and light therapy', 'Best for serious recovery or performance goals'],
    bestFor: 'Athletes, intensive recovery, TBI + inflammation protocols',
    included: ['8 HBOT + 8 RLT sessions per month', '3-month minimum'],
    priceCents: 149900, billingType: 'monthly', duration: 3, durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'combo-3x',
    name: 'HBOT + RLT — 3x/Week',
    category: 'session',
    description: '12 HBOT + 12 RLT per month',
    benefits: ['Maximum frequency combo protocol', 'Clinical-grade recovery and optimization', 'Lowest per-session cost for both therapies'],
    bestFor: 'Peak performance, intensive rehabilitation, maximum longevity investment',
    included: ['12 HBOT + 12 RLT sessions per month', '3-month minimum'],
    priceCents: 199900, billingType: 'monthly', duration: 3, durationLabel: '3-month minimum',
    paymentOptions: { monthly: true, upfront: { discount: 0.10 } },
  },
  {
    id: 'cellular-reset',
    name: 'Six-Week Cellular Energy Reset',
    category: 'session',
    description: '18 HBOT + 18 RLT + weekly check-ins',
    benefits: [
      'Structured 6-week program with 36 total therapy sessions',
      'Weekly provider check-ins track objective progress',
      'Money-back guarantee — we stand behind this program',
      'Designed for patients who want a transformative, measurable outcome',
    ],
    bestFor: 'Chronic fatigue, post-COVID, patients wanting a defined program with accountability',
    included: ['18 HBOT sessions', '18 RLT sessions', 'Weekly provider check-ins', 'Money-back guarantee'],
    priceCents: 399900, billingType: 'flat', duration: null, durationLabel: '6 Weeks', paymentOptions: {},
  },
  {
    id: 'prp-single',
    name: 'PRP — Single Injection',
    category: 'session',
    description: 'Joint, tendon, hair, or facial',
    benefits: ['Uses your own blood\'s growth factors for natural healing', 'Concentrated platelets delivered directly to the injury site', 'Safe, natural, and effective for joint, tendon, and aesthetic applications'],
    bestFor: 'Joint pain, tendon injuries, hair restoration, facial rejuvenation',
    included: ['Single PRP injection', 'Blood draw + processing on-site'],
    priceCents: 75000, billingType: 'flat', duration: null, durationLabel: 'Single', paymentOptions: {},
  },
  {
    id: 'prp-3pack',
    name: 'PRP — 3-Injection Pack',
    category: 'session',
    description: '$600/session — save $450',
    benefits: ['Research shows 3 PRP sessions spaced 4-6 weeks apart delivers best outcomes', 'Save $450 vs single sessions', 'Cumulative growth factor response compounds with each treatment'],
    bestFor: 'Chronic joint issues, hair restoration programs, optimal PRP outcomes',
    included: ['3 PRP injections', 'Blood draw + processing on-site'],
    priceCents: 180000, billingType: 'flat', duration: null, durationLabel: '3 Sessions', paymentOptions: {},
  },
  // Specialty IVs
  {
    id: 'iv-nad-225',
    name: 'NAD+ IV — 225mg',
    category: 'session',
    description: '2–4 hour infusion',
    benefits: ['Entry-level NAD+ IV dose', 'Good for first-time patients to test tolerance', '2-4 hour session'],
    bestFor: 'First NAD+ IV experience, mild energy boost',
    included: ['NAD+ 225mg IV infusion', '2–4 hour session'],
    priceCents: 37500, billingType: 'flat', duration: null, durationLabel: 'Per session', paymentOptions: {},
  },
  {
    id: 'iv-nad-500',
    name: 'NAD+ IV — 500mg',
    category: 'session',
    description: '2–4 hour infusion',
    benefits: ['Standard therapeutic dose', 'Best benefit-to-tolerability ratio for most patients'],
    bestFor: 'Standard NAD+ therapy, maintenance sessions',
    included: ['NAD+ 500mg IV infusion', '2–4 hour session'],
    priceCents: 52500, billingType: 'flat', duration: null, durationLabel: 'Per session', paymentOptions: {},
  },
  {
    id: 'iv-nad-750',
    name: 'NAD+ IV — 750mg',
    category: 'session',
    description: '3–4 hour infusion',
    benefits: ['High-dose NAD+ for deep restoration', 'Used in Koniver-style loading protocols'],
    bestFor: 'Loading protocols, advanced NAD+ therapy',
    included: ['NAD+ 750mg IV infusion', '3–4 hour session'],
    priceCents: 65000, billingType: 'flat', duration: null, durationLabel: 'Per session', paymentOptions: {},
  },
  {
    id: 'iv-nad-1000',
    name: 'NAD+ IV — 1000mg',
    category: 'session',
    description: '4 hour infusion',
    benefits: ['Maximum single-session NAD+ dose', 'Intensive restoration for severe depletion'],
    bestFor: 'Maximum NAD+ delivery, severe depletion cases',
    included: ['NAD+ 1000mg IV infusion', '4 hour session'],
    priceCents: 77500, billingType: 'flat', duration: null, durationLabel: 'Per session', paymentOptions: {},
  },

  // ═══ LABS ═════════════════════════════════════════════════════════════════
  {
    id: 'lab-essential',
    name: 'Essential Lab Panel',
    category: 'lab',
    description: 'Hormones, thyroid, metabolic, lipids, CBC, vitamins, cortisol',
    benefits: [
      'Comprehensive baseline covering the markers that matter most for optimization',
      'Goes beyond standard annual bloodwork — includes hormone panel, cortisol, and vitamin levels',
      'Results feed into our AI analysis system for personalized treatment recommendations',
      'Required before starting any hormone or peptide protocol',
    ],
    bestFor: 'New patients, annual check-ups, pre-protocol baseline',
    included: ['Comprehensive hormone panel', 'Thyroid panel', 'Metabolic panel', 'Lipid panel', 'CBC', 'Vitamins', 'Cortisol', 'PSA (men)'],
    priceCents: 35000, billingType: 'flat', duration: null, durationLabel: 'One-time', paymentOptions: {},
  },
  {
    id: 'lab-elite',
    name: 'Elite Lab Panel',
    category: 'lab',
    description: 'Everything in Essential + cardiovascular, inflammation, IGF-1, ferritin',
    benefits: [
      'Most comprehensive panel — includes cardiovascular risk markers many clinics skip',
      'ApoB, Lp(a), hs-CRP, and homocysteine for true cardiovascular risk assessment',
      'IGF-1 for growth hormone status, ferritin for iron stores and inflammation',
      'Gold standard for longevity-focused patients who want the complete picture',
    ],
    bestFor: 'Longevity patients, cardiovascular risk assessment, comprehensive optimization',
    included: ['Everything in Essential Panel', 'Cardiovascular markers (ApoB, Lp(a))', 'Inflammation markers (hs-CRP, homocysteine)', 'IGF-1', 'Ferritin'],
    priceCents: 75000, billingType: 'flat', duration: null, durationLabel: 'One-time', paymentOptions: {},
  },
];

// ── Price helpers ────────────────────────────────────────────────────────────

export function formatPrice(cents) {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString()}`
    : `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Get the stepped total for a program with dose-based pricing that follows titration
export function getSteppedTotal(steppedPricing, duration) {
  let total = 0;
  const monthlyBreakdown = [];
  for (let m = 0; m < duration; m++) {
    const price = steppedPricing[Math.min(m, steppedPricing.length - 1)];
    total += price;
    monthlyBreakdown.push(price);
  }
  return { total, monthlyBreakdown };
}

export function calculatePricing(item, selectedOption, selectedDose, customDuration) {
  const baseCents = selectedDose?.priceCents || item.priceCents;
  const duration = customDuration || item.duration;

  if (item.billingType === 'flat') {
    return { monthly: null, total: baseCents, savings: 0, label: 'One-time' };
  }

  if (item.billingType === 'monthly' && !item.duration) {
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

  // Stepped pricing — price follows titration schedule
  if (item.steppedPricing) {
    const { total: steppedTotal, monthlyBreakdown } = getSteppedTotal(item.steppedPricing, duration);

    if (selectedOption === 'upfront') {
      const upfrontConfig = item.paymentOptions.upfront;
      let free = 0;
      let label = `Upfront (${duration} months)`;

      if (upfrontConfig?.monthsFree) {
        // Find the best matching tier (exact or next lower)
        const tiers = Object.keys(upfrontConfig.monthsFree).map(Number).sort((a, b) => a - b);
        for (const t of tiers) {
          if (duration >= t) free = upfrontConfig.monthsFree[t];
        }
        if (free > 0) label = `Pay ${duration - free}, get ${free} free`;
      } else if (upfrontConfig?.discount) {
        // Fallback to percentage discount
        const upfrontTotal = Math.round(steppedTotal * (1 - upfrontConfig.discount));
        return { monthly: null, total: upfrontTotal, savings: steppedTotal - upfrontTotal, label, monthlyBreakdown };
      }

      // Remove the most expensive months (maintenance = last months) as the "free" ones
      const paidMonths = duration - free;
      const paidBreakdown = monthlyBreakdown.slice(0, paidMonths);
      const paidTotal = paidBreakdown.reduce((a, b) => a + b, 0);
      const savings = steppedTotal - paidTotal;

      return { monthly: null, total: paidTotal, savings, label, monthlyBreakdown };
    }

    // Monthly — show average monthly and stepped total
    const avgMonthly = Math.round(steppedTotal / duration);
    return { monthly: avgMonthly, total: steppedTotal, savings: 0, label: `${duration} months (stepped)`, monthlyBreakdown };
  }

  // Non-stepped programs
  if (selectedOption === 'upfront') {
    const discount = item.paymentOptions.upfront?.discount || 0;
    const totalMonthly = baseCents * duration;
    const upfrontTotal = Math.round(totalMonthly * (1 - discount));
    const savings = totalMonthly - upfrontTotal;
    return { monthly: null, total: upfrontTotal, savings, label: `Upfront (${duration} months)` };
  }

  const totalMonthly = baseCents * duration;
  return { monthly: baseCents, total: totalMonthly, savings: 0, label: `${duration} months` };
}
