// /pages/api/quotes/manage/[id]/payment-link.js
// Convert an accepted quote into a Stripe Checkout Session URL ("payment link").
// Body: { option_index?: number } — required for comparison quotes.
// Range Medical

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PUBLIC_QUOTE_BASE = 'https://range-medical.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const { option_index = null } = req.body || {};

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !quote) return res.status(404).json({ error: 'Quote not found' });

    // Resolve which set of items + totals to charge for
    const hasOptions = Array.isArray(quote.options) && quote.options.length > 0;
    let chosenItems, chosenSubtotal, chosenDiscount, chosenTotal, chosenOptionIndex;

    if (hasOptions) {
      const idx = Number.isInteger(option_index) ? option_index : null;
      if (idx === null || idx < 0 || idx >= quote.options.length) {
        return res.status(400).json({ error: 'option_index is required for comparison quotes' });
      }
      const opt = quote.options[idx];
      chosenItems = opt.items || [];
      chosenSubtotal = Number(opt.subtotal_cents) || 0;
      chosenDiscount = Number(opt.discount_cents) || 0;
      chosenTotal = Number(opt.total_cents) || 0;
      chosenOptionIndex = idx;
    } else {
      chosenItems = quote.items || [];
      chosenSubtotal = Number(quote.subtotal_cents) || 0;
      chosenDiscount = Number(quote.discount_cents) || 0;
      chosenTotal = Number(quote.total_cents) || 0;
      chosenOptionIndex = null;
    }

    if (!chosenItems.length) return res.status(400).json({ error: 'Quote has no items' });
    if (chosenTotal <= 0) return res.status(400).json({ error: 'Quote total must be greater than zero' });

    // Build Stripe Checkout line items with inline price_data (no pre-created Prices needed)
    const line_items = chosenItems.map((it) => ({
      quantity: Number(it.qty) || 1,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(Number(it.price || 0) * 100),
        product_data: {
          name: String(it.name || 'Item'),
          ...(it.description ? { description: String(it.description).slice(0, 500) } : {}),
        },
      },
    }));

    // Apply discount via a one-off coupon so the patient sees the breakdown on Stripe too
    let discounts;
    if (chosenDiscount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: chosenDiscount,
        currency: 'usd',
        duration: 'once',
        name: 'Bundle Discount',
        max_redemptions: 1,
        metadata: { quote_id: quote.id, quote_token: quote.token },
      });
      discounts = [{ coupon: coupon.id }];
    }

    const metadata = {
      source: 'quote',
      quote_id: quote.id,
      quote_token: quote.token,
      patient_id: quote.patient_id || '',
      option_index: chosenOptionIndex === null ? '' : String(chosenOptionIndex),
      recipient_name: quote.recipient_name || '',
    };

    const successUrl = `${PUBLIC_QUOTE_BASE}/quote/${quote.token}?paid=true`;
    const cancelUrl  = `${PUBLIC_QUOTE_BASE}/quote/${quote.token}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      ...(discounts ? { discounts } : { allow_promotion_codes: false }),
      ...(quote.recipient_email ? { customer_email: quote.recipient_email } : {}),
      phone_number_collection: { enabled: true },
      billing_address_collection: 'auto',
      metadata,
      payment_intent_data: { metadata },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Persist the link on the quote row + bump status to accepted
    const nowIso = new Date().toISOString();
    const update = {
      accepted_option_index: chosenOptionIndex,
      stripe_session_id: session.id,
      stripe_session_url: session.url,
      payment_link_created_at: nowIso,
    };
    if (quote.status !== 'paid') update.status = 'accepted';

    const { data: updated, error: updErr } = await supabase
      .from('quotes')
      .update(update)
      .eq('id', quote.id)
      .select()
      .single();
    if (updErr) throw updErr;

    return res.status(200).json({
      ok: true,
      url: session.url,
      session_id: session.id,
      amount_cents: chosenTotal,
      option_index: chosenOptionIndex,
      quote: updated,
    });
  } catch (err) {
    console.error('quote payment-link api error', err);
    return res.status(500).json({ error: err.message });
  }
}
