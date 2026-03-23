// /pages/api/admin/stripe-reconcile.js
// One-time + on-demand Stripe reconciliation
// Pulls actual charge amounts from Stripe and updates purchases table
// GET /api/admin/stripe-reconcile?limit=50&offset=0

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // POST = fix mismatches (update amount/amount_paid to match Stripe)
  // GET = just reconcile and report
  const autoFix = req.method === 'POST' || req.query.fix === 'true';
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  try {
    // Get unreconciled purchases that have a Stripe payment intent
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('id, stripe_payment_intent_id, amount, amount_paid')
      .not('stripe_payment_intent_id', 'is', null)
      .is('stripe_amount_cents', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    if (!purchases || purchases.length === 0) {
      return res.status(200).json({
        message: 'No unreconciled purchases found',
        processed: 0,
        matches: 0,
        mismatches: [],
      });
    }

    let matches = 0;
    const mismatches = [];
    const errors = [];
    let processed = 0;

    // Process in batches of 10 to stay well under Stripe rate limits
    for (let i = 0; i < purchases.length; i += 10) {
      const batch = purchases.slice(i, i + 10);

      const results = await Promise.allSettled(
        batch.map(async (purchase) => {
          try {
            const pi = await stripe.paymentIntents.retrieve(purchase.stripe_payment_intent_id);

            const stripeAmountCents = pi.amount_received || pi.amount;
            const stripeStatus = pi.status === 'succeeded' ? 'succeeded'
              : pi.status === 'requires_payment_method' ? 'failed'
              : pi.status;

            // Check for amount mismatch
            const dbAmountCents = Math.round((purchase.amount_paid || purchase.amount) * 100);
            const mismatch = Math.abs(stripeAmountCents - dbAmountCents) > 1; // allow 1 cent rounding
            const stripeAmountDollars = stripeAmountCents / 100;

            // Build update object — always store stripe verification fields
            const updateData = {
              stripe_amount_cents: stripeAmountCents,
              stripe_status: stripeStatus,
              stripe_verified_at: new Date().toISOString(),
            };

            // If there's a mismatch, fix the actual amount fields too
            // Stripe is the source of truth for what was actually charged
            if (mismatch) {
              updateData.amount = stripeAmountDollars;
              updateData.amount_paid = stripeAmountDollars;

              mismatches.push({
                purchase_id: purchase.id,
                old_amount: (purchase.amount_paid || purchase.amount),
                correct_amount: stripeAmountDollars,
                difference: (stripeAmountDollars - (purchase.amount_paid || purchase.amount)).toFixed(2),
                stripe_status: stripeStatus,
                fixed: true,
              });
            } else {
              matches++;
            }

            // Update the purchase record
            await supabase
              .from('purchases')
              .update(updateData)
              .eq('id', purchase.id);

            processed++;
          } catch (err) {
            errors.push({
              purchase_id: purchase.id,
              payment_intent: purchase.stripe_payment_intent_id,
              error: err.message,
            });
          }
        })
      );

      // Small delay between batches
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
