// /api/stripe/service-payment-intent
// Creates a PaymentIntent for service page purchases (lab panels, RLT, HBOT, CER, etc.)
// Replaces Stripe Payment Links with embedded on-site checkout

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
    const {
      firstName, lastName, email, phone,
      amountCents, productName, description,
      serviceCategory, serviceName,
    } = req.body;

    if (!firstName || !lastName || !email || !amountCents) {
      return res.status(400).json({ error: 'firstName, lastName, email, and amountCents are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const fullName = `${firstName} ${lastName}`;

    // Look up or create Stripe customer
    let customerId = null;

    // Check if patient already exists
    const { data: patient } = await supabase
      .from('patients')
      .select('id, stripe_customer_id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (patient?.stripe_customer_id) {
      customerId = patient.stripe_customer_id;
    } else {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        name: fullName,
        phone: phone || undefined,
        metadata: {
          source: 'website_checkout',
          patient_id: patient?.id || null,
        },
      });
      customerId = customer.id;

      // Link Stripe customer to patient if they exist
      if (patient?.id) {
        await supabase
          .from('patients')
          .update({ stripe_customer_id: customerId })
          .eq('id', patient.id);
      }
    }

    // Create PaymentIntent
    const intentParams = {
      amount: Math.round(amountCents),
      currency: 'usd',
      customer: customerId,
      description: description || productName || 'Range Medical purchase',
      metadata: {
        source: 'website_checkout',
        customer_name: fullName,
        customer_email: normalizedEmail,
        customer_phone: phone || '',
        service_category: serviceCategory || '',
        service_name: serviceName || '',
        product_name: productName || '',
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

    console.log(`Service payment intent created: ${paymentIntent.id} — ${productName} ($${(amountCents / 100).toFixed(2)}) for ${fullName}`);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Service payment intent error:', error);
    return res.status(500).json({ error: error.message });
  }
}
