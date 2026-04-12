// /pages/api/admin/stripe-reconcile.js
// One-time + on-demand Stripe reconciliation
// Pulls actual charge amounts from Stripe and updates purchases table
// Always fixes mismatches — Stripe is the source of truth
// GET /api/admin/stripe-reconcile?limit=100&offset=0

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const limit = Math.min(parseInt(req.query.limit) || 100, 200);
  const offset = parseInt(req.query.offset) || 0;

  try {
    // Get ALL purchases with a Stripe payment intent — check every one
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('id, stripe_payment_intent_id, amount, amount_paid, stripe_amount_cents, patient_name, item_name, purchase_date')
      .not('stripe_payment_intent_id', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    if (!purchases || purchases.length === 0) {
      return res.status(200).json({
        message: 'No Stripe purchases found',
        processed: 0,
        matches: 0,
        mismatches: [],
      });
    }

    let matches = 0;
    const mismatches = [];
    const errors = [];
    let processed = 0;

    // Process in batches of 10 to stay under Stripe rate limits
    for (let i = 0; i < purchases.length; i += 10) {
      const batch = purchases.slice(i, i + 10);

      await Promise.allSettled(
        batch.map(async (purchase) => {
          try {
            const pi = await stripe.paymentIntents.retrieve(purchase.stripe_payment_intent_id);

            const stripeAmountCents = pi.amount_received || pi.amount;
            const stripeStatus = pi.status === 'succeeded' ? 'succeeded'
              : pi.status === 'requires_payment_method' ? 'failed'
              : pi.status;
            const stripeAmountDollars = stripeAmountCents / 100;

            // Check for amount mismatch against amount_paid
            const dbAmountCents = Math.round((purchase.amount_paid || purchase.amount || 0) * 100);
            const mismatch = Math.abs(stripeAmountCents - dbAmountCents) > 1; // allow 1 cent rounding

            // Build update object
            const updateData = {
              stripe_amount_cents: stripeAmountCents,
              stripe_status: stripeStatus,
              stripe_verified_at: new Date().toISOString(),
            };

            // Get card details if not already stored
            if (pi.payment_method && typeof pi.payment_method === 'object' && pi.payment_method.card) {
              updateData.card_brand = pi.payment_method.card.brand;
              updateData.card_last4 = pi.payment_method.card.last4;
            }

            // Fix amount_paid to match what Stripe actually charged
            if (mismatch) {
              updateData.amount = stripeAmountDollars;
              updateData.amount_paid = stripeAmountDollars;

              mismatches.push({
                purchase_id: purchase.id,
                patient: purchase.patient_name,
                item: purchase.item_name,
                date: purchase.purchase_date,
                old_amount: Number(purchase.amount_paid || purchase.amount),
                correct_amount: stripeAmountDollars,
                difference: (stripeAmountDollars - Number(purchase.amount_paid || purchase.amount)).toFixed(2),
                stripe_status: stripeStatus,
              });
            } else {
              matches++;
            }

            await supabase
              .from('purchases')
              .update(updateData)
              .eq('id', purchase.id);

            processed++;
          } catch (err) {
            errors.push({
              purchase_id: purchase.id,
              patient: purchase.patient_name,
              payment_intent: purchase.stripe_payment_intent_id,
              error: err.message,
            });
          }
        })
      );

      if (i + 10 < purchases.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return res.status(200).json({
      message: mismatches.length > 0
        ? `Reconciled ${processed} purchases — fixed ${mismatches.length} incorrect amount${mismatches.length !== 1 ? 's' : ''}`
        : `Reconciled ${processed} purchases — all amounts correct`,
      processed,
      matches,
      mismatches,
      fixed: mismatches.length,
      errors: errors.length > 0 ? errors : undefined,
      remaining: purchases.length === limit ? 'More records may exist — run again with higher offset' : undefined,
    });
  } catch (err) {
    console.error('Stripe reconciliation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
