// Record Purchase After Stripe Payment
// POST: { patient_id, amount, description, stripe_payment_intent_id?, stripe_subscription_id?, payment_method }

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import stripe from '../../../lib/stripe';
import { generateReceiptHtml } from '../../../lib/receipt-email';
import { autoCreateOrExtendProtocol } from '../../../lib/auto-protocol';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendReceiptEmail(purchase) {
  try {
    // Fetch patient info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('name, email')
      .eq('id', purchase.patient_id)
      .single();

    if (patientError || !patient?.email) {
      console.log('Receipt email skipped — no patient email found');
      await logComm({ channel: 'email', messageType: 'receipt', message: 'Receipt skipped — no patient email', source: 'record-purchase', patientId: purchase.patient_id, status: 'error', errorMessage: 'No patient email found' });
      return;
    }

    const firstName = (patient.name || '').split(' ')[0] || 'there';

    // Get card details from Stripe PaymentIntent
    let cardBrand = null;
    let cardLast4 = null;
    if (purchase.stripe_payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(purchase.stripe_payment_intent_id, {
          expand: ['payment_method'],
        });
        if (pi.payment_method?.card) {
          cardBrand = pi.payment_method.card.brand;
          cardLast4 = pi.payment_method.card.last4;
        }
      } catch (err) {
        console.error('Failed to retrieve PaymentIntent for receipt:', err.message);
      }
    }

    // Build discount label
    let discountLabel = null;
    if (purchase.discount_type === 'percent') {
      discountLabel = `${purchase.discount_amount}% off`;
    } else if (purchase.discount_type === 'dollar') {
      discountLabel = `$${purchase.discount_amount} off`;
    }

    const html = generateReceiptHtml({
      firstName,
      invoiceId: purchase.id,
      date: new Date(purchase.purchase_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      description: purchase.description,
      originalAmountCents: purchase.original_amount ? Math.round(purchase.original_amount * 100) : Math.round(purchase.amount * 100),
      discountLabel,
      amountPaidCents: Math.round(purchase.amount * 100),
      cardBrand,
      cardLast4,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: patient.email,
      bcc: 'info@range-medical.com',
      subject: `Your Receipt from Range Medical — $${purchase.amount.toFixed(2)}`,
      html,
    });

    console.log(`Receipt email sent to ${patient.email} for purchase ${purchase.id}`);
    await logComm({ channel: 'email', messageType: 'receipt', message: `Receipt for $${purchase.amount.toFixed(2)} — ${purchase.description}`, source: 'record-purchase', patientId: purchase.patient_id, patientName: patient.name, recipient: patient.email, subject: `Your Receipt from Range Medical — $${purchase.amount.toFixed(2)}` });
  } catch (err) {
    console.error('Receipt email error:', err);
    await logComm({ channel: 'email', messageType: 'receipt', message: `Receipt failed for purchase ${purchase.id}`, source: 'record-purchase', patientId: purchase.patient_id, status: 'error', errorMessage: err.message }).catch(() => {});
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patient_id,
      amount,
      description,
      stripe_payment_intent_id,
      stripe_subscription_id,
      payment_method,
      discount_type,
      discount_amount,
      original_amount,
      service_category,
      service_name,
    } = req.body;

    if (!patient_id || !amount) {
      return res.status(400).json({ error: 'patient_id and amount are required' });
    }

    const insertData = {
      patient_id,
      amount: amount / 100, // Convert cents to dollars for DB
      description: description || 'Stripe charge',
      stripe_payment_intent_id: stripe_payment_intent_id || null,
      stripe_subscription_id: stripe_subscription_id || null,
      payment_method: payment_method || 'stripe',
      source: 'stripe_pos',
      purchase_date: new Date().toISOString(),
    };

    // Add discount fields if present
    if (discount_type) {
      insertData.discount_type = discount_type;
      insertData.discount_amount = discount_amount;
      insertData.original_amount = original_amount != null ? original_amount / 100 : null; // cents to dollars
    }

    const { data, error } = await supabase
      .from('purchases')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Record purchase error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Fire-and-forget receipt email
    sendReceiptEmail(data).catch(err =>
      console.error('Receipt email failed:', err)
    );

    // Fire-and-forget auto-protocol creation/extension
    if (service_category && service_name) {
      autoCreateOrExtendProtocol({
        patientId: patient_id,
        serviceCategory: service_category,
        serviceName: service_name,
        purchaseId: data.id,
      }).catch(err =>
        console.error('Auto-protocol failed:', err)
      );
    }

    return res.status(200).json({ purchase: data });

  } catch (error) {
    console.error('Record purchase error:', error);
    return res.status(500).json({ error: error.message });
  }
}
