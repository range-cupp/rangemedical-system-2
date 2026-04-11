// /pages/api/staff-messaging/channels/[id]/members.js
// GET: List channel members
// POST: Add members to channel
// DELETE: Remove a member from channel
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  const { id: channelId } = req.query;

  // Verify caller is a member
  const { data: membership } = await supabase
    .from('staff_channel_members')
    .select('id')
    .eq('channel_id', channelId)
    .eq('employee_id', employee.id)
    .maybeSingle();

  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this channel' });
  }

  if (req.method === 'GET') {
    return getMembers(req, res, channelId);
  } else if (req.method === 'POST') {
    return addMembers(req, res, channelId);
  } else if (req.method === 'DELETE') {
    return removeMember(req, res, employee, channelId);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getMembers(req, res, channelId) {
  try {
    const { data: members, error } = await supabase
      .from('staff_channel_members')
      .select('employee_id, joined_at, muted')
      .eq('channel_id', channelId);

    if (error) throw error;

    const empIds = members.map((m) => m.employee_id);
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, title, is_active')
      .in('id', empIds);

    const result = members.map((m) => {
      const emp = (employees || []).find((e) => e.id === m.employee_id);
      return {
        id: m.employee_id,
        name: emp?.name || 'Unknown',
        title: emp?.title || '',
        is_active: emp?.is_active ?? true,
        joined_at: m.joined_at,
      };
    });

    return res.status(200).json({ members: result });
  } catch (err) {
    console.error('Get members error:', err);
    return res.status(500).json({ error: 'Failed to fetch members' });
  }
}

async function addMembers(req, res, channelId) {
  try {
    const { employee_ids } = req.body;
    if (!employee_ids || !Array.isArray(employee_ids)) {
      return res.status(400).json({ error: 'employee_ids array required' });
    }

    // Verify channel is a group (can't add members to DMs)
    const { data: channel } = await supabase
      .from('staff_channels')
      .select('type')
      .eq('id', channelId)
      .single();

    if (channel?.type === 'dm') {
      return res.status(400).json({ error: 'Cannot add members to a DM' });
    }

    const rows = employee_ids.map((empId) => ({
      channel_id: channelId,
      employee_id: empId,
    }));

    const { error } = await supabase
      .from('staff_channel_members')
      .upsert(rows, { onConflict: 'channel_id,employee_id' });

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Add members error:', err);
    return res.status(500).json({ error: 'Failed to add members' });
  }
}

async function removeMember(req, res, employee, channelId) {
  try {
    const { employee_id } = req.body;
    const targetId = employee_id || employee.id; // default to self (leave)

    const { error } = await supabase
      .from('staff_channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('employee_id', targetId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Remove member error:', err);
    return res.status(500).json({ error: 'Failed to remove member' });
  }
}
