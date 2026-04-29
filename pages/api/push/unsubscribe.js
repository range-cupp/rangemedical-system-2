// /pages/api/push/unsubscribe.js
// Remove a Web Push subscription (called when user disables notifications).

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

  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });

  try {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('employee_id', employee.id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    return res.status(500).json({ error: 'Failed to remove subscription' });
  }
}
