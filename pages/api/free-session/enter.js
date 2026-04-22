// pages/api/free-session/enter.js
// Handles free single-session trial opt-ins (HBOT + RLT) with BANT qualification.
// Mirrors /api/giveaway/enter pattern: scoring, tiering, SMS + email notifications.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OWNER_PHONE = '+19496900339';

const TRIAL_CONFIG = {
  hbot: {
    label: 'Hyperbaric Oxygen',
    shortLabel: 'HBOT',
    sessionDuration: '60-minute',
    leadType: 'hbot_trial_free',
    source: 'hbot_free_session',
    accentColor: '#0891b2',
  },
  rlt: {
    label: 'Red Light',
    shortLabel: 'RLT',
    sessionDuration: '20-minute',
    leadType: 'rlt_trial_free',
    source: 'rlt_free_session',
    accentColor: '#dc2626',
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
  yes: 'Yes, I\u2019m ready to invest',
  yes_with_payments: 'Yes, with a payment plan',
  no: 'Just exploring for now',
};

function computeLeadScore({ importance90d, budgetAnswer }) {
  const importancePoints = Math.max(0, Math.min(10, Number(importance90d) || 0)) * 7;
  let budgetPoints = 0;
  if (budgetAnswer === 'yes') budgetPoints = 30;
  else if (budgetAnswer === 'yes_with_payments') budgetPoints = 20;
  return importancePoints + budgetPoints;
}

function computeTier({ importance90d, budgetAnswer }) {
  const imp = Number(importance90d) || 0;
  const budgetYes = budgetAnswer === 'yes' || budgetAnswer === 'yes_with_payments';
  if (imp >= 8 && budgetYes) return 'green';
  if (budgetAnswer === 'no' || imp <= 4) return 'red';
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
      struggleMain,
      struggleOther,
      badDayDescription,
      importance90d,
      budgetAnswer,
      source,
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
    if (!struggleMain || !badDayDescription) {
      return res.status(400).json({ error: 'Missing required story fields' });
    }
    if (!importance90d || !budgetAnswer) {
      return res.status(400).json({ error: 'Missing required qualification fields' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPhone = normalizePhone(phone);
    const customerName = `${firstName} ${lastName}`.trim();

    const leadScore = computeLeadScore({ importance90d, budgetAnswer });
    const leadTier = computeTier({ importance90d, budgetAnswer });
    const struggleLabel = STRUGGLE_LABELS[struggleMain] || struggleMain;
    const budgetLabel = BUDGET_LABELS[budgetAnswer] || budgetAnswer;

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
    const notesBlob = [
      `Free ${config.label} session — BANT`,
      `Struggle: ${struggleLabel}${struggleOther ? ` (${struggleOther})` : ''}`,
      `Bad day: ${badDayDescription}`,
      `Importance 90d: ${importance90d}/10`,
      `Budget: ${budgetLabel}`,
      `Tier: ${leadTier.toUpperCase()} (score ${leadScore})`,
    ].join('\n');

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
    const { data: trial } = await supabase
      .from('trial_passes')
      .insert({
        patient_id: patientId,
        sales_pipeline_id: lead?.id || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        payment_status: 'free',
        status: 'purchased',
        trial_type: trialType,
        main_problem: struggleLabel,
        importance_1_10: Number(importance90d),
        purchased_at: new Date().toISOString(),
        source: config.source,
      })
      .select('id')
      .single();

    const trialPassId = trial?.id || null;

    // 5. Confirmation SMS to patient
    if (normalizedPhone) {
      try {
        const message = `Hey ${firstName}, you\u2019re signed up for a free ${config.label} session at Range Medical. One ${config.sessionDuration} session won\u2019t be life-changing on its own \u2014 real change takes consistency \u2014 but it\u2019ll give you a real feel for it. We\u2019ll text you shortly to pick a time.\n\n\u2014 Range Medical`;
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
    }

    // 6. Staff alert SMS
    try {
      const alertMsg = `New FREE ${config.shortLabel} session: ${customerName} (${phone.trim()}). ${struggleLabel} \u00b7 ${importance90d}/10 \u00b7 ${leadTier.toUpperCase()}. Text them to schedule.`;
      const alertResult = await sendSMS({ to: OWNER_PHONE, message: alertMsg });
      await logComm({
        channel: 'sms',
        messageType: `free_session_${trialType}_staff_alert`,
        message: alertMsg,
        source: 'free-session-enter',
        recipient: OWNER_PHONE,
        status: alertResult.success ? 'sent' : 'error',
        errorMessage: alertResult.error || null,
        twilioMessageSid: alertResult.messageSid || null,
        provider: alertResult.provider || null,
      });
    } catch (alertErr) {
      console.error('Free session staff alert error:', alertErr);
    }

    // 7. Staff email
    try {
      const tierColor = leadTier === 'green' ? '#16A34A' : leadTier === 'yellow' ? '#D97706' : '#DC2626';
      const now = new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });

      const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:${config.accentColor};padding:24px 32px;">
<h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">New Free ${config.label} Session</h1>
<p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${now}</p>
</td></tr>
<tr><td style="padding:32px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;width:160px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600;">${escapeHtml(customerName)}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(normalizedEmail)}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(phone)}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Struggle</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(struggleLabel)}${struggleOther ? ` — ${escapeHtml(struggleOther)}` : ''}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Importance (90d)</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:700;">${importance90d}/10</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Budget</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(budgetLabel)}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Tier</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;"><span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:700;color:#fff;background:${tierColor};">${leadTier.toUpperCase()}</span> <span style="color:#737373;margin-left:8px;">score ${leadScore}</span></td></tr>
<tr><td style="padding:10px 0;font-size:14px;color:#737373;vertical-align:top;">Bad day</td><td style="padding:10px 0;font-size:14px;line-height:1.5;">${escapeHtml(badDayDescription)}</td></tr>
</table>
</td></tr></table></td></tr></table></body></html>`;

      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: ['chris@range-medical.com', 'damon@range-medical.com'],
        subject: `Free ${config.shortLabel} Session: ${customerName} — ${leadTier.toUpperCase()} (${leadScore})`,
        html,
      });
    } catch (emailErr) {
      console.error('Free session staff email error:', emailErr);
    }

    return res.status(200).json({
      success: true,
      trialId: trialPassId,
      leadTier,
      leadScore,
    });
  } catch (err) {
    console.error('Free session enter error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
