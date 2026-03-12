#!/usr/bin/env node
// scripts/link-stripe-customers.js
// Links all patients to their Stripe customer records by matching email.
// Also syncs any subscriptions for newly linked patients.

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('\n🔗 Stripe Customer Linker\n');

  // Step 1: Get all patients without stripe_customer_id
  const { data: unlinked } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email')
    .is('stripe_customer_id', null);

  console.log(`Patients without Stripe link: ${unlinked.length}`);

  // Step 2: Get ALL Stripe customers (paginated)
  const allCustomers = [];
  let hasMore = true;
  let startingAfter = null;
  while (hasMore) {
    const params = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    const batch = await stripe.customers.list(params);
    allCustomers.push(...batch.data);
    hasMore = batch.has_more;
    if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
  }
  console.log(`Total Stripe customers: ${allCustomers.length}`);

  // Build email lookup
  const stripeByEmail = {};
  allCustomers.forEach(c => {
    if (c.email) stripeByEmail[c.email.toLowerCase().trim()] = c;
  });

  // Step 3: Link all matches
  let linked = 0;
  for (const p of unlinked) {
    if (p.email) {
      const key = p.email.toLowerCase().trim();
      const stripeCustomer = stripeByEmail[key];
      if (stripeCustomer) {
        const { error } = await supabase
          .from('patients')
          .update({ stripe_customer_id: stripeCustomer.id })
          .eq('id', p.id);

        if (error) {
          console.log(`  ❌ Failed: ${p.first_name} ${p.last_name} — ${error.message}`);
        } else {
          console.log(`  ✅ ${p.first_name || '?'} ${p.last_name || '?'} → ${stripeCustomer.id}`);
          linked++;
        }
      }
    }
  }

  console.log(`\n🔗 Linked ${linked} patients to Stripe\n`);

  // Step 4: Sync subscriptions for ALL linked patients
  console.log('Syncing subscriptions...');
  const { data: allPatients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, stripe_customer_id')
    .not('stripe_customer_id', 'is', null);

  let subsSynced = 0;
  let subsNew = 0;
  for (const p of allPatients) {
    try {
      const subs = await stripe.subscriptions.list({ customer: p.stripe_customer_id, limit: 100 });
      for (const sub of subs.data) {
        const item = sub.items?.data?.[0];
        const price = item?.price;

        // Determine service category
        let serviceCategory = sub.metadata?.service_category || null;
        const desc = (price?.nickname || item?.description || sub.description || '').toLowerCase();
        if (!serviceCategory && desc) {
          if (desc.includes('hrt') || desc.includes('testosterone') || desc.includes('hormone')) {
            serviceCategory = 'hrt';
          } else if (desc.includes('weight') || desc.includes('tirzepatide') || desc.includes('semaglutide')) {
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

        const record = {
          patient_id: p.id,
          stripe_subscription_id: sub.id,
          stripe_customer_id: p.stripe_customer_id,
          status: sub.status,
          amount_cents: price?.unit_amount || 0,
          currency: price?.currency || 'usd',
          interval: price?.recurring?.interval || 'month',
          interval_count: price?.recurring?.interval_count || 1,
          description: price?.nickname || item?.description || sub.description || `Subscription (${sub.id})`,
          service_category: serviceCategory,
          current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end || false,
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          started_at: sub.created ? new Date(sub.created * 1000).toISOString() : null,
          metadata: sub.metadata || {},
        };

        // Check if exists
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('subscriptions')
            .update({ ...record, updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', sub.id);
          subsSynced++;
        } else {
          await supabase.from('subscriptions').insert(record);
          subsNew++;
          subsSynced++;
        }

        const amountStr = `$${(record.amount_cents / 100).toFixed(2)}/${record.interval}`;
        console.log(`  💳 ${p.first_name} ${p.last_name} — ${sub.status} — ${amountStr}`);
      }
    } catch (err) {
      // Skip customer not found errors (deleted Stripe customers)
      if (err.code !== 'resource_missing') {
        console.error(`  ⚠️  Error for ${p.first_name} ${p.last_name}: ${err.message}`);
      }
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`  Patients linked: ${linked}`);
  console.log(`  Subscriptions synced: ${subsSynced} (${subsNew} new)`);

  // Final stats
  const { count: linkedCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .not('stripe_customer_id', 'is', null);

  const { count: totalCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true });

  console.log(`  Total patients with Stripe: ${linkedCount}/${totalCount}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
