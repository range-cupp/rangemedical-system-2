// /pages/api/twilio/status-callback.js
// Receives delivery status updates from Twilio for outbound SMS
// Updates comms_log with actual delivery status (delivered, undelivered, failed)
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');
  }

  try {
    const {
      MessageSid,       // Twilio message ID
      MessageStatus,    // queued, sent, delivered, undelivered, failed
      To,               // recipient phone
      From,             // sender (our Twilio number)
      ErrorCode,        // Twilio error code if failed
      ErrorMessage,     // Error description
    } = req.body;

    console.log(`Twilio status update: ${MessageSid} → ${MessageStatus}${ErrorCode ? ` (${ErrorCode}: ${ErrorMessage})` : ''}`);

    if (!MessageSid) {
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send('<Response></Response>');
    }

    // Map Twilio statuses to our comms_log statuses
    const statusMap = {
      queued: 'queued',
      sending: 'sending',
      sent: 'sent',
      delivered: 'delivered',
      undelivered: 'undelivered',
      failed: 'error',
    };

    const mappedStatus = statusMap[MessageStatus] || MessageStatus;

    // Update the comms_log entry with actual delivery status
    const updateData = {
      status: mappedStatus,
    };

    if (ErrorCode || ErrorMessage) {
      updateData.error_message = `${ErrorCode || ''}: ${ErrorMessage || 'Unknown error'}`.trim();
    }

    // Find and update the comms_log entry by twilio_message_sid
    const { data: updated, error: updateError } = await supabase
      .from('comms_log')
      .update(updateData)
      .eq('twilio_message_sid', MessageSid)
      .select('id, patient_name, status')
      .maybeSingle();

    if (updateError) {
      console.error('Status callback update error:', updateError.message);
    } else if (updated) {
      console.log(`Updated comms_log ${updated.id} for ${updated.patient_name}: ${mappedStatus}`);
    } else {
      // Message SID not found — could be from GHL fallback or old message
      console.log(`No comms_log entry found for MessageSid: ${MessageSid}`);
    }

    // If delivery failed, log details for debugging
    if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      console.error(`SMS delivery failure: ${MessageSid} to ${To} — ${ErrorCode}: ${ErrorMessage}`);
    }

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');

  } catch (error) {
    console.error('Status callback error:', error);
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<Response></Response>');
  }
}
