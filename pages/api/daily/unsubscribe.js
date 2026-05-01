// /api/daily/unsubscribe
// Single endpoint serving both the user-clicked link and Gmail's
// List-Unsubscribe-Post one-click.
//
// GET  ?token=xxx  → verify, unsubscribe, 302 redirect to /daily/unsubscribe?ok=1&t=token
// POST ?token=xxx  → verify, unsubscribe, 200 (no body needed)
// Invalid token    → 302 to /daily/unsubscribe?invalid=1 (GET) or 400 (POST)

import { createClient } from '@supabase/supabase-js';
import { verifyUnsubscribeToken } from '../../../lib/daily-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function unsubscribeBySubscriberId(subscriberId) {
  // Get current subscriber email + status (idempotent: don't double-insert into suppression list)
  const { data: sub } = await supabase
    .from('daily_subscribers')
    .select('id, email, status')
    .eq('id', subscriberId)
    .maybeSingle();

  if (!sub) return { ok: false, reason: 'subscriber_not_found' };

  // Mark subscriber row as unsubscribed
  await supabase
    .from('daily_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', subscriberId);

  // Add to permanent suppression list if not already there
  const { data: existingSuppression } = await supabase
    .from('daily_unsubscribes')
    .select('id')
    .eq('email', sub.email)
    .maybeSingle();

  if (!existingSuppression) {
    await supabase.from('daily_unsubscribes').insert({
      email: sub.email,
      reason: 'user_clicked_link',
    });
  }

  return { ok: true };
}

export default async function handler(req, res) {
  const method = req.method;
  if (method !== 'GET' && method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = (req.query?.token || '').toString().trim();
  const subscriberId = verifyUnsubscribeToken(token);

  if (!subscriberId) {
    if (method === 'GET') {
      return res.redirect(302, '/daily/unsubscribe?invalid=1');
    }
    return res.status(400).json({ error: 'Invalid or expired link.' });
  }

  try {
    const result = await unsubscribeBySubscriberId(subscriberId);

    if (!result.ok) {
      if (method === 'GET') {
        return res.redirect(302, '/daily/unsubscribe?invalid=1');
      }
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    if (method === 'GET') {
      return res.redirect(302, `/daily/unsubscribe?ok=1&t=${encodeURIComponent(token)}`);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[daily/unsubscribe] error:', err);
    if (method === 'GET') {
      return res.redirect(302, '/daily/unsubscribe?error=1');
    }
    return res.status(500).json({ error: 'Internal error' });
  }
}
