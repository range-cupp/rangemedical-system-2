// /api/stripe/checkout-complete
// Called after embedded checkout payment succeeds
// Records purchase, triggers auto-protocol, sends notifications
// Replaces the checkout.session.completed webhook flow for embedded payments

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { autoCreateOrExtendProtocol } from '../../../lib/auto-protocol';
import { todayPacific } from '../../../lib/date-utils';
import { postToStaffChannel } from '../../../lib/post-to-staff-channel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Staff chat alert — replaces prior owner SMS + notification email.
    try {
      await postToStaffChannel({
        channelName: 'Sales Alerts',
        memberEmails: ['damon@range-medical.com', 'tara@range-medical.com'],
        content: [
          `💰 New Website Purchase — ${amount}`,
          '',
          customerName,
          `📞 ${phone || 'N/A'}`,
          `✉️ ${normalizedEmail}`,
          '',
          `Item: ${serviceName || productName}`,
        ].join('\n'),
        pushPayload: {
          title: `Purchase — ${amount}`,
          body: customerName,
        },
      });
    } catch (chatErr) {
      console.error('Checkout staff chat error:', chatErr);
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
