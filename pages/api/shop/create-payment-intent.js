// pages/api/shop/create-payment-intent.js
// Creates a Stripe PaymentIntent for the vial shop checkout.
// Total is computed server-side from items + shipping method — never trust the client amount.
// Stripe sees ONLY a generic "Peptide Therapy" descriptor; itemized detail goes to the patient receipt.

import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { getVialById, getShippingOption } from '../../../lib/vial-catalog';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.SHOP_JWT_SECRET || process.env.CRON_SECRET;

function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.split(' ')[1], JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

    const { items, shippingMethod } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'No items' });
    if (!shippingMethod) return res.status(400).json({ error: 'No shipping method' });

    let subtotalCents = 0;
    for (const item of items) {
      const vial = getVialById(item.peptideId);
      if (!vial) return res.status(400).json({ error: `Unknown peptide: ${item.peptideId}` });
      const qty = Math.max(1, Math.min(100, parseInt(item.quantity, 10) || 0));
      subtotalCents += vial.priceCents * qty;
    }

    const shippingOption = getShippingOption(shippingMethod);
    if (!shippingOption) return res.status(400).json({ error: 'Invalid shipping method' });
    const shippingCents = shippingOption.price || 0;

    const totalCents = subtotalCents + shippingCents;
    if (totalCents < 100) return res.status(400).json({ error: 'Order total too low' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      description: 'Peptide Therapy',
      statement_descriptor_suffix: 'PEPTIDE',
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: 'vial_shop',
        patient_id: decoded.patientId,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalCents,
      subtotalCents,
      shippingCents,
    });
  } catch (err) {
    console.error('Payment intent error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment' });
  }
}
