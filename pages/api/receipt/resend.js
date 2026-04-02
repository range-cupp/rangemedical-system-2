// POST /api/receipt/resend — Resend receipt email for a purchase
// If the purchase is part of a consolidated transaction (same stripe_payment_intent_id),
// sends a consolidated receipt with all items from that transaction.
// Body: { purchase_id: uuid }

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
    const { purchase_id } = req.body;

    if (!purchase_id) {
      return res.status(400).json({ error: 'purchase_id is required' });
    }

    // Fetch the requested purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchase_id)
      .single();

    if (purchaseError || !purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Check if this purchase is part of a consolidated transaction
    let allPurchases = [purchase];
    if (purchase.stripe_payment_intent_id) {
      const { data: siblings } = await supabase
        .from('purchases')
        .select('*')
        .eq('stripe_payment_intent_id', purchase.stripe_payment_intent_id)
        .order('created_at', { ascending: true });

      if (siblings && siblings.length > 1) {
        allPurchases = siblings;
      }
    }

    const isMultiItem = allPurchases.length > 1;

    // Get patient info
    const patientId = purchase.patient_id;
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('name, email, phone, address, city, state, zip_code')
      .eq('id', patientId)
      .single();

    if (patientError || !patient?.email) {
      return res.status(400).json({ error: 'No patient email found' });
    }

    const firstName = (patient.name || '').split(' ')[0] || 'there';
    const patientAddress = [
      patient.address,
      [patient.city, patient.state, patient.zip_code].filter(Boolean).join(', '),
    ].filter(Boolean).join(', ');

    // Get card details from Stripe
    let cardBrand = null;
    let cardLast4 = null;
    const piId = allPurchases.find(p => p.stripe_payment_intent_id)?.stripe_payment_intent_id;
    if (piId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(piId, {
          expand: ['payment_method'],
        });
        if (pi.payment_method?.card) {
          cardBrand = pi.payment_method.card.brand;
          cardLast4 = pi.payment_method.card.last4;
        }
      } catch (err) {
        console.error('Failed to retrieve PaymentIntent for resend receipt:', err.message);
      }
    }

    // Determine payment method display for non-Stripe purchases
    let paymentMethod = null;
    if (!cardBrand && !cardLast4) {
      const method = purchase.payment_method || '';
      if (method === 'cash') paymentMethod = 'Cash';
      else if (method === 'manual') paymentMethod = 'Manual payment';
    }

    let receiptParams;

    if (isMultiItem) {
      // Consolidated receipt
      // Show amount paid only — never original_amount or discounts
      const items = allPurchases.map(p => {
        const qty = p.quantity || 1;
        const lineTotalCents = Math.round(p.amount * 100);
        const name = p.description || p.item_name || 'Service';

        return { name, quantity: qty, unitPriceCents: Math.round(lineTotalCents / qty), lineTotalCents };
      });

      const totalAmountCents = allPurchases.reduce((sum, p) => sum + Math.round(p.amount * 100), 0);

      receiptParams = {
        firstName,
        patientName: patient.name,
        patientPhone: patient.phone || null,
        patientAddress: patientAddress || null,
        invoiceId: allPurchases[0].id,
        date: new Date(purchase.purchase_date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        items,
        amountPaidCents: totalAmountCents,
        cardBrand,
        cardLast4,
        paymentMethod,
      };
    } else {
      // Single-item receipt — show amount paid only, never original_amount or discounts
      const rawPaid = parseFloat(purchase.amount_paid);
      const rawAmt = parseFloat(purchase.amount) || 0;
      const amountPaidCents = Math.round((!isNaN(rawPaid) ? rawPaid : rawAmt) * 100);

      receiptParams = {
        firstName,
        patientName: patient.name,
        patientPhone: patient.phone || null,
        patientAddress: patientAddress || null,
        invoiceId: purchase.id,
        date: new Date(purchase.purchase_date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        description: purchase.description || purchase.item_name,
        amountPaidCents,
        cardBrand,
        cardLast4,
        paymentMethod,
      };
    }

    const html = generateReceiptHtml(receiptParams);

    // Generate PDF
    let attachments = [];
    try {
      const pdfBytes = await generateReceiptPdf(receiptParams);
      attachments = [{ filename: 'Range-Medical-Receipt.pdf', content: Buffer.from(pdfBytes) }];
    } catch (pdfErr) {
      console.error('Resend receipt PDF generation failed:', pdfErr.message);
    }

    // Calculate total for subject line
    const totalCents = isMultiItem
      ? allPurchases.reduce((sum, p) => sum + Math.round(p.amount * 100), 0)
      : Math.round(parseFloat(purchase.amount) * 100);
    const isComp = totalCents === 0;
    const totalLabel = isComp ? 'Complimentary' : `$${(totalCents / 100).toFixed(2)}`;
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

    const itemNames = allPurchases.map(p => p.item_name).join(', ');
    await logComm({
      channel: 'email',
      messageType: 'receipt',
      message: `Receipt resent for ${totalLabel} — ${itemNames}`,
      source: 'resend-receipt',
      patientId,
      patientName: patient.name,
      recipient: patient.email,
      subject: subjectLine,
    });

    return res.status(200).json({
      success: true,
      email: patient.email,
      items: allPurchases.length,
      total: totalLabel,
    });
  } catch (error) {
    console.error('Resend receipt error:', error);
    return res.status(500).json({ error: error.message });
  }
}
