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

/**
 * Post a system message into an employee's personal task channel.
 * The channel has ONLY the employee as a member — Chris is the sender but is
 * not added to the channel, so other employees' task channels don't clutter
 * Chris's chat list.
 *
 * @param {object} opts
 * @param {string} opts.employeeId       UUID of the assignee
 * @param {string} opts.content          Message body
 * @param {object} [opts.pushPayload]    Optional push title/body override
 * @param {boolean} [opts.skipPush]      If true, don't fire push notification
 * @returns {Promise<{ ok: boolean, channelId?: string, messageId?: string, error?: string }>}
 */
export async function postToTaskChannel({ employeeId, content, pushPayload, skipPush }) {
  try {
    if (!employeeId || !content) {
      return { ok: false, error: 'employeeId and content are required' };
    }

    const senderId = await resolveChrisId();
    if (!senderId) return { ok: false, error: 'sender not found' };

    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id, name')
      .eq('id', employeeId)
      .single();
    if (empErr || !emp) return { ok: false, error: 'employee not found' };

    const firstName = emp.name.split(' ')[0];
    const channelName = `Tasks – ${firstName}`;

    // Find or create channel — only the assignee as a member.
    let channelId;
    const { data: existing } = await supabase
      .from('staff_channels')
      .select('id')
      .eq('type', 'group')
      .eq('name', channelName)
      .limit(1);

    if (existing?.length) {
      channelId = existing[0].id;
      // Ensure assignee is a member.
      const { data: hasMember } = await supabase
        .from('staff_channel_members')
        .select('employee_id')
        .eq('channel_id', channelId)
        .eq('employee_id', emp.id)
        .limit(1);
      if (!hasMember?.length) {
        await supabase
          .from('staff_channel_members')
          .insert({ channel_id: channelId, employee_id: emp.id });
      }
    } else {
      const { data: ch, error: chErr } = await supabase
        .from('staff_channels')
        .insert({ name: channelName, type: 'group', created_by: senderId })
        .select('id')
        .single();
      if (chErr || !ch) {
        console.error('[postToTaskChannel] create channel failed:', chErr);
        return { ok: false, error: 'channel create failed' };
      }
      channelId = ch.id;
      await supabase
        .from('staff_channel_members')
        .insert({ channel_id: channelId, employee_id: emp.id });
    }

    const { data: message, error: msgErr } = await supabase
      .from('staff_messages')
      .insert({ channel_id: channelId, sender_id: senderId, content })
      .select('id')
      .single();
    if (msgErr || !message) {
      console.error('[postToTaskChannel] insert message failed:', msgErr);
      return { ok: false, error: 'message insert failed' };
    }

    await supabase
      .from('staff_channels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', channelId);

    if (!skipPush && emp.id !== senderId) {
      const title = pushPayload?.title || 'New task';
      const body = pushPayload?.body || (content.length > 140 ? `${content.slice(0, 140)}…` : content);
      pushToEmployees([emp.id], {
        title,
        body,
        data: {
          channel_id: channelId,
          message_id: message.id,
          sender_id: senderId,
          sender_name: 'Chris',
        },
      }).catch((err) => console.warn('[postToTaskChannel] push failed:', err?.message || err));
    }

    return { ok: true, channelId, messageId: message.id };
  } catch (err) {
    console.error('[postToTaskChannel] unexpected error:', err);
    return { ok: false, error: err.message || 'unknown error' };
  }
}

async function findOrCreateDmChannel({ aId, bId }) {
  // Both members must be in the same DM channel of type='dm'.
  const { data: aMemberships } = await supabase
    .from('staff_channel_members')
    .select('channel_id')
    .eq('employee_id', aId);
  if (!aMemberships || aMemberships.length === 0) {
    // Will fall through to create
  } else {
    const channelIds = aMemberships.map((m) => m.channel_id);
    const { data: shared } = await supabase
      .from('staff_channel_members')
      .select('channel_id')
      .eq('employee_id', bId)
      .in('channel_id', channelIds);
    if (shared && shared.length > 0) {
      const sharedIds = shared.map((s) => s.channel_id);
      const { data: existing } = await supabase
        .from('staff_channels')
        .select('id')
        .eq('type', 'dm')
        .in('id', sharedIds)
        .limit(1);
      if (existing && existing.length > 0) return existing[0].id;
    }
  }

  // Create a new DM.
  const { data: channel, error: chErr } = await supabase
    .from('staff_channels')
    .insert({ name: null, type: 'dm', created_by: aId })
    .select('id')
    .single();
  if (chErr || !channel) {
    console.error('[post-to-staff-channel] create DM failed:', chErr);
    return null;
  }
  await supabase
    .from('staff_channel_members')
    .insert([
      { channel_id: channel.id, employee_id: aId },
      { channel_id: channel.id, employee_id: bId },
    ]);
  return channel.id;
}

/**
 * Post a system message into a 1:1 DM channel between Chris (sender) and
 * the named staff member (recipient). Used to replace SMS notifications
 * that were targeted at a specific staff person.
 *
 * @param {object} opts
 * @param {string} opts.recipientEmail   Employee email of the recipient
 * @param {string} opts.content          Message body (plain text)
 * @param {object} [opts.pushPayload]    Optional override for the push title/body
 * @returns {Promise<{ ok: boolean, channelId?: string, messageId?: string, error?: string }>}
 */
export async function postDmToEmployee({ recipientEmail, content, pushPayload }) {
  try {
    if (!recipientEmail || !content) {
      return { ok: false, error: 'recipientEmail and content are required' };
    }

    const senderId = await resolveChrisId();
    if (!senderId) return { ok: false, error: 'sender not found' };

    const recipientRows = await resolveEmployees([recipientEmail]);
    const recipientId = recipientRows[0]?.id;
    if (!recipientId) {
      console.error('[post-to-staff-channel] recipient not found:', recipientEmail);
      return { ok: false, error: 'recipient not found' };
    }

    // Sending a DM "to yourself" doesn't make sense — bail early.
    if (recipientId === senderId) {
      return { ok: false, error: 'recipient is the sender' };
    }

    const channelId = await findOrCreateDmChannel({ aId: senderId, bId: recipientId });
    if (!channelId) return { ok: false, error: 'dm channel resolution failed' };

    const { data: message, error: msgErr } = await supabase
      .from('staff_messages')
      .insert({ channel_id: channelId, sender_id: senderId, content })
      .select('id')
      .single();
    if (msgErr || !message) {
      console.error('[post-to-staff-channel] DM insert failed:', msgErr);
      return { ok: false, error: 'message insert failed' };
    }

    await supabase
      .from('staff_channels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', channelId);

    const title = pushPayload?.title || 'Chris';
    const body = pushPayload?.body || (content.length > 140 ? `${content.slice(0, 140)}…` : content);
    pushToEmployees([recipientId], {
      title,
      body,
      data: {
        channel_id: channelId,
        message_id: message.id,
        sender_id: senderId,
        sender_name: 'Chris',
      },
    }).catch((err) => console.warn('[post-to-staff-channel] DM push failed:', err?.message || err));

    return { ok: true, channelId, messageId: message.id };
  } catch (err) {
    console.error('[post-to-staff-channel] DM unexpected error:', err);
    return { ok: false, error: err.message || 'unknown error' };
  }
}
