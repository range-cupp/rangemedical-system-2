// /pages/api/staff-messaging/dm.js
// POST: Find or create a DM channel between current user and another employee
// Range Medical

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

  const { employee_id } = req.body;

  if (!employee_id) {
    return res.status(400).json({ error: 'employee_id required' });
  }

  if (employee_id === employee.id) {
    return res.status(400).json({ error: 'Cannot DM yourself' });
  }

  try {
    // Find existing DM
    const { data: myChannels } = await supabase
      .from('staff_channel_members')
      .select('channel_id')
      .eq('employee_id', employee.id);

    if (myChannels && myChannels.length > 0) {
      const myChannelIds = myChannels.map((c) => c.channel_id);

      const { data: shared } = await supabase
        .from('staff_channel_members')
        .select('channel_id')
        .eq('employee_id', employee_id)
        .in('channel_id', myChannelIds);

      if (shared && shared.length > 0) {
        const sharedIds = shared.map((s) => s.channel_id);

        const { data: existingDm } = await supabase
          .from('staff_channels')
          .select('id')
          .eq('type', 'dm')
          .in('id', sharedIds)
          .limit(1);

        if (existingDm && existingDm.length > 0) {
          return res.status(200).json({ channel_id: existingDm[0].id, existing: true });
        }
      }
    }

    // Create new DM
    const { data: channel, error: chError } = await supabase
      .from('staff_channels')
      .insert({ type: 'dm', created_by: employee.id })
      .select()
      .single();

    if (chError) throw chError;

    const { error: memError } = await supabase
      .from('staff_channel_members')
      .insert([
        { channel_id: channel.id, employee_id: employee.id },
        { channel_id: channel.id, employee_id: employee_id },
      ]);

    if (memError) throw memError;

    return res.status(201).json({ channel_id: channel.id, existing: false });
  } catch (err) {
    console.error('DM error:', err);
    return res.status(500).json({ error: 'Failed to create DM' });
  }
}
