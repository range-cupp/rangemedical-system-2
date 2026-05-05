// /api/trial/checkout-complete
// Called after RLT trial embedded checkout payment succeeds
// Updates trial_passes, creates purchase, moves pipeline stage, sends notifications
// Range Medical

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { sendTrialConfirmation } from '../../../lib/trial-sms';
import { todayPacific } from '../../../lib/date-utils';
import { hasBlooioOptIn, isBlooioProvider, queuePendingLinkMessage } from '../../../lib/blooio-optin';
import { postToStaffChannel } from '../../../lib/post-to-staff-channel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
        item_name: 'RLT Trial - 3 Sessions',
        product_name: 'RLT Trial - 3 Sessions',
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

    // Send confirmation SMS to patient (Blooio two-step opt-in aware)
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone && trialPassId) {
      try {
        const useBlooio = isBlooioProvider();
        const optedIn = useBlooio ? await hasBlooioOptIn(normalizedPhone) : true;

        if (optedIn) {
          // Patient has replied before — send survey link directly
          await sendTrialConfirmation({ phone: normalizedPhone, firstName, trialId: trialPassId });
        } else {
          // New contact on Blooio — send plain text first, queue the link
          const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://range-medical.com';
          const surveyLink = `${BASE_URL}/rlt-trial/survey?trial_id=${trialPassId}&type=pre`;

          // Step 1: Plain text intro (no links) — prompts them to reply
          const introMessage = `Hey ${firstName}! Your Red Light Trial is confirmed — 3 sessions over 7 days. Reply YES to get your energy survey link and book your first session.\n\n- Range Medical`;
          await sendSMS({ to: normalizedPhone, message: introMessage });
          await logComm({
            channel: 'sms',
            messageType: 'rlt_trial_confirmation_intro',
            message: introMessage,
            source: 'trial-checkout',
            recipient: normalizedPhone,
            patientName: firstName,
            status: 'sent',
            provider: useBlooio ? 'blooio' : 'twilio',
          });

          // Step 2: Queue the survey link — auto-sent when they reply
          const linkMessage = `Here's your 60-second energy survey:\n${surveyLink}\n\nComplete it before your first session — it takes less than a minute.\n\n- Range Medical`;
          await queuePendingLinkMessage({
            phone: normalizedPhone,
            message: linkMessage,
            messageType: 'rlt_trial_survey_link',
            patientId: patientId,
            patientName: customerName,
          });

          console.log(`Trial confirmation: intro sent, survey link queued for ${normalizedPhone}`);
        }
      } catch (smsErr) {
        console.error('Trial confirmation SMS error:', smsErr);
      }
    }

    // Staff chat alert — replaces prior owner SMS + notification email.
    try {
      await postToStaffChannel({
        channelName: 'Sales Alerts',
        memberEmails: ['damon@range-medical.com', 'tara@range-medical.com'],
        content: [
          '💸 New RLT Trial Purchase — $49',
          '',
          customerName,
          `📞 ${normalizedPhone || phone || 'No phone'}`,
          `✉️ ${normalizedEmail}`,
          '',
          'Red Light Trial (3 sessions / 7 days)',
        ].join('\n'),
        pushPayload: {
          title: 'New RLT Trial — $49',
          body: customerName,
        },
      });
    } catch (chatErr) {
      console.error('Trial staff chat error:', chatErr);
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
