// pages/api/shop/create-payment-intent.js
// Creates a Stripe PaymentIntent for the shop checkout.
// Total is computed server-side from items + shipping method — never trust the client amount.
// Stripe sees only a category-themed protocol descriptor (Recovery Therapy, Wellness Protocol,
// Longevity Protocol, Cognitive Therapy, Immune Support, etc.) — never the word "vial".
// Itemized detail with the actual product names goes to the patient receipt only.

import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { getVialById, getShippingOption } from '../../../lib/vial-catalog';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.SHOP_JWT_SECRET || process.env.CRON_SECRET;

// What Stripe sees for each category. Pick generic, protocol-flavored language.
// Suffix appears on bank statements as "RANGE MEDICAL* SUFFIX" — keep ≤10 chars.
const STRIPE_CATEGORY_MAP = {
  recovery:        { description: 'Recovery Therapy',   suffix: 'RECOVERY' },
  growth_hormone:  { description: 'Wellness Protocol',  suffix: 'WELLNESS' },
  longevity:       { description: 'Longevity Protocol', suffix: 'VITALITY' },
  neuro:           { description: 'Cognitive Therapy',  suffix: 'FOCUS' },
  immune:          { description: 'Immune Support',     suffix: 'IMMUNE' },
  sexual_health:   { description: 'Wellness Therapy',   suffix: 'WELLNESS' },
};
const STRIPE_DEFAULT = { description: 'Wellness Therapy', suffix: 'WELLNESS' };

// Single-category cart → category-specific descriptor.
// Mixed-category cart → generic default.
function getStripeDescriptor(items) {
  const cats = new Set();
  for (const item of items) {
    const vial = getVialById(item.peptideId);
    if (vial) cats.add(vial.category);
  }
  if (cats.size === 1) {
    const cat = [...cats][0];
    return STRIPE_CATEGORY_MAP[cat] || STRIPE_DEFAULT;
  }
  return STRIPE_DEFAULT;
}

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

    const descriptor = getStripeDescriptor(items);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      description: descriptor.description,
      statement_descriptor_suffix: descriptor.suffix,
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: 'shop_order',
        protocol_category: descriptor.description,
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
