// /pages/api/assessment/confirm-payment.js
// Confirms payment status after Stripe Elements succeeds
// Range Medical — Injury & Recovery Assessment

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, paymentIntentId } = req.body;

    if (!leadId || !paymentIntentId) {
      return res.status(400).json({ error: 'leadId and paymentIntentId are required' });
    }

    // Verify payment status via Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not completed',
        status: paymentIntent.status,
      });
    }

    // Update assessment_leads
    const { error: updateError } = await supabase
      .from('assessment_leads')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Assessment payment confirm DB error:', updateError);
    }

    console.log(`Assessment payment confirmed: ${paymentIntentId} for lead ${leadId}`);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Assessment confirm payment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
