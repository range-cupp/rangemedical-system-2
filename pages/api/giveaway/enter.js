// pages/api/giveaway/enter.js
// Handles giveaway application submissions.
// Saves entry, scores the lead, creates/updates patient, inserts to pipeline,
// sends confirmation SMS to entrant, sends staff notification email.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { insertIntoPipeline } from '../../../lib/pipeline-insert';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const CAMPAIGN_KEY = 'cellular_reset_2026_04';

function computeLeadScore({ importance90d, budgetAnswer }) {
  // 0-100 scale. Importance contributes up to 70, budget up to 30.
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

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' ') || '',
  };
}

const STRUGGLE_LABELS = {
  energy: 'Low energy / afternoon crashes',
  brain_fog: 'Brain fog / focus',
  recovery: 'Slow recovery from injury or workouts',
  weight_loss: 'Trouble losing weight',
  other: 'Other',
};

const BUDGET_LABELS = {
  yes: 'Yes',
  yes_with_payments: 'Yes, with payment plan',
  no: 'Probably not right now',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name,
      phone,
      email,
      instagramHandle,
      consentMarketing,
      struggleMain,
      struggleOther,
      badDayDescription,
      desiredChange,
      importance90d,
      budgetAnswer,
      source,
    } = req.body || {};

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Missing required contact fields' });
    }
    if (!consentMarketing) {
      return res.status(400).json({ error: 'Marketing consent is required to enter' });
    }
    if (!struggleMain || !badDayDescription || !desiredChange) {
      return res.status(400).json({ error: 'Missing required story fields' });
    }
    if (!importance90d || !budgetAnswer) {
      return res.status(400).json({ error: 'Missing required qualification fields' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const { first_name, last_name } = splitName(name);

    const leadScore = computeLeadScore({ importance90d, budgetAnswer });
    const leadTier = computeTier({ importance90d, budgetAnswer });

    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // 1. Insert giveaway entry
    const { data: entry, error: entryErr } = await supabase
      .from('giveaway_entries')
      .insert([{
        name: name.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        instagram_handle: instagramHandle || null,
        consent_marketing: !!consentMarketing,
        struggle_main: struggleMain,
        struggle_other: struggleOther || null,
        bad_day_description: badDayDescription,
        desired_change: desiredChange,
        importance_90d: Number(importance90d),
        budget_answer: budgetAnswer,
        lead_score: leadScore,
        lead_tier: leadTier,
        status: 'new',
        campaign_key: CAMPAIGN_KEY,
        source: source || 'direct',
      }])
      .select()
      .single();

    if (entryErr) {
      console.error('giveaway_entries insert error:', entryErr);
      return res.status(500).json({ error: 'Could not save your entry. Please try again.' });
    }

    // 2. Find or create patient
    let patientId = null;
    try {
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id, tags')
        .eq('email', normalizedEmail)
        .maybeSingle();

      const tags = ['giveaway-entrant', `giveaway-${leadTier}`];

      if (existingPatient) {
        patientId = existingPatient.id;
        const existingTags = Array.isArray(existingPatient.tags) ? existingPatient.tags : [];
        const mergedTags = [...new Set([...existingTags, ...tags])];
        await supabase
          .from('patients')
          .update({ tags: mergedTags })
          .eq('id', patientId);
      } else {
        const { data: newPatient, error: patientErr } = await supabase
          .from('patients')
          .insert({
            first_name,
            last_name,
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            tags,
          })
          .select('id')
          .single();
        if (!patientErr && newPatient) patientId = newPatient.id;
      }

      if (patientId) {
        await supabase
          .from('giveaway_entries')
          .update({ patient_id: patientId })
          .eq('id', entry.id);
      }
    } catch (patientErr) {
      console.error('Patient upsert error:', patientErr);
    }

    // 3. Add to sales pipeline
    await insertIntoPipeline({
      first_name,
      last_name,
      email: normalizedEmail,
      phone: phone.trim(),
      source: 'giveaway',
      lead_type: 'giveaway',
      lead_id: entry.id,
      patient_id: patientId,
      path: 'energy',
      notes: `Giveaway — ${STRUGGLE_LABELS[struggleMain] || struggleMain}. Importance: ${importance90d}/10. Budget: ${BUDGET_LABELS[budgetAnswer] || budgetAnswer}.`,
      urgency: Number(importance90d),
    });

    // 4. Confirmation SMS to entrant
    try {
      const normalized = normalizePhone(phone);
      if (normalized) {
        const firstName = first_name || 'there';
        const message = `Hey ${firstName}, you're entered to win the 6-Week Cellular Energy Reset at Range Medical. We'll pick the winner soon and text everyone else their scholarship offer. Watch for a text from this number so your carrier doesn't filter us.\n\n- Range Medical`;

        const smsResult = await sendSMS({ to: normalized, message });

        await logComm({
          channel: 'sms',
          messageType: 'giveaway_entry_confirmation',
          message,
          source: 'giveaway-enter',
          patientId,
          patientName: first_name,
          recipient: normalized,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
        });
      }
    } catch (smsErr) {
      console.error('Giveaway confirmation SMS error:', smsErr);
    }

    // 5. Staff notification email
    try {
      const date = new Date().toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles',
      });
      const tierColor = leadTier === 'green' ? '#16A34A' : leadTier === 'yellow' ? '#D97706' : '#DC2626';

      const staffHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#000;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">New Giveaway Entry</h1>
          <p style="margin:4px 0 0;color:#a3a3a3;font-size:13px;">6-Week Cellular Energy Reset</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:14px;color:#737373;">${date}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;width:160px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(normalizedEmail)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(phone)}</td></tr>
            ${instagramHandle ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Instagram</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(instagramHandle)}</td></tr>` : ''}
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Struggle</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(STRUGGLE_LABELS[struggleMain] || struggleMain)}${struggleOther ? ` — ${escapeHtml(struggleOther)}` : ''}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Importance (90d)</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:700;">${importance90d}/10</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Budget</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${escapeHtml(BUDGET_LABELS[budgetAnswer] || budgetAnswer)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;">Tier</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;"><span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:700;color:#fff;background:${tierColor};">${leadTier.toUpperCase()}</span> <span style="color:#737373;margin-left:8px;">score ${leadScore}</span></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#737373;vertical-align:top;">Bad day</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;line-height:1.5;">${escapeHtml(badDayDescription)}</td></tr>
            <tr><td style="padding:10px 0;font-size:14px;color:#737373;vertical-align:top;">What would change</td><td style="padding:10px 0;font-size:14px;line-height:1.5;">${escapeHtml(desiredChange)}</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: ['chris@range-medical.com', 'damon@range-medical.com'],
        subject: `Giveaway: ${name} — ${leadTier.toUpperCase()} (${leadScore})`,
        html: staffHtml,
      });
    } catch (emailErr) {
      console.error('Staff notification email error:', emailErr);
    }

    return res.status(200).json({
      success: true,
      entryId: entry.id,
      leadTier,
      leadScore,
    });
  } catch (err) {
    console.error('Giveaway enter error:', err);
    return res.status(500).json({ error: 'Internal server error' });
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
