#!/usr/bin/env node
// scripts/sync-stripe-customers.js
// Links existing Stripe customers to patients in Supabase by matching email or metadata.patient_id
// Once linked, saved cards automatically appear in the POS via the saved-cards API.
// Usage: node scripts/sync-stripe-customers.js [--dry-run]

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars from .env.local
const envPath = resolve(import.meta.dirname, '..', '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const DRY_RUN = process.argv.includes('--dry-run');

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log(`\n=== Stripe Customer Sync ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // Step 1: Fetch all patients
  console.log('Step 1: Fetching patients from Supabase...');
  const { data: patients, error: pErr } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, stripe_customer_id');

  if (pErr) {
    console.error('Failed to fetch patients:', pErr);
    process.exit(1);
  }
  console.log(`  Found ${patients.length} patients`);

  const alreadyLinked = patients.filter(p => p.stripe_customer_id);
  const unlinked = patients.filter(p => !p.stripe_customer_id);
  console.log(`  Already linked: ${alreadyLinked.length}`);
  console.log(`  Unlinked (need matching): ${unlinked.length}\n`);

  // Build email lookup map for unlinked patients
  const emailToPatients = {};
  for (const p of unlinked) {
    if (p.email) {
      const key = p.email.toLowerCase().trim();
      if (!emailToPatients[key]) emailToPatients[key] = [];
      emailToPatients[key].push(p);
    }
  }

  // Also build ID lookup for metadata matching
  const idToPatient = {};
  for (const p of unlinked) {
    idToPatient[p.id] = p;
  }

  // Step 2: Paginate through all Stripe customers
  console.log('Step 2: Fetching all Stripe customers...');
  const stripeCustomers = [];
  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const params = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    const batch = await stripe.customers.list(params);
    stripeCustomers.push(...batch.data);
    hasMore = batch.has_more;
    if (batch.data.length > 0) {
      startingAfter = batch.data[batch.data.length - 1].id;
    }
  }
  console.log(`  Found ${stripeCustomers.length} Stripe customers\n`);

  // Step 3: Match and link
  console.log('Step 3: Matching Stripe customers to patients...\n');
  const matched = [];
  const noMatch = [];
  const ambiguous = [];
  const alreadyHasCards = [];

  for (const sc of stripeCustomers) {
    // Skip deleted customers
    if (sc.deleted) continue;

    // Check if already linked to a patient
    if (alreadyLinked.some(p => p.stripe_customer_id === sc.id)) continue;

    // Try metadata.patient_id match first (most reliable)
    const metaPatientId = sc.metadata?.patient_id;
    if (metaPatientId && idToPatient[metaPatientId]) {
      const patient = idToPatient[metaPatientId];
      matched.push({ patient, stripeCustomer: sc, matchType: 'metadata' });
      delete idToPatient[metaPatientId]; // prevent double-match
      // Also remove from email map
      if (patient.email) {
        const key = patient.email.toLowerCase().trim();
        if (emailToPatients[key]) {
          emailToPatients[key] = emailToPatients[key].filter(p => p.id !== patient.id);
        }
      }
      continue;
    }

    // Try email match
    const email = sc.email?.toLowerCase()?.trim();
    if (email && emailToPatients[email]) {
      const candidates = emailToPatients[email];
      if (candidates.length === 1) {
        const patient = candidates[0];
        matched.push({ patient, stripeCustomer: sc, matchType: 'email' });
        delete emailToPatients[email];
        delete idToPatient[patient.id];
      } else if (candidates.length > 1) {
        ambiguous.push({ email, stripeId: sc.id, patientCount: candidates.length });
      }
      continue;
    }

    noMatch.push({ id: sc.id, email: sc.email, name: sc.name });
  }

  // Step 4: Report matches
  console.log(`  Matched: ${matched.length}`);
  console.log(`  No match: ${noMatch.length}`);
  console.log(`  Ambiguous (multiple patients same email): ${ambiguous.length}\n`);

  if (matched.length > 0) {
    console.log('--- MATCHES ---');
    console.log('Patient                          | Email                          | Stripe ID              | Match Type');
    console.log('-'.repeat(115));
    for (const m of matched) {
      const name = `${m.patient.first_name || ''} ${m.patient.last_name || ''}`.trim().padEnd(32);
      const email = (m.patient.email || '').padEnd(30);
      console.log(`${name} | ${email} | ${m.stripeCustomer.id.padEnd(22)} | ${m.matchType}`);
    }
    console.log('');
  }

  if (ambiguous.length > 0) {
    console.log('--- AMBIGUOUS (skipped) ---');
    for (const a of ambiguous) {
      console.log(`  ${a.email} — ${a.patientCount} patients share this email (Stripe: ${a.stripeId})`);
    }
    console.log('');
  }

  // Step 5: Write to database
  if (DRY_RUN) {
    console.log(`DRY RUN — would update ${matched.length} patient records. Run without --dry-run to apply.\n`);
    return;
  }

  if (matched.length === 0) {
    console.log('No new matches to write.\n');
    return;
  }

  console.log(`Step 4: Writing ${matched.length} stripe_customer_id values to patients table...\n`);
  let updated = 0;
  let failed = 0;

  for (const m of matched) {
    const { error } = await supabase
      .from('patients')
      .update({ stripe_customer_id: m.stripeCustomer.id })
      .eq('id', m.patient.id);

    if (error) {
      console.error(`  FAILED: ${m.patient.first_name} ${m.patient.last_name} — ${error.message}`);
      failed++;
    } else {
      updated++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${updated}, Failed: ${failed}`);
  console.log(`Saved cards will now automatically appear in the POS for these patients.\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
