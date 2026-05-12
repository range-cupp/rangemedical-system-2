// pages/api/cron/free-session-prep.js
// Sends HBOT prep/contraindications SMS ~24h before scheduled free sessions.
// Runs daily at 8:30 AM PT (15:30 UTC). No links — no Blooio two-step needed.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

function formatPacific(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = Date.now();
    const windowStart = new Date(now + 14 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(now + 40 * 60 * 60 * 1000).toISOString();

    const { data: trials, error } = await supabase
      .from('trial_passes')
      .select('id, patient_id, first_name, phone, trial_type, scheduled_start_time, calcom_booking_uid')
      .eq('trial_type', 'hbot')
      .eq('status', 'scheduled')
      .gte('scheduled_start_time', windowStart)
      .lte('scheduled_start_time', windowEnd)
      .not('phone', 'is', null);

    if (error) {
      console.error('free-session-prep query error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!trials || trials.length === 0) {
      return res.status(200).json({ success: true, considered: 0, sent: 0 });
    }

    let sent = 0;
    const results = [];

    for (const trial of trials) {
      // Safety net: verify linked appointment isn't cancelled
      if (trial.calcom_booking_uid) {
        const { data: appt } = await supabase
          .from('appointments')
          .select('status')
          .eq('id', trial.calcom_booking_uid)
          .single();
        if (appt && appt.status === 'cancelled') {
          results.push({ trialId: trial.id, skipped: 'appointment_cancelled' });
          continue;
        }
      }

      const { data: prior } = await supabase
        .from('comms_log')
        .select('id')
        .eq('message_type', 'free_session_hbot_prep')
        .eq('patient_id', trial.patient_id)
        .limit(1);

      if (prior && prior.length > 0) {
        results.push({ trialId: trial.id, skipped: 'already_sent' });
        continue;
      }

      const normalizedTo = normalizePhone(trial.phone);
      if (!normalizedTo) {
        results.push({ trialId: trial.id, skipped: 'no_phone' });
        continue;
      }

      const firstName = trial.first_name || 'there';
      const prettyWhen = formatPacific(trial.scheduled_start_time);

      const message = [
        `Hey ${firstName}, your free Hyperbaric Oxygen session is coming up on ${prettyWhen}. A few things before you come in:`,
        '',
        '• Make sure you don’t have an active cold, sinus congestion, or ear infection — you’ll need to equalize pressure, like on a plane',
        '• No flying within 24 hours before or after your session',
        '• Eat a light meal beforehand — don’t come on an empty stomach',
        '• Stay hydrated',
        '• Wear comfortable clothes (cotton preferred)',
        '',
        'See you at 1901 Westcliff Dr #10, Newport Beach!',
        '— Range Medical',
      ].join('\n');

      try {
        const smsResult = await sendSMS({ to: normalizedTo, message });
        await logComm({
          channel: 'sms',
          messageType: 'free_session_hbot_prep',
          message,
          source: 'free-session-prep-cron',
          patientId: trial.patient_id,
          patientName: firstName,
          recipient: normalizedTo,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
          direction: 'outbound',
        });
        if (smsResult.success) sent += 1;
        results.push({ trialId: trial.id, sent: smsResult.success });
      } catch (smsErr) {
        console.error('free-session-prep SMS error:', smsErr);
        results.push({ trialId: trial.id, error: smsErr.message });
      }
    }

    return res.status(200).json({ success: true, considered: trials.length, sent, results });
  } catch (err) {
    console.error('free-session-prep cron error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
