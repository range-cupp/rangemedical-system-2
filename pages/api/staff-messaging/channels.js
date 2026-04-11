// /pages/api/staff-messaging/channels.js
// List channels for current employee (GET) or create a new channel (POST)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const employee = await requireAuth(req, res);
  if (!employee) return;

  if (req.method === 'GET') {
    return getChannels(req, res, employee);
  } else if (req.method === 'POST') {
    return createChannel(req, res, employee);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getChannels(req, res, employee) {
  try {
    // Get all channel IDs this employee belongs to
    const { data: memberships, error: memError } = await supabase
      .from('staff_channel_members')
      .select('channel_id, last_read_at, muted')
      .eq('employee_id', employee.id);

    if (memError) throw memError;
    if (!memberships || memberships.length === 0) {
      return res.status(200).json({ channels: [] });
    }

    const channelIds = memberships.map((m) => m.channel_id);

    // Get channel details
    const { data: channels, error: chError } = await supabase
      .from('staff_channels')
      .select('*')
      .in('id', channelIds);

    if (chError) throw chError;

    // Get all members for these channels
    const { data: allMembers, error: allMemError } = await supabase
      .from('staff_channel_members')
      .select('channel_id, employee_id')
      .in('channel_id', channelIds);

    if (allMemError) throw allMemError;

    // Get employee details for all members
    const memberIds = [...new Set(allMembers.map((m) => m.employee_id))];
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, title')
      .in('id', memberIds);

    if (empError) throw empError;

    const empMap = {};
    employees.forEach((e) => { empMap[e.id] = e; });

    // Get the last message for each channel
    const lastMessages = {};
    for (const chId of channelIds) {
      const { data: msgs } = await supabase
        .from('staff_messages')
        .select('id, content, sender_id, created_at, attachment_name')
        .eq('channel_id', chId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (msgs && msgs.length > 0) {
        const msg = msgs[0];
        const sender = empMap[msg.sender_id];
        lastMessages[chId] = {
          content: msg.attachment_name && !msg.content
            ? `Sent ${msg.attachment_name}`
            : msg.content,
          sender_name: sender?.name || 'Unknown',
          created_at: msg.created_at,
        };
      }
    }

    // Build unread counts
    const unreadCounts = {};
    for (const mem of memberships) {
      const { count, error: countError } = await supabase
        .from('staff_messages')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', mem.channel_id)
        .is('deleted_at', null)
        .neq('sender_id', employee.id)
        .gt('created_at', mem.last_read_at);

      if (!countError) {
        unreadCounts[mem.channel_id] = count || 0;
      }
    }

    // Build response
    const result = channels.map((ch) => {
      const members = allMembers
        .filter((m) => m.channel_id === ch.id)
        .map((m) => empMap[m.employee_id])
        .filter(Boolean);

      const membership = memberships.find((m) => m.channel_id === ch.id);

      return {
        id: ch.id,
        name: ch.name,
        type: ch.type,
        members,
        last_message: lastMessages[ch.id] || null,
        unread_count: unreadCounts[ch.id] || 0,
        muted: membership?.muted || false,
        created_at: ch.created_at,
      };
    });

    // Sort by last message time (most recent first), channels with no messages last
    result.sort((a, b) => {
      const aTime = a.last_message?.created_at || a.created_at;
      const bTime = b.last_message?.created_at || b.created_at;
      return new Date(bTime) - new Date(aTime);
    });

    return res.status(200).json({ channels: result });
  } catch (err) {
    console.error('Get channels error:', err);
    return res.status(500).json({ error: 'Failed to fetch channels' });
  }
}

async function createChannel(req, res, employee) {
  try {
    const { member_ids, name } = req.body;

    if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
      return res.status(400).json({ error: 'member_ids required' });
    }

    // Always include the creator
    const allMemberIds = [...new Set([employee.id, ...member_ids])];
    const isGroup = allMemberIds.length > 2 || !!name;
    const type = isGroup ? 'group' : 'dm';

    // For DMs, check if one already exists between these two people
    if (type === 'dm' && allMemberIds.length === 2) {
      const otherId = allMemberIds.find((id) => id !== employee.id);

      // Find channels where both are members and type is dm
      const { data: myChannels } = await supabase
        .from('staff_channel_members')
        .select('channel_id')
        .eq('employee_id', employee.id);

      if (myChannels && myChannels.length > 0) {
        const myChannelIds = myChannels.map((c) => c.channel_id);

        const { data: shared } = await supabase
          .from('staff_channel_members')
          .select('channel_id')
          .eq('employee_id', otherId)
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
    }

    // Create channel
    const { data: channel, error: chError } = await supabase
      .from('staff_channels')
      .insert({
        name: name || null,
        type,
        created_by: employee.id,
      })
      .select()
      .single();

    if (chError) throw chError;

    // Add members
    const memberRows = allMemberIds.map((empId) => ({
      channel_id: channel.id,
      employee_id: empId,
    }));

    const { error: memError } = await supabase
      .from('staff_channel_members')
      .insert(memberRows);

    if (memError) throw memError;

    return res.status(201).json({ channel_id: channel.id, existing: false });
  } catch (err) {
    console.error('Create channel error:', err);
    return res.status(500).json({ error: 'Failed to create channel' });
  }
}
