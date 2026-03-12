// /pages/api/assessment/payment-intent.js
// Creates a Stripe PaymentIntent for the $250 assessment fee
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
    const { leadId, email, firstName, lastName, phone } = req.body;

    if (!leadId || !email || !firstName || !lastName) {
      return res.status(400).json({ error: 'leadId, email, firstName, and lastName are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find or create Stripe customer via patient record
    let customerId = null;

    // Check if patient exists with a stripe_customer_id
    const { data: patient } = await supabase
      .from('patients')
      .select('id, stripe_customer_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (patient?.stripe_customer_id) {
      customerId = patient.stripe_customer_id;
    } else {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        name: `${firstName} ${lastName}`,
        phone: phone || undefined,
        metadata: {
          source: 'assessment',
          patient_id: patient?.id || null,
        },
      });
      customerId = customer.id;

      // Save stripe_customer_id to patient record if it exists
      if (patient?.id) {
        await supabase
          .from('patients')
          .update({ stripe_customer_id: customerId })
          .eq('id', patient.id);
      }
    }

    // Create PaymentIntent for $250
    let paymentIntent;
    const intentParams = {
      amount: 25000, // $250.00
      currency: 'usd',
      customer: customerId,
      description: 'Range Assessment — Injury & Recovery',
      metadata: {
        lead_id: leadId,
        assessment_path: 'injury',
        patient_email: normalizedEmail,
      },
    };

    // Try automatic_payment_methods first (Apple Pay, Google Pay, etc.)
    // Fall back to card-only if the account doesn't support it
    try {
      intentParams.automatic_payment_methods = { enabled: true };
      paymentIntent = await stripe.paymentIntents.create(intentParams);
    } catch (autoErr) {
      console.warn('automatic_payment_methods failed, falling back to card:', autoErr.message);
      delete intentParams.automatic_payment_methods;
      intentParams.payment_method_types = ['card'];
      paymentIntent = await stripe.paymentIntents.create(intentParams);
    }

    // Update assessment_leads with payment info
    await supabase
      .from('assessment_leads')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
        payment_amount_cents: 25000,
      })
      .eq('id', leadId);

    console.log(`Assessment payment intent created: ${paymentIntent.id} for lead ${leadId}`);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Assessment payment intent error:', error);
    return res.status(500).json({ error: error.message });
  }
}
