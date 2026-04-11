// /pages/api/staff-messaging/channels/[id]/read.js
// POST: Mark channel as read (update last_read_at)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../../../lib/auth';

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

  const { id: channelId } = req.query;

  try {
    const { error } = await supabase
      .from('staff_channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .eq('employee_id', employee.id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Failed to mark as read' });
  }
}
