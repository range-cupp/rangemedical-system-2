// /pages/api/assessment/payment-intent.js
// Creates a Stripe PaymentIntent for the $197 assessment fee
// Range Medical — Injury & Recovery Assessment

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { getClientIp } from '../../../lib/meta-capi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, email, firstName, lastName, phone, discount, meta } = req.body;

    if (!leadId || !email || !firstName || !lastName) {
      return res.status(400).json({ error: 'leadId, email, firstName, and lastName are required' });
    }

    // Apply discount (e.g., $50 off from start funnel)
    const discountCents = Math.min((discount || 0) * 100, 19700); // cap at full amount
    const amountCents = 19700 - discountCents;

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

    // Generate a server-side event_id used to dedupe browser pixel + CAPI Purchase events.
    // The frontend uses this same id when firing fbq('track', 'Purchase', ..., { eventID }).
    const metaEventId = `assessment_purchase_${leadId}_${Date.now()}`;

    // Capture Meta attribution signals from the browser so the webhook (which
    // fires from Stripe servers, not the user's browser) can send a complete
    // CAPI event later.
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const metaFbp = meta?.fbp || '';
    const metaFbc = meta?.fbc || '';

    // Create PaymentIntent
    const displayAmount = `$${(amountCents / 100).toFixed(0)}`;
    let paymentIntent;
    const intentParams = {
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      description: discountCents > 0
        ? `In-Clinic Visit — Injury & Recovery (${displayAmount} after $${discount} start funnel discount)`
        : 'In-Clinic Visit — Injury & Recovery (applied toward treatment)',
      metadata: {
        lead_id: leadId,
        assessment_path: 'injury',
        patient_email: normalizedEmail,
        patient_first_name: firstName,
        patient_last_name: lastName,
        patient_phone: phone || '',
        discount_applied: discountCents > 0 ? `${discount}` : '0',
        source: discountCents > 0 ? 'start_funnel' : 'direct',
        // Meta CAPI dedup + attribution — read by stripe webhook on payment_intent.succeeded
        meta_event_id: metaEventId,
        meta_fbp: metaFbp.slice(0, 200),
        meta_fbc: metaFbc.slice(0, 200),
        meta_client_ip: (clientIp || '').slice(0, 64),
        meta_client_user_agent: userAgent.slice(0, 480),
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

    // Update assessment_leads with payment info AND refresh contact info from
    // the form. submit.js may have been triggered by browser autofill with stale
    // data; the values that come in here are what the user is actually paying
    // with, so they're the source of truth for downstream patient creation.
    await supabase
      .from('assessment_leads')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
        payment_amount_cents: amountCents,
        first_name: firstName,
        last_name: lastName,
        email: normalizedEmail,
        phone: phone || null,
      })
      .eq('id', leadId);

    console.log(`Assessment payment intent created: ${paymentIntent.id} for lead ${leadId}`);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      metaEventId,
    });
  } catch (error) {
    console.error('Assessment payment intent error:', error);
    return res.status(500).json({ error: error.message });
  }
}
