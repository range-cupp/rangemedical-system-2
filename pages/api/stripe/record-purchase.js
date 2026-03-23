// Record Purchase After Stripe Payment
// POST: { patient_id, amount, description, stripe_payment_intent_id?, stripe_subscription_id?, payment_method }

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import stripe from '../../../lib/stripe';
import { generateReceiptHtml } from '../../../lib/receipt-email';
import { generateReceiptPdf } from '../../../lib/receipt-pdf';
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
      .select('name, email, phone, address, city, state, zip_code')
      .eq('id', purchase.patient_id)
      .single();

    if (patientError || !patient?.email) {
      console.log('Receipt email skipped — no patient email found');
      await logComm({ channel: 'email', messageType: 'receipt', message: 'Receipt skipped — no patient email', source: 'record-purchase', patientId: purchase.patient_id, status: 'error', errorMessage: 'No patient email found' });
      return;
    }

    const firstName = (patient.name || '').split(' ')[0] || 'there';
    const patientName = patient.name || firstName;

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

    // Build patient address line
    const patientAddress = [patient.address, [patient.city, patient.state, patient.zip_code].filter(Boolean).join(', ')].filter(Boolean).join(', ');

    const receiptParams = {
      firstName,
      patientName: patient.name,
      patientPhone: patient.phone || null,
      patientAddress: patientAddress || null,
      invoiceId: purchase.id,
      date: new Date(purchase.purchase_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      description: purchase.description || purchase.item_name,
      originalAmountCents: purchase.original_amount ? Math.round(purchase.original_amount * 100) : Math.round(purchase.amount * 100),
      discountLabel,
      amountPaidCents: Math.round(purchase.amount * 100),
      cardBrand,
      cardLast4,
    };

    const html = generateReceiptHtml(receiptParams);

    // Generate PDF attachment
    let attachments = [];
    try {
      const pdfBytes = await generateReceiptPdf(receiptParams);
      attachments = [{ filename: 'Range-Medical-Receipt.pdf', content: Buffer.from(pdfBytes) }];
    } catch (pdfErr) {
      console.error('Receipt PDF generation failed:', pdfErr.message);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: patient.email,
      bcc: 'info@range-medical.com',
      subject: purchase.amount === 0
        ? 'Your Receipt from Range Medical — Complimentary'
        : `Your Receipt from Range Medical — $${purchase.amount.toFixed(2)}`,
      html,
      attachments,
    });

    const subjectLine = purchase.amount === 0
      ? 'Your Receipt from Range Medical — Complimentary'
      : `Your Receipt from Range Medical — $${purchase.amount.toFixed(2)}`;
    const amountLabel = purchase.amount === 0 ? 'Complimentary' : `$${purchase.amount.toFixed(2)}`;
    console.log(`Receipt email sent to ${patient.email} for purchase ${purchase.id}`);
    await logComm({ channel: 'email', messageType: 'receipt', message: `Receipt for ${amountLabel} — ${purchase.item_name}`, source: 'record-purchase', patientId: purchase.patient_id, patientName: patient.name, recipient: patient.email, subject: subjectLine });
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
      quantity,
      skip_receipt,
      delivery_method,
      duration_days,
      shipping,
      fulfillment_method,
      tracking_number,
      item_description,
    } = req.body;

    if (!patient_id || (amount === undefined || amount === null)) {
      return res.status(400).json({ error: 'patient_id and amount are required' });
    }

    // Look up patient info for required purchase fields
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('name, email, phone')
      .eq('id', patient_id)
      .single();

    if (patientError) {
      console.error('Patient lookup error:', patientError);
    }

    const amountDollars = amount / 100; // Convert cents to dollars for DB
    // Parse medication name from service name for direct querying
    let medication = null;
    if (service_name && service_category) {
      const cat = service_category.toLowerCase();
      const name = service_name || '';
      if (cat === 'weight_loss') {
        const parts = name.split('—').map(s => s.trim());
        if (parts.length >= 2) medication = parts[0].trim();
        else {
          const lower = name.toLowerCase();
          if (lower.includes('semaglutide')) medication = 'Semaglutide';
          else if (lower.includes('tirzepatide')) medication = 'Tirzepatide';
          else if (lower.includes('retatrutide')) medication = 'Retatrutide';
        }
      } else if (cat === 'hrt') {
        medication = name.toLowerCase().includes('testosterone') ? 'Testosterone Cypionate' : 'Testosterone Cypionate';
      } else if (cat === 'peptide' || cat === 'vials') {
        // Strip "Vial", quantity suffixes, and parentheticals
        medication = name.replace(/\s*Vial\s*/i, '').replace(/\s*x\d+.*$/i, '').replace(/\s*\([^)]*\)$/g, '').trim();
        const parts = medication.split('—').map(s => s.trim());
        if (parts.length >= 3) medication = parts.slice(2).join(' — ').replace(/\s*\([^)]*\)$/g, '').trim();
        else if (parts.length >= 2 && parts[0].toLowerCase().includes('peptide')) medication = parts[parts.length - 1].trim();
      } else if (cat === 'iv_therapy' || cat === 'specialty_iv') {
        medication = name;
      } else if (cat === 'injection_pack') {
        medication = name;
      }
    }

    // Generate PHI-safe receipt name (strips medication details for patient-facing receipts)
    let receiptName = item_description || null;
    if (!receiptName && service_category && service_name) {
      const cat = (service_category || '').toLowerCase();
      if (cat === 'weight_loss') {
        // Never show specific medication or dosage on receipts
        receiptName = 'Weight Loss Program';
      } else if (cat === 'peptide' || cat === 'vials') {
        // Recovery peptides (BPC-157, TB-500, KPV, MGF) → "Injury & Recovery Protocol"
        // Everything else (GH blends, MOTS-C, GHK-Cu, GLOW, NAD+, etc.) → "Energy & Optimization Protocol"
        const nameLower = (service_name || '').toLowerCase();
        const isRecovery = /bpc|tb[-\s]?500|thymosin|kpv|mgf/i.test(nameLower)
          && !/blend|2x|3x|4x|ghrp/i.test(nameLower);
        const label = isRecovery ? 'Injury & Recovery Protocol' : 'Energy & Optimization Protocol';
        const durationMatch = (service_name || '').match(/(\d+)\s*Day/i);
        const duration = durationMatch ? durationMatch[1] : null;
        receiptName = duration ? `${label} — ${duration} Day` : label;
      }
    }

    const insertData = {
      patient_id,
      patient_name: patient?.name || 'Unknown',
      patient_email: patient?.email || null,
      patient_phone: patient?.phone || null,
      item_name: description || 'Stripe charge',
      product_name: description || 'Stripe charge',
      amount: amountDollars,
      amount_paid: amountDollars,
      category: service_category || 'Other',
      quantity: quantity || 1,
      stripe_payment_intent_id: stripe_payment_intent_id || null,
      stripe_subscription_id: stripe_subscription_id || null,
      payment_method: payment_method || 'stripe',
      source: 'stripe_pos',
      purchase_date: new Date().toISOString().split('T')[0],
      shipping: shipping || 0,
      description: receiptName,
      medication: medication,
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

    // Send receipt email (with PDF attachment) after purchase
    // skip_receipt flag is used when POSChargeModal sends a consolidated receipt for multi-item carts
    if (!skip_receipt) {
      sendReceiptEmail(data).catch(err =>
        console.error('Receipt email failed:', err)
      );
    }

    // Auto-create/extend protocol and link to purchase before responding
    if (service_category && service_name) {
      try {
        await autoCreateOrExtendProtocol({
          patientId: patient_id,
          serviceCategory: service_category,
          serviceName: service_name,
          purchaseId: data.id,
          deliveryMethod: delivery_method || null,
          durationDays: duration_days || null,
          quantity: quantity || 1,
          fulfillmentMethod: fulfillment_method || null,
          trackingNumber: tracking_number || null,
        });
      } catch (err) {
        console.error('Auto-protocol failed:', err);
      }
    }

    return res.status(200).json({ purchase: data });

  } catch (error) {
    console.error('Record purchase error:', error);
    return res.status(500).json({ error: error.message });
  }
}
