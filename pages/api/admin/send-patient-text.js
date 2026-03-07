// /pages/api/admin/send-patient-text.js
// Unified SMS API for Portal and Onboarding links — sends via Twilio
// Range Medical

import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    patient_name,
    patient_phone,
    patient_id,
    access_token,
    ghl_contact_id,
    message_type = 'portal'
  } = req.body;

  if (!patient_phone || !access_token) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Build the appropriate URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

  let message;
  if (message_type === 'onboard') {
    const onboardUrl = `${baseUrl}/onboard/${access_token}`;
    message = `Hi ${patient_name?.split(' ')[0] || 'there'}! Welcome to Range Medical. Take 2 minutes to set your goals and help us personalize your care: ${onboardUrl}`;
  } else {
    const portalUrl = `${baseUrl}/portal/${access_token}`;
    message = `Hi ${patient_name?.split(' ')[0] || 'there'}! Here's your Range portal to track your progress and log your treatments: ${portalUrl}`;
  }

  // Normalize phone number
  const phone = normalizePhone(patient_phone);
  if (!phone) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  // Send via Twilio
  const result = await sendSMS({ to: phone, message });

  if (result.success) {
    await logComm({
      channel: 'sms',
      messageType: message_type === 'onboard' ? 'onboard_link' : 'portal_link',
      message,
      source: 'send-patient-text(twilio)',
      patientId: patient_id || null,
      patientName: patient_name || null,
      ghlContactId: ghl_contact_id || null,
      recipient: phone,
      twilioMessageSid: result.messageSid,
      direction: 'outbound',
    });

    return res.status(200).json({
      success: true,
      method: 'twilio',
      messageSid: result.messageSid,
      message_type
    });
  }

  // Twilio failed — return SMS link as fallback for manual sending
  const formattedPhone = patient_phone.replace(/\D/g, '');
  const smsLink = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;

  return res.status(200).json({
    success: true,
    method: 'manual',
    sms_link: smsLink,
    message,
    message_type,
    note: 'Twilio send failed, use SMS link',
    error: result.error,
  });
}
