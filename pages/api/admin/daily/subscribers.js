// GET /api/admin/daily/subscribers
// Query: ?status=active|unsubscribed|all  ?search=email-fragment  ?limit=N

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
    const status = (req.query.status || 'all').toString();
    const search = (req.query.search || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);

    let q = supabase
      .from('daily_subscribers')
      .select('id, email, source, status, welcome_sequence_started_at, welcome_sequence_completed, last_sent_at, subscribed_at, unsubscribed_at, metadata', { count: 'exact' })
      .order('subscribed_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') q = q.eq('status', status);
    if (search) q = q.ilike('email', `%${search}%`);

    const { data, count, error } = await q;
    if (error) throw error;

    return res.status(200).json({ subscribers: data || [], total: count || 0 });
  } catch (err) {
    console.error('[admin/daily/subscribers] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
