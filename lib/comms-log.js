// lib/comms-log.js
// Shared helper to log all automated communications (SMS + email) to comms_log table
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Log an automated communication to the comms_log table.
 *
 * @param {Object} opts
 * @param {string}  opts.channel            - 'sms' or 'email'
 * @param {string}  opts.messageType        - e.g. 'peptide_followup', 'drip_email_1', 'wl_checkin'
 * @param {string}  opts.message            - message body / email HTML
 * @param {string}  opts.source             - file that sent it, e.g. 'peptide-reminders'
 * @param {string} [opts.patientId]         - patient UUID
 * @param {string} [opts.protocolId]        - protocol UUID
 * @param {string} [opts.ghlContactId]      - GHL contact ID
 * @param {string} [opts.patientName]       - patient display name
 * @param {string} [opts.recipient]         - email address or phone number
 * @param {string} [opts.subject]           - email subject line (null for SMS)
 * @param {string} [opts.status]            - 'sent' or 'error' (default: 'sent')
 * @param {string} [opts.errorMessage]      - error details if status is 'error'
 * @param {string} [opts.twilioMessageSid]  - Twilio/Blooio message ID for delivery tracking
 * @param {string} [opts.direction]         - 'inbound' or 'outbound' (default: 'outbound')
 * @param {string} [opts.provider]          - 'twilio' or 'blooio' (default: 'twilio')
 */
export async function logComm({
  channel,
  messageType,
  message,
  source,
  patientId = null,
  protocolId = null,
  ghlContactId = null,
  patientName = null,
  recipient = null,
  subject = null,
  status = 'sent',
  errorMessage = null,
  twilioMessageSid = null,
  direction = 'outbound',
  provider = null,
}) {
  try {
    const row = {
      patient_id: patientId,
      protocol_id: protocolId,
      ghl_contact_id: ghlContactId,
      patient_name: patientName,
      channel,
      message_type: messageType,
      recipient,
      subject,
      message,
      status,
      error_message: errorMessage,
      source,
      direction,
    };

    // Only include twilio_message_sid if provided (column may not exist yet)
    if (twilioMessageSid) {
      row.twilio_message_sid = twilioMessageSid;
    }

    // Only include provider if provided (column may not exist yet)
    if (provider) {
      row.provider = provider;
    }

    const { error } = await supabase.from('comms_log').insert(row);

    if (error) {
      // If a column doesn't exist yet, retry without it
      if (error.message && (error.message.includes('twilio_message_sid') || error.message.includes('provider'))) {
        delete row.twilio_message_sid;
        delete row.provider;
        const { error: retryErr } = await supabase.from('comms_log').insert(row);
        if (retryErr) console.error('comms_log insert error (retry):', retryErr.message);
      } else {
        console.error('comms_log insert error:', error.message);
      }
    }
  } catch (err) {
    // Non-fatal — never break the sender
    console.error('comms_log error:', err.message);
  }
}
