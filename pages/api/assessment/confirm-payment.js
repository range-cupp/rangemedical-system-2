// /pages/api/assessment/confirm-payment.js
// Confirms payment status after Stripe Elements succeeds
// Range Medical — Injury & Recovery Assessment

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { sendSMS } from '../../../lib/send-sms';
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

    // --- Send SMS notification to Chris ---
    try {
      const { data: lead } = await supabase
        .from('assessment_leads')
        .select('first_name, last_name, assessment_type')
        .eq('id', leadId)
        .single();

      const name = lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown';
      const type = lead?.assessment_type || 'assessment';
      const amount = (paymentIntent.amount / 100).toFixed(2);
      const message = `New assessment paid! ${name} just paid $${amount} for a ${type} assessment via range-medical.com.`;

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
