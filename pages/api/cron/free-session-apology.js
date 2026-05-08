// pages/api/cron/free-session-apology.js
// One-time apology: sends a short sorry text to anyone who received
// multiple "you haven't booked" followup texts due to the dedup bug.
// Only sends to people who still haven't booked. Idempotent.
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

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: followups, error } = await supabase
      .from('comms_log')
      .select('recipient, patient_id, patient_name')
      .like('message_type', 'free_session_%_unbooked_followup')
      .eq('status', 'sent')
      .eq('channel', 'sms');

    if (error) {
      console.error('free-session-apology query error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!followups || followups.length === 0) {
      return res.status(200).json({ success: true, considered: 0, sent: 0 });
    }

    // Group by phone, find people who received more than one followup
    const byPhone = {};
    for (const row of followups) {
      const digits = (row.recipient || '').replace(/\D/g, '').slice(-10);
      if (!digits) continue;
      if (!byPhone[digits]) {
        byPhone[digits] = { count: 0, patientId: row.patient_id, patientName: row.patient_name, phone: row.recipient };
      }
      byPhone[digits].count++;
    }

    const duplicates = Object.values(byPhone).filter(p => p.count > 1);
    if (duplicates.length === 0) {
      return res.status(200).json({ success: true, considered: 0, sent: 0, message: 'No duplicates found' });
    }

    let sent = 0;
    let skipped = 0;
    const results = [];

    for (const dup of duplicates) {
      // Skip if apology already sent
      const phoneDigits = (dup.phone || '').replace(/\D/g, '').slice(-10);
      const { data: priorApology } = await supabase
        .from('comms_log')
        .select('id')
        .eq('message_type', 'free_session_followup_apology')
        .ilike('recipient', `%${phoneDigits}`)
        .limit(1);

      if (priorApology && priorApology.length > 0) {
        results.push({ phone: phoneDigits, skipped: 'apology_already_sent' });
        skipped++;
        continue;
      }

      // Skip if they've already booked
      if (dup.patientId) {
        const { data: booked } = await supabase
          .from('trial_passes')
          .select('id')
          .eq('patient_id', dup.patientId)
          .in('status', ['scheduled', 'used'])
          .limit(1);

        if (booked && booked.length > 0) {
          results.push({ phone: phoneDigits, skipped: 'already_booked' });
          skipped++;
          continue;
        }
      }

      const normalizedTo = normalizePhone(dup.phone);
      if (!normalizedTo) {
        results.push({ phone: phoneDigits, skipped: 'no_phone' });
        skipped++;
        continue;
      }

      const firstName = (dup.patientName || 'there').split(' ')[0];
      const message = `Hey ${firstName}, sorry about the extra texts — that was a glitch on our end. If you’d still like to try a free Hyperbaric Oxygen session, just reply here and we’ll get you scheduled.\n\n— Range Medical`;

      try {
        const smsResult = await sendSMS({ to: normalizedTo, message });
        await logComm({
          channel: 'sms',
          messageType: 'free_session_followup_apology',
          message,
          source: 'free-session-apology-cron',
          patientId: dup.patientId,
          patientName: dup.patientName,
          recipient: normalizedTo,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
          direction: 'outbound',
        });
        if (smsResult.success) sent++;
        results.push({ phone: phoneDigits, extraTexts: dup.count, sent: smsResult.success });
      } catch (smsErr) {
        console.error('free-session-apology SMS error:', smsErr);
        results.push({ phone: phoneDigits, error: smsErr.message });
      }
    }

    return res.status(200).json({ success: true, duplicatesFound: duplicates.length, sent, skipped, results });
  } catch (err) {
    console.error('free-session-apology cron error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
