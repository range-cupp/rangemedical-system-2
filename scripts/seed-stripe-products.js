#!/usr/bin/env node

// scripts/seed-stripe-products.js
// Creates all Range Medical products & prices in Stripe, then seeds the pos_services table.
//
// Usage:
//   node scripts/seed-stripe-products.js              # uses live keys
//   node scripts/seed-stripe-products.js --test        # uses test keys
//   node scripts/seed-stripe-products.js --dry-run     # preview only, no API calls
//
// Requires: STRIPE_SECRET_KEY (or STRIPE_SECRET_KEY_TEST), NEXT_PUBLIC_SUPABASE_URL,
//           SUPABASE_SERVICE_ROLE_KEY in .env.local

// Load .env.local manually (no dotenv dependency)
const fs = require('fs');
const envPath = require('path').resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex);
  let value = trimmed.slice(eqIndex + 1);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = value;
}

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const args = process.argv.slice(2);
const isTest = args.includes('--test');
const isDryRun = args.includes('--dry-run');

const stripeKey = isTest ? process.env.STRIPE_SECRET_KEY_TEST : process.env.STRIPE_SECRET_KEY;
if (!stripeKey && !isDryRun) {
  console.error(`Missing ${isTest ? 'STRIPE_SECRET_KEY_TEST' : 'STRIPE_SECRET_KEY'}`);
  process.exit(1);
}

const stripe = isDryRun ? null : new Stripe(stripeKey);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ─────────────────────────────────────────────
// PRODUCT CATALOG
// ─────────────────────────────────────────────

