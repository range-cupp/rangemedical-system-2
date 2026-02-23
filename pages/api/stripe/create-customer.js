// Stripe Customer Creation
// POST: { patient_id, email, name }
// Idempotent — returns existing customer if already linked

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
    const { patient_id, email, name } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    // Check if patient already has a Stripe customer
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('stripe_customer_id, email, name')
      .eq('id', patient_id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.stripe_customer_id) {
      // Return existing customer
      const existing = await stripe.customers.retrieve(patient.stripe_customer_id);
      return res.status(200).json({ customer: existing });
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: email || patient.email,
      name: name || patient.name,
      metadata: { patient_id },
    });

    // Save stripe_customer_id to patients table
    const { error: updateError } = await supabase
      .from('patients')
      .update({ stripe_customer_id: customer.id })
      .eq('id', patient_id);

    if (updateError) {
      console.error('Failed to save stripe_customer_id:', updateError);
    }

    return res.status(200).json({ customer });

  } catch (error) {
    console.error('Create customer error:', error);
    return res.status(500).json({ error: error.message });
  }
}
