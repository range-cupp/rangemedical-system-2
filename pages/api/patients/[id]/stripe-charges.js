// /pages/api/patients/[id]/stripe-charges.js
// Fetches actual Stripe charges for a patient — source of truth for payment amounts
// Range Medical System V2

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Patient ID required' });

  try {
    // Get patient's Stripe customer ID
    const { data: patient } = await supabase
      .from('patients')
      .select('stripe_customer_id')
      .eq('id', id)
      .single();

    if (!patient?.stripe_customer_id) {
      return res.status(200).json({ charges: [], hasStripeCustomer: false });
    }

    // Fetch actual charges from Stripe
    const charges = await stripe.charges.list({
      customer: patient.stripe_customer_id,
      limit: 100,
      expand: ['data.payment_intent'],
    });

    const formattedCharges = charges.data.map(c => ({
      id: c.id,
      amount: c.amount, // cents — actual amount charged
      amount_refunded: c.amount_refunded,
      refunded: c.refunded,
      status: c.status,
      created: c.created, // unix timestamp
      description: c.description,
      payment_intent_id: typeof c.payment_intent === 'object' ? c.payment_intent?.id : c.payment_intent,
      card_brand: c.payment_method_details?.card?.brand || null,
      card_last4: c.payment_method_details?.card?.last4 || null,
      receipt_url: c.receipt_url,
    }));

    return res.status(200).json({
      charges: formattedCharges,
      hasStripeCustomer: true,
    });
  } catch (error) {
    console.error('Stripe charges API error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
