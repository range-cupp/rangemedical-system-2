// /pages/api/staff-messaging/unread-count.js
// GET: Total unread message count across all channels for badge display
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employee = await requireAuth(req, res);
  if (!employee) return;

  try {
    // Get all channel memberships with last_read_at
    const { data: memberships, error: memError } = await supabase
      .from('staff_channel_members')
      .select('channel_id, last_read_at, muted')
      .eq('employee_id', employee.id);

    if (memError) throw memError;
    if (!memberships || memberships.length === 0) {
      return res.status(200).json({ unread: 0 });
    }

    let total = 0;
    for (const mem of memberships) {
      if (mem.muted) continue;

      const { count, error } = await supabase
        .from('staff_messages')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', mem.channel_id)
        .is('deleted_at', null)
        .neq('sender_id', employee.id)
        .gt('created_at', mem.last_read_at);

      if (!error) {
        total += count || 0;
      }
    }

    return res.status(200).json({ unread: total });
  } catch (err) {
    console.error('Unread count error:', err);
    return res.status(500).json({ error: 'Failed to get unread count' });
  }
}
