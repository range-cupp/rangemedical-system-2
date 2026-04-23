// pages/api/free-session/book.js
// Books the Cal.com slot for a free trial session and persists the no-show
// payment method on the trial_pass. The prospect must have already agreed
// to the $25 no-show fee (noShowAgreed = true) and attached a card via
// Stripe Elements + SetupIntent.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createBooking } from '../../../lib/calcom';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import stripe from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_PHONE = '+19496900339';

const TYPE_LABELS = {
  hbot: { label: 'Hyperbaric Oxygen', shortLabel: 'HBOT', duration: 60 },
  rlt:  { label: 'Red Light',         shortLabel: 'RLT',  duration: 20 },
};

function formatPacific(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      trialId,
      eventTypeId,
      slotStart,
      paymentMethodId,
      noShowAgreed,
    } = req.body || {};

    if (!trialId || !eventTypeId || !slotStart) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'A payment method is required to hold your session' });
    }
    if (noShowAgreed !== true) {
      return res.status(400).json({ error: 'You must agree to the $25 no-show fee to continue' });
    }

    const { data: trial, error: trialErr } = await supabase
      .from('trial_passes')
      .select('id, first_name, last_name, email, phone, trial_type, patient_id, stripe_customer_id, scheduled_start_time, calcom_booking_uid')
      .eq('id', trialId)
      .single();

    if (trialErr || !trial) {
      return res.status(404).json({ error: 'Free session record not found' });
    }

    if (trial.calcom_booking_uid) {
      return res.status(409).json({ error: 'This session has already been booked' });
    }

    const typeCfg = TYPE_LABELS[trial.trial_type] || TYPE_LABELS.hbot;
    const customerName = `${trial.first_name || ''} ${trial.last_name || ''}`.trim();
    const normalizedPhone = normalizePhone(trial.phone);

    // Attach the payment method to the Stripe customer (if not already) so we
    // can charge it off-session for a no-show. The SetupIntent confirm on the
    // client usually handles attach, but call here defensively.
    if (trial.stripe_customer_id) {
      try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: trial.stripe_customer_id });
      } catch (attachErr) {
        if (attachErr?.code !== 'resource_already_exists' && !/already been attached/i.test(attachErr?.message || '')) {
          console.error('Stripe attach error:', attachErr);
        }
      }
    }

    // Book in Cal.com
    const bookingNotes = `Free ${typeCfg.label} trial — $25 no-show hold on file (pm_id on trial_pass ${trialId})`;
    const calResult = await createBooking({
      eventTypeId: parseInt(eventTypeId, 10),
      start: slotStart,
      name: customerName || trial.email || 'Range Medical Lead',
      email: trial.email,
      phoneNumber: trial.phone,
      notes: bookingNotes,
    });

    if (calResult?.error) {
      console.error('Cal.com booking failed:', calResult);
      let errorMsg = 'Could not book this time. Please pick another slot.';
      try {
        const parsed = typeof calResult.error === 'string' ? JSON.parse(calResult.error) : calResult.error;
        const detail = parsed?.error?.message || parsed?.message || '';
        if (detail.includes('already has booking') || detail.includes('not available')) {
          errorMsg = 'This time slot is no longer available. Please pick another.';
        } else if (detail) {
          errorMsg = detail;
        }
      } catch {
        // fall through
      }
      return res.status(409).json({ error: errorMsg, slotUnavailable: /no longer available|not available|already/i.test(errorMsg) });
    }

    const startDate = new Date(slotStart);
    const endDate = new Date(startDate.getTime() + typeCfg.duration * 60000);
    const calBookingId = calResult.id;
    const calBookingUid = calResult.uid;

    // Update trial pass with booking + no-show hold
    await supabase
      .from('trial_passes')
      .update({
        scheduled_start_time: startDate.toISOString(),
        calcom_booking_id: calBookingId,
        calcom_booking_uid: calBookingUid,
        no_show_payment_method_id: paymentMethodId,
        no_show_agreed_at: new Date().toISOString(),
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', trialId);

    // Mirror to calcom_bookings so it appears on the admin schedule
    try {
      await supabase
        .from('calcom_bookings')
        .insert({
          calcom_booking_id: calBookingId,
          calcom_uid: calBookingUid,
          patient_id: trial.patient_id,
          patient_name: customerName,
          patient_email: trial.email,
          patient_phone: trial.phone,
          service_name: `Free ${typeCfg.label} Trial`,
          service_slug: trial.trial_type === 'hbot' ? 'hbot' : 'red-light-therapy',
          calcom_event_type_id: parseInt(eventTypeId, 10),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          booking_date: slotStart.split('T')[0],
          duration_minutes: typeCfg.duration,
          status: 'scheduled',
          notes: bookingNotes,
          booked_by: 'self',
        });
    } catch (dbErr) {
      console.error('calcom_bookings mirror insert error:', dbErr);
    }

    // SMS confirmation to lead
    const prettyWhen = formatPacific(startDate.toISOString());
    if (normalizedPhone) {
      try {
        const message = `You\u2019re booked for a free ${typeCfg.label} session at Range Medical on ${prettyWhen}. 1901 Westcliff Dr #10, Newport Beach. A card is on file for the $25 no-show fee \u2014 only charged if you miss without letting us know. Reply to reschedule.\n\n\u2014 Range Medical`;
        const smsResult = await sendSMS({ to: normalizedPhone, message });
        await logComm({
          channel: 'sms',
          messageType: `free_session_${trial.trial_type}_booking_confirmed`,
          message,
          source: 'free-session-book',
          patientId: trial.patient_id,
          patientName: trial.first_name,
          recipient: normalizedPhone,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
        });
      } catch (smsErr) {
        console.error('Booking confirmation SMS error:', smsErr);
      }
    }

    // Create follow-up task for Damon
    try {
      const { data: damon } = await supabase
        .from('employees')
        .select('id')
        .eq('email', 'damon@range-medical.com')
        .single();
      if (damon?.id) {
        await supabase.from('tasks').insert({
          title: `Free ${typeCfg.shortLabel} booked: ${customerName}`,
          description: `${customerName} self-booked a free ${typeCfg.label} session for ${prettyWhen}.\nPhone: ${trial.phone || 'n/a'}\nEmail: ${trial.email || 'n/a'}\n$25 no-show card is on file (trial_pass ${trialId}).`,
          assigned_to: damon.id,
          assigned_by: damon.id,
          patient_id: trial.patient_id,
          patient_name: customerName,
          priority: 'medium',
          status: 'pending',
        });
      }
    } catch (taskErr) {
      console.error('Damon task insert error:', taskErr);
    }

    // Staff alert SMS
    try {
      const alertMsg = `Free ${typeCfg.shortLabel} booked: ${customerName} (${trial.phone}) \u2014 ${prettyWhen}. $25 no-show card on file.`;
      const alertResult = await sendSMS({ to: OWNER_PHONE, message: alertMsg });
      await logComm({
        channel: 'sms',
        messageType: `free_session_${trial.trial_type}_booking_staff_alert`,
        message: alertMsg,
        source: 'free-session-book',
        recipient: OWNER_PHONE,
        status: alertResult.success ? 'sent' : 'error',
        errorMessage: alertResult.error || null,
        twilioMessageSid: alertResult.messageSid || null,
        provider: alertResult.provider || null,
      });
    } catch (alertErr) {
      console.error('Booking staff alert error:', alertErr);
    }

    // Staff email
    try {
      const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0A0A0A;padding:20px 28px;"><h1 style="margin:0;color:#fff;font-size:18px;">Free ${typeCfg.label} Session Booked</h1></td></tr>
<tr><td style="padding:24px 28px;">
<p style="margin:0 0 12px;font-size:15px;"><strong>${escapeHtml(customerName)}</strong> \u00b7 ${escapeHtml(trial.phone || '')} \u00b7 ${escapeHtml(trial.email || '')}</p>
<p style="margin:0 0 12px;font-size:15px;"><strong>When:</strong> ${escapeHtml(prettyWhen)}</p>
<p style="margin:0 0 12px;font-size:15px;"><strong>Duration:</strong> ${typeCfg.duration} min</p>
<p style="margin:0 0 0;font-size:13px;color:#737373;">$25 no-show card saved on trial_pass ${trialId}. Charge from Stripe if they no-show.</p>
</td></tr></table></td></tr></table></body></html>`;
      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: ['chris@range-medical.com', 'damon@range-medical.com'],
        subject: `Free ${typeCfg.shortLabel} booked: ${customerName} \u2014 ${prettyWhen}`,
        html,
      });
    } catch (emailErr) {
      console.error('Booking staff email error:', emailErr);
    }

    return res.status(200).json({
      success: true,
      bookingUid: calBookingUid,
      bookingId: calBookingId,
      scheduledStart: startDate.toISOString(),
    });
  } catch (err) {
    console.error('Free session book error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
