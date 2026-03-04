// /pages/api/twilio/send-sms.js
// Send SMS via Twilio using Messaging Service for A2P compliance
// Primary sender for all outbound SMS — no longer routes through GHL
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendTwilioSMS, normalizePhone } from '../../../lib/twilio-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    patient_id,
    patient_name,
    to,           // phone number
    message,
    message_type, // optional: label for comms_log
  } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'to and message are required' });
  }

  // Normalize phone to E.164
  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  // Look up patient's GHL contact ID for logging (if we have patient_id)
  let ghlContactId = null;
  if (patient_id) {
    const { data: patient } = await supabase
      .from('patients')
      .select('ghl_contact_id')
      .eq('id', patient_id)
      .single();
    ghlContactId = patient?.ghl_contact_id || null;
  }

  // Send via Twilio (primary — uses Messaging Service SID for A2P compliance)
  const result = await sendTwilioSMS({ to: normalizedTo, message });

  if (result.success) {
    await logComm({
      channel: 'sms',
      messageType: message_type || 'direct_sms',
      message,
      source: 'send-sms(twilio)',
      patientId: patient_id || null,
      patientName: patient_name || null,
      recipient: normalizedTo,
      ghlContactId,
      twilioMessageSid: result.messageSid || null,
      direction: 'outbound',
    });

    return res.status(200).json({ success: true, via: 'twilio', messageSid: result.messageSid });
  }

  // Log the failure
  await logComm({
    channel: 'sms',
    messageType: message_type || 'direct_sms',
    message,
    source: 'send-sms(twilio)',
    patientId: patient_id || null,
    patientName: patient_name || null,
    recipient: normalizedTo,
    ghlContactId,
    status: 'error',
    errorMessage: result.error,
    direction: 'outbound',
  });

  return res.status(500).json({ error: 'Failed to send SMS', details: result.error });
}
