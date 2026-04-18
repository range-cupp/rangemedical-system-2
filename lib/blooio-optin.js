// lib/blooio-optin.js
// Blooio two-step opt-in utilities
// First outbound Blooio message cannot contain links — patient must reply first
// Once they reply once, it's a permanent unlock for that phone number
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if a phone number has ever replied via Blooio (opted in).
 * Queries comms_log for any inbound message from this phone with provider = 'blooio'.
 * Once true, all future messages can include links.
 *
 * @param {string} phone - Phone number (any format — last 10 digits are matched)
 * @returns {Promise<boolean>} true if patient has ever replied via Blooio
 */
export async function hasBlooioOptIn(phone) {
  if (!phone) return false;

  const normalizedFrom = phone.replace(/\D/g, '').slice(-10);
  if (normalizedFrom.length < 10) return false;

  const { data, error } = await supabase
    .from('comms_log')
    .select('id')
    .eq('direction', 'inbound')
    .eq('provider', 'blooio')
    .ilike('recipient', `%${normalizedFrom}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('hasBlooioOptIn error:', error.message);
    return false; // Default to false (will trigger two-step, safer)
  }

  return !!data;
}

/**
 * Queue a link-containing message for later delivery after patient replies.
 *
 * @param {Object} opts
 * @param {string}  opts.phone          - E.164 phone number
 * @param {string}  opts.message        - Full message with links to send later
 * @param {string}  opts.messageType    - 'form_links' or 'guide_links'
 * @param {string}  [opts.patientId]    - Patient UUID
 * @param {string}  [opts.patientName]  - Patient display name
 * @param {string}  [opts.formBundleId] - Form bundle UUID (for form_links)
 * @returns {Promise<{ id: string } | null>}
 */
export async function queuePendingLinkMessage({ phone, message, messageType, patientId, patientName, formBundleId }) {
  // Expire any existing pending message of the same type for this phone — newest wins.
  // Without this, two calls before the patient replies produce two sends when they reply YES.
  if (phone && messageType) {
    const normalizedFrom = phone.replace(/\D/g, '').slice(-10);
    if (normalizedFrom.length === 10) {
      const { data: expired, error: expireError } = await supabase
        .from('pending_link_messages')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .eq('message_type', messageType)
        .ilike('phone', `%${normalizedFrom}`)
        .select('id');

      if (expireError) {
        console.error('queuePendingLinkMessage expire-existing error:', expireError.message);
      } else if (expired && expired.length > 0) {
        console.log(`Expired ${expired.length} existing pending ${messageType} message(s) for ${normalizedFrom} before re-queuing`);
      }
    }
  }

  const { data, error } = await supabase
    .from('pending_link_messages')
    .insert({
      phone,
      message,
      message_type: messageType || null,
      patient_id: patientId || null,
      patient_name: patientName || null,
      form_bundle_id: formBundleId || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('queuePendingLinkMessage error:', error.message);
    return null;
  }

  console.log(`Queued pending link message ${data.id} for ${phone} (${messageType})`);
  return data;
}

/**
 * Get all pending (non-expired) messages for a phone number.
 * Used by the Blooio webhook to auto-send when patient replies.
 *
 * @param {string} phone - Phone number (any format — last 10 digits matched)
 * @returns {Promise<Array>}
 */
export async function getPendingMessages(phone) {
  if (!phone) return [];

  const normalizedFrom = phone.replace(/\D/g, '').slice(-10);
  if (normalizedFrom.length < 10) return [];

  const { data, error } = await supabase
    .from('pending_link_messages')
    .select('*')
    .eq('status', 'pending')
    .ilike('phone', `%${normalizedFrom}`)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getPendingMessages error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Mark a pending message as sent after auto-delivery.
 *
 * @param {string} id - pending_link_messages UUID
 */
export async function markPendingMessageSent(id) {
  const { error } = await supabase
    .from('pending_link_messages')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('markPendingMessageSent error:', error.message);
  }
}

/**
 * Check if the current SMS provider is Blooio-based.
 * Returns true for 'blooio' or 'blooio_with_fallback'.
 *
 * @returns {boolean}
 */
export function isBlooioProvider() {
  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase().trim();
  return provider === 'blooio' || provider === 'blooio_with_fallback';
}
