// /api/admin/new-purchases-check
// Returns recent purchases since a given timestamp for in-app notifications
// Polls from AdminLayout to show badge + toast when new website purchases arrive

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { since } = req.query;

    // Count unacknowledged purchases from today (for badge)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from('purchases')
      .select('id', { count: 'exact', head: true })
      .in('source', ['website_checkout', 'payment_link'])
      .gte('created_at', todayStart.toISOString());

    // If since is provided, return new purchases since that timestamp
    let newPurchases = [];
    let latestTimestamp = since || null;

    if (since) {
      const { data, error } = await supabase
        .from('purchases')
        .select('id, patient_name, item_name, amount, source, created_at')
        .gt('created_at', since)
        .in('source', ['website_checkout', 'payment_link'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data?.length > 0) {
        newPurchases = data;
        latestTimestamp = data[0].created_at;
      }
    } else {
      // First call — just get the latest timestamp to initialize
      const { data } = await supabase
        .from('purchases')
        .select('created_at')
        .in('source', ['website_checkout', 'payment_link'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (data?.length > 0) {
        latestTimestamp = data[0].created_at;
      } else {
        latestTimestamp = new Date().toISOString();
      }
    }

    return res.status(200).json({
      todayCount: todayCount || 0,
      newPurchases,
      latestTimestamp,
    });
  } catch (error) {
    console.error('New purchases check error:', error);
    return res.status(500).json({ error: error.message });
  }
}
