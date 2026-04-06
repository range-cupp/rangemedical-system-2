// /pages/api/stripe/refund.js
// POST: Issue full or partial refund on a Stripe charge
// Body: { charge_id, amount? (in dollars — omit for full refund) }

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { charge_id, amount } = req.body;
  if (!charge_id) return res.status(400).json({ error: 'charge_id is required' });

  try {
    // Fetch the charge first to validate
    const charge = await stripe.charges.retrieve(charge_id);
    if (!charge) return res.status(404).json({ error: 'Charge not found' });
    if (charge.status !== 'succeeded') return res.status(400).json({ error: 'Can only refund succeeded charges' });

    const refundableAmount = (charge.amount - charge.amount_refunded) / 100;
    if (refundableAmount <= 0) return res.status(400).json({ error: 'Charge has already been fully refunded' });

    // Validate partial amount
    const refundParams = { charge: charge_id };
    if (amount !== undefined && amount !== null) {
      const refundDollars = parseFloat(amount);
      if (isNaN(refundDollars) || refundDollars <= 0) {
        return res.status(400).json({ error: 'Invalid refund amount' });
      }
      if (refundDollars > refundableAmount) {
        return res.status(400).json({ error: `Refund amount ($${refundDollars.toFixed(2)}) exceeds refundable balance ($${refundableAmount.toFixed(2)})` });
      }
      refundParams.amount = Math.round(refundDollars * 100); // convert to cents
    }

    // Issue the refund
    const refund = await stripe.refunds.create(refundParams);

    // Update purchase record in Supabase if we have a matching payment_intent
    const paymentIntentId = typeof charge.payment_intent === 'object'
      ? charge.payment_intent?.id
      : charge.payment_intent;

    if (paymentIntentId) {
      // Check if this is now a full refund
      const updatedCharge = await stripe.charges.retrieve(charge_id);
      const isFullRefund = updatedCharge.refunded;

      await supabase.from('purchases').update({
        stripe_status: isFullRefund ? 'refunded' : 'partially_refunded',
        stripe_verified_at: new Date().toISOString(),
      }).eq('stripe_payment_intent_id', paymentIntentId);
    }

    const refundedAmount = refund.amount / 100;
    return res.status(200).json({
      success: true,
      refund_id: refund.id,
      amount_refunded: refundedAmount,
      message: `Refund of $${refundedAmount.toFixed(2)} issued successfully`,
    });
  } catch (error) {
    console.error('Stripe refund error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
