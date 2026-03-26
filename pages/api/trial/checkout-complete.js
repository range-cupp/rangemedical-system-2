// /api/trial/checkout-complete
// Called after RLT trial embedded checkout payment succeeds
// Updates trial_passes, creates purchase, moves pipeline stage, sends notifications
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import stripe from '../../../lib/stripe';
import { sendSMS } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { sendTrialConfirmation } from '../../../lib/trial-sms';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const OWNER_PHONE = '+19496900339';
const OWNER_EMAIL = 'chriscupp8181@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      paymentIntentId,
      trialId,
      firstName, lastName, email, phone,
    } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    // Verify payment succeeded on Stripe
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment not succeeded (status: ${pi.status})` });
    }

    const customerName = `${firstName} ${lastName}`;
    const normalizedEmail = (email || '').toLowerCase().trim();

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
    const { data: purchase } = await supabase
      .from('purchases')
      .insert({
        patient_id: patientId,
        patient_name: customerName,
        patient_email: normalizedEmail || null,
        patient_phone: phone || null,
        item_name: 'RLT Trial - 7 Days',
        product_name: 'RLT Trial - 7 Days',
        amount: 49,
        amount_paid: 49,
        category: 'rlt',
        quantity: 1,
        stripe_payment_intent_id: paymentIntentId,
        stripe_amount_cents: 4900,
        stripe_status: 'succeeded',
        stripe_verified_at: new Date().toISOString(),
        payment_method: 'stripe',
        source: 'rlt_trial',
        purchase_date: todayPacific(),
      })
      .select('id')
      .single();

    // Update or create trial pass
    let trialPassId = trialId;

    if (trialPassId) {
      // Update existing trial pass (from ManyChat flow)
      await supabase
        .from('trial_passes')
        .update({
          patient_id: patientId,
          first_name: firstName,
          last_name: lastName || null,
          email: normalizedEmail || null,
          phone: phone || null,
          stripe_payment_intent_id: paymentIntentId,
          payment_status: 'paid',
          status: 'purchased',
          purchased_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', trialPassId);
    } else {
      // Create new trial pass (direct website visit, no ManyChat)
      // First create pipeline lead
      const { data: lead } = await supabase
        .from('sales_pipeline')
        .insert({
          lead_type: 'rlt_trial',
          first_name: firstName,
          last_name: lastName || null,
          email: normalizedEmail || null,
          phone: phone || null,
          source: 'website',
          stage: 'booked',
          patient_id: patientId,
        })
        .select('id')
        .single();

      const { data: trial } = await supabase
        .from('trial_passes')
        .insert({
          patient_id: patientId,
          sales_pipeline_id: lead?.id || null,
          first_name: firstName,
          last_name: lastName || null,
          email: normalizedEmail || null,
          phone: phone || null,
          stripe_payment_intent_id: paymentIntentId,
          payment_status: 'paid',
          status: 'purchased',
          purchased_at: new Date().toISOString(),
          source: 'website',
        })
        .select('id')
        .single();

      trialPassId = trial?.id;
    }

    // Move pipeline stage to booked
    if (trialPassId) {
      const { data: trialData } = await supabase
        .from('trial_passes')
        .select('sales_pipeline_id')
        .eq('id', trialPassId)
        .single();

      if (trialData?.sales_pipeline_id) {
        await supabase
          .from('sales_pipeline')
          .update({
            stage: 'booked',
            patient_id: patientId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', trialData.sales_pipeline_id);
      }
    }

    // Send confirmation SMS to patient
    if (phone && trialPassId) {
      try {
        await sendTrialConfirmation({ phone, firstName, trialId: trialPassId });
      } catch (smsErr) {
        console.error('Trial confirmation SMS error:', smsErr);
      }
    }

    // Notify owner
    const ownerSms = `New RLT Trial Purchase!\n\n${customerName}\n$49 — Red Light Trial (7 days)\n${phone || 'No phone'}\n\nvia range-medical.com`;
    await sendSMS({ to: OWNER_PHONE, message: ownerSms });

    try {
      const now = new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });

      await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: OWNER_EMAIL,
        subject: `New RLT Trial: $49 — ${customerName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="background: #dc2626; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 20px;">New Red Light Trial</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer</td><td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${customerName}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; font-size: 14px; text-align: right;">${normalizedEmail}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td><td style="padding: 8px 0; font-size: 14px; text-align: right;">${phone || 'N/A'}</td></tr>
                <tr style="border-top: 2px solid #e5e7eb;"><td style="padding: 12px 0; color: #6b7280; font-size: 16px; font-weight: 600;">Total</td><td style="padding: 12px 0; font-weight: 700; font-size: 20px; text-align: right; color: #16a34a;">$49.00</td></tr>
              </table>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">${now} · RLT Trial checkout</div>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Trial notification email error:', emailErr);
    }

    console.log(`RLT trial checkout complete: ${customerName} → trial ${trialPassId}`);

    return res.status(200).json({
      success: true,
      trialId: trialPassId,
      purchaseId: purchase?.id || null,
    });
  } catch (error) {
    console.error('Trial checkout-complete error:', error);
    return res.status(500).json({ error: error.message });
  }
}
