// pages/api/admin/giveaway/list.js
// Returns all giveaway entries for a campaign, newest first, with summary stats.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_CAMPAIGN = 'cellular_reset_2026_04';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const campaignKey = req.query.campaignKey || DEFAULT_CAMPAIGN;

    const { data: entries, error } = await supabase
      .from('giveaway_entries')
      .select('*')
      .eq('campaign_key', campaignKey)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('giveaway list error:', error);
      return res.status(500).json({ error: error.message });
    }

    const stats = {
      total: entries.length,
      green: entries.filter((e) => e.lead_tier === 'green').length,
      yellow: entries.filter((e) => e.lead_tier === 'yellow').length,
      red: entries.filter((e) => e.lead_tier === 'red').length,
      winner: entries.find((e) => e.is_winner) || null,
      scholarshipsOffered: entries.filter((e) => e.scholarship_offered_at).length,
      scholarshipsInterested: entries.filter((e) => e.status === 'scholarship_interested').length,
    };

    return res.status(200).json({ entries, stats, campaignKey });
  } catch (err) {
    console.error('giveaway list exception:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
