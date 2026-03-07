// /pages/api/admin/send-form-sms.js
// Send consent/form links to patients via Twilio SMS
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ghlContactId, patientName, patientPhone, patientId, formType, formUrl } = req.body;

  // Validate required fields
  if (!formType || !formUrl) {
    return res.status(400).json({ error: 'Missing form type or URL' });
  }

  // Build the message
  const firstName = patientName || 'there';
  const message = `Hi ${firstName}! Please complete your ${formType} for Range Medical: ${formUrl}`;

  // Get phone number — either from request body or look up from patient/GHL contact
  let phone = patientPhone ? normalizePhone(patientPhone) : null;

  if (!phone && patientId) {
    const { data: patient } = await supabase
      .from('patients')
      .select('phone')
      .eq('id', patientId)
      .single();
    phone = normalizePhone(patient?.phone);
  }

  if (!phone && ghlContactId) {
    // Look up patient by GHL contact ID
    const { data: patient } = await supabase
      .from('patients')
      .select('phone')
      .eq('ghl_contact_id', ghlContactId)
      .single();
    phone = normalizePhone(patient?.phone);
  }

  if (!phone) {
    return res.status(400).json({ error: 'No phone number available. Please provide patientPhone, patientId, or ghlContactId.' });
  }

  try {
    // Send via SMS provider (Blooio/Twilio based on SMS_PROVIDER env)
    const result = await sendSMS({ to: phone, message });

    if (!result.success) {
      console.error('SMS send error:', result.error);
      return res.status(500).json({ error: 'Failed to send SMS', details: result.error });
    }

    await logComm({
      channel: 'sms',
      messageType: `form_link_${formType}`,
      message,
      source: `send-form-sms(${result.provider || 'sms'})`,
      patientId: patientId || null,
      patientName: patientName || null,
      ghlContactId: ghlContactId || null,
      recipient: phone,
      twilioMessageSid: result.messageSid,
      direction: 'outbound',
      provider: result.provider || null,
    });

    console.log(`SMS sent to ${phone}: ${formType}`);

    return res.status(200).json({
      success: true,
      messageSid: result.messageSid,
      message: `Sent ${formType} link to patient`
    });

  } catch (error) {
    console.error('Send SMS error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send SMS' });
  }
}
