// pages/api/giveaway/enter.js
// Handles giveaway application submissions.
// Saves entry, scores the lead, creates/updates patient, inserts to pipeline,
// sends confirmation SMS to entrant, posts staff alert to internal chat.

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { insertIntoPipeline } from '../../../lib/pipeline-insert';
import { postToStaffChannel } from '../../../lib/post-to-staff-channel';

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
        const message = `Hey ${firstName}, you're entered to win the 6-Week Cellular Energy Reset at Range Medical. Drawing is Saturday, April 25 at 10 AM PT. If you don't win, we'll text you a $1,000 scholarship offer. Watch for a text from this number so your carrier doesn't filter us.\n\n- Range Medical`;

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

    // 5. Staff chat alert — replaces the prior SMS to owner + staff email.
    try {
      const struggleLabel = STRUGGLE_LABELS[struggleMain] || struggleMain;
      const budgetLabel = BUDGET_LABELS[budgetAnswer] || budgetAnswer;
      const lines = [
        `🎁 New giveaway entry — ${leadTier.toUpperCase()} (score ${leadScore})`,
        '',
        name,
        `📞 ${phone.trim()}`,
        `✉️ ${normalizedEmail}`,
      ];
      if (instagramHandle) lines.push(`📸 ${instagramHandle}`);
      lines.push(
        `Struggle: ${struggleLabel}${struggleOther ? ` — ${struggleOther}` : ''}`,
        `Importance (90d): ${importance90d}/10`,
        `Budget: ${budgetLabel}`,
      );
      if (badDayDescription) lines.push('', `Bad day: ${badDayDescription}`);
      if (desiredChange) lines.push('', `What would change: ${desiredChange}`);
      lines.push('', 'Manage entries: range-medical.com/admin/giveaway');

      await postToStaffChannel({
        channelName: 'Giveaway Alerts',
        memberEmails: ['damon@range-medical.com', 'tara@range-medical.com'],
        content: lines.join('\n'),
        pushPayload: {
          title: `Giveaway entry — ${leadTier.toUpperCase()}`,
          body: `${name} · ${phone.trim()}`,
        },
      });
    } catch (chatErr) {
      console.error('Giveaway staff chat error:', chatErr);
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
