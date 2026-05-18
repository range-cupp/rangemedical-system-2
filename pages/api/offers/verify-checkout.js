// pages/api/offers/verify-checkout.js
// Verifies a Stripe Checkout Session is paid. Called by the success page.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      return res.status(200).json({
        paid: true,
        email: session.customer_details?.email || '',
        name: session.customer_details?.name || '',
        offerId: session.metadata?.offer_id || '',
      });
    }

    return res.status(200).json({ paid: false });
  } catch (error) {
    console.error('Verify checkout error:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
}
