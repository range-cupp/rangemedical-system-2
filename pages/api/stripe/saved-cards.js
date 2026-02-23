// Stripe Saved Payment Methods
// GET: ?patient_id=xxx — list saved cards
// POST: { patient_id } — create SetupIntent for saving a new card
// DELETE: { payment_method_id } — detach a saved card

import { createClient } from '@supabase/supabase-js';
import { getStripe } from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const stripeMode = req.headers['x-stripe-mode'] || 'live';
  const stripe = getStripe(stripeMode);

  if (req.method === 'GET') {
    try {
      const { patient_id } = req.query;

      if (!patient_id) {
        return res.status(400).json({ error: 'patient_id is required' });
      }

      const { data: patient, error } = await supabase
        .from('patients')
        .select('stripe_customer_id')
        .eq('id', patient_id)
        .single();

      if (error || !patient?.stripe_customer_id) {
        return res.status(200).json({ cards: [] });
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: patient.stripe_customer_id,
        type: 'card',
      });

      const cards = paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      }));

      return res.status(200).json({ cards });

    } catch (error) {
      console.error('List cards error:', error);
      return res.status(500).json({ error: error.message });
    }

  } else if (req.method === 'POST') {
    try {
      const { patient_id } = req.body;

      if (!patient_id) {
        return res.status(400).json({ error: 'patient_id is required' });
      }

      // Get or create Stripe customer
      let { data: patient, error } = await supabase
        .from('patients')
        .select('stripe_customer_id, email, name')
        .eq('id', patient_id)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      let customerId = patient.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: patient.email,
          name: patient.name,
          metadata: { patient_id },
        });
        customerId = customer.id;

        await supabase
          .from('patients')
          .update({ stripe_customer_id: customerId })
          .eq('id', patient_id);
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return res.status(200).json({ client_secret: setupIntent.client_secret });

    } catch (error) {
      console.error('Setup intent error:', error);
      return res.status(500).json({ error: error.message });
    }

  } else if (req.method === 'DELETE') {
    try {
      const { payment_method_id } = req.body;

      if (!payment_method_id) {
        return res.status(400).json({ error: 'payment_method_id is required' });
      }

      await stripe.paymentMethods.detach(payment_method_id);

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Detach card error:', error);
      return res.status(500).json({ error: error.message });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
