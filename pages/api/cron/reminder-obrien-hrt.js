// /pages/api/cron/reminder-obrien-hrt.js
// One-shot reminder — pings Chris in chat on May 5, 2026 at 9am PT to
// charge J O'Brien and start his HRT subscription.
// Schedule in vercel.json: "0 16 5 5 *" (16:00 UTC = 9am PDT on May 5)
// Date-gated to 2026-05-05 PT so it can't fire on May 5 of any other year
// if the cron entry isn't removed. Safe to delete this file (and its
// vercel.json entry) any time after May 5, 2026.
// Range Medical

import { postDmToEmployee } from '../../../lib/post-to-staff-channel';

const FIRE_DATE_PT = '2026-05-05'; // YYYY-MM-DD in America/Los_Angeles
const MESSAGE = "Reminder: charge J O'Brien and start his HRT subscription.";

function pacificDateStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

export default async function handler(req, res) {
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

  const today = pacificDateStr();
  if (today !== FIRE_DATE_PT) {
    console.log(`[reminder-obrien-hrt] Skipping — today is ${today}, fire date is ${FIRE_DATE_PT}`);
    return res.status(200).json({ skipped: true, today, fireDate: FIRE_DATE_PT });
  }

  // Self-DM: post-to-staff-channel sends from Chris and refuses recipient===sender.
  // Use the chat group instead so it's still visible.
  const result = await postDmToEmployee({
    recipientEmail: 'damon@range-medical.com',
    content: MESSAGE,
  });

  if (!result?.ok) {
    console.error('[reminder-obrien-hrt] Send failed:', result?.error);
    return res.status(500).json({ error: result?.error });
  }
  return res.status(200).json({ success: true });
}
