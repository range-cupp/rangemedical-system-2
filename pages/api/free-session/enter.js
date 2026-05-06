// pages/api/free-session/enter.js
// Handles free single-session trial opt-ins (HBOT + RLT). Patient gets a
// confirmation SMS; staff get a single chat message in the "Free Session
// Alerts" channel (Damon, Tara, Chris) with push notifications.

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import stripe from '../../../lib/stripe';
import { createCard } from '../../../lib/pipelines-server';
import { postToStaffChannel } from '../../../lib/post-to-staff-channel';
import { sendMetaCapiEvent, getClientIp } from '../../../lib/meta-capi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRIAL_CONFIG = {
  hbot: {
    label: 'Hyperbaric Oxygen',
    shortLabel: 'HBOT',
    sessionDuration: '60-minute',
    leadType: 'hbot_trial_free',
    source: 'hbot_free_session',
    accentColor: '#0891b2',
    calcomSlug: 'hbot',
    requiresCard: false,
  },
  rlt: {
    label: 'Red Light',
    shortLabel: 'RLT',
    sessionDuration: '20-minute',
    leadType: 'rlt_trial_free',
    source: 'rlt_free_session',
    accentColor: '#dc2626',
    calcomSlug: 'red-light-therapy',
    requiresCard: false,
  },
};

const STRUGGLE_LABELS = {
  energy: 'Low energy / afternoon crashes',
  brain_fog: 'Brain fog / focus',
  recovery: 'Slow recovery / injury / workouts',
  sleep: 'Sleep',
  pain: 'Pain / inflammation',
  headaches: 'Headaches',
  skin: 'Skin / inflammation',
  mood: 'Mood / stress',
  weight_loss: 'Trouble losing weight',
  other: 'Other',
};

const BUDGET_LABELS = {
  single:     'Single sessions \u2014 one at a time',
  pack:       'A pack (5 or 10 sessions)',
  membership: 'Monthly membership',
  exploring:  'Just exploring for now',
};

function computeLeadScore({ importance90d, budgetAnswer }) {
  const importancePoints = Math.max(0, Math.min(10, Number(importance90d) || 0)) * 7;
  let budgetPoints = 0;
  if (budgetAnswer === 'membership') budgetPoints = 30;
  else if (budgetAnswer === 'pack') budgetPoints = 22;
  else if (budgetAnswer === 'single') budgetPoints = 12;
  return importancePoints + budgetPoints;
}

