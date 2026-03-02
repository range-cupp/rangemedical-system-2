// /pages/api/twilio/send-sms.js
// Send SMS via GHL API (primary) or Twilio (future fallback)
// GHL manages the business phone number until it's transferred to Twilio
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;

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

  // Primary: Send via GHL (manages the business phone number)
  if (GHL_API_KEY && patient_id) {
    try {
      const result = await sendViaGHL({ patient_id, patient_name, to: normalizedTo, message, message_type });
      if (result.success) {
        return res.status(200).json(result);
      }
      // If GHL fails, log and continue to Twilio fallback
      console.log('GHL SMS failed, trying Twilio fallback:', result.error);
    } catch (err) {
      console.error('GHL SMS error:', err.message);
    }
  }

  // Fallback: Send via Twilio (for when number is transferred)
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  const messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim();

  if (accountSid && authToken && (fromNumber || messagingServiceSid)) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', normalizedTo);
      if (messagingServiceSid) {
        params.append('MessagingServiceSid', messagingServiceSid);
      } else {
        params.append('From', fromNumber);
      }
      params.append('Body', message);

      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com').replace(/\/$/, '');
      params.append('StatusCallback', `${baseUrl}/api/twilio/status-callback`);

      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const twilioData = await twilioRes.json();

      if (!twilioRes.ok) {
        await logComm({
          channel: 'sms',
          messageType: message_type || 'direct_sms',
          message,
          source: 'send-sms(twilio)',
          patientId: patient_id || null,
          patientName: patient_name || null,
          status: 'error',
          errorMessage: twilioData.message || 'Twilio API error',
        });
        return res.status(500).json({ error: 'Failed to send SMS', details: twilioData.message });
      }

      await logComm({
        channel: 'sms',
        messageType: message_type || 'direct_sms',
        message,
        source: 'send-sms(twilio)',
        patientId: patient_id || null,
        patientName: patient_name || null,
        recipient: normalizedTo,
        twilioMessageSid: twilioData.sid || null,
      });

      // Update direction for conversation view
      await supabase
        .from('comms_log')
        .update({ direction: 'outbound' })
        .eq('source', 'send-sms(twilio)')
        .eq('patient_id', patient_id)
        .order('created_at', { ascending: false })
        .limit(1);

      return res.status(200).json({ success: true, via: 'twilio', messageSid: twilioData.sid });
    } catch (error) {
      console.error('Twilio send error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(400).json({ error: 'No SMS provider configured (GHL or Twilio)' });
}

/**
 * Send SMS via GHL Conversations API
 */
async function sendViaGHL({ patient_id, patient_name, to, message, message_type }) {
  // Look up GHL contact ID from patient
  const { data: patient } = await supabase
    .from('patients')
    .select('ghl_contact_id')
    .eq('id', patient_id)
    .single();

  if (!patient?.ghl_contact_id) {
    return { success: false, error: 'Patient has no GHL contact ID' };
  }

  const ghlRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      type: 'SMS',
      contactId: patient.ghl_contact_id,
      message,
    }),
  });

  if (!ghlRes.ok) {
    const errorText = await ghlRes.text();
    console.error('GHL SMS error:', ghlRes.status, errorText);
    return { success: false, error: `GHL error: ${errorText}` };
  }

  const ghlData = await ghlRes.json();

  // Log the sent message
  await logComm({
    channel: 'sms',
    messageType: message_type || 'direct_sms',
    message,
    source: 'send-sms(ghl)',
    patientId: patient_id,
    patientName: patient_name,
    recipient: to,
    ghlContactId: patient.ghl_contact_id,
  });

  // Update direction for conversation view
  await supabase
    .from('comms_log')
    .update({ direction: 'outbound' })
    .eq('source', 'send-sms(ghl)')
    .eq('patient_id', patient_id)
    .order('created_at', { ascending: false })
    .limit(1);

  return { success: true, via: 'ghl', messageId: ghlData.messageId || ghlData.id };
}

/**
 * Normalize a phone number to E.164 format
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (phone.startsWith('+') && digits.length >= 10) return '+' + digits;
  return null;
}
