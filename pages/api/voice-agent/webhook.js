// /pages/api/voice-agent/webhook.js
// Receives post-call webhooks from Retell after each voice conversation ends.
// Extracts caller info, creates a follow-up task, and posts a notification
// to the internal staff chat for Tara, Damon, and Chris.

import { createClient } from '@supabase/supabase-js';
import { pushToEmployees } from '../../../lib/web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NOTIFY_USERNAMES = ['tara', 'damon', 'chris'];
const CHANNEL_NAME = 'Voice Agent Leads';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event, call } = req.body;

  if (event !== 'call_ended' && event !== 'call_analyzed') {
    return res.status(200).json({ ok: true });
  }

  try {
    const analysis = call?.call_analysis || {};
    const callerName = analysis.caller_name || null;
    const callerPhone = analysis.caller_phone || null;
    const serviceInterest = analysis.service_interest || null;
    const wantsCallback = analysis.wants_callback || false;
    const appointmentBooked = analysis.appointment_booked || false;
    const callDuration = call?.end_timestamp && call?.start_timestamp
      ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
      : null;

    if (appointmentBooked) {
      return res.status(200).json({ ok: true, action: 'appointment_already_booked' });
    }

    if (!callerName && !callerPhone && !wantsCallback) {
      return res.status(200).json({ ok: true, action: 'no_actionable_data' });
    }

    const parts = [];
    if (callerName) parts.push(`Caller: ${callerName}`);
    if (callerPhone) parts.push(`Phone: ${callerPhone}`);
    if (serviceInterest) parts.push(`Interested in: ${serviceInterest}`);
    if (wantsCallback) parts.push('Wants a callback');
    if (callDuration) parts.push(`Call duration: ${callDuration}s`);

    const taskTitle = callerName
      ? `Voice agent lead — ${callerName}${serviceInterest ? ` (${serviceInterest})` : ''}`
      : `Voice agent lead — follow up${serviceInterest ? ` (${serviceInterest})` : ''}`;

    const taskBody = parts.join('\n');

    // Create a follow-up task
    const { error: taskError } = await supabase.from('tasks').insert({
      title: taskTitle,
      body: taskBody,
      priority: wantsCallback ? 'high' : 'normal',
      status: 'pending',
      assigned_by: 'voice_agent',
      created_at: new Date().toISOString(),
    });

    if (taskError) {
      console.error('Failed to create voice agent task:', taskError);
    }

    // Post to staff chat + push notifications
    await notifyStaffChat(parts, wantsCallback).catch((e) => {
      console.error('Failed to notify staff chat:', e);
    });

    return res.status(200).json({ ok: true, action: 'task_created', taskTitle });
  } catch (err) {
    console.error('Voice agent webhook error:', err);
    return res.status(200).json({ ok: true });
  }
}

async function notifyStaffChat(parts, wantsCallback) {
  // Look up employee IDs
  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, username')
    .in('username', NOTIFY_USERNAMES);

  if (!employees || employees.length === 0) {
    console.error('No employees found for voice agent notifications');
    return;
  }

  const employeeIds = employees.map((e) => e.id);

  // Find existing "Voice Agent Leads" channel or create one
  const channelId = await findOrCreateChannel(employeeIds);
  if (!channelId) return;

  // Use the first employee as the "sender" (system-posted, but needs a sender_id)
  const systemSender = employees.find((e) => e.username === 'chris') || employees[0];

  const priority = wantsCallback ? '🔴 ' : '';
  const message = `${priority}🎙️ Voice Agent Lead\n${parts.join('\n')}`;

  const { data: msg, error: msgError } = await supabase
    .from('staff_messages')
    .insert({
      channel_id: channelId,
      sender_id: systemSender.id,
      content: message,
    })
    .select()
    .single();

  if (msgError) {
    console.error('Failed to insert staff chat message:', msgError);
    return;
  }

  // Update channel timestamp
  await supabase
    .from('staff_channels')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', channelId);

  // Push notifications to all members
  await pushToEmployees(employeeIds, {
    title: '🎙️ Voice Agent Lead',
    body: parts.slice(0, 2).join(' · '),
    data: { channel_id: channelId, message_id: msg.id },
  });
}

async function findOrCreateChannel(employeeIds) {
  // Look for an existing group channel named "Voice Agent Leads"
  const { data: channels } = await supabase
    .from('staff_channels')
    .select('id')
    .eq('name', CHANNEL_NAME)
    .eq('type', 'group')
    .limit(1);

  if (channels && channels.length > 0) {
    return channels[0].id;
  }

  // Create the channel
  const { data: channel, error: chError } = await supabase
    .from('staff_channels')
    .insert({
      name: CHANNEL_NAME,
      type: 'group',
      created_by: employeeIds[0],
    })
    .select()
    .single();

  if (chError) {
    console.error('Failed to create Voice Agent Leads channel:', chError);
    return null;
  }

  // Add all members
  const memberRows = employeeIds.map((id) => ({
    channel_id: channel.id,
    employee_id: id,
  }));

  const { error: memError } = await supabase
    .from('staff_channel_members')
    .insert(memberRows);

  if (memError) {
    console.error('Failed to add channel members:', memError);
  }

  return channel.id;
}
