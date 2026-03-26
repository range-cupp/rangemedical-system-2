// /api/stripe/checkout-complete
// Called after embedded checkout payment succeeds
// Records purchase, triggers auto-protocol, sends notifications
// Replaces the checkout.session.completed webhook flow for embedded payments

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import stripe from '../../../lib/stripe';
import { sendSMS } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { autoCreateOrExtendProtocol } from '../../../lib/auto-protocol';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const OWNER_PHONE = '+19496900339';
const OWNER_EMAIL = 'chriscupp8181@gmail.com';

function formatAmount(cents) {
  if (!cents) return '$0.00';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      paymentIntentId,
      firstName, lastName, email, phone,
      amountCents, productName, description,
      serviceCategory, serviceName,
    } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    // Verify the payment actually succeeded on Stripe
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method'],
    });

    if (pi.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment not succeeded (status: ${pi.status})` });
    }

    const customerName = `${firstName} ${lastName}`;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const amount = formatAmount(amountCents);

    // Card details for receipt
    let cardBrand = null;
    let cardLast4 = null;
    if (pi.payment_method?.card) {
      cardBrand = pi.payment_method.card.brand;
      cardLast4 = pi.payment_method.card.last4;
    }

    // Find patient by email or phone
    let patientId = null;
    if (normalizedEmail) {
      const { data: byEmail } = await supabase
        .from('patients')
        .select('id')
        .ilike('email', normalizedEmail)
        .limit(1)
        .maybeSingle();
      if (byEmail) patientId = byEmail.id;
    }
    if (!patientId && phone) {
      const digits = phone.replace(/\D/g, '').slice(-10);
      if (digits.length === 10) {
        const { data: byPhone } = await supabase
          .from('patients')
          .select('id')
          .or(`phone.ilike.%${digits}`)
          .limit(1)
          .maybeSingle();
        if (byPhone) patientId = byPhone.id;
      }
    }

    // Create purchase record
    const purchaseData = {
      patient_id: patientId,
      patient_name: customerName,
      patient_email: normalizedEmail || null,
      patient_phone: phone || null,
      item_name: serviceName || productName || description || 'Website Purchase',
      product_name: serviceName || productName || description || 'Website Purchase',
      amount: (amountCents || 0) / 100,
      amount_paid: (amountCents || 0) / 100,
      category: serviceCategory || 'Other',
      quantity: 1,
      stripe_payment_intent_id: paymentIntentId,
      stripe_amount_cents: amountCents,
      stripe_status: 'succeeded',
      stripe_verified_at: new Date().toISOString(),
      payment_method: 'stripe',
      source: 'website_checkout',
      purchase_date: todayPacific(),
      card_brand: cardBrand,
      card_last4: cardLast4,
    };

    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases')
      .insert(purchaseData)
      .select('id')
      .single();

    if (purchaseErr) {
      console.error('Checkout-complete purchase creation error:', purchaseErr.message);
      // Don't fail the response — payment succeeded, we should still notify
    }

    console.log(`Website checkout purchase created: ${purchase?.id} — ${serviceName || productName} (${amount}) for ${customerName}`);

    // Auto-create protocol if patient matched and category is valid
    if (patientId && serviceCategory && serviceCategory !== 'Other' && purchase?.id) {
      try {
        await autoCreateOrExtendProtocol({
          patientId,
          serviceCategory,
          serviceName: serviceName || productName,
          purchaseId: purchase.id,
          quantity: 1,
        });
        console.log(`Auto-protocol triggered for website checkout: ${serviceName || productName} (patient: ${patientId})`);
      } catch (protoErr) {
        console.error('Auto-protocol from website checkout failed:', protoErr.message);
      }
    } else if (!patientId) {
      console.log(`Website checkout purchase unlinked — no patient match for ${normalizedEmail}`);
    }

    // Send SMS notification to owner
    const smsMessage = `New Website Purchase!\n\n${customerName}\n${serviceName || productName}\n${amount}\n\nvia range-medical.com`;
    const smsResult = await sendSMS({ to: OWNER_PHONE, message: smsMessage });

    // Send email notification to owner
    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

    try {
      await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: OWNER_EMAIL,
        subject: `New Purchase: ${amount} — ${serviceName || productName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="background: #000; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 20px;">New Website Purchase</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer</td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                  <td style="padding: 8px 0; font-size: 14px; text-align: right;">${normalizedEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td>
                  <td style="padding: 8px 0; font-size: 14px; text-align: right;">${phone || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Item</td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${serviceName || productName}</td>
                </tr>
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 16px; font-weight: 600;">Total</td>
                  <td style="padding: 12px 0; font-weight: 700; font-size: 20px; text-align: right; color: #16a34a;">${amount}</td>
                </tr>
              </table>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
                ${now} · via range-medical.com embedded checkout
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Checkout notification email error:', emailErr);
    }

    return res.status(200).json({
      success: true,
      purchaseId: purchase?.id || null,
    });
  } catch (error) {
    console.error('Checkout-complete error:', error);
    return res.status(500).json({ error: error.message });
  }
}
