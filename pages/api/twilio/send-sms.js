// /pages/api/twilio/send-sms.js
// Send SMS via GHL API (primary) or Twilio (fallback for patients without GHL contact)
// GHL manages the business phone number (949-997-3988)
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
    const result = await sendViaGHL({ patient_id, patient_name, to: normalizedTo, message, message_type });
    if (result.success) {
      return res.status(200).json(result);
    }

    // If GHL failed because patient has no contact ID, fall through to Twilio
    // If GHL failed for another reason (API error), do NOT silently fall through —
    // Twilio has carrier blocking issues (error 30034), so it's better to return
    // the GHL error than to send via Twilio and have it blocked
    if (result.error !== 'Patient has no GHL contact ID') {
      console.error('GHL SMS failed (not falling back to Twilio):', result.error);
      // Log the failure
      await logComm({
        channel: 'sms',
        messageType: message_type || 'direct_sms',
        message,
        source: 'send-sms(ghl)',
        patientId: patient_id,
        patientName: patient_name,
        recipient: normalizedTo,
        status: 'error',
        errorMessage: result.error,
        direction: 'outbound',
      });
      return res.status(500).json({ error: 'Failed to send SMS via GHL', details: result.error });
    }

    // Patient has no GHL contact ID — fall through to Twilio
    console.log('Patient has no GHL contact ID, trying Twilio fallback');
  }

  // Fallback: Send via Twilio (for patients without GHL contact)
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
          direction: 'outbound',
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
        direction: 'outbound',
      });

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
 * Includes retry logic for transient failures
 */
async function sendViaGHL({ patient_id, patient_name, to, message, message_type }) {
  // Look up GHL contact ID from patient
  const { data: patient, error: lookupErr } = await supabase
    .from('patients')
    .select('ghl_contact_id')
    .eq('id', patient_id)
    .single();

  if (lookupErr) {
    console.error('Patient lookup error:', lookupErr.message);
    return { success: false, error: `Patient lookup failed: ${lookupErr.message}` };
  }

  if (!patient?.ghl_contact_id) {
    return { success: false, error: 'Patient has no GHL contact ID' };
  }

  // Try sending via GHL with one retry on failure
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
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
        lastError = `GHL ${ghlRes.status}: ${errorText}`;
        console.error(`GHL SMS attempt ${attempt + 1} failed:`, lastError);
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
          continue;
        }
        return { success: false, error: lastError };
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
        direction: 'outbound',
      });

      return { success: true, via: 'ghl', messageId: ghlData.messageId || ghlData.id };
    } catch (err) {
      lastError = err.message;
      console.error(`GHL SMS attempt ${attempt + 1} error:`, err.message);
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
        continue;
      }
    }
  }

  return { success: false, error: lastError || 'GHL send failed after retries' };
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
