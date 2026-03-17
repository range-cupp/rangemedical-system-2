#!/usr/bin/env node
// Rename existing Stripe peptide products to generic "Peptide Therapy" names
// and add peptide_identifier metadata to their prices.
//
// This does NOT touch pos_services (already migrated) or create new products.
// It only updates existing Stripe products/prices in place.
//
// Usage:
//   node scripts/rename-stripe-peptides.js --dry-run   # preview only
//   node scripts/rename-stripe-peptides.js              # live update

const fs = require('fs');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');
const isTest = process.argv.includes('--test');

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
const stripeKey = isTest ? process.env.STRIPE_SECRET_KEY_TEST : process.env.STRIPE_SECRET_KEY;
if (!stripeKey && !isDryRun) {
  console.error(`Missing ${isTest ? 'STRIPE_SECRET_KEY_TEST' : 'STRIPE_SECRET_KEY'}`);
  process.exit(1);
}
const stripe = new Stripe(stripeKey);

// Known peptide compound names that appear in Stripe product names
// These will be detected and moved to metadata
const PEPTIDE_PATTERNS = [
  /^BPC[-\s]?157/i,
  /^Recovery\s*4[-\s]?Blend/i,
  /^MOTS[-\s]?C/i,
  /^GHK[-\s]?Cu/i,
  /^GLOW/i,
  /^BDNF/i,
  /^2X\s/i,
  /^3X\s/i,
  /^4X\s/i,
  /^NAD\+/i,
  /^CJC/i,
  /^Tesamorelin/i,
  /^AOD/i,
  /^DSIP/i,
];

function isPeptideProductName(name) {
  return PEPTIDE_PATTERNS.some(p => p.test(name));
}

function makeGenericName(originalName, category) {
  // Vials: "BPC-157 / Thymosin-Beta 4 Vial" → "Peptide Therapy — Vial"
  if (category === 'vials') {
    return 'Peptide Therapy — Vial';
  }
  // "Peptide Protocol — 30 Day" → "Peptide Therapy — 30 Day"
  // "BDNF Peptide Protocol" → "BDNF Peptide Therapy"
  const dashMatch = originalName.match(/^(.+?)\s*—\s*(.+)$/);
  if (dashMatch) {
    return `Peptide Therapy — ${dashMatch[2].trim()}`;
  }
  if (/BDNF/i.test(originalName)) {
    return 'BDNF Peptide Therapy';
  }
  return 'Peptide Therapy';
}

function extractPeptideId(originalName) {
  // "BPC-157/TB4 — 10 Day (Take-Home)" → "BPC-157/TB4"
  const dashMatch = originalName.match(/^(.+?)\s*—\s*(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  return originalName;
}

async function run() {
  console.log(`\nStripe Peptide Product Renamer${isDryRun ? ' (DRY RUN)' : ''}${isTest ? ' (TEST MODE)' : ''}\n`);

  // Fetch all active products
  let products = [];
  let hasMore = true;
  let startingAfter = null;

  console.log('Fetching Stripe products...');
  while (hasMore) {
    const params = { limit: 100, active: true };
    if (startingAfter) params.starting_after = startingAfter;
    const batch = await stripe.products.list(params);
    products = products.concat(batch.data);
    hasMore = batch.has_more;
    if (batch.data.length > 0) {
      startingAfter = batch.data[batch.data.length - 1].id;
    }
  }

  console.log(`Found ${products.length} total active products.\n`);

  // Filter to peptide products ONLY by metadata category
  // Don't match by name pattern — too many false positives (NAD+ IVs, injections, etc.)
  const peptideCategories = ['peptide', 'vials', 'sleep'];
  const peptideProducts = products.filter(p => {
    return peptideCategories.includes(p.metadata?.category);
  });

  console.log(`Found ${peptideProducts.length} peptide products to process.\n`);

  let updatedProducts = 0;
  let updatedPrices = 0;

  for (const product of peptideProducts) {
    const originalName = product.name;
    const alreadyGeneric = originalName.startsWith('Peptide Therapy');

    if (alreadyGeneric) {
      console.log(`  SKIP (already generic): ${originalName}`);
      continue;
    }

    const category = product.metadata?.category || 'peptide';
    const newName = makeGenericName(originalName, category);
    const peptideId = extractPeptideId(originalName);

    if (isDryRun) {
      console.log(`  [dry] Product "${originalName}" → "${newName}"`);
    } else {
      // Update product name and description
      await stripe.products.update(product.id, {
        name: newName,
        description: product.description
          ? product.description.replace(peptideId, 'peptide therapy')
          : undefined,
      });
      console.log(`  OK Product: "${originalName}" → "${newName}"`);
      updatedProducts++;
    }

    // Update prices for this product — add peptide_identifier metadata
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });

    for (const price of prices.data) {
      const priceLabel = price.nickname || `$${(price.unit_amount / 100).toFixed(2)}`;
      // Build peptide_identifier: for products with nicknames like "Phase 1",
      // prefix with the compound name (e.g., "BDNF — Phase 1")
      let pricePeptideId;
      if (category === 'vials') {
        // Vials: use the original product name as identifier (e.g., "BPC-157 / Thymosin-Beta 4 Vial")
        pricePeptideId = originalName;
      } else if (price.nickname && !isPeptideProductName(price.nickname)) {
        // Nickname is generic like "Phase 1" — prefix with compound name
        pricePeptideId = `${peptideId} — ${price.nickname}`;
      } else {
        pricePeptideId = price.nickname || peptideId;
      }

      if (price.metadata?.peptide_identifier) {
        console.log(`    SKIP price ${priceLabel} (metadata already set)`);
        continue;
      }

      if (isDryRun) {
        console.log(`    [dry] Price ${priceLabel} → metadata.peptide_identifier="${pricePeptideId}"`);
      } else {
        await stripe.prices.update(price.id, {
          metadata: {
            ...price.metadata,
            peptide_identifier: pricePeptideId,
          },
        });
        console.log(`    OK Price ${priceLabel} → metadata.peptide_identifier="${pricePeptideId}"`);
        updatedPrices++;
      }
    }
  }

  console.log(`\nDone! ${isDryRun ? 'Would update' : 'Updated'} ${updatedProducts} products and ${updatedPrices} prices.`);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
