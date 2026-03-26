// /api/hbot-trial/create-payment-intent
// Creates a Stripe PaymentIntent for $149 HBOT Trial
// Links trial_pass_id to the payment metadata
// Range Medical

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
    const { firstName, lastName, email, phone, main_problem, importance_1_10, trialId } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const fullName = `${firstName} ${lastName}`;

    // Look up or create Stripe customer
    let customerId = null;

    const { data: patient } = await supabase
      .from('patients')
      .select('id, stripe_customer_id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (patient?.stripe_customer_id) {
      customerId = patient.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        name: fullName,
        phone: phone || undefined,
        metadata: {
          source: 'hbot_trial',
          patient_id: patient?.id || null,
        },
      });
      customerId = customer.id;

      if (patient?.id) {
        await supabase
          .from('patients')
          .update({ stripe_customer_id: customerId })
          .eq('id', patient.id);
      }
    }

    // Create PaymentIntent for $149
    const intentParams = {
      amount: 14900,
      currency: 'usd',
      customer: customerId,
      description: 'Hyperbaric Recovery Trial \u2014 3 Sessions / 10 Days \u2014 $149',
      metadata: {
        source: 'hbot_trial',
        trial_id: trialId || '',
        customer_name: fullName,
        customer_email: normalizedEmail,
        customer_phone: phone || '',
        product_name: 'HBOT Trial - 3 Sessions',
        service_category: 'hbot',
        main_problem: main_problem || '',
        importance: String(importance_1_10 || ''),
      },
    };

    let paymentIntent;
    try {
      intentParams.automatic_payment_methods = { enabled: true };
      paymentIntent = await stripe.paymentIntents.create(intentParams);
    } catch (autoErr) {
      console.warn('automatic_payment_methods failed, falling back to card:', autoErr.message);
      delete intentParams.automatic_payment_methods;
      intentParams.payment_method_types = ['card'];
      paymentIntent = await stripe.paymentIntents.create(intentParams);
    }

    // If trial pass exists, link payment intent and store qualification data
    if (trialId) {
      await supabase
        .from('trial_passes')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          email: normalizedEmail,
          phone: phone || null,
          main_problem: main_problem || null,
          importance_1_10: importance_1_10 || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trialId);
    }

    console.log(`HBOT trial payment intent created: ${paymentIntent.id} for ${fullName}`);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('HBOT trial payment intent error:', error);
    return res.status(500).json({ error: error.message });
  }
}
