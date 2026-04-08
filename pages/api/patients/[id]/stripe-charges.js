// /pages/api/patients/[id]/stripe-charges.js
// Fetches actual Stripe charges for a patient — source of truth for payment amounts
// Range Medical System V2

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Patient ID required' });

  try {
    // Get patient's Stripe customer ID
    const { data: patient } = await supabase
      .from('patients')
      .select('stripe_customer_id')
      .eq('id', id)
      .single();

    if (!patient?.stripe_customer_id) {
      return res.status(200).json({ charges: [], hasStripeCustomer: false });
    }

    // Fetch ALL purchases for this patient — used as fallback when
    // stripe_payment_intent_id isn't populated on older/imported records.
    // We match by purchase_date + amount_paid against the Stripe charge.
    const { data: allPatientPurchases } = await supabase
      .from('purchases')
      .select('id, purchase_date, description, item_name, amount_paid, medication, dose, quantity, category, stripe_payment_intent_id')
      .eq('patient_id', id);
    const unlinkedPurchases = (allPatientPurchases || []).filter(p => !p.stripe_payment_intent_id);

    // Fetch actual charges from Stripe
    const charges = await stripe.charges.list({
      customer: patient.stripe_customer_id,
      limit: 100,
      expand: ['data.payment_intent'],
    });

    // Get all payment intent IDs from charges
    const paymentIntentIds = charges.data
      .map(c => typeof c.payment_intent === 'object' ? c.payment_intent?.id : c.payment_intent)
      .filter(Boolean);

    // Fetch matching purchases from Supabase to get actual item names
    let purchasesByPi = {};
    if (paymentIntentIds.length > 0) {
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, stripe_payment_intent_id, description, item_name, amount_paid, medication, dose, quantity, category')
        .in('stripe_payment_intent_id', paymentIntentIds);

      if (purchases) {
        for (const p of purchases) {
          if (!purchasesByPi[p.stripe_payment_intent_id]) {
            purchasesByPi[p.stripe_payment_intent_id] = [];
          }
          purchasesByPi[p.stripe_payment_intent_id].push(p);
        }
      }
    }

    // Fetch internal invoices (our `invoices` table) by payment_intent_id — these
    // store the staff-side line items entered at checkout / invoice creation.
    let internalInvoiceItemsByPi = {};
    if (paymentIntentIds.length > 0) {
      const { data: internalInvoices } = await supabase
        .from('invoices')
        .select('stripe_payment_intent_id, items, subtotal_cents, discount_cents, discount_description')
        .in('stripe_payment_intent_id', paymentIntentIds);
      if (internalInvoices) {
        for (const inv of internalInvoices) {
          if (!inv.stripe_payment_intent_id || !Array.isArray(inv.items)) continue;
          const rawLines = inv.items.map(it => {
            const qty = Number(it.quantity) || 1;
            const unit = Number(it.price_cents) || 0;
            const baseName = it.display_name || it.name || it.description || 'Service';
            return {
              name: qty > 1 ? `${baseName} ×${qty}` : baseName,
              category: it.category || null,
              line_cents: unit * qty,
            };
          });
          const subtotalCents = rawLines.reduce((s, l) => s + l.line_cents, 0);
          const discountCents = Number(inv.discount_cents) || 0;
          // Prorate discount across lines so each row reflects amount actually paid
          let allocated = 0;
          const lines = rawLines.map((l, idx) => {
            let paidCents;
            if (discountCents > 0 && subtotalCents > 0) {
              if (idx === rawLines.length - 1) {
                paidCents = subtotalCents - discountCents - allocated;
              } else {
                paidCents = Math.round(l.line_cents * (subtotalCents - discountCents) / subtotalCents);
                allocated += paidCents;
              }
            } else {
              paidCents = l.line_cents;
            }
            return {
              name: l.name,
              category: l.category,
              amount_paid: paidCents / 100,
              list_amount: l.line_cents / 100,
              discounted: discountCents > 0 && paidCents !== l.line_cents,
            };
          });
          internalInvoiceItemsByPi[inv.stripe_payment_intent_id] = lines;
        }
      }
    }

    // Fetch invoice line items for charges that came from Stripe invoices
    const invoiceIds = [...new Set(charges.data.map(c => c.invoice).filter(Boolean))];
    let invoiceLineItems = {}; // joined description string
    let invoiceLineItemsDetailed = {}; // structured [{name, amount_paid}]
    if (invoiceIds.length > 0) {
      await Promise.all(invoiceIds.map(async (invId) => {
        try {
          const invoice = await stripe.invoices.retrieve(invId, { expand: ['lines.data'] });
          const lines = invoice.lines?.data || [];
          invoiceLineItems[invId] = lines
            .map(line => line.description || line.price?.nickname || 'Service')
            .join(', ');
          invoiceLineItemsDetailed[invId] = lines.map(line => ({
            name: line.description || line.price?.nickname || 'Service',
            amount_paid: typeof line.amount === 'number' ? line.amount / 100 : null,
            category: null,
          }));
        } catch (err) {
          // Skip if invoice retrieval fails
        }
      }));
    }

    const formattedCharges = charges.data.map(c => {
      const piId = typeof c.payment_intent === 'object' ? c.payment_intent?.id : c.payment_intent;
      const linkedPurchases = piId ? (purchasesByPi[piId] || []) : [];

      // Build a readable description: purchases first, then invoice line items, then Stripe description
      let itemDescription = c.description;
      if (linkedPurchases.length > 0) {
        itemDescription = linkedPurchases
          .map(p => p.medication || p.description || p.item_name || 'Service')
          .join(', ');
      } else if (c.invoice && invoiceLineItems[c.invoice]) {
        itemDescription = invoiceLineItems[c.invoice];
      }

      // Itemized line items (medication + dose + amount paid) — staff-facing detail
      let lineItems = linkedPurchases.map(p => {
        const baseName = p.medication || p.description || p.item_name || 'Service';
        const parts = [baseName];
        if (p.dose) parts.push(p.dose);
        if (p.quantity && Number(p.quantity) > 1) parts.push(`×${p.quantity}`);
        return {
          name: parts.join(' · '),
          category: p.category || null,
          amount_paid: p.amount_paid != null ? Number(p.amount_paid) : null,
        };
      });
      // Fallback 1: internal invoices table keyed by payment intent
      if (lineItems.length === 0 && piId && internalInvoiceItemsByPi[piId]) {
        lineItems = internalInvoiceItemsByPi[piId];
      }
      // Fallback 2: Stripe-hosted invoice lines
      if (lineItems.length === 0 && c.invoice && invoiceLineItemsDetailed[c.invoice]) {
        lineItems = invoiceLineItemsDetailed[c.invoice];
      }
      // Fallback 3: match unlinked purchases by date (±1 day) and where the
      // sum of amount_paid on that day equals the charge total. Handles older
      // imported purchases that never got stripe_payment_intent_id set.
      if (lineItems.length === 0 && unlinkedPurchases.length > 0) {
        const chargeDate = new Date(c.created * 1000);
        const chargeAmount = c.amount / 100;
        // PT date string for comparison
        const ymd = (d) => d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
        const targetYmd = ymd(chargeDate);
        const sameDay = unlinkedPurchases.filter(p => {
          if (!p.purchase_date) return false;
          // purchase_date may be 'YYYY-MM-DD' or ISO; normalize
          const pd = String(p.purchase_date).slice(0, 10);
          return pd === targetYmd;
        });
        // Try exact-amount single match first
        const exact = sameDay.filter(p => Math.abs(Number(p.amount_paid) - chargeAmount) < 0.01);
        let matched = [];
        if (exact.length > 0) {
          matched = exact;
        } else {
          // Otherwise, if all same-day purchases sum to the charge amount, use them all
          const sum = sameDay.reduce((s, p) => s + Number(p.amount_paid || 0), 0);
          if (sameDay.length > 0 && Math.abs(sum - chargeAmount) < 0.01) {
            matched = sameDay;
          }
        }
        if (matched.length > 0) {
          lineItems = matched.map(p => {
            const baseName = p.medication || p.item_name || p.description || 'Service';
            const parts = [baseName];
            if (p.dose) parts.push(p.dose);
            if (p.quantity && Number(p.quantity) > 1) parts.push(`×${p.quantity}`);
            return {
              name: parts.join(' · '),
              category: p.category || null,
              amount_paid: p.amount_paid != null ? Number(p.amount_paid) : null,
            };
          });
          // Also override the description so the row title shows the items
          if (!itemDescription || itemDescription === c.description) {
            itemDescription = matched.map(p => p.medication || p.item_name || p.description || 'Service').join(', ');
          }
        }
      }

      return {
        id: c.id,
        amount: c.amount, // cents — actual amount charged
        amount_refunded: c.amount_refunded,
        refunded: c.refunded,
        status: c.status,
        created: c.created, // unix timestamp
        description: itemDescription,
        payment_intent_id: piId,
        card_brand: c.payment_method_details?.card?.brand || null,
        card_last4: c.payment_method_details?.card?.last4 || null,
        receipt_url: c.receipt_url,
        purchase_id: linkedPurchases.length > 0 ? linkedPurchases[0].id : null,
        line_items: lineItems,
      };
    });

    return res.status(200).json({
      charges: formattedCharges,
      hasStripeCustomer: true,
    });
  } catch (error) {
    console.error('Stripe charges API error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
