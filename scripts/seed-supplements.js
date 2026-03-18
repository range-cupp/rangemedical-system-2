#!/usr/bin/env node

// scripts/seed-supplements.js
// Creates Range Medical supplement products in Stripe and seeds pos_services.
//
// Usage:
//   node scripts/seed-supplements.js              # uses live keys
//   node scripts/seed-supplements.js --test        # uses test keys
//   node scripts/seed-supplements.js --dry-run     # preview only, no API calls

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
// SUPPLEMENT PRODUCTS
// ─────────────────────────────────────────────

const SUPPLEMENTS = [
  {
    name: 'Vitamin D3 + K2',
    description: 'Vitamin D3 with K2 supplement.',
    price: 3200,  // $32
    sort_order: 1,
  },
  {
    name: 'DIM 200 + CDG 100',
    description: 'DIM 200mg plus Calcium D-Glucarate 100mg supplement.',
    price: 3000,  // $30
    sort_order: 2,
  },
  {
    name: 'NAC with Milk Thistle',
    description: 'N-Acetyl Cysteine with Milk Thistle supplement.',
    price: 2500,  // $25
    sort_order: 3,
  },
  {
    name: 'Multivitamin — 60 Capsules',
    description: 'Multivitamin supplement, 60 capsules.',
    price: 4500,  // $45
    sort_order: 4,
  },
  {
    name: 'Omega-3 with CoQ10',
    description: 'Omega-3 fatty acids with Coenzyme Q10 supplement.',
    price: 5000,  // $50
    sort_order: 5,
  },
  {
    name: 'Red Yeast Rice',
    description: 'Red Yeast Rice supplement for cardiovascular support.',
    price: 4500,  // $45
    sort_order: 6,
  },
];

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log(`\n💊 Range Medical — Supplement Seeder`);
  console.log(`   Mode: ${isTest ? 'TEST' : 'LIVE'}${isDryRun ? ' (DRY RUN)' : ''}\n`);

  const posRows = [];

  for (const supp of SUPPLEMENTS) {
    console.log(`  Creating: ${supp.name} — $${(supp.price / 100).toFixed(2)}`);

    // 1. Create Stripe product
    let stripeProduct = null;
    if (!isDryRun) {
      stripeProduct = await stripe.products.create({
        name: supp.name,
        description: supp.description,
        active: true,
        metadata: { category: 'supplements' },
      });
      console.log(`    ✓ Product: ${stripeProduct.id}`);
    }

    // 2. Create Stripe price
    if (!isDryRun) {
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        currency: 'usd',
        unit_amount: supp.price,
        active: true,
      });
      console.log(`    ✓ Price: ${stripePrice.id} — $${(supp.price / 100).toFixed(2)}`);
    } else {
      console.log(`    [dry] Price: $${(supp.price / 100).toFixed(2)}`);
    }

    // 3. Build POS row
    posRows.push({
      name: supp.name,
      category: 'supplements',
      price_cents: supp.price,
      recurring: false,
      interval: null,
      active: true,
      sort_order: 15000 + supp.sort_order,  // supplements category index ~15
    });
  }

  // 4. Insert into pos_services
  console.log(`\n  Inserting ${posRows.length} supplements into pos_services...`);

  if (!isDryRun) {
    const { error } = await supabase
      .from('pos_services')
      .insert(posRows);

    if (error) {
      console.error('  ✗ Insert failed:', error.message);
    } else {
      console.log(`  ✓ Inserted ${posRows.length} supplements`);
    }
  } else {
    console.log(`  [dry] Would insert ${posRows.length} rows`);
  }

  console.log(`\n✅ Done! ${SUPPLEMENTS.length} supplement products created.\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
