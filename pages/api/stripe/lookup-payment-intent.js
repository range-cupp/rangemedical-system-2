// Look up a Stripe PaymentIntent by ID for the Tap to Pay (Stripe Terminal) flow.
// Staff creates a charge in the Stripe Dashboard iPhone app (Tap to Pay on iPhone),
// then pastes the PI ID here. This endpoint validates the PI and returns card details
// so the UI can confirm amount/card before recording the purchase.
//
// POST: { payment_intent_id, expected_amount_cents }
// Returns: { ok, pi, already_recorded, amount_matches }

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeId(raw) {
  const v = String(raw || '').trim();
  // Accept bare PI IDs (pi_...) or a full URL from the Stripe dashboard.
  const match = v.match(/pi_[A-Za-z0-9]+/);
  return match ? match[0] : v;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { payment_intent_id, expected_amount_cents } = req.body || {};
  const piId = normalizeId(payment_intent_id);

  if (!piId.startsWith('pi_')) {
    return res.status(400).json({ error: 'Invalid PaymentIntent ID. Expected "pi_…".' });
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(piId, {
      expand: ['payment_method', 'latest_charge'],
    });
  } catch (err) {
    return res.status(404).json({ error: err.message || 'PaymentIntent not found' });
  }

  if (pi.status !== 'succeeded') {
    return res.status(400).json({
      error: `PaymentIntent is "${pi.status}", not succeeded. Complete the charge in the Stripe app first.`,
      status: pi.status,
    });
  }

  // Check if this PI has already been recorded against a purchase — prevents double-record.
  const { data: existing } = await supabase
    .from('purchases')
    .select('id, patient_id, purchase_date, amount_paid')
    .eq('stripe_payment_intent_id', piId)
    .limit(1);

  const alreadyRecorded = Array.isArray(existing) && existing.length > 0;

  // Card details — Tap to Pay comes through as card_present with wallet info
  const charge = pi.latest_charge;
  const pm = charge?.payment_method_details || pi.payment_method;
  const cardBrand =
    charge?.payment_method_details?.card_present?.brand ||
    charge?.payment_method_details?.card?.brand ||
    pi.payment_method?.card?.brand ||
    null;
  const cardLast4 =
    charge?.payment_method_details?.card_present?.last4 ||
    charge?.payment_method_details?.card?.last4 ||
    pi.payment_method?.card?.last4 ||
    null;
  const wallet =
    charge?.payment_method_details?.card_present?.wallet?.type ||
    charge?.payment_method_details?.card?.wallet?.type ||
    null;

  const amountCents = pi.amount_received || pi.amount;
  const expected = Number(expected_amount_cents) || 0;
  const amountMatches = expected > 0 ? amountCents === expected : true;

  return res.status(200).json({
    ok: true,
    pi: {
      id: pi.id,
      amount_cents: amountCents,
      currency: pi.currency,
      created: pi.created,
      card_brand: cardBrand,
      card_last4: cardLast4,
      wallet,
      customer: pi.customer || null,
      description: pi.description || null,
      receipt_email: charge?.receipt_email || pi.receipt_email || null,
    },
    already_recorded: alreadyRecorded,
    existing_purchase: alreadyRecorded ? existing[0] : null,
    amount_matches: amountMatches,
    expected_amount_cents: expected,
  });
}
