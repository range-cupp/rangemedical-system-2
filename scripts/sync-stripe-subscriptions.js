#!/usr/bin/env node
// scripts/sync-stripe-subscriptions.js
// Pulls all subscriptions from Stripe and syncs them to the local subscriptions table.
// Matches Stripe customers to patients via stripe_customer_id or email.
//
// Usage:
//   node scripts/sync-stripe-subscriptions.js              # Dry run
//   node scripts/sync-stripe-subscriptions.js --run         # Actually sync

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const args = process.argv.slice(2);
  const isRun = args.includes('--run');

  console.log(`\n💳 Stripe Subscription Sync`);
  console.log(`Mode: ${isRun ? '🟢 LIVE RUN' : '🔵 DRY RUN'}\n`);

  // Step 1: Fetch all subscriptions from Stripe (paginated)
  console.log('Fetching subscriptions from Stripe...');
  const allSubscriptions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = { limit: 100, expand: ['data.default_payment_method', 'data.latest_invoice'] };
    if (startingAfter) params.starting_after = startingAfter;

    const batch = await stripe.subscriptions.list(params);
    allSubscriptions.push(...batch.data);
    hasMore = batch.has_more;
    if (batch.data.length > 0) {
      startingAfter = batch.data[batch.data.length - 1].id;
    }
  }

  console.log(`Found ${allSubscriptions.length} subscriptions in Stripe\n`);

  // Count by status
  const byStatus = {};
  allSubscriptions.forEach(sub => {
    byStatus[sub.status] = (byStatus[sub.status] || 0) + 1;
  });
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  console.log('');

  // Step 2: Build patient lookup maps
  // Map by stripe_customer_id
  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, stripe_customer_id');

  const byStripeId = {};
  const byEmail = {};
  (patients || []).forEach(p => {
    if (p.stripe_customer_id) byStripeId[p.stripe_customer_id] = p;
    if (p.email) {
      const key = p.email.toLowerCase().trim();
      if (!byEmail[key]) byEmail[key] = p;
    }
  });

  console.log(`Patient lookup: ${Object.keys(byStripeId).length} by Stripe ID, ${Object.keys(byEmail).length} by email\n`);

  // Step 3: Match and prepare subscription records
  let matched = 0;
  let unmatched = 0;
  let newlyLinked = 0;
  const records = [];
  const unmatchedList = [];

  for (const sub of allSubscriptions) {
    const customerId = sub.customer;
    let patient = byStripeId[customerId];

    // If no match by stripe_customer_id, try by email
    if (!patient) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.email) {
          const emailKey = customer.email.toLowerCase().trim();
          patient = byEmail[emailKey];

          // If matched by email, link the stripe_customer_id
          if (patient && isRun) {
            await supabase
              .from('patients')
              .update({ stripe_customer_id: customerId })
              .eq('id', patient.id);
            newlyLinked++;
          }
        }

        if (!patient) {
          unmatched++;
          unmatchedList.push({
            sub_id: sub.id,
            customer_id: customerId,
            customer_name: customer.name || 'N/A',
            customer_email: customer.email || 'N/A',
            status: sub.status,
            amount: sub.items?.data?.[0]?.price?.unit_amount || 0,
          });
          continue;
        }
      } catch (err) {
        unmatched++;
        unmatchedList.push({
          sub_id: sub.id,
          customer_id: customerId,
          customer_name: 'Error fetching',
          customer_email: '',
          status: sub.status,
          amount: 0,
        });
        continue;
      }
    }

    matched++;

    // Extract subscription details
    const item = sub.items?.data?.[0];
    const price = item?.price;
    // Use latest invoice amount_paid to reflect discounts/coupons; fall back to base price
    const invoice = sub.latest_invoice && typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null;
    const amountCents = invoice?.amount_paid != null ? invoice.amount_paid : (price?.unit_amount || 0);
    const interval = price?.recurring?.interval || 'month';
    const intervalCount = price?.recurring?.interval_count || 1;
    const description = price?.nickname || item?.description || sub.description || price?.product?.name || '';

    // Try to determine service category from description or metadata
    let serviceCategory = sub.metadata?.service_category || null;
    if (!serviceCategory && description) {
      const desc = description.toLowerCase();
      if (desc.includes('hrt') || desc.includes('testosterone') || desc.includes('hormone')) {
        serviceCategory = 'hrt';
      } else if (desc.includes('weight') || desc.includes('tirzepatide') || desc.includes('semaglutide') || desc.includes('retatrutide')) {
        serviceCategory = 'weight_loss';
      } else if (desc.includes('hbot') || desc.includes('hyperbaric')) {
        serviceCategory = 'hbot';
      } else if (desc.includes('rlt') || desc.includes('red light')) {
        serviceCategory = 'rlt';
      } else if (desc.includes('peptide')) {
        serviceCategory = 'peptide';
      } else if (desc.includes('iv') || desc.includes('infusion')) {
        serviceCategory = 'iv';
      } else if (desc.includes('membership') || desc.includes('member')) {
        serviceCategory = 'membership';
      }
    }

    records.push({
      patient_id: patient.id,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      status: sub.status,
      amount_cents: amountCents,
      currency: price?.currency || 'usd',
      interval,
      interval_count: intervalCount,
      description: description || `Subscription (${sub.id})`,
      service_category: serviceCategory,
      current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end || false,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      started_at: sub.start_date ? new Date(sub.start_date * 1000).toISOString() : (sub.created ? new Date(sub.created * 1000).toISOString() : null),
      metadata: sub.metadata || {},
    });

    const patientName = `${patient.first_name} ${patient.last_name}`;
    const amountStr = `$${(amountCents / 100).toFixed(2)}/${interval}`;
    const statusEmoji = sub.status === 'active' ? '✅' : sub.status === 'canceled' ? '❌' : '⚠️';
    console.log(`  ${statusEmoji} ${patientName.padEnd(30)} ${amountStr.padEnd(15)} ${description || 'N/A'} (${sub.status})`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Matched to patients: ${matched}`);
  console.log(`  Newly linked by email: ${newlyLinked}`);
  console.log(`  Unmatched: ${unmatched}`);

  if (unmatchedList.length > 0) {
    console.log(`\n⚠️  Unmatched subscriptions:`);
    for (const u of unmatchedList) {
      console.log(`  ${u.customer_name} (${u.customer_email}) — ${u.status} — $${(u.amount / 100).toFixed(2)}`);
    }
  }

  if (!isRun) {
    console.log(`\n🔵 Dry run complete. Use --run to sync to database.`);
    return;
  }

  // Step 4: Upsert into subscriptions table
  console.log(`\nSyncing ${records.length} subscriptions to database...`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of records) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', record.stripe_subscription_id)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('subscriptions')
        .update({
          ...record,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', record.stripe_subscription_id);

      if (error) {
        console.error(`  ❌ Update failed for ${record.stripe_subscription_id}: ${error.message}`);
        errors++;
      } else {
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('subscriptions')
        .insert(record);

      if (error) {
        console.error(`  ❌ Insert failed for ${record.stripe_subscription_id}: ${error.message}`);
        errors++;
      } else {
        inserted++;
      }
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
