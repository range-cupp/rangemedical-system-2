// pages/api/offers/create-payment.js
// Creates a Stripe PaymentIntent for a new patient offer (embedded checkout).

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getOfferById } from '../../../lib/offer-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { offerId, firstName, lastName, email, phone } = req.body;

  if (!offerId || !firstName || !email) {
    return res.status(400).json({ error: 'offerId, firstName, and email are required' });
  }

  const offer = getOfferById(offerId);
  if (!offer) {
    return res.status(400).json({ error: `Unknown offer: ${offerId}` });
  }

  try {
    // One-per-patient: check if this email already purchased any new patient offer
    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .ilike('description', '%New Patient Offer%')
      .eq('patient_id', (
        await supabase.from('patients').select('id').eq('email', email.toLowerCase()).maybeSingle()
      ).data?.id || '00000000-0000-0000-0000-000000000000')
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({
        error: 'It looks like you\'ve already used a new patient offer. These are limited to one per patient.',
        alreadyUsed: true,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: offer.priceCents,
      currency: 'usd',
      metadata: {
        type: 'new_patient_offer',
        offer_id: offerId,
        offer_name: offer.name,
        patient_name: `${firstName} ${lastName || ''}`.trim(),
        patient_email: email,
        patient_phone: phone || '',
      },
      receipt_email: email,
      description: `New Patient Offer: ${offer.name}`,
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Offer payment error:', error);
    return res.status(500).json({ error: 'Failed to create payment' });
  }
}
