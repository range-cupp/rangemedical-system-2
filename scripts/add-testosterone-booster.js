#!/usr/bin/env node

// scripts/add-testosterone-booster.js
// One-time script: Creates "Testosterone Booster (Oral) — 30 Day Supply" in Stripe + pos_services
// Usage: node scripts/add-testosterone-booster.js

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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('\n--- Adding Testosterone Booster (Oral) to Stripe + POS ---\n');

  // 1. Create Stripe product
  const product = await stripe.products.create({
    name: 'Testosterone Booster (Oral) — 30 Day Supply',
    description: 'Oral testosterone booster. 30-day supply, take 2x per week. One-time purchase, auto-renews protocol.',
    active: true,
    metadata: { category: 'hrt' },
  });
  console.log(`  Product created: ${product.id}`);

  // 2. Create Stripe price ($125 one-time)
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: 17500, // $175.00
    active: true,
  });
  console.log(`  Price created: ${price.id} — $175.00 (one-time)`);

  // 3. Add to pos_services table
  const { error } = await supabase
    .from('pos_services')
    .insert({
      name: 'Testosterone Booster (Oral) — 30 Day Supply',
      category: 'hrt',
      price: 17500,
      recurring: false,
      interval: null,
      active: true,
      sort_order: 5001, // After HRT Monthly Membership (category index 5 * 1000 + 1)
    });

  if (error) {
    console.error('  POS insert error:', error.message);
  } else {
    console.log('  POS service added');
  }

  console.log('\n  Done! Product is now available in POS checkout.\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
