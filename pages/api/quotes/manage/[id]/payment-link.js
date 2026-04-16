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

    // Re-hydrate POS metadata at link-creation time so category / peptide / duration
    // always reflect the live POS catalog — not a stale snapshot captured at quote time.
    // Resolution order: (1) by pos_service_id, (2) stored snapshot fields on the item,
    // (3) exact name match against pos_services. This way legacy quotes created before
    // we captured pos_service_id still flow correctly.
    const posIds = chosenItems.map((it) => it.pos_service_id).filter(Boolean);
    const itemNames = [...new Set(
      chosenItems
        .filter((it) => !it.pos_service_id && it.name)
        .map((it) => it.name)
    )];

    const posById = new Map();
    if (posIds.length) {
      const { data: rows } = await supabase
        .from('pos_services')
        .select('id, name, category, sub_category, peptide_identifier, duration_days')
        .in('id', posIds);
      (rows || []).forEach((r) => posById.set(r.id, r));
    }

    const posByName = new Map();
    if (itemNames.length) {
      const { data: rows } = await supabase
        .from('pos_services')
        .select('id, name, category, sub_category, peptide_identifier, duration_days')
        .in('name', itemNames);
      // First match wins per name (catalog shouldn't have duplicate names within category)
      (rows || []).forEach((r) => { if (!posByName.has(r.name)) posByName.set(r.name, r); });
    }

    const resolveMeta = (it) => {
      if (it.pos_service_id && posById.has(it.pos_service_id)) {
        const p = posById.get(it.pos_service_id);
        return { category: p.category, sub_category: p.sub_category, peptide_identifier: p.peptide_identifier, duration_days: p.duration_days, pos_service_id: p.id, source: 'pos_id' };
      }
      if (it.category || it.peptide_identifier || it.duration_days) {
        return {
          category: it.category || null,
          sub_category: it.sub_category || null,
          peptide_identifier: it.peptide_identifier || null,
          duration_days: it.duration_days || null,
          pos_service_id: it.pos_service_id || null,
          source: 'snapshot',
        };
      }
      if (it.name && posByName.has(it.name)) {
        const p = posByName.get(it.name);
        return { category: p.category, sub_category: p.sub_category, peptide_identifier: p.peptide_identifier, duration_days: p.duration_days, pos_service_id: p.id, source: 'name_match' };
      }
      return { category: null, sub_category: null, peptide_identifier: null, duration_days: null, pos_service_id: null, source: 'unresolved' };
    };

    // ── Validation gate ──────────────────────────────────────────────
    // Before we create the Stripe session, confirm every line item either
    // (a) resolved to a POS category, or (b) is obviously non-protocol
    // (shipping / tax / fee). Anything else gets surfaced to the admin so
    // they can either fix it in the quote or explicitly confirm it's
    // intentional. This is the hard stop that ensures paid quotes always
    // produce correct protocols when they should.
    const NON_PROTOCOL_NAME = /\b(shipping|delivery|overnight|tax|fee|surcharge|handling|discount|rebate)\b/i;
    const enriched = chosenItems.map((it, idx) => {
      const meta = resolveMeta(it);
      const resolved = !!meta.category;
      const looksNonProtocol = NON_PROTOCOL_NAME.test(String(it.name || ''));
      return { idx, item: it, meta, resolved, looksNonProtocol };
    });
    const unresolvedProtocolLike = enriched.filter((e) => !e.resolved && !e.looksNonProtocol);

    if (unresolvedProtocolLike.length > 0 && !req.body?.confirm_unresolved) {
      return res.status(422).json({
        error: 'One or more line items are not linked to a POS service',
        needs_confirmation: true,
        unresolved: unresolvedProtocolLike.map((e) => ({
          index: e.idx,
          name: e.item.name,
          price: e.item.price,
          qty: e.item.qty,
        })),
        all_items: enriched.map((e) => ({
          index: e.idx,
          name: e.item.name,
          price: e.item.price,
          resolved: e.resolved,
          resolution_source: e.meta.source,
          category: e.meta.category,
          looks_non_protocol: e.looksNonProtocol,
        })),
      });
    }

    // Build Stripe Checkout line items with inline price_data (no pre-created Prices needed).
    // Category / peptide / duration metadata flows through so the stripe webhook can
    // auto-create the matching protocol when the patient pays.
    const compactMeta = (obj) => {
      const out = {};
      for (const [k, v] of Object.entries(obj || {})) {
        if (v === null || v === undefined || v === '') continue;
        out[k] = String(v);
      }
      return out;
    };
    const line_items = enriched.map(({ item: it, meta }) => {
      const productMeta = compactMeta({
        category: meta.category,
        sub_category: meta.sub_category,
        peptide_identifier: meta.peptide_identifier,
        duration_days: meta.duration_days,
        pos_service_id: meta.pos_service_id,
      });
      const priceMeta = compactMeta({
        peptide_identifier: meta.peptide_identifier,
        duration_days: meta.duration_days,
      });
      return {
        quantity: Number(it.qty) || 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(it.price || 0) * 100),
          ...(Object.keys(priceMeta).length ? { metadata: priceMeta } : {}),
          product_data: {
            name: String(it.name || 'Item'),
            ...(it.description ? { description: String(it.description).slice(0, 500) } : {}),
            ...(Object.keys(productMeta).length ? { metadata: productMeta } : {}),
          },
        },
      };
    });

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
