// /pages/api/ghl/send-sms.js
// Send SMS via Twilio
// Range Medical
// UPDATED: 2026-02-22 - Switched from GHL to Twilio

import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '../../../lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contact_id, message, protocol_id, message_type } = req.body;

  if (!contact_id || !message) {
    return res.status(400).json({ error: 'Missing contact_id or message' });
  }

  try {
    // Look up patient phone number from patients table using ghl_contact_id
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('phone, name')
      .eq('ghl_contact_id', contact_id)
      .single();

    if (patientError || !patient?.phone) {
      console.error('Could not find phone for contact_id:', contact_id);
      return res.status(400).json({
        error: 'Could not find phone number for this contact'
      });
    }

    // Send SMS via Twilio
    const result = await sendSMS(patient.phone, message);

    if (!result) {
      console.error('SMS send failed for:', patient.phone);
      return res.status(500).json({
        error: 'Failed to send SMS'
      });
    }

    console.log('SMS sent to:', patient.phone, '(contact_id:', contact_id, ')');

    // Log to protocol_logs if protocol_id provided
    if (protocol_id) {
      const { error: logError } = await supabase
        .from('protocol_logs')
        .insert({
          protocol_id: protocol_id,
          log_type: 'checkin_text_sent',
          log_date: new Date().toISOString().split('T')[0],
          notes: `${message_type || 'Check-in'} text sent`,
        });

      if (logError) {
        console.error('Error logging SMS to protocol:', logError);
        // Don't fail the request if logging fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      messageId: result.sid
    });

  } catch (err) {
    console.error('SMS error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