const PRODUCTS = [
  // ── Programs ──
  {
    name: 'Six-Week Cellular Energy Reset',
    description: '18 HBOT + 18 Red Light sessions over 6 weeks. Structured protocol with weekly check-ins and money-back guarantee.',
    category: 'programs',
    prices: [{ amount: 399900, nickname: null }],
  },

  // ── Combo Memberships ──
  {
    name: 'Combo Membership — 1x/Week',
    description: '4 HBOT + 4 Red Light Therapy sessions per month. Both therapies back to back.',
    category: 'combo_membership',
    prices: [{ amount: 89900, nickname: null, recurring: true, commitment: '3_month_minimum' }],
  },
  {
    name: 'Combo Membership — 2x/Week',
    description: '8 HBOT + 8 Red Light Therapy sessions per month. Both therapies back to back.',
    category: 'combo_membership',
    prices: [{ amount: 149900, nickname: null, recurring: true, commitment: '3_month_minimum' }],
  },
  {
    name: 'Combo Membership — 3x/Week',
    description: '12 HBOT + 12 Red Light Therapy sessions per month. Both therapies back to back.',
    category: 'combo_membership',
    prices: [{ amount: 199900, nickname: null, recurring: true, commitment: '3_month_minimum' }],
  },

  // ── HBOT ──
  {
    name: 'HBOT — Single Session',
    description: '60-minute Hyperbaric Oxygen Therapy session.',
    category: 'hbot',
    prices: [{ amount: 18500, nickname: null }],
  },
  {
    name: 'HBOT — 5-Session Pack',
    description: '5 Hyperbaric Oxygen Therapy sessions. $170/session.',
    category: 'hbot',
    prices: [{ amount: 85000, nickname: null }],
  },
  {
    name: 'HBOT — 10-Session Pack',
    description: '10 Hyperbaric Oxygen Therapy sessions. $160/session.',
    category: 'hbot',
    prices: [{ amount: 160000, nickname: null }],
  },
  {
    name: 'HBOT Membership — 1x/Week',
    description: '4 HBOT sessions per month. Additional sessions at $150 each. 3-month minimum. $137/session — Save 26%.',
    category: 'hbot',
    prices: [{ amount: 54900, nickname: null, recurring: true, commitment: '3_month_minimum' }],
  },
  {
    name: 'HBOT Membership — 2x/Week',
    description: '8 HBOT sessions per month. Additional sessions at $150 each. 3-month minimum. $125/session — Save 32%.',
    category: 'hbot',
    prices: [{ amount: 99900, nickname: null, recurring: true, commitment: '3_month_minimum' }],
  },
  {
    name: 'HBOT Membership — 3x/Week',
    description: '12 HBOT sessions per month. Additional sessions at $150 each. 3-month minimum. $117/session — Save 37%.',
    category: 'hbot',
    prices: [{ amount: 139900, nickname: null, recurring: true, commitment: '3_month_minimum' }],
  },
  {
    name: 'HBOT — Additional Member Session',
    description: 'Additional HBOT session for active membership holders.',
    category: 'hbot',
    prices: [{ amount: 15000, nickname: null }],
  },

  // ── Red Light Therapy ──
  {
    name: 'Red Light Therapy — Single Session',
    description: 'Full-body Red Light Therapy session. 660–850nm wavelengths.',
    category: 'red_light',
    prices: [{ amount: 8500, nickname: null }],
  },
  {
    name: 'Red Light Therapy — 5-Session Pack',
    description: '5 Red Light Therapy sessions. $75/session.',
    category: 'red_light',
    prices: [{ amount: 37500, nickname: null }],
  },
  {
    name: 'Red Light Therapy — 10-Session Pack',
    description: '10 Red Light Therapy sessions. $60/session.',
    category: 'red_light',
    prices: [{ amount: 60000, nickname: null }],
  },
  {
    name: 'Red Light Reset Membership',
    description: 'Up to 12 Red Light Therapy sessions per month. Additional sessions at $50 each.',
    category: 'red_light',
    prices: [{ amount: 39900, nickname: null, recurring: true, commitment: '3_month_minimum' }],
  },
  {
    name: 'Red Light — Additional Member Session',
    description: 'Additional Red Light session for active membership holders.',
    category: 'red_light',
    prices: [{ amount: 5000, nickname: null }],
  },

  // ── HRT ──
  {
    name: 'HRT Monthly Membership',
    description: 'All medications, supplies, quarterly labs, 1 Range IV/month ($225 value), and ongoing provider support. Requires baseline labs.',
    category: 'hrt',
    prices: [{ amount: 25000, nickname: null, recurring: true }],
  },
  {
    name: 'Testosterone Booster (Oral) — 30 Day Supply',
    description: 'Oral testosterone booster. 30-day supply, take 2x per week. One-time purchase, auto-renews protocol.',
    category: 'hrt',
    prices: [{ amount: 17500, nickname: null }],
  },

  // ── Weight Loss ──
  {
    name: 'Tirzepatide — Weight Loss Program',
    description: 'Weekly injection. All supplies included. Requires baseline labs.',
    category: 'weight_loss',
    prices: [
      { amount: 39900, nickname: '2.5 mg/week', recurring: true },
      { amount: 54900, nickname: '5.0 mg/week', recurring: true },
      { amount: 59900, nickname: '7.5 mg/week', recurring: true },
      { amount: 64900, nickname: '10.0 mg/week', recurring: true },
      { amount: 69900, nickname: '12.5 mg/week', recurring: true },
    ],
  },
  {
    name: 'Retatrutide — Weight Loss Program',
    description: 'Weekly injection. All supplies included. Requires baseline labs.',
    category: 'weight_loss',
    prices: [
      { amount: 49900, nickname: '2 mg/week', recurring: true },
      { amount: 59900, nickname: '4 mg/week', recurring: true },
      { amount: 69900, nickname: '6 mg/week', recurring: true },
      { amount: 74900, nickname: '8 mg/week', recurring: true },
      { amount: 79900, nickname: '10 mg/week', recurring: true },
      { amount: 85900, nickname: '12 mg/week', recurring: true },
    ],
  },

  // ── IV Therapy ──
  {
    name: 'The Range IV',
    description: 'Customizable IV with 5 included vitamins/minerals. Choose from: Vitamin C, B-Complex, B12, Magnesium, Zinc, Glutathione, Amino Acids, L-Carnitine, NAC, Calcium, Biotin, Vitamin D3.',
    category: 'iv_therapy',
    prices: [{ amount: 22500, nickname: null }],
  },
  {
    name: 'Range IV — Additional Add-On',
    description: 'Additional vitamin/mineral add-on for The Range IV.',
    category: 'iv_therapy',
    prices: [{ amount: 3500, nickname: null }],
  },
  {
    name: 'Glutathione Push — 400mg',
    description: 'Glutathione push add-on. 400mg.',
    category: 'iv_therapy',
    prices: [{ amount: 7500, nickname: null }],
  },
  {
    name: 'Glutathione Push — 600mg',
    description: 'Glutathione push add-on. 600mg.',
    category: 'iv_therapy',
    prices: [{ amount: 10000, nickname: null }],
  },

  // ── Specialty IVs ──
  {
    name: 'Glutathione IV',
    description: 'Glutathione IV infusion.',
    category: 'specialty_iv',
    prices: [
      { amount: 17000, nickname: '1g' },
      { amount: 19000, nickname: '2g' },
      { amount: 21500, nickname: '3g' },
    ],
  },
  {
    name: 'High-Dose Vitamin C IV',
    description: 'High-dose Vitamin C IV infusion.',
    category: 'specialty_iv',
    prices: [
      { amount: 21500, nickname: '10g' },
      { amount: 22500, nickname: '15g' },
      { amount: 24000, nickname: '20g' },
      { amount: 25500, nickname: '25g' },
      { amount: 27000, nickname: '30g' },
      { amount: 28500, nickname: '35g' },
      { amount: 30000, nickname: '40g' },
      { amount: 31500, nickname: '45g' },
      { amount: 33000, nickname: '50g' },
      { amount: 34500, nickname: '55g' },
      { amount: 36000, nickname: '60g' },
      { amount: 37500, nickname: '65g' },
      { amount: 39000, nickname: '70g' },
      { amount: 40000, nickname: '75g' },
    ],
  },
  {
    name: 'Methylene Blue IV',
    description: 'Methylene Blue IV infusion.',
    category: 'specialty_iv',
    prices: [{ amount: 45000, nickname: null }],
  },
  {
    name: 'Methylene Blue + High Dose Vitamin C + Magnesium',
    description: 'Methylene Blue IV combined with High Dose Vitamin C and Magnesium.',
    category: 'specialty_iv',
    prices: [{ amount: 75000, nickname: null }],
  },
  {
    name: 'NAD+ IV — 225mg',
    description: 'NAD+ IV infusion. 225mg.',
    category: 'specialty_iv',
    prices: [{ amount: 37500, nickname: null }],
  },
  {
    name: 'NAD+ IV — 500mg',
    description: 'NAD+ IV infusion. 500mg.',
    category: 'specialty_iv',
    prices: [{ amount: 52500, nickname: null }],
  },
  {
    name: 'NAD+ IV — 750mg',
    description: 'NAD+ IV infusion. 750mg.',
    category: 'specialty_iv',
    prices: [{ amount: 65000, nickname: null }],
  },
  {
    name: 'NAD+ IV — 1000mg',
    description: 'NAD+ IV infusion. 1000mg.',
    category: 'specialty_iv',
    prices: [{ amount: 77500, nickname: null }],
  },

  // ── Injections — Standard ($35) ──
  {
    name: 'B12 Injection (Methylcobalamin)',
    description: 'B12 (Methylcobalamin) injection.',
    category: 'injection_standard',
    prices: [{ amount: 3500, nickname: null }],
  },
  {
    name: 'B-Complex Injection',
    description: 'B-Complex injection.',
    category: 'injection_standard',
    prices: [{ amount: 3500, nickname: null }],
  },
  {
    name: 'Vitamin D3 Injection',
    description: 'Vitamin D3 injection.',
    category: 'injection_standard',
    prices: [{ amount: 3500, nickname: null }],
  },
  {
    name: 'Biotin Injection',
    description: 'Biotin injection.',
    category: 'injection_standard',
    prices: [{ amount: 3500, nickname: null }],
  },
  {
    name: 'Amino Blend Injection',
    description: 'Amino Blend injection.',
    category: 'injection_standard',
    prices: [{ amount: 3500, nickname: null }],
  },
  {
    name: 'NAC Injection',
    description: 'NAC injection.',
    category: 'injection_standard',
    prices: [{ amount: 3500, nickname: null }],
  },
  {
    name: 'BCAA Injection',
    description: 'BCAA injection.',
    category: 'injection_standard',
    prices: [{ amount: 3500, nickname: null }],
  },

  // ── Injections — Premium ($50) ──
  {
    name: 'L-Carnitine Injection',
    description: 'L-Carnitine injection.',
    category: 'injection_premium',
    prices: [{ amount: 5000, nickname: null }],
  },
  {
    name: 'Glutathione Injection (200mg)',
    description: 'Glutathione injection. 200mg.',
    category: 'injection_premium',
    prices: [{ amount: 5000, nickname: null }],
  },
  {
    name: 'MIC-B12 Injection (Skinny Shot)',
    description: 'MIC-B12 (Skinny Shot) injection.',
    category: 'injection_premium',
    prices: [{ amount: 5000, nickname: null }],
  },

  // ── Injection Packs ──
  {
    name: 'Standard Injection 12-Pack',
    description: '12 injections per month (Mon/Wed/Fri). Buy 10, get 12. Any standard injection.',
    category: 'injection_pack',
    prices: [{ amount: 35000, nickname: null }],
  },
  {
    name: 'Premium Injection 12-Pack',
    description: '12 injections per month (Mon/Wed/Fri). Buy 10, get 12. Any premium injection.',
    category: 'injection_pack',
    prices: [{ amount: 50000, nickname: null }],
  },

  // ── NAD+ Injections ──
  {
    name: 'NAD+ Injection — 50mg',
    description: 'NAD+ subcutaneous injection. 50mg. ($0.50/mg)',
    category: 'nad_injection',
    prices: [{ amount: 2500, nickname: null }],
  },
  {
    name: 'NAD+ Injection — 75mg',
    description: 'NAD+ subcutaneous injection. 75mg.',
    category: 'nad_injection',
    prices: [{ amount: 3750, nickname: null }],
  },
  {
    name: 'NAD+ Injection — 100mg',
    description: 'NAD+ subcutaneous injection. 100mg.',
    category: 'nad_injection',
    prices: [{ amount: 5000, nickname: null }],
  },
  {
    name: 'NAD+ Injection — 125mg',
    description: 'NAD+ subcutaneous injection. 125mg.',
    category: 'nad_injection',
    prices: [{ amount: 6250, nickname: null }],
  },
  {
    name: 'NAD+ Injection — 150mg',
    description: 'NAD+ subcutaneous injection. 150mg.',
    category: 'nad_injection',
    prices: [{ amount: 7500, nickname: null }],
  },

  // ── DSIP Sleep Protocol ──
  {
    name: 'DSIP Protocol — Phase 1 (250 mcg)',
    description: 'Delta Sleep-Inducing Peptide, 250 mcg, PRN before bed. Pre-filled syringes. 4-week supply.',
    category: 'sleep',
    prices: [{ amount: 15000, nickname: null }],
  },
  {
    name: 'DSIP Protocol — Phase 2 (500 mcg)',
    description: 'Delta Sleep-Inducing Peptide, 500 mcg, PRN before bed. Pre-filled syringes. 4-week supply.',
    category: 'sleep',
    prices: [{ amount: 20000, nickname: null }],
  },
  {
    name: 'DSIP Protocol — Phase 3 (750 mcg)',
    description: 'Delta Sleep-Inducing Peptide, 750 mcg, PRN before bed. Pre-filled syringes. 4-week supply.',
    category: 'sleep',
    prices: [{ amount: 25000, nickname: null }],
  },
  {
    name: 'DSIP Protocol — Full 3-Phase Program',
    description: 'Complete DSIP sleep optimization program. Phases 1–3 (250 mcg → 500 mcg → 750 mcg). 12-week progressive protocol. Pre-filled syringes included.',
    category: 'sleep',
    prices: [{ amount: 60000, nickname: null }],
  },

  // ── Peptide Therapy ──
  {
    name: 'BDNF Peptide Protocol',
    description: 'BDNF (Brain-Derived Neurotrophic Factor) peptide protocol. Three-phase progression.',
    category: 'peptide',
    prices: [
      { amount: 15000, nickname: 'Phase 1' },
      { amount: 20000, nickname: 'Phase 2' },
      { amount: 25000, nickname: 'Phase 3' },
    ],
  },
  {
    name: 'Peptide Protocol — 10 Day',
    description: '10-day peptide protocol. Pre-filled syringes, 1 injection per day.',
    category: 'peptide',
    prices: [
      { amount: 15000, nickname: 'BPC-157 (500mcg)' },
      { amount: 22500, nickname: 'BPC-157 (750mcg)' },
      { amount: 25000, nickname: 'BPC-157 + Thymosin Beta-4' },
    ],
  },
  {
    name: 'Peptide Protocol — 20 Day',
    description: '20-day peptide protocol. Pre-filled syringes.',
    category: 'peptide',
    prices: [
      { amount: 27500, nickname: 'BPC-157 (500mcg)' },
      { amount: 40000, nickname: 'BPC-157 (750mcg)' },
      { amount: 45000, nickname: 'BPC-157 + Thymosin Beta-4' },
      { amount: 40000, nickname: 'MOTS-C (5mg)' },
      { amount: 70000, nickname: 'MOTS-C (10mg)' },
    ],
  },
  {
    name: 'Peptide Protocol — 30 Day',
    description: '30-day peptide protocol. Pre-filled syringes. Some protocols require labs.',
    category: 'peptide',
    prices: [
      { amount: 40000, nickname: 'BPC-157 (500mcg)' },
      { amount: 60000, nickname: 'BPC-157 (750mcg)' },
      { amount: 67500, nickname: 'BPC-157 + Thymosin Beta-4' },
      { amount: 50000, nickname: 'GLOW Blend (GHK-Cu + BPC-157 + TB-500)' },
      { amount: 25000, nickname: 'GHK-Cu (1mg daily)' },
      { amount: 35000, nickname: 'GHK-Cu (2mg daily)' },
      { amount: 40000, nickname: '2X Blend (1mg × 20 inj)' },
      { amount: 45000, nickname: '2X Blend (2mg × 20 inj)' },
      { amount: 50000, nickname: '2X Blend (3mg × 20 inj)' },
      { amount: 60000, nickname: '2X Blend (4mg × 20 inj)' },
      { amount: 42500, nickname: '3X Blend (1mg × 20 inj)' },
      { amount: 47500, nickname: '3X Blend (2mg × 20 inj)' },
      { amount: 52500, nickname: '3X Blend (3mg × 20 inj)' },
      { amount: 62500, nickname: '3X Blend (4mg × 20 inj)' },
      { amount: 45000, nickname: '4X Blend (1mg × 20 inj)' },
      { amount: 50000, nickname: '4X Blend (2mg × 20 inj)' },
      { amount: 55000, nickname: '4X Blend (3mg × 20 inj)' },
      { amount: 65000, nickname: '4X Blend (4mg × 20 inj)' },
    ],
  },

  // ── Vials ──
  {
    name: 'NAD+ 1000mg Vial',
    description: 'NAD+ 1000mg take-home vial for self-administration.',
    category: 'vials',
    prices: [{ amount: 50000, nickname: null }],
  },
  {
    name: 'BPC-157 / Thymosin-Beta 4 Vial',
    description: 'BPC-157 / Thymosin-Beta 4 combination take-home vial.',
    category: 'vials',
    prices: [{ amount: 40000, nickname: null }],
  },
  {
    name: 'MOTS-c Vial',
    description: 'MOTS-c take-home vial for self-administration.',
    category: 'vials',
    prices: [{ amount: 20000, nickname: null }],
  },
  {
    name: 'Tesamorelin / Ipamorelin Vial',
    description: 'Tesamorelin / Ipamorelin combination take-home vial.',
    category: 'vials',
    prices: [{ amount: 30000, nickname: null }],
  },
  {
    name: 'CJC-1295 / Ipamorelin Vial',
    description: 'CJC-1295 / Ipamorelin combination take-home vial.',
    category: 'vials',
    prices: [{ amount: 30000, nickname: null }],
  },
  {
    name: 'AOD-9604 Vial',
    description: 'AOD-9604 take-home vial for self-administration.',
    category: 'vials',
    prices: [{ amount: 30000, nickname: null }],
  },
  {
    name: 'GLOW Vial',
    description: 'GLOW blend take-home vial (GHK-Cu + BPC-157 + TB-500).',
    category: 'vials',
    prices: [{ amount: 40000, nickname: null }],
  },

  // ── Lab Panels ──
  {
    name: 'Essential Blood Panel — Male',
    description: 'CMP, Lipid, CBC, Hormones, Thyroid, Metabolism, Vitamin D. Includes provider review visit.',
    category: 'labs',
    prices: [{ amount: 35000, nickname: null }],
  },
  {
    name: 'Essential Blood Panel — Female',
    description: 'CMP, Lipid, CBC, Hormones, Thyroid, Metabolism, Vitamin D. Includes provider review visit.',
    category: 'labs',
    prices: [{ amount: 35000, nickname: null }],
  },
  {
    name: 'Elite Blood Panel — Male',
    description: 'Everything in Essential + Heart Health, Inflammation, expanded Hormones, Vitamins & Minerals. Includes provider review visit.',
    category: 'labs',
    prices: [{ amount: 75000, nickname: null }],
  },
  {
    name: 'Elite Blood Panel — Female',
    description: 'Everything in Essential + Heart Health, Inflammation, expanded Hormones, Vitamins & Minerals. Includes provider review visit.',
    category: 'labs',
    prices: [{ amount: 75000, nickname: null }],
  },

  // ── Regenerative (product only, no prices) ──
  {
    name: 'PRP Therapy — Consultation',
    description: 'Platelet-Rich Plasma therapy. Consultation required for pricing.',
    category: 'regenerative',
    prices: [],
  },
  {
    name: 'Exosome Therapy — Consultation',
    description: 'Exosome IV infusion therapy. Consultation required for pricing.',
    category: 'regenerative',
    prices: [],
  },

  // ── Assessment (free) ──
  {
    name: 'Range Assessment',
    description: 'Initial assessment for new patients. Two-door model: injury/recovery or health optimization.',
    category: 'assessment',
    prices: [{ amount: 0, nickname: null }],
  },
];

