// /pages/api/webhooks/stripe.js
// Stripe Webhook Handler
// - checkout.session.completed: creates purchase record, auto-creates protocol, sends notifications
// - invoice.paid: HRT membership renewal → credits free Range IV + sends patient email
// Range Medical
// UPDATED: 2026-03-14 — Auto-create purchase + protocol from Payment Link checkouts

import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { autoCreateOrExtendProtocol } from '../../../lib/auto-protocol';
import { todayPacific } from '../../../lib/date-utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OWNER_PHONE = '+19496900339';
const OWNER_EMAIL = 'chriscupp8181@gmail.com';

// Disable body parsing — Stripe needs raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Read raw body from request
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Format dollar amount
function formatAmount(cents) {
  if (!cents) return '$0.00';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Send purchase notification email
async function sendNotificationEmail({ customerName, customerEmail, items, amount }) {
  const itemList = items.join(', ');
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #000; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">💰 New Website Purchase</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
            <td style="padding: 8px 0; font-size: 14px; text-align: right;">${customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Item</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${itemList}</td>
          </tr>
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #6b7280; font-size: 16px; font-weight: 600;">Total</td>
            <td style="padding: 12px 0; font-weight: 700; font-size: 20px; text-align: right; color: #16a34a;">${amount}</td>
          </tr>
        </table>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
          ${now} · via range-medical.com Payment Link
        </div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: OWNER_EMAIL,
      subject: `💰 New Purchase: ${amount} — ${items[0] || 'Website Purchase'}`,
      html: html,
    });
    return true;
  } catch (err) {
    console.error('Notification email error:', err);
    return false;
  }
}

// ================================================================
// HRT MEMBERSHIP PERK — Free Range IV
// ================================================================

// Check if a subscription invoice is for an HRT membership
async function isHRTMembershipInvoice(invoice) {
  // 1. Check line item descriptions for HRT keywords
  const lineItems = invoice.lines?.data || [];
  const descriptions = lineItems.map(li => (li.description || '').toLowerCase()).join(' ');
  if (descriptions.includes('hrt') || descriptions.includes('testosterone') || descriptions.includes('trt')) {
    return true;
  }

  // 2. Check subscription metadata for service_category
  if (invoice.subscription) {
    try {
      const sub = await stripe.subscriptions.retrieve(invoice.subscription);
      if (sub.metadata?.service_category === 'hrt') return true;
    } catch (err) {
      console.error('Error retrieving subscription:', err.message);
    }
  }

  return false;
}

