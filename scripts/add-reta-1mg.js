#!/usr/bin/env node
// One-off: Add Retatrutide 1mg single injection at $62.50

const fs = require('fs');
const path = require('path');
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
  console.log('Creating Retatrutide 1mg @ $62.50...\n');

  const product = await stripe.products.create({
    name: 'Retatrutide — Single Injection — 1 mg',
    description: 'Retatrutide single injection. 1mg dose.',
    active: true,
    metadata: { category: 'weight_loss' },
  });
  console.log('  ✓ Stripe Product:', product.id);

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: 6250,
    active: true,
  });
  console.log('  ✓ Stripe Price:', price.id, '— $62.50');

  const { error } = await supabase.from('pos_services').insert({
    name: 'Retatrutide — Single Injection — 1 mg',
    category: 'weight_loss',
    price: 6250,
    recurring: false,
    interval: null,
    active: true,
    sort_order: 5500,
  });

  if (error) {
    console.error('  ✗ DB insert failed:', error.message);
    process.exit(1);
  }

  console.log('  ✓ Inserted into pos_services');
  console.log('\n✅ Done!\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
