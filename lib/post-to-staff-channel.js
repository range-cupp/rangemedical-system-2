// lib/post-to-staff-channel.js
// Post a system-generated message into a named staff group channel.
// Finds the channel by name (or creates it with the given member emails),
// inserts the message under the given sender, and fires push notifications
// to everyone else in the channel. Best-effort — never throws.

import { createClient } from '@supabase/supabase-js';
import { pushToEmployees } from './web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHRIS_EMAILS = ['cupp@range-medical.com', 'chris@range-medical.com'];

async function resolveEmployees(emails) {
  if (!emails?.length) return [];
  const { data, error } = await supabase
    .from('employees')
    .select('id, email, name')
    .in('email', emails);
  if (error) {
    console.error('[post-to-staff-channel] resolve emails failed:', error);
    return [];
  }
  return data || [];
}

async function resolveChrisId() {
  const rows = await resolveEmployees(CHRIS_EMAILS);
  return rows[0]?.id || null;
}

async function findOrCreateNamedChannel({ channelName, memberIds, createdBy }) {
  // Look for an existing group channel with this exact name.
  const { data: existing } = await supabase
    .from('staff_channels')
    .select('id')
    .eq('type', 'group')
    .eq('name', channelName)
    .limit(1);

  if (existing && existing.length > 0) {
    const channelId = existing[0].id;

    // Make sure all expected members are still in the channel — add any
    // who aren't (e.g., a new staff member was added after channel creation).
    const { data: currentMembers } = await supabase
      .from('staff_channel_members')
      .select('employee_id')
      .eq('channel_id', channelId);

    const currentSet = new Set((currentMembers || []).map((m) => m.employee_id));
    const missing = memberIds.filter((id) => !currentSet.has(id));
    if (missing.length > 0) {
      await supabase
        .from('staff_channel_members')
        .insert(missing.map((employee_id) => ({ channel_id: channelId, employee_id })));
    }

    return channelId;
  }

  // Create a new channel.
  const { data: channel, error: chErr } = await supabase
    .from('staff_channels')
    .insert({ name: channelName, type: 'group', created_by: createdBy })
    .select('id')
    .single();
  if (chErr || !channel) {
    console.error('[post-to-staff-channel] create channel failed:', chErr);
    return null;
  }

  await supabase
    .from('staff_channel_members')
    .insert(memberIds.map((employee_id) => ({ channel_id: channel.id, employee_id })));

  return channel.id;
}

/**
 * Post a system message into a named staff group channel.
 *
 * @param {object} opts
 * @param {string} opts.channelName       Channel name to find or create
 * @param {string[]} opts.memberEmails    Emails of staff who should be in the channel
 * @param {string} opts.content           Message body (plain text)
 * @param {object} [opts.pushPayload]     Optional override for the push title/body
 * @returns {Promise<{ ok: boolean, channelId?: string, messageId?: string, error?: string }>}
 */
export async function postToStaffChannel({ channelName, memberEmails, content, pushPayload }) {
  try {
    if (!channelName || !content) {
      return { ok: false, error: 'channelName and content are required' };
    }

    // Resolve everyone we want in the channel + the sender (Chris).
    const senderId = await resolveChrisId();
    if (!senderId) {
      console.error('[post-to-staff-channel] could not resolve Chris employee record');
      return { ok: false, error: 'sender not found' };
    }

    const memberRows = await resolveEmployees(memberEmails || []);
    const memberIds = [...new Set([senderId, ...memberRows.map((r) => r.id)])];

    const channelId = await findOrCreateNamedChannel({
      channelName,
      memberIds,
      createdBy: senderId,
    });
    if (!channelId) return { ok: false, error: 'channel resolution failed' };

    const { data: message, error: msgErr } = await supabase
      .from('staff_messages')
      .insert({
        channel_id: channelId,
        sender_id: senderId,
        content,
      })
      .select('id')
      .single();
    if (msgErr || !message) {
      console.error('[post-to-staff-channel] insert message failed:', msgErr);
      return { ok: false, error: 'message insert failed' };
    }

    // Bump channel updated_at so it floats to the top of recipients' lists.
    await supabase
      .from('staff_channels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', channelId);

    // Fire push to everyone except the sender.
    const recipientIds = memberIds.filter((id) => id !== senderId);
    if (recipientIds.length > 0) {
      const title = pushPayload?.title || `Chris in ${channelName}`;
      const body = pushPayload?.body || (content.length > 140 ? `${content.slice(0, 140)}…` : content);
      pushToEmployees(recipientIds, {
        title,
        body,
        data: {
          channel_id: channelId,
          message_id: message.id,
          sender_id: senderId,
          sender_name: 'Chris',
        },
      }).catch((err) => console.warn('[post-to-staff-channel] push failed:', err?.message || err));
    }

    return { ok: true, channelId, messageId: message.id };
  } catch (err) {
    console.error('[post-to-staff-channel] unexpected error:', err);
    return { ok: false, error: err.message || 'unknown error' };
  }
}