// Credit a free Range IV to a patient's account
// Resets monthly — any unused perk from previous months is expired first
async function creditFreeRangeIV(patientId, invoiceId) {
  const today = todayPacific();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  // Check if already credited this month (prevent duplicates from webhook retries)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: existingPerk } = await supabase
    .from('protocols')
    .select('id')
    .eq('patient_id', patientId)
    .eq('program_type', 'iv_therapy')
    .eq('medication', 'Range IV')
    .ilike('notes', '%HRT Membership Perk%')
    .gte('created_at', startOfMonth.toISOString())
    .limit(1);

  if (existingPerk?.length) {
    console.log(`Range IV already credited this month for patient ${patientId}, skipping`);
    return null;
  }

  // Expire any unused Range IV perks from previous months (reset — doesn't stack)
  const { data: oldPerks } = await supabase
    .from('protocols')
    .select('id')
    .eq('patient_id', patientId)
    .eq('program_type', 'iv_therapy')
    .eq('medication', 'Range IV')
    .ilike('notes', '%HRT Membership Perk%')
    .eq('status', 'active')
    .eq('sessions_used', 0);

  if (oldPerks?.length) {
    const oldIds = oldPerks.map(p => p.id);
    await supabase
      .from('protocols')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .in('id', oldIds);
    console.log(`Expired ${oldIds.length} unused Range IV perk(s) for patient ${patientId}`);
  }

  // Create the IV protocol (1 session)
  const { data: protocol, error } = await supabase
    .from('protocols')
    .insert({
      patient_id: patientId,
      program_name: 'Range IV — HRT Membership Perk',
      program_type: 'iv_therapy',
      medication: 'Range IV',
      total_sessions: 1,
      sessions_used: 0,
      status: 'active',
      delivery_method: 'in_clinic',
      start_date: today,
      end_date: endDate.toISOString().split('T')[0],
      notes: `Complimentary Range IV — HRT Membership Perk. Auto-credited on ${today}.`,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Range IV credit error:', error);
    return null;
  }

  console.log(`Range IV credited for patient ${patientId} (protocol ${protocol.id})`);
  return protocol.id;
}

// Send the patient an email about their free Range IV
async function sendRangeIVPerkEmail(patientId) {
  const { data: patient } = await supabase
    .from('patients')
    .select('name, first_name, email')
    .eq('id', patientId)
    .single();

  if (!patient?.email) {
    console.log('Range IV perk email skipped — no patient email');
    return;
  }

  const firstName = patient.first_name || (patient.name || '').split(' ')[0] || 'there';
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' , timeZone: 'America/Los_Angeles' });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto;">
      <div style="background: #000; color: #fff; padding: 24px 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 2px;">RANGE MEDICAL</h1>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px 28px; border-radius: 0 0 12px 12px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #111;">Your Complimentary Range IV is Ready</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Hi ${firstName},
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Thank you for your continued HRT membership with Range Medical. As a valued member, your complimentary <strong>Range IV</strong> for ${monthName} has been added to your account.
        </p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 20px;">💉</span>
            <strong style="color: #166534; font-size: 16px;">1x Range IV Session</strong>
          </div>
          <p style="color: #15803d; font-size: 14px; margin: 0;">
            Available now — included with your HRT membership
          </p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Stop by the clinic anytime during business hours, or give us a call to schedule your IV session. This perk is available for the next 30 days.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="tel:+19499973988" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Call to Schedule: (949) 997-3988
          </a>
        </div>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Range Medical · 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: patient.email,
      bcc: 'info@range-medical.com',
      subject: `Your Complimentary Range IV for ${monthName} is Ready`,
      html,
    });

    console.log(`Range IV perk email sent to ${patient.email}`);

    await logComm({
      channel: 'email',
      messageType: 'membership_perk',
      message: `HRT membership perk — complimentary Range IV for ${monthName}`,
      source: 'stripe-webhook',
      patientId,
      patientName: patient.name,
      recipient: patient.email,
      subject: `Your Complimentary Range IV for ${monthName} is Ready`,
    });
  } catch (err) {
    console.error('Range IV perk email error:', err);
    await logComm({
      channel: 'email',
      messageType: 'membership_perk',
      message: `Range IV perk email failed for patient ${patientId}`,
      source: 'stripe-webhook',
      patientId,
      patientName: patient.name,
      status: 'error',
      errorMessage: err.message,
    }).catch(err => { console.error('logComm error:', err.message); });
  }
}

