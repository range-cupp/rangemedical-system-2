#!/usr/bin/env node
// Add BDNF Phase 1/2/3 as prices on the "Peptide Therapy — 30 Day" Stripe product
// and create matching pos_services rows.
//
// Usage:
//   node scripts/add-bdnf-30day.js --dry-run   # preview only
//   node scripts/add-bdnf-30day.js              # live

const fs = require('fs');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');

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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BDNF_PHASES = [
  { nickname: 'BDNF Phase 1', peptide_identifier: 'BDNF Phase 1', amount: 15000 },
  { nickname: 'BDNF Phase 2', peptide_identifier: 'BDNF Phase 2', amount: 20000 },
  { nickname: 'BDNF Phase 3', peptide_identifier: 'BDNF Phase 3', amount: 25000 },
];

async function run() {
  console.log(`\nAdd BDNF 30-Day Phases${isDryRun ? ' (DRY RUN)' : ''}\n`);

  // 1. Find the "Peptide Therapy — 30 Day" product
  const products = await stripe.products.list({ limit: 100, active: true });
  const product30 = products.data.find(p =>
    p.name === 'Peptide Therapy — 30 Day' && p.metadata?.category === 'peptide'
  );

  if (!product30) {
    console.error('Could not find "Peptide Therapy — 30 Day" product in Stripe.');
    process.exit(1);
  }
  console.log(`Found product: ${product30.name} (${product30.id})\n`);

  // 2. Check existing prices to avoid duplicates
  const existingPrices = await stripe.prices.list({ product: product30.id, active: true, limit: 100 });
  const existingBDNF = existingPrices.data.filter(p =>
    (p.metadata?.peptide_identifier || '').includes('BDNF')
  );
  if (existingBDNF.length > 0) {
    console.log('Existing BDNF prices on this product:');
    existingBDNF.forEach(p => console.log(`  ${p.nickname}: $${p.unit_amount / 100} (${p.id})`));
    console.log('');
  }

  // 3. Get max sort_order for 30-day peptides
  const { data: existing30Day } = await supabase
    .from('pos_services')
    .select('sort_order')
    .eq('category', 'peptide')
    .ilike('sub_category', '%30 Day%')
    .order('sort_order', { ascending: false })
    .limit(1);

  let nextSortOrder = (existing30Day?.[0]?.sort_order || 0) + 1;

  // 4. Create prices and pos_services rows
  for (const phase of BDNF_PHASES) {
    // Check if this exact phase already exists
    const alreadyExists = existingBDNF.find(p =>
      p.metadata?.peptide_identifier === phase.peptide_identifier
    );

    if (alreadyExists) {
      console.log(`SKIP Stripe (already exists): ${phase.nickname} — $${alreadyExists.unit_amount / 100}`);
    } else if (isDryRun) {
      console.log(`[dry] Would create Stripe price: ${phase.nickname} — $${phase.amount / 100}`);
    } else {
      const newPrice = await stripe.prices.create({
        product: product30.id,
        unit_amount: phase.amount,
        currency: 'usd',
        nickname: phase.nickname,
        metadata: {
          peptide_identifier: phase.peptide_identifier,
        },
      });
      console.log(`OK Stripe price: ${phase.nickname} — $${phase.amount / 100} (${newPrice.id})`);
    }

    // Check if pos_services row already exists
    const { data: existingRow } = await supabase
      .from('pos_services')
      .select('id, name, peptide_identifier, price_cents')
      .eq('category', 'peptide')
      .eq('peptide_identifier', phase.peptide_identifier)
      .ilike('sub_category', '%30 Day%');

    if (existingRow && existingRow.length > 0) {
      console.log(`SKIP pos_services (already exists): ${phase.peptide_identifier} — $${existingRow[0].price_cents / 100}`);
    } else if (isDryRun) {
      console.log(`[dry] Would create pos_services: ${phase.peptide_identifier} — $${phase.amount / 100} (sort: ${nextSortOrder})`);
    } else {
      const { error } = await supabase
        .from('pos_services')
        .insert({
          name: 'Peptide Therapy — 30 Day',
          category: 'peptide',
          sub_category: 'Peptide Therapy — 30 Day',
          peptide_identifier: phase.peptide_identifier,
          price_cents: phase.amount,
          active: true,
          sort_order: nextSortOrder,
        });

      if (error) {
        console.error(`ERROR pos_services: ${phase.peptide_identifier} — ${error.message}`);
      } else {
        console.log(`OK pos_services: ${phase.peptide_identifier} — $${phase.amount / 100} (sort: ${nextSortOrder})`);
      }
    }
    nextSortOrder++;
    console.log('');
  }

  console.log('Done!');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
