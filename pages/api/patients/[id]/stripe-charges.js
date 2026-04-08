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
      // Fallback: build from Stripe invoice lines when no linked purchases exist
      if (lineItems.length === 0 && c.invoice && invoiceLineItemsDetailed[c.invoice]) {
        lineItems = invoiceLineItemsDetailed[c.invoice];
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