// Process HRT membership payment — credit Range IV + notify patient
async function processHRTMembershipPerk(invoice) {
  // Get patient_id from subscription metadata
  let patientId = null;

  if (invoice.subscription) {
    try {
      const sub = await stripe.subscriptions.retrieve(invoice.subscription);
      patientId = sub.metadata?.patient_id || null;
    } catch (err) {
      console.error('Error retrieving subscription for perk:', err.message);
    }
  }

  // Fallback: look up patient by Stripe customer ID
  if (!patientId && invoice.customer) {
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('stripe_customer_id', invoice.customer)
      .limit(1)
      .single();

    if (patient) patientId = patient.id;
  }

  if (!patientId) {
    console.log('HRT perk: could not resolve patient_id, skipping');
    return;
  }

  // Verify patient has an active HRT protocol
  const { data: hrtProtocols } = await supabase
    .from('protocols')
    .select('id')
    .eq('patient_id', patientId)
    .in('status', ['active', 'expired'])
    .or('program_type.ilike.%hrt%,program_type.ilike.%hrt_male%,program_type.ilike.%hrt_female%')
    .limit(1);

  if (!hrtProtocols?.length) {
    console.log(`HRT perk: patient ${patientId} has no active HRT protocol, skipping`);
    return;
  }

  // Credit the Range IV
  const protocolId = await creditFreeRangeIV(patientId, invoice.id);
  if (!protocolId) return; // Already credited or error

  // Send the patient email
  await sendRangeIVPerkEmail(patientId);

  // Notify owner
  const { data: patient } = await supabase
    .from('patients')
    .select('name, first_name, phone')
    .eq('id', patientId)
    .single();

  const smsMessage = `💉 HRT Perk: Free Range IV credited for ${patient?.name || 'Unknown'}`;
  await sendSMS({ to: OWNER_PHONE, message: smsMessage }).catch(err => {
    console.error('HRT perk owner SMS failed:', err.message);
  });

  // Send patient scheduling prompt SMS
  if (patient?.phone) {
    const firstName = patient.first_name || (patient.name || '').split(' ')[0] || 'there';
    const monthName = new Date().toLocaleDateString('en-US', { month: 'long' , timeZone: 'America/Los_Angeles' });
    const schedulePrompt = `Hi ${firstName}! Your complimentary Range IV for ${monthName} is ready 💉 Want to schedule? Reply YES and we'll send you a link to pick a time! — Range Medical`;

    const promptResult = await sendSMS({ to: patient.phone, message: schedulePrompt }).catch(err => {
      console.error('HRT IV schedule prompt SMS error:', err);
      return { success: false, error: err.message };
    });

    await logComm({
      channel: 'sms',
      messageType: 'hrt_iv_schedule_prompt',
      message: schedulePrompt,
      source: 'stripe-webhook',
      patientId,
      patientName: patient.name,
      recipient: patient.phone,
      status: promptResult.success ? 'sent' : 'error',
      errorMessage: promptResult.error || null,
      twilioMessageSid: promptResult.messageSid || null,
      provider: promptResult.provider || null,
      direction: 'outbound',
    }).catch(err => { console.error('logComm error:', err.message); });

    if (promptResult.success) {
      console.log(`HRT IV scheduling prompt sent to ${patient.name} (${patient.phone})`);
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Read raw body and verify signature
  let event;
  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed (Payment Link purchases)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Get line items with product details to identify what was purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 5,
        expand: ['data.price.product'],
      });
      const items = lineItems.data.map(item => item.description || 'Unknown item');

      // Customer info
      const customerEmail = session.customer_details?.email || session.customer_email || 'unknown';
      const customerName = session.customer_details?.name || customerEmail;
      const customerPhone = session.customer_details?.phone || null;
      const amount = formatAmount(session.amount_total);

      // Send SMS via Twilio
      const smsMessage = `💰 New Purchase!\n\n${customerName}\n${items.join(', ')}\n${amount}\n\nvia range-medical.com`;
      const smsResult = await sendSMS({ to: OWNER_PHONE, message: smsMessage });
      const smsSent = smsResult.success;

      // Also send email notification
      const emailSent = await sendNotificationEmail({ customerName, customerEmail, items, amount });

      console.log(`Purchase notification: ${amount} — ${items.join(', ')} (SMS: ${smsSent ? 'sent' : 'failed'}, Email: ${emailSent ? 'sent' : 'failed'})`);

      // ================================================================
      // AUTO-CREATE PURCHASE RECORD + PROTOCOL
      // Match customer to patient, create purchase, trigger auto-protocol
      // ================================================================

      // Find patient by email, then phone
      let patientId = null;
      if (customerEmail && customerEmail !== 'unknown') {
        const { data: byEmail } = await supabase
          .from('patients')
          .select('id')
          .ilike('email', customerEmail)
          .limit(1)
          .maybeSingle();
        if (byEmail) patientId = byEmail.id;
      }
      if (!patientId && customerPhone) {
        const digits = customerPhone.replace(/\D/g, '').slice(-10);
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

      // Idempotency: check if we've already processed this checkout session
      const paymentIntentId = session.payment_intent || null;
      if (paymentIntentId) {
        const { data: existingPurchases } = await supabase
          .from('purchases')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .limit(1);

        if (existingPurchases?.length) {
          console.log(`Webhook idempotency: purchases already exist for PI ${paymentIntentId}, skipping`);
          return res.status(200).json({ received: true, skipped: 'duplicate' });
        }
      }

      // Process each line item → purchase record + auto-protocol
      for (const item of lineItems.data) {
        const product = item.price?.product;
        const category = (typeof product === 'object' ? product?.metadata?.category : null) || 'Other';
        let serviceName = item.description || product?.name || 'Website Purchase';
        const itemAmount = item.amount_total || 0;

        // For peptides, the Stripe product name is generic ("Peptide Therapy — 30 Day").
        // The specific peptide identity is in the price metadata. Reconstruct the full
        // service name so auto-protocol parsing can identify the correct peptide/duration.
        const peptideIdentifier = item.price?.metadata?.peptide_identifier;
        if (peptideIdentifier && category === 'peptide') {
          serviceName = `${serviceName} — ${peptideIdentifier}`;
        }

        // Create purchase record
        const purchaseData = {
          patient_id: patientId,
          patient_name: customerName,
          patient_email: customerEmail !== 'unknown' ? customerEmail : null,
          patient_phone: customerPhone,
          item_name: serviceName,
          product_name: serviceName,
          amount: itemAmount / 100,
          amount_paid: itemAmount / 100,
          category,
          quantity: item.quantity || 1,
          stripe_payment_intent_id: session.payment_intent || null,
          stripe_amount_cents: itemAmount,
          stripe_status: 'succeeded',
          stripe_verified_at: new Date().toISOString(),
          payment_method: 'stripe',
          source: 'payment_link',
          purchase_date: todayPacific(),
        };

        const { data: purchase, error: purchaseErr } = await supabase
          .from('purchases')
          .insert(purchaseData)
          .select('id')
          .single();

        if (purchaseErr) {
          console.error('Webhook purchase creation error:', purchaseErr.message);
          continue;
        }

        console.log(`Purchase created from Payment Link: ${purchase.id} — ${serviceName} ($${(itemAmount / 100).toFixed(2)})`);

        // Auto-create protocol if patient is matched and category is valid
        if (patientId && category !== 'Other') {
          try {
            // For peptides, extract duration from product metadata if available
            const productMeta = typeof product === 'object' ? product?.metadata : {};
            const priceMeta = item.price?.metadata || {};
            const durationFromMeta = parseInt(priceMeta.duration_days || productMeta?.duration_days) || null;

            await autoCreateOrExtendProtocol({
              patientId,
              serviceCategory: category,
              serviceName,
              purchaseId: purchase.id,
              quantity: item.quantity || 1,
              durationDays: durationFromMeta,
              stripePaymentIntentId: session.payment_intent || null,
            });
            console.log(`Auto-protocol triggered for Payment Link purchase: ${serviceName} (patient: ${patientId})`);
          } catch (protoErr) {
            console.error('Auto-protocol from Payment Link failed:', protoErr.message);
            // Flag the purchase so staff knows it needs manual protocol assignment
            await supabase
              .from('purchases')
              .update({ status: 'needs_protocol' })
              .eq('id', purchase.id)
              .then(() => {})
              .catch(flagErr => console.error('Failed to flag purchase:', flagErr.message));
          }
        } else if (!patientId) {
          console.log(`Payment Link purchase unlinked — no patient match for ${customerEmail}`);
        }
      }
    } catch (err) {
      // Don't fail the webhook response — Stripe would retry
      console.error('Error processing checkout notification:', err.message);
    }
  }

  // Handle invoice.paid (subscription renewals — HRT membership perks)
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;

    // Only process subscription invoices
    if (invoice.subscription) {
      try {
        const isHRT = await isHRTMembershipInvoice(invoice);
        if (isHRT) {
          console.log(`HRT membership invoice paid: ${invoice.id} — processing Range IV perk`);
          await processHRTMembershipPerk(invoice);
        }
      } catch (err) {
        console.error('Error processing HRT membership perk:', err.message);
      }
    }
  }

  // Sync subscription status on any subscription-related event
  if (event.type === 'invoice.paid' || event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.created') {
    try {
      let subId = null;
      if (event.type.startsWith('customer.subscription.')) {
        subId = event.data.object.id;
      } else if (event.data.object.subscription) {
        subId = event.data.object.subscription;
      }

      if (subId) {
        const sub = event.type === 'customer.subscription.deleted'
          ? event.data.object
          : await stripe.subscriptions.retrieve(subId);

        const item = sub.items?.data?.[0];
        const price = item?.price;
        const customerId = sub.customer;

        // Find patient by stripe_customer_id
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (patient) {
          const record = {
            patient_id: patient.id,
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId,
            status: sub.status,
            amount_cents: price?.unit_amount || 0,
            currency: price?.currency || 'usd',
            interval: price?.recurring?.interval || 'month',
            interval_count: price?.recurring?.interval_count || 1,
            description: price?.nickname || sub.description || '',
            service_category: sub.metadata?.service_category || null,
            current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: sub.cancel_at_period_end || false,
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          };

          // Upsert by stripe_subscription_id
          const { data: existing } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('stripe_subscription_id', sub.id)
            .maybeSingle();

          if (existing) {
            await supabase.from('subscriptions').update(record).eq('stripe_subscription_id', sub.id);
          } else {
            record.started_at = sub.start_date ? new Date(sub.start_date * 1000).toISOString() : (sub.created ? new Date(sub.created * 1000).toISOString() : null);
            record.metadata = sub.metadata || {};
            await supabase.from('subscriptions').insert(record);
          }
          console.log(`Subscription synced: ${sub.id} → ${sub.status}`);
        }
      }
    } catch (err) {
      console.error('Error syncing subscription:', err.message);
    }
  }

  // Handle charge.refunded — update purchase stripe_status
  if (event.type === 'charge.refunded') {
    try {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;

      if (paymentIntentId) {
        const { error: refundErr } = await supabase
          .from('purchases')
          .update({
            stripe_status: 'refunded',
            stripe_verified_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntentId);

        if (refundErr) {
          console.error('Error updating refund status:', refundErr.message);
        } else {
          console.log(`Purchase marked as refunded for PI: ${paymentIntentId}`);
        }
      }
    } catch (err) {
      console.error('Error handling charge.refunded:', err.message);
    }
  }

  // Always return 200 to acknowledge receipt (prevents Stripe retries)
  return res.status(200).json({ received: true });
}
