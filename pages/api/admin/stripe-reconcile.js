// /pages/api/admin/stripe-reconcile.js
// Stripe reconciliation — verifies payment status and card details.
//
// IMPORTANT: This does NOT override per-item amounts. A single PaymentIntent
// can cover multiple line items (multi-item cart). The PI's amount_received
// is the CART TOTAL, not the per-item price. Per-item amounts come from the
// POS at checkout time and should not be changed by reconciliation.
//
// What this DOES:
//   - Verifies payment status (succeeded, failed, etc.)
//   - Stores card brand/last4 for display
//   - Flags purchases where the sum of items doesn't match the PI total
//
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
    // Get purchases that haven't been verified against Stripe yet
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('id, stripe_payment_intent_id, amount, amount_paid, stripe_amount_cents, patient_name, item_name, purchase_date, stripe_verified_at')
      .not('stripe_payment_intent_id', 'is', null)
      .is('stripe_verified_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    if (!purchases || purchases.length === 0) {
      return res.status(200).json({
        message: 'No unverified Stripe purchases found',
        processed: 0,
        verified: 0,
        warnings: [],
      });
    }

    // Group purchases by PaymentIntent to handle multi-item carts correctly
    const byPI = {};
    for (const p of purchases) {
      const pi = p.stripe_payment_intent_id;
      if (!byPI[pi]) byPI[pi] = [];
      byPI[pi].push(p);
    }

    let verified = 0;
    const warnings = [];
    const errors = [];
    let processed = 0;

    const piIds = Object.keys(byPI);

    // Process in batches of 10 to stay under Stripe rate limits
    for (let i = 0; i < piIds.length; i += 10) {
      const batch = piIds.slice(i, i + 10);

      await Promise.allSettled(
        batch.map(async (piId) => {
          const group = byPI[piId];
          try {
            const pi = await stripe.paymentIntents.retrieve(piId, {
              expand: ['payment_method'],
            });

            const stripeStatus = pi.status === 'succeeded' ? 'succeeded'
              : pi.status === 'requires_payment_method' ? 'failed'
              : pi.status;

            const piTotalCents = pi.amount_received || pi.amount;
            const itemSumCents = group.reduce((s, p) => s + Math.round((p.amount_paid || p.amount || 0) * 100), 0);

            // Card details
            let cardBrand = null;
            let cardLast4 = null;
            if (pi.payment_method?.card) {
              cardBrand = pi.payment_method.card.brand;
              cardLast4 = pi.payment_method.card.last4;
            }

            // Update each purchase in this group with status + card details
            // but do NOT touch amount or amount_paid
            for (const purchase of group) {
              const updateData = {
                stripe_status: stripeStatus,
                stripe_verified_at: new Date().toISOString(),
                stripe_amount_cents: Math.round((purchase.amount_paid || purchase.amount || 0) * 100),
              };
              if (cardBrand) updateData.card_brand = cardBrand;
              if (cardLast4) updateData.card_last4 = cardLast4;

              await supabase
                .from('purchases')
                .update(updateData)
                .eq('id', purchase.id);

              processed++;
            }

            // Check if the sum of items matches the PI total
            if (Math.abs(piTotalCents - itemSumCents) > 1) {
              warnings.push({
                payment_intent: piId,
                stripe_total: piTotalCents / 100,
                items_sum: itemSumCents / 100,
                difference: ((piTotalCents - itemSumCents) / 100).toFixed(2),
                items: group.map(p => ({
                  id: p.id,
                  patient: p.patient_name,
                  item: p.item_name,
                  amount_paid: Number(p.amount_paid || p.amount),
                })),
              });
            } else {
              verified += group.length;
            }
          } catch (err) {
            errors.push({
              payment_intent: piId,
              purchases: group.map(p => p.id),
              error: err.message,
            });
          }
        })
      );

      if (i + 10 < piIds.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return res.status(200).json({
      message: warnings.length > 0
        ? `Verified ${processed} purchases — ${warnings.length} payment intent${warnings.length !== 1 ? 's' : ''} have amount mismatches (review manually)`
        : `Verified ${processed} purchases — all amounts match`,
      processed,
      verified,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
      remaining: purchases.length === limit ? 'More records may exist — run again with higher offset' : undefined,
    });
  } catch (err) {
    console.error('Stripe reconciliation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
