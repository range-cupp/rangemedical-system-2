// /api/hbot-trial/checkout-complete
// Called after HBOT trial embedded checkout payment succeeds
// Updates trial_passes, creates purchase, moves pipeline stage, sends notifications
// Range Medical

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { sendHBOTTrialConfirmation } from '../../../lib/hbot-trial-sms';
import { todayPacific } from '../../../lib/date-utils';
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
      main_problem, importance_1_10,
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
        item_name: 'HBOT Trial - 3 Sessions',
        product_name: 'HBOT Trial - 3 Sessions',
        amount: 149,
        amount_paid: 149,
        category: 'hbot',
        quantity: 1,
        stripe_payment_intent_id: paymentIntentId,
        stripe_amount_cents: 14900,
        stripe_status: 'succeeded',
        stripe_verified_at: new Date().toISOString(),
        payment_method: 'stripe',
        source: 'hbot_trial',
        purchase_date: todayPacific(),
      })
      .select('id')
      .single();

    // Update or create trial pass
    let trialPassId = trialId;

    if (trialPassId) {
      // Update existing trial pass
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
          trial_type: 'hbot',
          main_problem: main_problem || null,
          importance_1_10: importance_1_10 || null,
          purchased_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', trialPassId);
    } else {
      // Create new trial pass (direct website visit)
      // First create pipeline lead
      const { data: lead } = await supabase
        .from('sales_pipeline')
        .insert({
          lead_type: 'hbot_trial',
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
          trial_type: 'hbot',
          main_problem: main_problem || null,
          importance_1_10: importance_1_10 || null,
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
        await sendHBOTTrialConfirmation({ phone, firstName, trialId: trialPassId });
      } catch (smsErr) {
        console.error('HBOT trial confirmation SMS error:', smsErr);
      }
    }

    // Staff chat alert \u2014 replaces prior owner SMS + notification email.
    try {
      const lines = [
        '\ud83d\udcb8 New HBOT Trial Purchase \u2014 $149',
        '',
        customerName,
        `\ud83d\udcde ${phone || 'No phone'}`,
        `\u2709\ufe0f ${normalizedEmail}`,
      ];
      if (main_problem) lines.push(`Main problem: ${main_problem}`);
      if (importance_1_10) lines.push(`Importance: ${importance_1_10}/10`);
      lines.push('', 'Hyperbaric Recovery Trial (3 sessions / 10 days)');
      await postToStaffChannel({
        channelName: 'Sales Alerts',
        memberEmails: ['damon@range-medical.com', 'tara@range-medical.com'],
        content: lines.join('\n'),
        pushPayload: {
          title: 'New HBOT Trial \u2014 $149',
          body: customerName,
        },
      });
    } catch (chatErr) {
      console.error('HBOT trial staff chat error:', chatErr);
    }

    console.log(`HBOT trial checkout complete: ${customerName} \u2192 trial ${trialPassId}`);

    return res.status(200).json({
      success: true,
      trialId: trialPassId,
      purchaseId: purchase?.id || null,
    });
  } catch (error) {
    console.error('HBOT trial checkout-complete error:', error);
    return res.status(500).json({ error: error.message });
  }
}
