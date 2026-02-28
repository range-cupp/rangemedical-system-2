// /pages/api/twilio/send-sms.js
// Send SMS directly via Twilio (bypasses GHL)
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

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
    to,           // phone number in E.164 format
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

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    // Fall back to GHL if Twilio is not configured
    return fallbackToGHL(req, res, { patient_id, to: normalizedTo, message, patient_name, message_type });
  }

  try {
    // Send via Twilio REST API (no SDK needed)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', normalizedTo);
    params.append('From', fromNumber);
    params.append('Body', message);

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
      console.error('Twilio error:', twilioData);

      await logComm({
        channel: 'sms',
        messageType: message_type || 'direct_sms',
        message,
        source: 'twilio/send-sms',
        patientId: patient_id || null,
        patientName: patient_name || null,
        status: 'error',
        errorMessage: twilioData.message || 'Twilio API error',
      });

      return res.status(500).json({
        error: 'Failed to send SMS',
        details: twilioData.message,
      });
    }

    // Log the sent message
    await logComm({
      channel: 'sms',
      messageType: message_type || 'direct_sms',
      message,
      source: 'twilio/send-sms',
      patientId: patient_id || null,
      patientName: patient_name || null,
      recipient: normalizedTo,
    });

    // Also store in comms_log with direction for conversation view
    await supabase
      .from('comms_log')
      .update({ direction: 'outbound' })
      .eq('source', 'twilio/send-sms')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })
      .limit(1);

    return res.status(200).json({
      success: true,
      messageSid: twilioData.sid,
      status: twilioData.status,
    });

  } catch (error) {
    console.error('Twilio send error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Fallback to GHL if Twilio is not configured
 */
async function fallbackToGHL(req, res, { patient_id, to, message, patient_name, message_type }) {
  // Try to find GHL contact ID from patient
  if (!patient_id) {
    return res.status(400).json({ error: 'Twilio not configured and no patient_id for GHL fallback' });
  }

  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('ghl_contact_id')
      .eq('id', patient_id)
      .single();

    if (!patient?.ghl_contact_id) {
      return res.status(400).json({ error: 'Twilio not configured and patient has no GHL contact ID' });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.rangemedical.com';
    const ghlRes = await fetch(`${baseUrl}/api/ghl/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: patient.ghl_contact_id,
        message,
        message_type,
      }),
    });

    const ghlData = await ghlRes.json();

    if (!ghlRes.ok) {
      return res.status(500).json({ error: 'GHL fallback failed', details: ghlData });
    }

    await logComm({
      channel: 'sms',
      messageType: message_type || 'direct_sms',
      message,
      source: 'twilio/send-sms(ghl-fallback)',
      patientId: patient_id,
      patientName: patient_name,
      ghlContactId: patient.ghl_contact_id,
    });

    return res.status(200).json({ success: true, via: 'ghl', ...ghlData });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
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
