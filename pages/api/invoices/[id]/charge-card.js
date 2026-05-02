// POST /api/invoices/[id]/charge-card
// Charge a patient's saved card on file for an open invoice
// Used by front desk when patient calls and says "charge my card"

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { payment_method_id, amount_cents } = req.body;

  if (!payment_method_id) {
    return res.status(400).json({ error: 'payment_method_id is required' });
  }

  try {
    // Get invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(200).json({ invoice, message: 'Invoice already paid' });
    }

    if (invoice.status === 'voided' || invoice.status === 'cancelled') {
      return res.status(400).json({ error: `Cannot charge a ${invoice.status} invoice` });
    }

    if (!invoice.patient_id) {
      return res.status(400).json({ error: 'Invoice has no linked patient' });
    }

    // Get patient's Stripe customer ID
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('stripe_customer_id, name')
      .eq('id', invoice.patient_id)
      .single();

    if (patientError || !patient?.stripe_customer_id) {
      return res.status(400).json({ error: 'Patient has no Stripe customer on file' });
    }

    const chargeAmount = amount_cents && amount_cents > 0 && amount_cents <= invoice.total_cents
      ? amount_cents : invoice.total_cents;

    // Create and confirm PaymentIntent with the saved card
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: 'usd',
      customer: patient.stripe_customer_id,
      payment_method: payment_method_id,
      payment_method_types: ['card'],
      confirm: true,
      description: `Invoice for ${invoice.patient_name}`,
      metadata: {
        patient_id: invoice.patient_id,
        invoice_id: id,
      },
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com'}/admin/payments`,
    });

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: `Payment not completed. Status: ${paymentIntent.status}`,
        status: paymentIntent.status,
      });
    }

    // Payment succeeded — complete the invoice using the same logic as complete.js
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntent.id,
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update invoice error:', updateError);
      return res.status(500).json({ error: 'Payment succeeded but invoice update failed. Payment ID: ' + paymentIntent.id });
    }

    // Record each item as a purchase
    if (invoice.items?.length > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
      const hasDiscount = invoice.discount_cents > 0;
      const subtotalCents = invoice.subtotal_cents || 0;

      let discountType = null;
      let discountAmount = null;
      if (hasDiscount && invoice.discount_description) {
        const desc = invoice.discount_description;
        if (desc.includes('%')) {
          discountType = 'percent';
          discountAmount = parseFloat(desc);
        } else if (desc.includes('$')) {
          discountType = 'dollar';
          discountAmount = parseFloat(desc.replace('$', ''));
        }
      }

      for (const item of invoice.items) {
        const itemSubtotal = item.price_cents * (item.quantity || 1);
        let itemAmount = itemSubtotal;
        let itemOriginalAmount = null;
        if (hasDiscount && subtotalCents > 0) {
          const proportion = itemSubtotal / subtotalCents;
          const itemDiscount = Math.round(invoice.discount_cents * proportion);
          itemAmount = Math.max(itemSubtotal - itemDiscount, 0);
          itemOriginalAmount = itemSubtotal;
        }

        // Use internal_name (with actual peptide) for protocol creation, not
        // the patient-facing display name. Pass through builder configs.
        const serviceName = item.internal_name || item.name;
        try {
          await fetch(`${baseUrl}/api/stripe/record-purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: invoice.patient_id,
              amount: itemAmount,
              description: item.name,
              service_category: item.category || null,
              service_name: serviceName,
              stripe_payment_intent_id: paymentIntent.id,
              payment_method: 'stripe',
              quantity: item.quantity || 1,
              delivery_method: item.delivery_method || null,
              duration_days: item.duration_days || null,
              peptide_config: item.peptide_config || null,
              wl_config: item.wl_config || null,
              hrt_config: item.hrt_config || null,
              injection_frequency: item.inj_config?.frequency || null,
              ...(hasDiscount && itemOriginalAmount ? {
                discount_type: discountType,
                discount_amount: discountAmount,
                original_amount: itemOriginalAmount,
              } : {}),
            }),
          });
        } catch (err) {
          console.error(`Record purchase error for item ${item.name}:`, err);
        }
      }
    }

    return res.status(200).json({
      invoice: updated,
      payment_intent_id: paymentIntent.id,
      message: 'Card charged successfully',
    });
  } catch (error) {
    console.error('Charge card error:', error);
    // Stripe errors have a specific structure
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}
