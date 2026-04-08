// Send Consolidated Receipt
// POST: { purchase_ids: [uuid, ...] }
// Sends one receipt email (with PDF) for multiple purchases from the same transaction

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import stripe from '../../../lib/stripe';
import { generateReceiptHtml } from '../../../lib/receipt-email';
import { generateReceiptPdf } from '../../../lib/receipt-pdf';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { purchase_ids } = req.body;

    if (!purchase_ids || !Array.isArray(purchase_ids) || purchase_ids.length === 0) {
      return res.status(400).json({ error: 'purchase_ids array is required' });
    }

    // Fetch all purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .in('id', purchase_ids);

    if (purchaseError || !purchases || purchases.length === 0) {
      console.error('Consolidated receipt — purchases not found:', purchaseError);
      return res.status(404).json({ error: 'Purchases not found' });
    }

    // Get patient from first purchase
    const patientId = purchases[0].patient_id;
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('name, email, phone, address, city, state, zip_code')
      .eq('id', patientId)
      .single();

    if (patientError || !patient?.email) {
      console.log('Consolidated receipt skipped — no patient email found');
      await logComm({
        channel: 'email',
        messageType: 'receipt',
        message: 'Consolidated receipt skipped — no patient email',
        source: 'send-consolidated-receipt',
        patientId,
        status: 'error',
        errorMessage: 'No patient email found',
      });
      return res.status(200).json({ success: false, reason: 'no_email' });
    }

    const firstName = (patient.name || '').split(' ')[0] || 'there';

    // Get card details and actual charged amount from Stripe PaymentIntent
    let cardBrand = null;
    let cardLast4 = null;
    let stripeChargedCents = null;
    const piId = purchases.find(p => p.stripe_payment_intent_id)?.stripe_payment_intent_id;
    if (piId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(piId, {
          expand: ['payment_method'],
        });
        if (pi.payment_method?.card) {
          cardBrand = pi.payment_method.card.brand;
          cardLast4 = pi.payment_method.card.last4;
        }
        // Use the actual amount Stripe charged as source of truth
        if (pi.amount_received) {
          stripeChargedCents = pi.amount_received;
        }
      } catch (err) {
        console.error('Failed to retrieve PaymentIntent for consolidated receipt:', err.message);
      }
    }

    // Build line items — show amount paid only, never original_amount or discounts
    const items = purchases.map(p => {
      const qty = p.quantity || 1;
      const lineTotalCents = Math.round(p.amount * 100);

      return {
        name: p.description || p.item_name,
        quantity: qty,
        unitPriceCents: Math.round(lineTotalCents / qty),
        lineTotalCents,
      };
    });

    // Use Stripe's actual charged amount when available, otherwise sum from DB
    const dbTotalCents = purchases.reduce((sum, p) => sum + Math.round(p.amount * 100), 0);
    const totalAmountCents = stripeChargedCents || dbTotalCents;
    const isComp = totalAmountCents === 0;

    // Build patient address
    const patientAddress = [
      patient.address,
      [patient.city, patient.state, patient.zip_code].filter(Boolean).join(', '),
    ].filter(Boolean).join(', ');

    // Use first purchase ID as the invoice reference
    const receiptParams = {
      firstName,
      patientName: patient.name,
      patientPhone: patient.phone || null,
      patientAddress: patientAddress || null,
      invoiceId: purchases[0].id,
      date: new Date(purchases[0].purchase_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
              timeZone: 'America/Los_Angeles',
      }),
      items,
      amountPaidCents: totalAmountCents,
      cardBrand,
      cardLast4,
    };

    const html = generateReceiptHtml(receiptParams);

    // Generate PDF
    let attachments = [];
    try {
      const pdfBytes = await generateReceiptPdf(receiptParams);
      attachments = [{ filename: 'Range-Medical-Receipt.pdf', content: Buffer.from(pdfBytes) }];
    } catch (pdfErr) {
      console.error('Consolidated receipt PDF generation failed:', pdfErr.message);
    }

    // Send email
    const totalLabel = isComp ? 'Complimentary' : `$${(totalAmountCents / 100).toFixed(2)}`;
    const subjectLine = isComp
      ? 'Your Receipt from Range Medical — Complimentary'
      : `Your Receipt from Range Medical — ${totalLabel}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: patient.email,
      bcc: 'info@range-medical.com',
      subject: subjectLine,
      html,
      attachments,
    });

    const itemNames = purchases.map(p => p.item_name).join(', ');
    console.log(`Consolidated receipt sent to ${patient.email} for ${purchases.length} items`);
    await logComm({
      channel: 'email',
      messageType: 'receipt',
      message: `Receipt for ${totalLabel} — ${itemNames}`,
      source: 'send-consolidated-receipt',
      patientId,
      patientName: patient.name,
      recipient: patient.email,
      subject: subjectLine,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Consolidated receipt error:', error);
    return res.status(500).json({ error: error.message });
  }
}
