#!/usr/bin/env node
// Update GLOW 30-day price from $400 to $675 in both Stripe and pos_services.
//
// Stripe prices are immutable, so we:
//   1. Find the existing $400 GLOW price on the 30-day product
//   2. Create a new $675 price on the same product with same metadata
//   3. Archive the old price
//   4. Update pos_services.price_cents in Supabase
//
// Usage:
//   node scripts/update-glow-30day-price.js --dry-run   # preview only
//   node scripts/update-glow-30day-price.js              # live update

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

const OLD_AMOUNT = 50000; // $500
const NEW_AMOUNT = 67500; // $675

async function run() {
  console.log(`\nGLOW 30-Day Price Update ($400 → $675)${isDryRun ? ' (DRY RUN)' : ''}\n`);

  // 1. Find the Peptide Therapy — 30 Day product
  const products = await stripe.products.list({ limit: 100, active: true });
  const product30 = products.data.find(p =>
    p.name === 'Peptide Therapy — 30 Day' && p.metadata?.category === 'peptide'
  );

  if (!product30) {
    console.error('Could not find "Peptide Therapy — 30 Day" product in Stripe.');
    process.exit(1);
  }
  console.log(`Found product: ${product30.name} (${product30.id})`);

  // 2. Find the GLOW $400 price
  const prices = await stripe.prices.list({ product: product30.id, active: true, limit: 100 });
  const glowPrice = prices.data.find(p =>
    p.metadata?.peptide_identifier?.includes('GLOW')
  );

  if (!glowPrice) {
    console.error(`Could not find GLOW price on product ${product30.id}.`);
    console.log('Active prices:', prices.data.map(p => `${p.nickname || p.id}: $${p.unit_amount / 100} (${p.metadata?.peptide_identifier || 'no peptide_id'})`));
    process.exit(1);
  }
  console.log(`Found GLOW price: ${glowPrice.id} — $${glowPrice.unit_amount / 100} (nickname: ${glowPrice.nickname})`);

  if (isDryRun) {
    console.log(`\n[dry] Would create new price: $${NEW_AMOUNT / 100} with same metadata`);
    console.log(`[dry] Would archive old price: ${glowPrice.id}`);
  } else {
    // 3. Create new price at $675
    const newPrice = await stripe.prices.create({
      product: product30.id,
      unit_amount: NEW_AMOUNT,
      currency: 'usd',
      nickname: glowPrice.nickname,
      metadata: { ...glowPrice.metadata },
    });
    console.log(`Created new price: ${newPrice.id} — $${NEW_AMOUNT / 100}`);

    // 4. Archive old price
    await stripe.prices.update(glowPrice.id, { active: false });
    console.log(`Archived old price: ${glowPrice.id}`);

    // 5. Update default price on product if it was the old one
    if (product30.default_price === glowPrice.id) {
      await stripe.products.update(product30.id, { default_price: newPrice.id });
      console.log(`Updated default price on product to ${newPrice.id}`);
    }
  }

  // 6. Update pos_services
  console.log('\nUpdating pos_services...');
  const { data: rows, error: fetchErr } = await supabase
    .from('pos_services')
    .select('*')
    .eq('category', 'peptide')
    .ilike('peptide_identifier', '%GLOW%')
    .ilike('sub_category', '%30 Day%');

  if (fetchErr) {
    console.error('Fetch error:', fetchErr.message);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('No matching pos_services rows found. Trying broader search...');
    const { data: allPeptides } = await supabase
      .from('pos_services')
      .select('id, name, peptide_identifier, sub_category, price_cents')
      .eq('category', 'peptide')
      .eq('active', true);
    const glowRows = allPeptides.filter(r =>
      (r.peptide_identifier || '').toLowerCase().includes('glow') ||
      (r.name || '').toLowerCase().includes('glow')
    );
    console.log('GLOW rows found:', glowRows);
  }

  for (const row of rows) {
    if (row.price_cents === NEW_AMOUNT) {
      console.log(`  SKIP (already $675): ${row.peptide_identifier}`);
      continue;
    }

    if (isDryRun) {
      console.log(`  [dry] ${row.peptide_identifier}: $${row.price_cents / 100} → $${NEW_AMOUNT / 100}`);
    } else {
      const { error: updateErr } = await supabase
        .from('pos_services')
        .update({ price_cents: NEW_AMOUNT, updated_at: new Date().toISOString() })
        .eq('id', row.id);

      if (updateErr) {
        console.error(`  ERROR: ${updateErr.message}`);
      } else {
        console.log(`  OK: ${row.peptide_identifier} — $${row.price_cents / 100} → $${NEW_AMOUNT / 100}`);
      }
    }
  }

  console.log('\nDone!');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
