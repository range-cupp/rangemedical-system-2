// pages/api/offers/create-payment.js
// Creates a Stripe PaymentIntent for a new patient offer (embedded checkout).

import Stripe from 'stripe';
import { getOfferById } from '../../../lib/offer-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
