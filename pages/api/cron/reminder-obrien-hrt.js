// /pages/api/cron/reminder-obrien-hrt.js
// One-shot reminder — texts Chris on May 5, 2026 at 9am PT to charge
// J O'Brien and start his HRT subscription.
// Schedule in vercel.json: "0 16 5 5 *" (16:00 UTC = 9am PDT on May 5)
// Date-gated to 2026-05-05 PT so it can't fire on May 5 of any other year
// if the cron entry isn't removed. Safe to delete this file (and its
// vercel.json entry) any time after May 5, 2026.
// Range Medical

import { sendBlooioMessage } from '../../../lib/blooio';
import { logComm } from '../../../lib/comms-log';

const CHRIS_PHONE = '+19496900339';
const FIRE_DATE_PT = '2026-05-05'; // YYYY-MM-DD in America/Los_Angeles
const MESSAGE = "Reminder: charge J O'Brien and start his HRT subscription.";

function pacificDateStr() {
  // en-CA locale yields YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

export default async function handler(req, res) {
  // Verify cron authorization (matches the rest of /api/cron/*)
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Date gate — only fire on 2026-05-05 Pacific
  const today = pacificDateStr();
  if (today !== FIRE_DATE_PT) {
    console.log(`[reminder-obrien-hrt] Skipping — today is ${today}, fire date is ${FIRE_DATE_PT}`);
    return res.status(200).json({ skipped: true, today, fireDate: FIRE_DATE_PT });
  }

  console.log(`[reminder-obrien-hrt] Sending reminder to ${CHRIS_PHONE}`);

  const result = await sendBlooioMessage({ to: CHRIS_PHONE, message: MESSAGE });

  await logComm({
    channel: 'sms',
    messageType: 'staff_reminder_obrien_hrt',
    message: MESSAGE,
    source: 'cron/reminder-obrien-hrt',
    recipient: CHRIS_PHONE,
    status: result.success ? 'sent' : 'error',
    errorMessage: result.error || null,
    twilioMessageSid: result.messageSid || null,
    provider: 'blooio',
    direction: 'outbound',
  });

  if (!result.success) {
    console.error('[reminder-obrien-hrt] Send failed:', result.error);
    return res.status(500).json({ error: result.error });
  }

  return res.status(200).json({ success: true, messageSid: result.messageSid });
}
