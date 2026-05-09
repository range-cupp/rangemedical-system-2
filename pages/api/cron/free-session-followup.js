// /pages/api/cron/free-session-followup.js
// Runs every few minutes. Sends a single follow-up SMS to free-session leads
// who submitted step 1 but never finished picking a time on step 2. The
// "reply if you couldn't finish booking" prompt was pulled out of the
// immediate confirmation SMS so it doesn't undercut the self-serve flow.
//
// Eligibility:
//   - trial_passes row created 5+ minutes ago, but less than 60 min ago
//   - calcom_booking_uid IS NULL (never booked a slot)
//   - phone is present
//   - no prior comms_log row of this messageType for this trial
//   - status is not cancelled
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRIAL_LABELS = {
  hbot: 'Hyperbaric Oxygen',
  rlt:  'Red Light',
};

function isAuthorized(req) {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  return isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = Date.now();
    const fiveMinAgo = new Date(now - 5 * 60 * 1000).toISOString();
    const sixtyMinAgo = new Date(now - 60 * 60 * 1000).toISOString();

    // Trial passes that opted in 5-60 min ago and never booked
    const { data: candidates, error } = await supabase
      .from('trial_passes')
      .select('id, patient_id, first_name, phone, trial_type, purchased_at, calcom_booking_uid, status')
      .is('calcom_booking_uid', null)
      .gte('purchased_at', sixtyMinAgo)
      .lte('purchased_at', fiveMinAgo)
      .neq('status', 'cancelled')
      .not('phone', 'is', null);

    if (error) {
      console.error('free-session-followup query error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!candidates || candidates.length === 0) {
      return res.status(200).json({ success: true, considered: 0, sent: 0 });
    }

    let sent = 0;
    const results = [];

    // Deduplicate by phone — if someone submitted step 1 multiple times,
    // only process one followup per phone number
    const seenPhones = new Set();
    const dedupedCandidates = [];
    for (const trial of candidates) {
      const digits = (trial.phone || '').replace(/\D/g, '').slice(-10);
      if (!digits || seenPhones.has(digits)) continue;
      seenPhones.add(digits);
      dedupedCandidates.push(trial);
    }

    for (const trial of dedupedCandidates) {
      const messageType = `free_session_${trial.trial_type}_unbooked_followup`;

      const normalizedPhone = normalizePhone(trial.phone);
      if (!normalizedPhone) {
        results.push({ trialId: trial.id, skipped: 'no_phone' });
        continue;
      }

      // Dedup by phone (not patient_id) to prevent multiple followups
      // when someone submits step 1 more than once
      const phoneDigits = normalizedPhone.replace(/\D/g, '').slice(-10);
      const recentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: prior } = await supabase
        .from('comms_log')
        .select('id')
        .eq('message_type', messageType)
        .ilike('recipient', `%${phoneDigits}`)
        .gte('created_at', recentCutoff)
        .limit(1);

      if (prior && prior.length > 0) {
        results.push({ trialId: trial.id, skipped: 'already_sent' });
        continue;
      }

      // Skip if patient already replied — they're engaged with staff
      const { data: inboundReply } = await supabase
        .from('comms_log')
        .select('id')
        .eq('direction', 'inbound')
        .ilike('recipient', `%${phoneDigits}`)
        .gte('created_at', trial.purchased_at)
        .limit(1);

      if (inboundReply && inboundReply.length > 0) {
        results.push({ trialId: trial.id, skipped: 'patient_replied' });
        continue;
      }

      const label = TRIAL_LABELS[trial.trial_type] || 'free';
      const firstName = trial.first_name || 'there';
      const message = `Hey ${firstName}, looks like you didn't finish picking a time for your free ${label} session. Want help getting scheduled? Reply here and we'll lock it in.\n\n— Range Medical`;

      try {
        const smsResult = await sendSMS({ to: normalizedPhone, message });
        await logComm({
          channel: 'sms',
          messageType,
          message,
          source: 'free-session-followup-cron',
          patientId: trial.patient_id,
          patientName: firstName,
          recipient: normalizedPhone,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
        });
        if (smsResult.success) sent += 1;
        results.push({ trialId: trial.id, sent: smsResult.success });
      } catch (smsErr) {
        console.error('free-session-followup SMS error:', smsErr);
        results.push({ trialId: trial.id, error: smsErr.message });
      }
    }

    return res.status(200).json({
      success: true,
      considered: candidates.length,
      sent,
      results,
    });
  } catch (err) {
    console.error('free-session-followup cron error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
