// /pages/api/admin/send-questionnaire-reminder.js
// Manually send questionnaire reminder via GHL SMS
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';

async function sendSMS(contactId, message) {
  if (!GHL_API_KEY) {
    throw new Error('GHL_API_KEY not configured');
  }

  const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-04-15'
    },
    body: JSON.stringify({
      type: 'SMS',
      contactId: contactId,
      message: message
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GHL SMS error: ${err}`);
  }

  return true;
}

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

    if (!protocol.ghl_contact_id) {
      return res.status(400).json({ error: 'Patient has no GHL contact ID' });
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

    // Send SMS
    await sendSMS(protocol.ghl_contact_id, message);

    return res.status(200).json({
      success: true,
      message: `${reminder_type} reminder sent to ${protocol.patient_name}`
    });

  } catch (error) {
    console.error('Send reminder error:', error);
    return res.status(500).json({ error: error.message });
  }
}
