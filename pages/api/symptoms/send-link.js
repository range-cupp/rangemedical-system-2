// /pages/api/symptoms/send-link.js
// Send symptoms questionnaire link via SMS to patient
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientId, phone, name } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    // Fetch patient from database
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, name, phone, email, ghl_contact_id')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const rawPhone = patient.phone || phone;
    const patientPhone = normalizePhone(rawPhone);
    if (!patientPhone) {
      return res.status(400).json({ error: 'Patient has no phone number' });
    }

    // Build the questionnaire link
    const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : name?.split(' ')[0] || 'there');
    const displayName = name || patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const questionnaireUrl = `${BASE_URL}/symptom-questionnaire?patient=${patientId}&name=${encodeURIComponent(displayName)}`;

    // Build SMS message
    const message = `Hi ${firstName}! Range Medical here.\n\nPlease take a moment to complete your symptoms questionnaire. It helps us track your progress and tailor your treatment:\n\n${questionnaireUrl}\n\n- Range Medical`;

    // Send SMS via the configured provider (Blooio/Twilio router)
    const smsResult = await sendSMS({ to: patientPhone, message });

    // Log the communication
    await logComm({
      channel: 'sms',
      messageType: 'symptoms_questionnaire_link',
      message,
      source: 'patient-profile',
      patientId: patient.id,
      ghlContactId: patient.ghl_contact_id,
      patientName: displayName,
      recipient: patientPhone,
      twilioMessageSid: smsResult.messageSid || null,
      status: smsResult.success ? 'sent' : 'error',
      errorMessage: smsResult.success ? null : smsResult.error,
      provider: smsResult.provider || null,
      direction: 'outbound',
    });

    if (!smsResult.success) {
      console.error('Symptoms link SMS error:', smsResult.error);
      return res.status(500).json({ error: 'Failed to send SMS' });
    }

    return res.status(200).json({ success: true, message: 'SMS sent successfully' });

  } catch (error) {
    console.error('Error sending symptoms link:', error);
    return res.status(500).json({ error: error.message });
  }
}
