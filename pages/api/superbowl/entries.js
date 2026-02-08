// /pages/api/superbowl/entries.js
// Super Bowl LX Giveaway - View Entries (Admin Only)
// Range Medical - 2026-02-08

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'range-superbowl-2026';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const providedSecret = req.headers['x-admin-secret'];
  if (providedSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: entries, error } = await supabase
      .from('superbowl_giveaway_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch entries' });
    }

    // Calculate stats
    const stats = {
      total_entries: entries.length,
      patriots_picks: entries.filter(e => e.team_pick === 'patriots').length,
      seahawks_picks: entries.filter(e => e.team_pick === 'seahawks').length,
      winners: entries.filter(e => e.is_winner).length,
      by_source: {}
    };

    // Group by source
    entries.forEach(e => {
      const src = e.utm_source || 'unknown';
      stats.by_source[src] = (stats.by_source[src] || 0) + 1;
    });

    // Health interests breakdown
    const interestCounts = {};
    entries.forEach(e => {
      (e.health_interests || []).forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
    });
    stats.health_interests = interestCounts;

    // Referral stats
    stats.entries_with_referrer = entries.filter(e => e.referred_by).length;
    stats.entries_without_referrer = entries.filter(e => !e.referred_by).length;

    return res.status(200).json({
      success: true,
      stats,
      entries
    });

  } catch (error) {
    console.error('Entries error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
