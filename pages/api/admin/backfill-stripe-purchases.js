// /pages/api/admin/backfill-stripe-purchases.js
// One-time backfill: finds Stripe charges that have no matching purchase
// record in the DB, resolves the patient, and creates the missing purchase.
//
// GET  /api/admin/backfill-stripe-purchases?month=2026-04           → dry run
// POST /api/admin/backfill-stripe-purchases  { month: "2026-04" }   → apply

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const month = req.query.month || req.body?.month;
  const dryRun = req.method === 'GET';

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Provide month as YYYY-MM (e.g. 2026-04)' });
  }

  try {
    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);
    const startDateStr = `${year}-${String(mon).padStart(2, '0')}-01`;
    const endDateStr = mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

    // ── Step 1: Pull all succeeded Stripe PIs for the month ───────────
    const allPIs = [];
    let hasMore = true;
    let startingAfter;
    while (hasMore) {
      const params = {
        created: { gte: Math.floor(startDate / 1000), lt: Math.floor(endDate / 1000) },
        limit: 100,
      };
      if (startingAfter) params.starting_after = startingAfter;
      const result = await stripe.paymentIntents.list(params);
      allPIs.push(...result.data);
      hasMore = result.has_more;
      if (result.data.length) startingAfter = result.data[result.data.length - 1].id;
    }

    const succeededPIs = allPIs.filter(pi => pi.status === 'succeeded');

    // ── Step 2: Get existing DB PI IDs for the month ──────────────────
    const { data: purchases } = await supabase
      .from('purchases')
      .select('stripe_payment_intent_id')
      .gte('purchase_date', startDateStr)
      .lt('purchase_date', endDateStr)
      .not('stripe_payment_intent_id', 'is', null);

    const existingPIIds = new Set((purchases || []).map(p => p.stripe_payment_intent_id));

    // Also check ALL purchases (not just this month) for this PI
    const missingPIs = succeededPIs.filter(pi => !existingPIIds.has(pi.id));

    // Double-check: some purchases might have been recorded on a different date
    if (missingPIs.length > 0) {
      const piIds = missingPIs.map(pi => pi.id);
      const { data: anyMatches } = await supabase
        .from('purchases')
        .select('stripe_payment_intent_id')
        .in('stripe_payment_intent_id', piIds);

      const foundAnywhere = new Set((anyMatches || []).map(p => p.stripe_payment_intent_id));
      const trulyMissing = missingPIs.filter(pi => !foundAnywhere.has(pi.id));

      // ── Step 3: Resolve each missing PI ──────────────────────────────
      const toCreate = [];
      const unresolved = [];

      for (const pi of trulyMissing) {
        const amountCents = pi.amount_received || pi.amount;
        const chargeDate = new Date(pi.created * 1000).toISOString().split('T')[0];
        const desc = pi.description || '';

        // Resolve customer
        let patientId = null;
        let patientName = null;
        let patientEmail = null;
        let patientPhone = null;
        let category = 'Other';
        let subscriptionId = null;
        let source = 'stripe';

        if (pi.customer) {
          // Look up by stripe_customer_id
          const { data: patient } = await supabase
            .from('patients')
            .select('id, name, email, phone')
            .eq('stripe_customer_id', pi.customer)
            .maybeSingle();

          if (patient) {
            patientId = patient.id;
            patientName = patient.name;
            patientEmail = patient.email;
            patientPhone = patient.phone;
          } else {
            // Get email from Stripe customer
            try {
              const cust = await stripe.customers.retrieve(pi.customer);
              patientName = cust.name || null;
              patientEmail = cust.email || null;

              // Try email match
              if (patientEmail) {
                const { data: byEmail } = await supabase
                  .from('patients')
                  .select('id, name, phone')
                  .ilike('email', patientEmail)
                  .limit(1)
                  .maybeSingle();

                if (byEmail) {
                  patientId = byEmail.id;
                  patientName = patientName || byEmail.name;
                  patientPhone = byEmail.phone;
                }
              }

              // Try name match as last resort
              if (!patientId && patientName) {
                const { data: byName } = await supabase
                  .from('patients')
                  .select('id, email, phone')
                  .ilike('name', patientName)
                  .limit(1)
                  .maybeSingle();

                if (byName) {
                  patientId = byName.id;
                  patientEmail = patientEmail || byName.email;
                  patientPhone = byName.phone;
                }
              }
            } catch (e) { /* customer deleted or inaccessible */ }
          }
        }

        // Determine if subscription
        if (pi.invoice) {
          try {
            const inv = await stripe.invoices.retrieve(pi.invoice);
            if (inv.subscription) {
              subscriptionId = inv.subscription;
              source = 'subscription';
              try {
                const sub = await stripe.subscriptions.retrieve(inv.subscription);
                category = sub.metadata?.service_category || 'Other';
              } catch (e) { /* ignore */ }
            } else {
              source = 'invoice';
            }
          } catch (e) { /* ignore */ }
        }

        // Get card details
        let cardBrand = null;
        let cardLast4 = null;
        try {
          const piDetail = await stripe.paymentIntents.retrieve(pi.id, { expand: ['payment_method'] });
          if (piDetail.payment_method?.card) {
            cardBrand = piDetail.payment_method.card.brand;
            cardLast4 = piDetail.payment_method.card.last4;
          }
        } catch (e) { /* ignore */ }

        const record = {
          patient_id: patientId,
          patient_name: patientName || 'Unknown',
          patient_email: patientEmail,
          patient_phone: patientPhone,
          item_name: desc || 'Stripe payment',
          product_name: desc || 'Stripe payment',
          amount: amountCents / 100,
          amount_paid: amountCents / 100,
          stripe_amount_cents: amountCents,
          stripe_payment_intent_id: pi.id,
          stripe_subscription_id: subscriptionId,
          stripe_status: 'succeeded',
          stripe_verified_at: new Date().toISOString(),
          card_brand: cardBrand,
          card_last4: cardLast4,
          category,
          quantity: 1,
          payment_method: subscriptionId ? 'stripe_subscription' : 'stripe_invoice',
          source,
          purchase_date: chargeDate,
        };

        if (patientId) {
          toCreate.push(record);
        } else {
          unresolved.push({
            payment_intent: pi.id,
            amount: amountCents / 100,
            date: chargeDate,
            description: desc,
            customer_name: patientName,
            customer_email: patientEmail,
          });
        }
      }

      // ── Step 4: Create purchases if not dry run ─────────────────────
      let created = 0;
      if (!dryRun && toCreate.length > 0) {
        for (const record of toCreate) {
          const { error } = await supabase.from('purchases').insert(record);
          if (error) {
            console.error(`Backfill insert error for PI ${record.stripe_payment_intent_id}:`, error.message);
          } else {
            created++;
          }
        }
      }

      return res.status(200).json({
        month,
        dry_run: dryRun,
        total_stripe_charges: succeededPIs.length,
        already_recorded: succeededPIs.length - trulyMissing.length,
        missing: trulyMissing.length,
        resolved: toCreate.length,
        unresolved: unresolved.length,
        created: dryRun ? 0 : created,
        to_create: dryRun ? toCreate.map(r => ({
          patient_name: r.patient_name,
          amount: r.amount_paid,
          date: r.purchase_date,
          description: r.item_name,
          category: r.category,
          source: r.source,
        })) : undefined,
        unresolved_details: unresolved.length > 0 ? unresolved : undefined,
      });
    }

    return res.status(200).json({
      month,
      dry_run: dryRun,
      total_stripe_charges: succeededPIs.length,
      already_recorded: succeededPIs.length,
      missing: 0,
      message: 'All Stripe charges already have matching purchase records.',
    });

  } catch (err) {
    console.error('Backfill error:', err);
    return res.status(500).json({ error: err.message });
  }
}
