// /pages/api/push/subscribe.js
// Save or refresh a Web Push subscription for the current employee.

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { subscription } = req.body || {};
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription payload' });
  }

  const userAgent = req.headers['user-agent'] || null;

  try {
    // Upsert by endpoint — same device re-subscribing should overwrite, not duplicate.
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        employee_id: employee.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent,
        last_used_at: new Date().toISOString(),
        failure_count: 0,
      }, { onConflict: 'endpoint' });

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    return res.status(500).json({ error: 'Failed to save subscription' });
  }
}
