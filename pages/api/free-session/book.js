// pages/api/free-session/book.js
// Books a free trial session (HBOT or RLT) via the native scheduling
// engine and persists the no-show payment method on the trial_pass.
// Cal.com is no longer in the loop. The prospect must have agreed to
// the $25 no-show fee (noShowAgreed = true) and attached a card via
// Stripe Elements + SetupIntent.

import { createClient } from '@supabase/supabase-js';
import { createAppointment } from '../../../lib/create-appointment';
import { pickProviderForSlot } from '../../../lib/scheduling';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import stripe from '../../../lib/stripe';
import { moveCard } from '../../../lib/pipelines-server';
import { sendMetaCapiEvent, getClientIp } from '../../../lib/meta-capi';
import { postToStaffChannel } from '../../../lib/post-to-staff-channel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TYPE_LABELS = {
  hbot: { label: 'Hyperbaric Oxygen', shortLabel: 'HBOT', duration: 60, slug: 'hbot', category: 'hbot', requiresCard: false },
  rlt:  { label: 'Red Light',         shortLabel: 'RLT',  duration: 20, slug: 'red-light-therapy', category: 'rlt', requiresCard: false },
};

function formatPacific(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { trialId, slotStart, paymentMethodId, noShowAgreed, meta: metaInput = {} } = req.body || {};

    if (!trialId || !slotStart) {
      return res.status(400).json({
        error: 'Missing required booking fields',
        debug: { hasTrialId: !!trialId, hasSlotStart: !!slotStart },
      });
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

    if (typeCfg.requiresCard) {
      if (!paymentMethodId) {
        return res.status(400).json({ error: 'A payment method is required to hold your session' });
      }
      if (noShowAgreed !== true) {
        return res.status(400).json({ error: 'You must agree to the $25 no-show fee to continue' });
      }

      // Attach payment method defensively (SetupIntent confirm usually does it).
      if (trial.stripe_customer_id) {
        try {
          await stripe.paymentMethods.attach(paymentMethodId, { customer: trial.stripe_customer_id });
        } catch (attachErr) {
          if (attachErr?.code !== 'resource_already_exists' && !/already been attached/i.test(attachErr?.message || '')) {
            console.error('Stripe attach error:', attachErr);
          }
        }
      }
    }

    // Pick provider via the engine (round-robin).
    const provider = await pickProviderForSlot({ serviceSlug: typeCfg.slug, startISO: slotStart });
    if (!provider) {
      return res.status(409).json({
        error: 'This time slot is no longer available. Please pick another.',
        slotUnavailable: true,
      });
    }

    const startDate = new Date(slotStart);
    const endDate = new Date(startDate.getTime() + typeCfg.duration * 60000);
    const serviceName = `Free ${typeCfg.label} Trial`;
    const bookingNotes = typeCfg.requiresCard
      ? `Free ${typeCfg.label} trial — $25 no-show hold on file (pm_id on trial_pass ${trialId})`
      : `Free ${typeCfg.label} trial — no card on file (ops-only flow)`;

    let appointmentResult;
    try {
      appointmentResult = await createAppointment({
        patient_id: trial.patient_id,
        patient_name: customerName || 'Range Medical Lead',
        patient_phone: trial.phone || null,
        service_name: serviceName,
        service_category: typeCfg.category,
        service_slug: typeCfg.slug,
        provider: provider.displayLabel || provider.name,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: typeCfg.duration,
        notes: bookingNotes,
        visit_reason: `Free ${typeCfg.label} trial session (self-booked)`,
        source: 'patient',
        created_by: 'free-session-self-book',
        send_notification: false,   // Custom SMS/email below
      });
    } catch (e) {
      console.error('Free session createAppointment error:', e);
      return res.status(500).json({ error: 'Could not book this time. Please try again.' });
    }

    // Update trial pass with booking + (optional) no-show hold
    const trialUpdate = {
      scheduled_start_time: startDate.toISOString(),
      calcom_booking_uid: appointmentResult.appointment.id,  // legacy column → appointment.id
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    };
    if (typeCfg.requiresCard && paymentMethodId) {
      trialUpdate.no_show_payment_method_id = paymentMethodId;
      trialUpdate.no_show_agreed_at = new Date().toISOString();
    }
    await supabase.from('trial_passes').update(trialUpdate).eq('id', trialId);

    // Move the matching Free Sessions pipeline card to "scheduled".
    try {
      const { data: card } = await supabase
        .from('pipeline_cards')
        .select('id')
        .eq('pipeline', 'free_sessions')
        .eq('status', 'active')
        .filter('meta->>trial_pass_id', 'eq', trialId)
        .maybeSingle();
      if (card?.id) {
        await moveCard({
          card_id: card.id,
          to_stage: 'scheduled',
          scheduled_for: startDate.toISOString(),
          triggered_by: 'free_session_book',
          automation_reason: 'slot booked via /api/free-session/book',
        });
      }
    } catch (cardErr) {
      console.error('Free session pipeline card move error:', cardErr);
    }

    // Patient SMS confirmation
    const prettyWhen = formatPacific(startDate.toISOString());
    if (normalizedPhone) {
      try {
        const message = typeCfg.requiresCard
          ? `You’re booked for a free ${typeCfg.label} session at Range Medical on ${prettyWhen}. 1901 Westcliff Dr #10, Newport Beach. A card is on file for the $25 no-show fee — only charged if you miss without letting us know. Reply to reschedule.\n\n— Range Medical`
          : `You’re booked for a free ${typeCfg.label} session at Range Medical on ${prettyWhen}. 1901 Westcliff Dr #10, Newport Beach. Reply to reschedule or cancel — please give us a heads up if you can’t make it.\n\n— Range Medical`;
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

    // Staff chat alert — replaces the prior SMS + Damon task + staff email.
    try {
      const lines = [
        `✅ Free ${typeCfg.label} session BOOKED`,
        '',
        customerName,
        `📞 ${trial.phone || 'n/a'}`,
        `✉️ ${trial.email || 'n/a'}`,
        `📅 ${prettyWhen}`,
        `⏱ ${typeCfg.duration} min`,
      ];
      if (typeCfg.requiresCard) {
        lines.push('', `$25 no-show card is on file (trial_pass ${trialId}). Charge from Stripe if they no-show.`);
      } else {
        lines.push('', 'No card on file — please confirm with reminder texts (24h + same-day).');
      }
      await postToStaffChannel({
        channelName: 'Free Session Alerts',
        memberEmails: ['damon@range-medical.com', 'tara@range-medical.com'],
        content: lines.join('\n'),
        pushPayload: {
          title: `Free ${typeCfg.shortLabel} booked`,
          body: `${customerName} · ${prettyWhen}`,
        },
      });
    } catch (chatErr) {
      console.error('Booking staff chat error:', chatErr);
    }

    // Meta Conversions API — server-side Schedule event, deduped against
    // the browser pixel via the matching event_id.
    if (metaInput?.eventId) {
      try {
        const sessionValue = trial.trial_type === 'hbot' ? 185 : 85;
        const result = await sendMetaCapiEvent({
          eventName: 'Schedule',
          eventId: metaInput.eventId,
          eventSourceUrl: metaInput.eventSourceUrl || `https://range-medical.com/${trial.trial_type}-trial`,
          user: {
            email: trial.email || undefined,
            phone: trial.phone || undefined,
            firstName: trial.first_name || undefined,
            lastName: trial.last_name || undefined,
            fbp: metaInput.fbp,
            fbc: metaInput.fbc,
            clientIp: getClientIp(req),
            clientUserAgent: req.headers['user-agent'] || '',
          },
          custom: {
            value: sessionValue,
            currency: 'USD',
            content_name: `${typeCfg.label} Free Session Booked`,
            content_category: trial.trial_type,
          },
        });
        if (result.skipped) {
          console.log(`Meta CAPI Schedule skipped: ${result.skipped}`);
        } else if (!result.ok) {
          console.error('Meta CAPI Schedule failed:', result.error);
        }
      } catch (capiErr) {
        console.error('Meta CAPI Schedule exception:', capiErr);
      }
    }

    return res.status(200).json({
      success: true,
      bookingUid: appointmentResult.appointment.id,
      bookingId: appointmentResult.appointment.id,
      scheduledStart: startDate.toISOString(),
    });
  } catch (err) {
    console.error('Free session book error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
