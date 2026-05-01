// POST /api/daily/resubscribe
// Called by the unsubscribe confirmation page when a user clicks the
// "wait, put me back" button. Reverses the unsubscribe action:
//   - daily_subscribers: status='active', clear unsubscribed_at
//   - daily_unsubscribes: remove the suppression row for this email

import { createClient } from '@supabase/supabase-js';
import { verifyUnsubscribeToken } from '../../../lib/daily-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = (req.body?.token || '').toString().trim();
  const subscriberId = verifyUnsubscribeToken(token);
  if (!subscriberId) {
    return res.status(400).json({ error: 'Invalid or expired link.' });
  }

  try {
    const { data: sub } = await supabase
      .from('daily_subscribers')
      .select('id, email')
      .eq('id', subscriberId)
      .maybeSingle();

    if (!sub) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    await supabase
      .from('daily_subscribers')
      .update({
        status: 'active',
        unsubscribed_at: null,
      })
      .eq('id', subscriberId);

    // Clear suppression so future cron sends will hit them again.
    await supabase.from('daily_unsubscribes').delete().eq('email', sub.email);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[daily/resubscribe] error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
