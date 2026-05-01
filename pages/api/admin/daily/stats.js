// GET /api/admin/daily/stats
// Dashboard summary for /admin/daily

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
    const today = todayPacific();

    const [
      { count: totalActive },
      { count: welcomeInProgress },
      { count: totalUnsubscribed },
      { data: nextScheduled },
      { count: draftCount },
      { count: approvedCount },
      { count: sendsLast7d },
    ] = await Promise.all([
      supabase
        .from('daily_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('welcome_sequence_completed', true),
      supabase
        .from('daily_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('welcome_sequence_completed', false),
      supabase
        .from('daily_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unsubscribed'),
      supabase
        .from('daily_tips')
        .select('id, subject, scheduled_for')
        .eq('status', 'approved')
        .gte('scheduled_for', today)
        .order('scheduled_for', { ascending: true })
        .limit(1),
      supabase
        .from('daily_tips')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft'),
      supabase
        .from('daily_tips')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('scheduled_for', today),
      supabase
        .from('daily_sends')
        .select('*', { count: 'exact', head: true })
        .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return res.status(200).json({
      subscribers: {
        active_completed: totalActive || 0,
        in_welcome: welcomeInProgress || 0,
        unsubscribed: totalUnsubscribed || 0,
      },
      queue: {
        drafts: draftCount || 0,
        approved_upcoming: approvedCount || 0,
        next: nextScheduled?.[0] || null,
      },
      sends_last_7d: sendsLast7d || 0,
      today,
    });
  } catch (err) {
    console.error('[admin/daily/stats] error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function todayPacific() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
}
