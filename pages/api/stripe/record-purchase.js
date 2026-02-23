// Record Purchase After Stripe Payment
// POST: { patient_id, amount, description, stripe_payment_intent_id?, stripe_subscription_id?, payment_method }

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patient_id,
      amount,
      description,
      stripe_payment_intent_id,
      stripe_subscription_id,
      payment_method,
    } = req.body;

    if (!patient_id || !amount) {
      return res.status(400).json({ error: 'patient_id and amount are required' });
    }

    const { data, error } = await supabase
      .from('purchases')
      .insert({
        patient_id,
        amount: amount / 100, // Convert cents to dollars for DB
        description: description || 'Stripe charge',
        stripe_payment_intent_id: stripe_payment_intent_id || null,
        stripe_subscription_id: stripe_subscription_id || null,
        payment_method: payment_method || 'stripe',
        source: 'stripe_pos',
        purchase_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Record purchase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ purchase: data });

  } catch (error) {
    console.error('Record purchase error:', error);
    return res.status(500).json({ error: error.message });
  }
}