function computeTier({ importance90d, budgetAnswer }) {
  const imp = Number(importance90d) || 0;
  const highCommit = budgetAnswer === 'pack' || budgetAnswer === 'membership';
  if (imp >= 8 && highCommit) return 'green';
  if (budgetAnswer === 'exploring' || imp <= 4) return 'red';
  return 'yellow';
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      trialType,
      firstName,
      lastName,
      email,
      phone,
      consentMarketing,
      struggleMains,
      struggleOther,
      badDayDescription,
      importance90d,
      budgetAnswer,
      source,
      meta: metaInput = {},
    } = req.body || {};

    const config = TRIAL_CONFIG[trialType];
    if (!config) {
      return res.status(400).json({ error: 'Invalid trial type' });
    }

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required contact fields' });
    }
    if (!consentMarketing) {
      return res.status(400).json({ error: 'Marketing consent is required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPhone = normalizePhone(phone);
    const customerName = `${firstName} ${lastName}`.trim();

    // One free session per person. Block if this email or phone already has
    // a trial pass that's been booked or used. Abandoned 'purchased' rows
    // don't count, so a lead who bounced step 2 can still come back and
    // finish. Cancellations flip the status off 'scheduled' so a legit
    // reschedule isn't blocked.
    {
      const { data: byEmail } = await supabase
        .from('trial_passes')
        .select('id')
        .eq('trial_type', trialType)
        .in('status', ['scheduled', 'used'])
        .eq('email', normalizedEmail)
        .limit(1);
      let blocked = !!(byEmail && byEmail.length > 0);

      // Phone fallback — stored phones may be formatted ("(949) 555-9999"),
      // so normalize to last-10-digits in JS rather than relying on ILIKE.
      if (!blocked) {
        const phoneDigits = String(phone).replace(/\D/g, '').slice(-10);
        if (phoneDigits.length === 10) {
          const { data: actives } = await supabase
            .from('trial_passes')
            .select('phone')
            .eq('trial_type', trialType)
            .in('status', ['scheduled', 'used']);
          blocked = (actives || []).some(
            (p) => String(p.phone || '').replace(/\D/g, '').slice(-10) === phoneDigits,
          );
        }
      }

      if (blocked) {
        return res.status(409).json({
          error: `Looks like you already have a free ${config.label} session on file. Text or call (949) 997-3988 to reschedule.`,
        });
      }
    }

    const hasBant = Array.isArray(struggleMains) && struggleMains.length > 0 && importance90d && budgetAnswer;
    const leadScore = hasBant ? computeLeadScore({ importance90d, budgetAnswer }) : 0;
    const leadTier = hasBant ? computeTier({ importance90d, budgetAnswer }) : 'yellow';
    const struggleLabel = Array.isArray(struggleMains) && struggleMains.length > 0
      ? struggleMains.map((v) => STRUGGLE_LABELS[v] || v).join(', ')
      : '';
    const budgetLabel = budgetAnswer ? (BUDGET_LABELS[budgetAnswer] || budgetAnswer) : '';

    // 1. Find or create patient
    let patientId = null;
    const tags = ['free-session', `free-session-${trialType}`, `free-session-${leadTier}`];

    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id, tags')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingPatient) {
      patientId = existingPatient.id;
      const existingTags = Array.isArray(existingPatient.tags) ? existingPatient.tags : [];
      const mergedTags = [...new Set([...existingTags, ...tags])];
      await supabase.from('patients').update({ tags: mergedTags }).eq('id', patientId);
    } else {
      const { data: newPatient } = await supabase
        .from('patients')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: customerName,
          email: normalizedEmail,
          phone: phone.trim(),
          tags,
        })
        .select('id')
        .single();
      if (newPatient) patientId = newPatient.id;
    }

    // 2. Build qualification notes blob
    const noteLines = [`Free ${config.label} session`];
    if (struggleLabel) noteLines.push(`Struggle: ${struggleLabel}${struggleOther ? ` (${struggleOther})` : ''}`);
    if (badDayDescription) noteLines.push(`Bad day: ${badDayDescription}`);
    if (importance90d) noteLines.push(`Importance 90d: ${importance90d}/10`);
    if (budgetLabel) noteLines.push(`Budget: ${budgetLabel}`);
    noteLines.push(`Tier: ${leadTier.toUpperCase()} (score ${leadScore})`);
    const notesBlob = noteLines.join('\n');

    // 3. Create sales_pipeline lead
    const { data: lead } = await supabase
      .from('sales_pipeline')
      .insert({
        lead_type: config.leadType,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        source: source || 'website',
        stage: 'new',
        patient_id: patientId,
        notes: notesBlob,
      })
      .select('id')
      .single();

    // 4. Create trial_passes row
    const trialRow = {
      patient_id: patientId,
      sales_pipeline_id: lead?.id || null,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      payment_status: 'free',
      status: 'purchased',
      trial_type: trialType,
      purchased_at: new Date().toISOString(),
      source: config.source,
    };
    if (struggleLabel) trialRow.main_problem = struggleLabel;
    if (importance90d) trialRow.importance_1_10 = Number(importance90d);

    const { data: trial, error: trialErr } = await supabase
      .from('trial_passes')
      .insert(trialRow)
      .select('id')
      .single();

    if (trialErr || !trial?.id) {
      console.error('trial_passes insert error:', trialErr);
      return res.status(500).json({ error: 'Could not save your free session. Please try again or text (949) 997-3988.' });
    }

    const trialPassId = trial.id;

    // 4b. Create Free Sessions pipeline card. Non-blocking — log and continue
    // if it fails so the trial pass + notifications still go out.
    try {
      await createCard({
        pipeline: 'free_sessions',
        stage: 'needs_scheduling',
        patient_id: patientId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        source: config.source,
        notes: notesBlob,
        meta: {
          prize_type: trialType === 'rlt' ? 'red_light' : 'hbot',
          trial_pass_id: trialPassId,
          lead_tier: leadTier,
          lead_score: leadScore,
        },
        triggered_by: 'free_session_enter',
        automation_reason: `Free ${config.label} session opt-in`,
      });
    } catch (cardErr) {
      console.error('Free session pipeline card create error:', cardErr);
    }

    // 5. Resolve legacy event type ID for the slot picker (kept for
    // back-compat with the client; the booking endpoint also accepts
    // serviceSlug directly so this is optional). Read from local services
    // table — no Cal.com call.
    let eventTypeId = null;
    try {
      const { data: svc } = await supabase
        .from('services')
        .select('legacy_calcom_event_type_id')
        .eq('slug', config.calcomSlug)
        .maybeSingle();
      if (svc?.legacy_calcom_event_type_id) eventTypeId = svc.legacy_calcom_event_type_id;
    } catch (lookupErr) {
      console.error('Service lookup error:', lookupErr);
    }

    // 6. Stripe: find or create customer + SetupIntent for no-show card.
    // Skipped entirely for trials with requiresCard=false (RLT) — those use
    // an ops-only flow (slot caps + reminders) instead of card-on-file.
    let stripeCustomerId = null;
    let setupClientSecret = null;
    let setupIntentId = null;
    if (config.requiresCard) {
      try {
        const existingCustomers = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: normalizedEmail,
            name: customerName,
            phone: phone.trim(),
            metadata: {
              patient_id: patientId || '',
              trial_id: trialPassId || '',
              free_session_type: trialType,
            },
          });
          stripeCustomerId = customer.id;
        }

        if (patientId && stripeCustomerId) {
          await supabase
            .from('patients')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', patientId);
        }

        const setupIntent = await stripe.setupIntents.create({
          customer: stripeCustomerId,
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
          usage: 'off_session',
          metadata: {
            purpose: 'free_session_no_show_hold',
            trial_id: trialPassId || '',
            free_session_type: trialType,
          },
        });
        setupClientSecret = setupIntent.client_secret;
        setupIntentId = setupIntent.id;
      } catch (stripeErr) {
        console.error('Stripe SetupIntent error:', stripeErr);
      }
    }

    // 7. Update trial_passes with Stripe info (only when card flow ran)
    if (trialPassId && (stripeCustomerId || setupIntentId)) {
      await supabase
        .from('trial_passes')
        .update({
          stripe_customer_id: stripeCustomerId,
          stripe_setup_intent_id: setupIntentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trialPassId);
    }

    // 8-10. Run confirmation SMS + staff SMS + staff email in parallel.
    // Each task has its own try/catch so one failure doesn't drop the others.
    const notificationTasks = [];

    if (normalizedPhone) {
      notificationTasks.push((async () => {
        try {
          const message = `Hey ${firstName}, thanks for signing up for a free ${config.label} session at Range Medical. Pick your time on the page to lock it in \u2014 we\u2019ll send a confirmation as soon as you\u2019re booked.\n\n\u2014 Range Medical`;
          const smsResult = await sendSMS({ to: normalizedPhone, message });
          await logComm({
            channel: 'sms',
            messageType: `free_session_${trialType}_confirmation`,
            message,
            source: 'free-session-enter',
            patientId,
            patientName: firstName,
            recipient: normalizedPhone,
            status: smsResult.success ? 'sent' : 'error',
            errorMessage: smsResult.error || null,
            twilioMessageSid: smsResult.messageSid || null,
            provider: smsResult.provider || null,
          });
        } catch (smsErr) {
          console.error('Free session confirmation SMS error:', smsErr);
        }
      })());
    }

    notificationTasks.push((async () => {
      try {
        const lines = [
          `\ud83c\udd95 New FREE ${config.label} session`,
          '',
          customerName,
          `\ud83d\udcde ${phone.trim()}`,
          `\u2709\ufe0f ${normalizedEmail}`,
        ];
        if (struggleLabel) lines.push(`Hoping it helps: ${struggleLabel}${struggleOther ? ` \u2014 ${struggleOther}` : ''}`);
        if (badDayDescription) lines.push(`Bad day: ${badDayDescription}`);
        if (importance90d) lines.push(`Importance (90d): ${importance90d}/10`);
        lines.push('', "They'll pick a time on the next step. If they don't finish, reach out and help them schedule.");
        const content = lines.join('\n');

        await postToStaffChannel({
          channelName: 'Free Session Alerts',
          memberEmails: ['damon@range-medical.com', 'tara@range-medical.com'],
          content,
          pushPayload: {
            title: `New FREE ${config.shortLabel} session`,
            body: `${customerName} \u00b7 ${phone.trim()}`,
          },
        });
      } catch (chatErr) {
        console.error('Free session staff chat error:', chatErr);
      }
    })());

    // Meta Conversions API \u2014 server-side Lead event, deduped against the
    // browser pixel via the matching event_id.
    if (metaInput?.eventId) {
      notificationTasks.push((async () => {
        try {
          const sessionValue = trialType === 'hbot' ? 185 : 85;
          const result = await sendMetaCapiEvent({
            eventName: 'Lead',
            eventId: metaInput.eventId,
            eventSourceUrl: metaInput.eventSourceUrl || `https://range-medical.com/${trialType}-trial`,
            user: {
              email: normalizedEmail,
              phone: phone.trim(),
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              fbp: metaInput.fbp,
              fbc: metaInput.fbc,
              clientIp: getClientIp(req),
              clientUserAgent: req.headers['user-agent'] || '',
            },
            custom: {
              value: sessionValue,
              currency: 'USD',
              content_name: `${config.label} Free Session`,
              content_category: trialType,
            },
          });
          if (result.skipped) {
            console.log(`Meta CAPI Lead skipped: ${result.skipped}`);
          } else if (!result.ok) {
            console.error('Meta CAPI Lead failed:', result.error);
          }
        } catch (capiErr) {
          console.error('Meta CAPI Lead exception:', capiErr);
        }
      })());
    }


    await Promise.allSettled(notificationTasks);

    return res.status(200).json({
      success: true,
      trialId: trialPassId,
      leadTier,
      leadScore,
      eventTypeId,
      stripeCustomerId,
      setupClientSecret,
      requiresCard: !!config.requiresCard,
      sessionDurationMinutes: trialType === 'hbot' ? 60 : 20,
    });
  } catch (err) {
    console.error('Free session enter error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
