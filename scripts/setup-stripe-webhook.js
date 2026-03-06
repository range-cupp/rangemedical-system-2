#!/usr/bin/env node

// scripts/setup-stripe-webhook.js
// Creates a Stripe webhook endpoint and outputs the signing secret

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

async function main() {
  console.log('\n🔗 Setting up Stripe Webhook...\n');

  // Check for existing webhook
  const existing = await stripe.webhookEndpoints.list({ limit: 50 });
  const existingHook = existing.data.find(w => w.url === 'https://app.range-medical.com/api/webhooks/stripe');

  if (existingHook) {
    console.log('  Found existing webhook:', existingHook.id);
    console.log('  Deleting to recreate with fresh secret...');
    await stripe.webhookEndpoints.del(existingHook.id);
    console.log('  Deleted.\n');
  }

  // Create new webhook endpoint
  const webhook = await stripe.webhookEndpoints.create({
    url: 'https://app.range-medical.com/api/webhooks/stripe',
    enabled_events: ['checkout.session.completed'],
    description: 'Purchase notification SMS to owner',
  });

  console.log('  ✓ Webhook created!');
  console.log(`  ID:     ${webhook.id}`);
  console.log(`  URL:    ${webhook.url}`);
  console.log(`  Events: ${webhook.enabled_events.join(', ')}`);
  console.log(`  Secret: ${webhook.secret}`);

  // Output the secret for env var setup
  console.log('\n' + '='.repeat(60));
  console.log('Add this to your environment:');
  console.log('='.repeat(60));
  console.log(`\nSTRIPE_WEBHOOK_SECRET=${webhook.secret}\n`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
