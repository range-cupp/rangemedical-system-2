#!/usr/bin/env node

// scripts/create-rlt-payment-links.js
// Creates Stripe Payment Links for Red Light Therapy products
// Outputs the buy.stripe.com URLs to add to the website
//
// Usage:
//   node scripts/create-rlt-payment-links.js
//   node scripts/create-rlt-payment-links.js --list   (list existing payment links)

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

const listOnly = process.argv.includes('--list');

// RLT products we need payment links for
const RLT_PRODUCTS = [
  { search: 'Red Light Reset Membership', label: 'Membership ($399/mo)' },
  { search: 'Red Light Therapy — Single Session', label: 'Single Session ($85)' },
  { search: 'Red Light Therapy — 5-Session Pack', label: '5-Session Pack ($375)' },
  { search: 'Red Light Therapy — 10-Session Pack', label: '10-Session Pack ($600)' },
];

async function main() {
  console.log('\n🔴 Red Light Therapy — Stripe Payment Links\n');

  if (listOnly) {
    // List all existing payment links
    console.log('Listing all existing payment links...\n');
    const links = await stripe.paymentLinks.list({ limit: 100, active: true });

    for (const link of links.data) {
      // Get line items for this link
      const items = await stripe.paymentLinks.listLineItems(link.id, { limit: 5 });
      const priceIds = items.data.map(i => i.price.id);

      // Get product names
      const names = [];
      for (const item of items.data) {
        const price = await stripe.prices.retrieve(item.price.id, { expand: ['product'] });
        names.push(price.product.name);
      }

      console.log(`  ${link.url}`);
      console.log(`    Active: ${link.active}`);
      console.log(`    Products: ${names.join(', ')}`);
      console.log('');
    }

    if (links.data.length === 0) {
      console.log('  No active payment links found.');
    }
    return;
  }

  // Step 1: Find the RLT products in Stripe
  console.log('Step 1: Finding RLT products in Stripe...\n');

  const products = await stripe.products.list({ limit: 100, active: true });
  const rltProducts = products.data.filter(p =>
    p.name.includes('Red Light') && !p.name.includes('Combo')
  );

  if (rltProducts.length === 0) {
    console.log('  No Red Light products found in Stripe.');
    console.log('  Run the seed script first: node scripts/seed-stripe-products.js');
    return;
  }

  console.log(`  Found ${rltProducts.length} RLT products:`);
  for (const p of rltProducts) {
    console.log(`    - ${p.name} (${p.id})`);
  }

  // Step 2: Get prices for each product
  console.log('\nStep 2: Getting prices...\n');

  const productPrices = {};
  for (const product of rltProducts) {
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
    productPrices[product.name] = { product, prices: prices.data };
    for (const price of prices.data) {
      const amount = (price.unit_amount / 100).toFixed(2);
      const type = price.recurring ? `$${amount}/mo` : `$${amount}`;
      console.log(`    ${product.name}: ${price.id} — ${type}`);
    }
  }

  // Step 3: Create Payment Links
  console.log('\nStep 3: Creating Payment Links...\n');

  const results = [];

  for (const rltProduct of RLT_PRODUCTS) {
    const match = productPrices[rltProduct.search];
    if (!match || match.prices.length === 0) {
      console.log(`  ✗ No price found for: ${rltProduct.search}`);
      continue;
    }

    const price = match.prices[0]; // Use the first (usually only) price

    try {
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: {
          category: 'red_light',
          product_name: rltProduct.search
        },
      });

      console.log(`  ✓ ${rltProduct.label}`);
      console.log(`    URL: ${paymentLink.url}`);
      results.push({ label: rltProduct.label, url: paymentLink.url, search: rltProduct.search });
    } catch (err) {
      console.log(`  ✗ Failed: ${rltProduct.label} — ${err.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Payment Links Created — Add these to red-light-therapy.jsx:');
  console.log('='.repeat(60) + '\n');

  for (const r of results) {
    console.log(`  ${r.label}:`);
    console.log(`    ${r.url}\n`);
  }

  console.log('\nDone! Update pages/red-light-therapy.jsx with these URLs.\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
