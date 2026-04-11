// /pages/api/staff-messaging/channels/[id]/messages.js
// GET: Paginated message history for a channel
// POST: Send a new message to a channel
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

  // Verify membership
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
    return getMessages(req, res, channelId);
  } else if (req.method === 'POST') {
    return sendMessage(req, res, employee, channelId);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getMessages(req, res, channelId) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // cursor: created_at of oldest loaded message

    let query = supabase
      .from('staff_messages')
      .select('*')
      .eq('channel_id', channelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    // Get sender details
    const senderIds = [...new Set(messages.map((m) => m.sender_id))];
    const { data: senders } = await supabase
      .from('employees')
      .select('id, name, title')
      .in('id', senderIds);

    const senderMap = {};
    (senders || []).forEach((s) => { senderMap[s.id] = s; });

    const result = messages.map((m) => ({
      ...m,
      sender: senderMap[m.sender_id] || { id: m.sender_id, name: 'Unknown' },
    }));

    // Return in chronological order
    result.reverse();

    return res.status(200).json({
      messages: result,
      has_more: messages.length === limit,
    });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

async function sendMessage(req, res, employee, channelId) {
  try {
    const { content, attachment_url, attachment_name, attachment_type } = req.body;

    if (!content && !attachment_url) {
      return res.status(400).json({ error: 'Message content or attachment required' });
    }

    const { data: message, error } = await supabase
      .from('staff_messages')
      .insert({
        channel_id: channelId,
        sender_id: employee.id,
        content: content || null,
        attachment_url: attachment_url || null,
        attachment_name: attachment_name || null,
        attachment_type: attachment_type || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update channel updated_at
    await supabase
      .from('staff_channels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', channelId);

    // Update sender's last_read_at to now
    await supabase
      .from('staff_channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .eq('employee_id', employee.id);

    return res.status(201).json({
      message: {
        ...message,
        sender: { id: employee.id, name: employee.name, title: employee.title },
      },
    });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
