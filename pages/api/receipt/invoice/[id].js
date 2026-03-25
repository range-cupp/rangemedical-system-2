// GET /api/receipt/invoice/[id] — Returns PDF receipt for a paid invoice
// Generates receipt directly from invoice data (works for all payment methods)

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../../lib/stripe';
import { generateReceiptPdf } from '../../../../lib/receipt-pdf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing invoice id' });
  }

  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'paid') {
      return res.status(400).json({ error: 'Invoice has not been paid' });
    }

    // Fetch patient info
    let patient = null;
    if (invoice.patient_id) {
      const { data } = await supabase
        .from('patients')
        .select('name, phone, address, city, state, zip_code')
        .eq('id', invoice.patient_id)
        .single();
      patient = data;
    }

    const patientName = patient?.name || invoice.patient_name || 'Patient';
    const firstName = patientName.split(' ')[0] || 'Patient';
    const patientAddress = patient
      ? [patient.address, [patient.city, patient.state, patient.zip_code].filter(Boolean).join(', ')].filter(Boolean).join(', ')
      : null;

    // Get card details from Stripe if available
    let cardBrand = null;
    let cardLast4 = null;
    if (invoice.stripe_payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(invoice.stripe_payment_intent_id, {
          expand: ['payment_method'],
        });
        if (pi.payment_method?.card) {
          cardBrand = pi.payment_method.card.brand;
          cardLast4 = pi.payment_method.card.last4;
        }
      } catch (err) {
        console.error('Failed to retrieve PaymentIntent for invoice receipt:', err.message);
      }
    }

    // Determine payment method display for non-Stripe payments
    let paymentMethod = null;
    if (!cardBrand && !cardLast4) {
      const notes = invoice.notes || '';
      if (notes.includes('comp') || notes.includes('Comp')) {
        paymentMethod = 'Complimentary';
      } else if (notes.includes('cash') || notes.includes('Cash')) {
        paymentMethod = 'Cash';
      } else if (notes.includes('card') || notes.includes('Card')) {
        paymentMethod = 'Card';
      }
    }

    const date = new Date(invoice.paid_at || invoice.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const items = (invoice.items || []);
    const isMultiItem = items.length > 1;

    let pdfParams;

    if (isMultiItem) {
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

      const lineItems = items.map(item => {
        const qty = item.quantity || 1;
        const itemSubtotal = item.price_cents * qty;
        let lineTotalCents = itemSubtotal;

        if (hasDiscount && subtotalCents > 0) {
          const proportion = itemSubtotal / subtotalCents;
          const itemDiscount = Math.round(invoice.discount_cents * proportion);
          lineTotalCents = Math.max(itemSubtotal - itemDiscount, 0);
        }

        let discountLabel = null;
        if (hasDiscount && discountType === 'percent') {
          discountLabel = `${discountAmount}% off`;
        } else if (hasDiscount && discountType === 'dollar') {
          discountLabel = `$${discountAmount} off`;
        }

        return {
          name: item.display_name || item.name || 'Service',
          quantity: qty,
          unitPriceCents: item.price_cents,
          discountLabel,
          lineTotalCents,
        };
      });

      pdfParams = {
        firstName,
        patientName,
        patientPhone: patient?.phone || invoice.patient_phone || null,
        patientAddress,
        invoiceId: invoice.id,
        date,
        items: lineItems,
        amountPaidCents: invoice.total_cents,
        cardBrand,
        cardLast4,
        paymentMethod,
      };
    } else {
      // Single item
      const item = items[0] || {};
      const qty = item.quantity || 1;
      const originalAmountCents = item.price_cents ? item.price_cents * qty : invoice.subtotal_cents || invoice.total_cents;

      let discountLabel = null;
      if (invoice.discount_cents > 0 && invoice.discount_description) {
        discountLabel = invoice.discount_description;
      }

      pdfParams = {
        firstName,
        patientName,
        patientPhone: patient?.phone || invoice.patient_phone || null,
        patientAddress,
        invoiceId: invoice.id,
        date,
        description: item.display_name || item.name || 'Service',
        originalAmountCents: invoice.discount_cents > 0 ? originalAmountCents : invoice.total_cents,
        discountLabel,
        amountPaidCents: invoice.total_cents,
        cardBrand,
        cardLast4,
        paymentMethod,
      };
    }

    const pdfBytes = await generateReceiptPdf(pdfParams);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Range-Medical-Receipt.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Invoice receipt PDF error:', error);
    return res.status(500).json({ error: 'Failed to generate receipt' });
  }
}
