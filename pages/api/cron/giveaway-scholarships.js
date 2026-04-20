// /pages/api/cron/giveaway-scholarships.js
// Scheduled scholarship blast for the 6-Week Cellular Energy Reset giveaway.
// Fires Saturday, April 25, 2026 at 11 AM PT (18:00 UTC) — one hour after the 10 AM winner pick.
// Cron schedule: "0 18 25 4 *" in vercel.json
// Range Medical

import { Resend } from 'resend';
import { sendScholarshipBlast } from '../../../lib/giveaway-scholarships';

const resend = new Resend(process.env.RESEND_API_KEY);
const CAMPAIGN_KEY = 'cellular_reset_2026_04';

export default async function handler(req, res) {
  // Auth: Vercel cron or CRON_SECRET
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

  try {
    const result = await sendScholarshipBlast({
      campaignKey: CAMPAIGN_KEY,
      requireWinner: true,
    });

    // Always notify staff — success, no-op, or failure modes all matter
    try {
      const subject = !result.success
        ? `⚠️ Giveaway cron blocked: ${result.error}`
        : result.sent === 0
          ? `Giveaway cron: no scholarships to send (${result.totalEligible} eligible)`
          : `Giveaway cron: sent ${result.sent} scholarship${result.sent === 1 ? '' : 's'}`;

      const body = `
        <p><strong>Campaign:</strong> ${CAMPAIGN_KEY}</p>
        <p><strong>Winner:</strong> ${result.winner ? `${result.winner.name} (${result.winner.phone})` : 'not picked yet'}</p>
        <p><strong>Total eligible:</strong> ${result.totalEligible ?? 0}</p>
        <p><strong>Sent:</strong> ${result.sent ?? 0}</p>
        <p><strong>Failed:</strong> ${result.failed ?? 0}</p>
        <p><strong>Skipped (bad phone):</strong> ${result.skipped ?? 0}</p>
        ${result.error ? `<p style="color:#DC2626;"><strong>Error:</strong> ${result.error}</p>` : ''}
        ${result.failures?.length ? `<p><strong>Failures:</strong><br>${result.failures.map(f => `${f.phone}: ${f.error}`).join('<br>')}</p>` : ''}
      `;

      await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: ['chris@range-medical.com', 'damon@range-medical.com'],
        subject,
        html: body,
      });
    } catch (emailErr) {
      console.error('Cron staff notification email error:', emailErr);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('giveaway-scholarships cron error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
