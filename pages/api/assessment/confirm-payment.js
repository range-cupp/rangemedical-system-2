// /pages/api/assessment/confirm-payment.js
// Confirms payment status after Stripe Elements succeeds, creates patient + purchase
// Range Medical — Range Assessment

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { sendSMS } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PATH_LABEL = {
  injury: 'Injury & Recovery',
  energy: 'Energy, Hormones & Weight',
  both: 'Full-Spectrum',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, paymentIntentId } = req.body;

    if (!leadId || !paymentIntentId) {
      return res.status(400).json({ error: 'leadId and paymentIntentId are required' });
    }

    // Verify payment status via Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not completed',
        status: paymentIntent.status,
      });
    }

    // Update assessment_leads
    const { error: updateError } = await supabase
      .from('assessment_leads')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Assessment payment confirm DB error:', updateError);
    }

    console.log(`Assessment payment confirmed: ${paymentIntentId} for lead ${leadId}`);

    // Pull lead so we have name/email/phone for downstream records
    const { data: lead } = await supabase
      .from('assessment_leads')
      .select('first_name, last_name, email, phone, assessment_path')
      .eq('id', leadId)
      .single();

    // --- Find or create patient + record purchase (so the $197 is visible
    //     in admin dashboards instead of disappearing into Stripe). ---
    let patientId = null;
    let patientName = null;
    let patientEmail = null;
    let patientPhone = null;

    if (lead) {
      patientName = `${(lead.first_name || '').trim()} ${(lead.last_name || '').trim()}`.trim() || null;
      patientEmail = lead.email ? lead.email.toLowerCase().trim() : null;
      patientPhone = lead.phone || null;

      try {
        // Match by email first (case-insensitive)
        if (patientEmail) {
          const { data: byEmail } = await supabase
            .from('patients')
            .select('id, stripe_customer_id')
            .ilike('email', patientEmail)
            .limit(1)
            .maybeSingle();
          if (byEmail) patientId = byEmail.id;
        }

        // Fall back to phone (last 10 digits)
        if (!patientId && patientPhone) {
          const digits = patientPhone.replace(/\D/g, '').slice(-10);
          if (digits.length === 10) {
            const { data: byPhone } = await supabase
              .from('patients')
              .select('id')
              .ilike('phone', `%${digits}`)
              .limit(1)
              .maybeSingle();
            if (byPhone) patientId = byPhone.id;
          }
        }

        // Create patient if not found
        if (!patientId && patientName) {
          const stripeCustomerId = paymentIntent.customer || null;
          const { data: newPatient, error: insertPatientErr } = await supabase
            .from('patients')
            .insert({
              first_name: lead.first_name || null,
              last_name: lead.last_name || null,
              name: patientName,
              full_name: patientName,
              email: patientEmail,
              phone: patientPhone,
              status: 'lead',
              stripe_customer_id: stripeCustomerId,
              tags: ['assessment', `assessment_${lead.assessment_path || 'unknown'}`],
            })
            .select('id')
            .single();

          if (insertPatientErr) {
            console.error('Assessment patient creation error:', insertPatientErr.message);
          } else if (newPatient) {
            patientId = newPatient.id;
            console.log(`Assessment created patient ${patientId} for lead ${leadId}`);
          }
        }
      } catch (patientErr) {
        console.error('Assessment patient match/create error:', patientErr.message);
      }
    }

    // Idempotency: skip if a purchase row already exists for this PI
    try {
      const { data: existing } = await supabase
        .from('purchases')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .limit(1);

      if (existing?.length) {
        console.log(`Assessment purchase already recorded for PI ${paymentIntentId} — skipping`);
      } else {
        const amountCents = paymentIntent.amount || 0;
        const pathLabel = PATH_LABEL[lead?.assessment_path] || 'Range Assessment';
        const itemName = `Range Assessment — ${pathLabel} ($197 credit toward treatment)`;

        // Pull card details for receipts
        let cardBrand = null;
        let cardLast4 = null;
        try {
          const charges = paymentIntent.charges?.data || [];
          const card = charges[0]?.payment_method_details?.card;
          if (card) {
            cardBrand = card.brand;
            cardLast4 = card.last4;
          }
        } catch (e) { /* ignore */ }

        const { error: purchaseErr } = await supabase
          .from('purchases')
          .insert({
            patient_id: patientId,
            patient_name: patientName || 'Unknown',
            patient_email: patientEmail,
            patient_phone: patientPhone,
            item_name: itemName,
            product_name: itemName,
            description: itemName,
            category: 'assessment',
            quantity: 1,
            amount: amountCents / 100,
            amount_paid: amountCents / 100,
            stripe_payment_intent_id: paymentIntentId,
            stripe_amount_cents: amountCents,
            stripe_status: 'succeeded',
            stripe_verified_at: new Date().toISOString(),
            card_brand: cardBrand,
            card_last4: cardLast4,
            payment_method: 'stripe',
            source: 'assessment',
            purchase_date: todayPacific(),
          });

        if (purchaseErr) {
          console.error('Assessment purchase insert error:', purchaseErr.message);
        } else {
          console.log(`Assessment purchase recorded for ${patientName || 'Unknown'} ($${(amountCents / 100).toFixed(2)})`);
        }
      }
    } catch (purchaseCatch) {
      console.error('Assessment purchase creation threw:', purchaseCatch.message);
    }

    // --- Send SMS notification to Chris ---
    try {
      const name = patientName || 'Unknown';
      const path = lead?.assessment_path || 'assessment';
      const amount = (paymentIntent.amount / 100).toFixed(2);
      const message = `New assessment paid! ${name} just paid $${amount} for a ${path} assessment via range-medical.com.`;

      const smsResult = await sendSMS({ to: '+19496900339', message });

      if (smsResult.success) {
        await logComm({
          channel: 'sms',
          messageType: 'admin_assessment_payment_notification',
          message,
          source: 'confirm-payment',
          recipient: '+19496900339',
          twilioMessageSid: smsResult.messageSid,
          direction: 'outbound',
          provider: smsResult.provider || null,
        });
        console.log(`Assessment payment notification sent to Chris for lead ${leadId}`);
      } else {
        console.error('Assessment payment notification SMS failed:', smsResult.error);
      }
    } catch (notifyErr) {
      console.error('Assessment payment notification error:', notifyErr);
      // Non-blocking — don't fail the payment confirmation
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Assessment confirm payment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
