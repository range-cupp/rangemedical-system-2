// pages/api/offers/create-checkout.js
// Creates a Stripe Checkout Session for a new patient offer.
// Redirects to /offer-success on completion.

import Stripe from 'stripe';
import { getOfferById } from '../../../lib/offer-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { offerId } = req.body;
  if (!offerId) {
    return res.status(400).json({ error: 'offerId is required' });
  }

  const offer = getOfferById(offerId);
  if (!offer) {
    return res.status(400).json({ error: `Unknown offer: ${offerId}` });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.range-medical.com';

  try {
    const sessionParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: `${baseUrl}/offer-success?session_id={CHECKOUT_SESSION_ID}&offerId=${offerId}`,
      cancel_url: `${baseUrl}/#new-patient-offers`,
      metadata: {
        type: 'new_patient_offer',
        offer_id: offerId,
        offer_name: offer.name,
      },
    };

    if (offer.stripePriceId) {
      sessionParams.line_items = [{ price: offer.stripePriceId, quantity: 1 }];
    } else {
      sessionParams.line_items = [{
        price_data: {
          currency: 'usd',
          unit_amount: offer.priceCents,
          product_data: {
            name: offer.name,
            description: offer.shortDescription,
          },
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Offer checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
