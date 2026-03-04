#!/usr/bin/env node

// scripts/create-lab-payment-links.js
// Creates Stripe Payment Links for Lab Panel products
// Outputs the buy.stripe.com URLs to add to the website

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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const LAB_PRODUCTS = [
  { search: 'Essential Blood Panel — Male', label: 'Essential Male ($350)' },
  { search: 'Essential Blood Panel — Female', label: 'Essential Female ($350)' },
  { search: 'Elite Blood Panel — Male', label: 'Elite Male ($750)' },
  { search: 'Elite Blood Panel — Female', label: 'Elite Female ($750)' },
];

async function main() {
  console.log('\n🧪 Lab Panels — Stripe Payment Links\n');

  // Step 1: Find lab products in Stripe
  console.log('Step 1: Finding lab products in Stripe...\n');

  const products = await stripe.products.list({ limit: 100, active: true });
  const labProducts = products.data.filter(p =>
    p.name.includes('Blood Panel') || p.name.includes('Baseline Panel')
  );

  if (labProducts.length === 0) {
    console.log('  No lab products found in Stripe.');
    return;
  }

  console.log(`  Found ${labProducts.length} lab products:`);
  for (const p of labProducts) {
    console.log(`    - ${p.name} (${p.id})`);
  }

  // Step 2: Get prices for each product
  console.log('\nStep 2: Getting prices...\n');

  const productPrices = {};
  for (const product of labProducts) {
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
    productPrices[product.name] = { product, prices: prices.data };
    for (const price of prices.data) {
      const amount = (price.unit_amount / 100).toFixed(2);
      console.log(`    ${product.name}: ${price.id} — $${amount}`);
    }
  }

  // Step 3: Create Payment Links
  console.log('\nStep 3: Creating Payment Links...\n');

  const results = [];

  for (const labProduct of LAB_PRODUCTS) {
    const match = productPrices[labProduct.search];
    if (!match || match.prices.length === 0) {
      console.log(`  ✗ No price found for: ${labProduct.search}`);
      continue;
    }

    const price = match.prices[0];

    try {
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: {
          category: 'labs',
          product_name: labProduct.search
        },
      });

      console.log(`  ✓ ${labProduct.label}`);
      console.log(`    URL: ${paymentLink.url}`);
      results.push({ label: labProduct.label, url: paymentLink.url, search: labProduct.search });
    } catch (err) {
      console.log(`  ✗ Failed: ${labProduct.label} — ${err.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Payment Links Created — Add these to lab-panels.jsx:');
  console.log('='.repeat(60) + '\n');

  for (const r of results) {
    console.log(`  ${r.label}:`);
    console.log(`    ${r.url}\n`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
