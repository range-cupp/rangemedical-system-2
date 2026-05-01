// GET /api/admin/daily/unsubscribes
// Permanent suppression list.

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);
    const { data, error, count } = await supabase
      .from('daily_unsubscribes')
      .select('id, email, unsubscribed_at, reason', { count: 'exact' })
      .order('unsubscribed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return res.status(200).json({ unsubscribes: data || [], total: count || 0 });
  } catch (err) {
    console.error('[admin/daily/unsubscribes] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
