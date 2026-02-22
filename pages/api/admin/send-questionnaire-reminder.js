// /pages/api/admin/send-questionnaire-reminder.js
// Manually send questionnaire reminder via SMS
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '../../../lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';

function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Check auth
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { protocol_id, reminder_type } = req.body; // reminder_type: 'intake' or 'completion'

    if (!protocol_id) {
      return res.status(400).json({ error: 'protocol_id required' });
    }

    if (!reminder_type || !['intake', 'completion'].includes(reminder_type)) {
      return res.status(400).json({ error: 'reminder_type must be intake or completion' });
    }

    // Get protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', protocol_id)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Look up patient phone from the patients table
    let patientPhone = null;
    if (protocol.patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('phone')
        .eq('id', protocol.patient_id)
        .single();
      patientPhone = patient?.phone;
    }

    // Fallback: try looking up by ghl_contact_id
    if (!patientPhone && protocol.ghl_contact_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('phone')
        .eq('ghl_contact_id', protocol.ghl_contact_id)
        .single();
      patientPhone = patient?.phone;
    }

    if (!patientPhone) {
      return res.status(400).json({ error: 'Patient has no phone number' });
    }

    // Check if questionnaire already exists
    const { data: existing } = await supabase
      .from('questionnaire_responses')
      .select('id')
      .eq('protocol_id', protocol_id)
      .eq('questionnaire_type', reminder_type)
      .single();

    if (existing) {
      return res.status(400).json({ error: `${reminder_type} questionnaire already completed` });
    }

    // Build message
    const firstName = getFirstName(protocol.patient_name);
    const trackerUrl = `https://app.range-medical.com/track/${protocol.access_token}`;

    let message;
    if (reminder_type === 'intake') {
      message = `Hi ${firstName}! This is Range Medical. Please complete your starting assessment so we can track your recovery progress - takes just 2 minutes: ${trackerUrl}`;
    } else {
      message = `Hi ${firstName}! Your ${protocol.program_name} is wrapping up. Please take 2 min to complete your final assessment - we'd love to see how much you've improved: ${trackerUrl}`;
    }

    // Send SMS via Twilio
    const smsResult = await sendSMS(patientPhone, message);

    if (!smsResult) {
      return res.status(500).json({ error: 'Failed to send SMS' });
    }

    return res.status(200).json({
      success: true,
      message: `${reminder_type} reminder sent to ${protocol.patient_name}`
    });

  } catch (error) {
    console.error('Send reminder error:', error);
    return res.status(500).json({ error: error.message });
  }
}
