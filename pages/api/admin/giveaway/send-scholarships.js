// pages/api/admin/giveaway/send-scholarships.js
// Manual admin endpoint — sends $1,000 scholarship SMS to consented non-winners.
// Logic lives in lib/giveaway-scholarships.js (shared with the Saturday cron).
// POST body: { campaignKey?, dryRun? }

import { sendScholarshipBlast } from '../../../../lib/giveaway-scholarships';

const DEFAULT_CAMPAIGN = 'cellular_reset_2026_04';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaignKey = DEFAULT_CAMPAIGN, dryRun = false } = req.body || {};
    const result = await sendScholarshipBlast({ campaignKey, dryRun, requireWinner: false });
    return res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    console.error('send-scholarships error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
