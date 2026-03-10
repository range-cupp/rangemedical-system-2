#!/usr/bin/env node

// scripts/seed-vials.js
// Adds Vial products to Stripe + pos_services table.
//
// Usage:
//   node scripts/seed-vials.js              # live mode
//   node scripts/seed-vials.js --dry-run    # preview only

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
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

const isDryRun = process.argv.includes('--dry-run');
const stripe = isDryRun ? null : new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ─────────────────────────────────────────────
// VIAL PRODUCTS
// ─────────────────────────────────────────────

const VIALS = [
  {
    name: 'NAD+ 1000mg Vial',
    description: 'NAD+ 1000mg take-home vial for self-administration.',
    price: 50000, // $500
  },
  {
    name: 'BPC-157 / Thymosin-Beta 4 Vial',
    description: 'BPC-157 / Thymosin-Beta 4 combination take-home vial.',
    price: 40000, // $400
  },
  {
    name: 'MOTS-c Vial',
    description: 'MOTS-c take-home vial for self-administration.',
    price: 20000, // $200
  },
  {
    name: 'Tesamorelin / Ipamorelin Vial',
    description: 'Tesamorelin / Ipamorelin combination take-home vial.',
    price: 30000, // $300
  },
  {
    name: 'CJC-1295 / Ipamorelin Vial',
    description: 'CJC-1295 / Ipamorelin combination take-home vial.',
    price: 30000, // $300
  },
  {
    name: 'AOD-9604 Vial',
    description: 'AOD-9604 take-home vial for self-administration.',
    price: 30000, // $300
  },
  {
    name: 'GLOW Vial',
    description: 'GLOW blend take-home vial (GHK-Cu + BPC-157 + TB-500).',
    price: 40000, // $400
  },
];

// Sort order base: vials go after peptide (category index 13) → 13000+
const SORT_BASE = 13000;

async function main() {
  console.log(`\n🧪 Range Medical — Vial Product Seeder`);
  console.log(`   Mode: LIVE${isDryRun ? ' (DRY RUN)' : ''}\n`);

  const posRows = [];

  for (let i = 0; i < VIALS.length; i++) {
    const vial = VIALS[i];
    console.log(`  Creating: ${vial.name} — $${(vial.price / 100).toFixed(2)}`);

    let stripeProduct = null;
    let stripePrice = null;

    if (!isDryRun) {
      // Create Stripe product
      stripeProduct = await stripe.products.create({
        name: vial.name,
        description: vial.description,
        active: true,
        metadata: { category: 'vials' },
      });
      console.log(`    ✓ Product: ${stripeProduct.id}`);

      // Create Stripe price
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        currency: 'usd',
        unit_amount: vial.price,
        active: true,
      });
      console.log(`    ✓ Price: ${stripePrice.id}`);
    } else {
      console.log(`    [dry] Would create Stripe product + price`);
    }

    posRows.push({
      name: vial.name,
      category: 'vials',
      price: vial.price,
      recurring: false,
      interval: null,
      active: true,
      sort_order: SORT_BASE + i + 1,
    });
  }

  // Insert into pos_services
  console.log(`\n  Inserting ${posRows.length} vial services into pos_services...`);

  if (!isDryRun) {
    const { error } = await supabase
      .from('pos_services')
      .insert(posRows);

    if (error) {
      console.error(`  ✗ Insert failed:`, error.message);
      process.exit(1);
    }
    console.log(`  ✓ Inserted ${posRows.length} vial services`);
  } else {
    console.log(`  [dry] Would insert ${posRows.length} rows`);
    posRows.forEach(r => console.log(`    - ${r.name}: $${(r.price / 100).toFixed(2)}`));
  }

  console.log(`\n✅ Done!\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