// ─────────────────────────────────────────────
// CATEGORY SORT ORDER (for pos_services)
// ─────────────────────────────────────────────
const CATEGORY_ORDER = [
  'programs', 'combo_membership', 'hbot', 'red_light', 'hrt', 'weight_loss',
  'iv_therapy', 'specialty_iv', 'injection_standard', 'injection_premium',
  'injection_pack', 'nad_injection', 'sleep', 'peptide', 'vials', 'labs', 'regenerative', 'assessment',
];

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log(`\n🏥 Range Medical — Stripe Product Seeder`);
  console.log(`   Mode: ${isTest ? 'TEST' : 'LIVE'}${isDryRun ? ' (DRY RUN)' : ''}\n`);

  let stripeResults = [];
  let posRows = [];
  let sortCounters = {}; // per-category sort counter

  for (const product of PRODUCTS) {
    const catIndex = CATEGORY_ORDER.indexOf(product.category);
    if (!sortCounters[product.category]) sortCounters[product.category] = 0;

    console.log(`  Creating: ${product.name} (${product.category})`);

    // 1. Create Stripe product
    let stripeProduct = null;
    if (!isDryRun) {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        active: true,
        metadata: { category: product.category },
      });
      console.log(`    ✓ Product: ${stripeProduct.id}`);
    }

    // 2. Create Stripe prices + build pos_services rows
    for (const p of product.prices) {
      const isRecurring = !!p.recurring;
      const priceParams = {
        product: stripeProduct?.id,
        currency: 'usd',
        unit_amount: p.amount,
        active: true,
        metadata: {},
      };
      if (p.nickname) priceParams.nickname = p.nickname;
      if (p.commitment) priceParams.metadata.commitment = p.commitment;
      if (isRecurring) {
        priceParams.recurring = { interval: 'month', interval_count: 1 };
      }

      let stripePrice = null;
      if (!isDryRun) {
        stripePrice = await stripe.prices.create(priceParams);
        console.log(`    ✓ Price: ${stripePrice.id} — $${(p.amount / 100).toFixed(2)}${isRecurring ? '/mo' : ''}${p.nickname ? ` (${p.nickname})` : ''}`);
      } else {
        console.log(`    [dry] Price: $${(p.amount / 100).toFixed(2)}${isRecurring ? '/mo' : ''}${p.nickname ? ` (${p.nickname})` : ''}`);
      }

      stripeResults.push({ product: stripeProduct?.id, price: stripePrice?.id, name: product.name, nickname: p.nickname });

      // Build the POS service row name
      let posName = product.name;
      if (p.nickname) posName = `${product.name} — ${p.nickname}`;

      sortCounters[product.category]++;

      posRows.push({
        name: posName,
        category: product.category,
        price: p.amount,
        recurring: isRecurring,
        interval: isRecurring ? 'month' : null,
        active: true,
        sort_order: (catIndex * 1000) + sortCounters[product.category],
      });
    }

    // Products with no prices (consultation-only) — no pos_services row
    if (product.prices.length === 0) {
      console.log(`    (no price — consultation only)`);
    }
  }

  // 3. Seed pos_services table
  console.log(`\n  Seeding pos_services table (${posRows.length} rows)...`);

  if (!isDryRun) {
    // Deactivate all existing services
    const { error: deactivateError } = await supabase
      .from('pos_services')
      .update({ active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // match all rows

    if (deactivateError) {
      console.error('  ✗ Failed to deactivate existing services:', deactivateError.message);
    } else {
      console.log('  ✓ Deactivated existing services');
    }

    // Insert new services in batches of 50
    for (let i = 0; i < posRows.length; i += 50) {
      const batch = posRows.slice(i, i + 50);
      const { error: insertError } = await supabase
        .from('pos_services')
        .insert(batch);

      if (insertError) {
        console.error(`  ✗ Insert batch ${i}-${i + batch.length} failed:`, insertError.message);
      }
    }
    console.log(`  ✓ Inserted ${posRows.length} services`);
  } else {
    console.log(`  [dry] Would deactivate existing and insert ${posRows.length} rows`);
  }

  // Summary
  console.log(`\n✅ Done!`);
  console.log(`   Stripe products created: ${PRODUCTS.length}`);
  console.log(`   Stripe prices created:   ${stripeResults.length}`);
  console.log(`   POS services seeded:     ${posRows.length}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
