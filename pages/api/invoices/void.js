// POST /api/invoices/void
// Void an invoice — cancels it and optionally refunds via Stripe
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoice_id, reason, voided_by } = req.body;

  if (!invoice_id) {
    return res.status(400).json({ error: 'invoice_id is required' });
  }

  try {
    // Fetch the invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (fetchError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Can't void an already voided/cancelled invoice
    if (invoice.status === 'voided' || invoice.status === 'cancelled') {
      return res.status(400).json({ error: `Invoice is already ${invoice.status}` });
    }

    let refund = null;

    // If the invoice was paid and has a Stripe payment intent, issue a refund
    if (invoice.status === 'paid' && invoice.stripe_payment_intent_id) {
      try {
        refund = await stripe.refunds.create({
          payment_intent: invoice.stripe_payment_intent_id,
          reason: 'requested_by_customer',
        });
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr);
        return res.status(500).json({
          error: `Stripe refund failed: ${stripeErr.message}`,
        });
      }
    }

    // Update invoice status to voided
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by: voided_by || null,
        void_reason: reason || null,
        stripe_refund_id: refund?.id || null,
      })
      .eq('id', invoice_id)
      .select()
      .single();

    if (updateError) {
      console.error('Void invoice update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // If the invoice had recorded purchases, mark them as refunded
    if (invoice.status === 'paid' && invoice.patient_id) {
      try {
        await supabase
          .from('purchases')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', invoice.stripe_payment_intent_id);
      } catch (purchaseErr) {
        console.error('Mark purchases refunded error:', purchaseErr);
      }
    }

    return res.status(200).json({
      invoice: updated,
      refund: refund ? { id: refund.id, status: refund.status, amount: refund.amount } : null,
    });
  } catch (error) {
    console.error('Void invoice error:', error);
    return res.status(500).json({ error: error.message });
  }
}
