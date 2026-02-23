// Stripe Subscription Management
// POST: { patient_id, price_amount, interval, description }
// DELETE: { subscription_id }

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { patient_id, price_amount, interval, description } = req.body;

      if (!patient_id || !price_amount) {
        return res.status(400).json({ error: 'patient_id and price_amount are required' });
      }

      // Get patient's Stripe customer
      const { data: patient, error: fetchError } = await supabase
        .from('patients')
        .select('stripe_customer_id')
        .eq('id', patient_id)
        .single();

      if (fetchError || !patient?.stripe_customer_id) {
        return res.status(400).json({ error: 'Patient must have a Stripe customer with a saved payment method' });
      }

      // Get default payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: patient.stripe_customer_id,
        type: 'card',
        limit: 1,
      });

      if (!paymentMethods.data.length) {
        return res.status(400).json({ error: 'No saved payment method found. Save a card first.' });
      }

      // Create a price object
      const price = await stripe.prices.create({
        unit_amount: Math.round(price_amount),
        currency: 'usd',
        recurring: { interval: interval || 'month' },
        product_data: {
          name: description || 'Range Medical subscription',
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: patient.stripe_customer_id,
        items: [{ price: price.id }],
        default_payment_method: paymentMethods.data[0].id,
        metadata: { patient_id },
      });

      return res.status(200).json({
        subscription_id: subscription.id,
        status: subscription.status,
      });

    } catch (error) {
      console.error('Subscription create error:', error);
      return res.status(500).json({ error: error.message });
    }

  } else if (req.method === 'DELETE') {
    try {
      const { subscription_id } = req.body;

      if (!subscription_id) {
        return res.status(400).json({ error: 'subscription_id is required' });
      }

      const cancelled = await stripe.subscriptions.cancel(subscription_id);

      return res.status(200).json({
        subscription_id: cancelled.id,
        status: cancelled.status,
      });

    } catch (error) {
      console.error('Subscription cancel error:', error);
      return res.status(500).json({ error: error.message });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
