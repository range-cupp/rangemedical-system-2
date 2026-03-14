#!/usr/bin/env node
// One-off: Add BDNF Peptide Protocol — Phase 1 ($150), Phase 2 ($200), Phase 3 ($250)
// One Stripe product with 3 prices + 3 pos_services rows.

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

const PHASES = [
  { nickname: 'Phase 1', amount: 15000, sortOrder: 12100 },
  { nickname: 'Phase 2', amount: 20000, sortOrder: 12101 },
  { nickname: 'Phase 3', amount: 25000, sortOrder: 12102 },
];

async function main() {
  console.log('Creating BDNF Peptide Protocol in Stripe + pos_services...\n');

  // 1. Create one Stripe product
  const product = await stripe.products.create({
    name: 'BDNF Peptide Protocol',
    description: 'BDNF (Brain-Derived Neurotrophic Factor) peptide protocol. Three-phase progression.',
    active: true,
    metadata: { category: 'peptide' },
  });
  console.log('  ✓ Stripe Product:', product.id);

  // 2. Create 3 prices + 3 pos_services rows
  for (const phase of PHASES) {
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: phase.amount,
      active: true,
      nickname: phase.nickname,
    });
    console.log(`  ✓ Stripe Price: ${price.id} — ${phase.nickname} $${(phase.amount / 100).toFixed(2)}`);

    const { error } = await supabase.from('pos_services').insert({
      name: `BDNF Peptide Protocol — ${phase.nickname}`,
      category: 'peptide',
      price: phase.amount,
      recurring: false,
      interval: null,
      active: true,
      sort_order: phase.sortOrder,
    });

    if (error) {
      console.error(`  ✗ DB insert failed for ${phase.nickname}:`, error.message);
      process.exit(1);
    }
    console.log(`  ✓ pos_services: BDNF Peptide Protocol — ${phase.nickname}`);
  }

  console.log('\n✅ Done! BDNF Protocol (Phase 1–3) added to Stripe and pos_services.\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
