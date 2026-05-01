// GET /api/admin/daily/sends
// Returns recent sends. ?limit=N&type=tip|welcome|all

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
    const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
    const type = (req.query.type || 'all').toString();

    let q = supabase
      .from('daily_sends')
      .select(`
        id, sent_at, welcome_sequence_step, resend_message_id, opened_at, clicked_at, bounced, complained,
        subscriber:daily_subscribers(id, email),
        tip:daily_tips(id, subject)
      `)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (type === 'tip') q = q.is('welcome_sequence_step', null).not('tip_id', 'is', null);
    else if (type === 'welcome') q = q.not('welcome_sequence_step', 'is', null);

    const { data, error } = await q;
    if (error) throw error;

    return res.status(200).json({ sends: data || [] });
  } catch (err) {
    console.error('[admin/daily/sends] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
