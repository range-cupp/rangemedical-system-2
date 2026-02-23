// Stripe PaymentIntent Creation
// POST: { patient_id, amount, description, payment_method_id? }
// amount is in cents

import { createClient } from '@supabase/supabase-js';
import { getStripe } from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ensureStripeCustomer(patient_id, stripe) {
  const { data: patient, error } = await supabase
    .from('patients')
    .select('stripe_customer_id, email, name')
    .eq('id', patient_id)
    .single();

  if (error) throw new Error('Patient not found');

  if (patient.stripe_customer_id) {
    return patient.stripe_customer_id;
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: patient.email,
    name: patient.name,
    metadata: { patient_id },
  });

  await supabase
    .from('patients')
    .update({ stripe_customer_id: customer.id })
    .eq('id', patient_id);

  return customer.id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripeMode = req.headers['x-stripe-mode'] || 'live';
    const stripe = getStripe(stripeMode);

    const { patient_id, amount, description, payment_method_id } = req.body;

    if (!patient_id || !amount) {
      return res.status(400).json({ error: 'patient_id and amount are required' });
    }

    const customerId = await ensureStripeCustomer(patient_id, stripe);

    const intentParams = {
      amount: Math.round(amount),
      currency: 'usd',
      customer: customerId,
      description: description || 'Range Medical charge',
      metadata: { patient_id },
    };

    // If a saved payment method is provided, attach it and confirm immediately
    if (payment_method_id) {
      intentParams.payment_method = payment_method_id;
      intentParams.confirm = true;
      intentParams.return_url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://rangemedical.com'}/admin/command-center`;
    }

    const paymentIntent = await stripe.paymentIntents.create(intentParams);

    return res.status(200).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      status: paymentIntent.status,
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    return res.status(500).json({ error: error.message });
  }
}
