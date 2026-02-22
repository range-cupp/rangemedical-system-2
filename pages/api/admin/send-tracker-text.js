// /pages/api/admin/send-tracker-text.js
// Send tracker link via SMS through Twilio
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '../../../lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    protocol_id,
    patient_name,
    patient_phone,
    access_token,
    ghl_contact_id,
    program_type,
    program_name
  } = req.body;

  if (!patient_phone || !access_token) {
    return res.status(400).json({ error: 'Phone and access_token required' });
  }

  // Build patient portal URL - one link for everything
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
  const patientUrl = `${baseUrl}/my/${access_token}`;

  // Build message
  const firstName = patient_name?.split(' ')[0] || 'there';
  const message = `Hi ${firstName}!\n\nYour Range Medical patient portal is ready. View your programs, track your progress, and stay on schedule:\n\n${patientUrl}\n\nQuestions? Reply to this text or call (949) 997-3988`;

  try {
    // Send SMS via Twilio
    const smsResult = await sendSMS(patient_phone, message);

    if (smsResult) {
      // Log the send
      await logTextSent(protocol_id, patient_phone, message, 'twilio');
      return res.status(200).json({ success: true, method: 'twilio' });
    }

    // Fallback: Log that we need manual send
    console.log('SMS failed, logging for manual send:', { to: patient_phone, message });

    // Log the attempt
    await logTextSent(protocol_id, patient_phone, message, 'manual');

    return res.status(200).json({
      success: true,
      method: 'logged',
      message: 'Text logged for manual sending',
      sms_content: message,
      phone: patient_phone
    });

  } catch (error) {
    console.error('Send text error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function logTextSent(protocolId, phone, message, method) {
  try {
    // Update protocol with last text sent timestamp
    if (protocolId) {
      // First get current notes
      const { data: protocol } = await supabase
        .from('protocols')
        .select('notes')
        .eq('id', protocolId)
        .single();

      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      const newNote = `[${timestamp}] Tracker link texted to patient`;
      const updatedNotes = protocol?.notes
        ? `${protocol.notes}\n${newNote}`
        : newNote;

      await supabase
        .from('protocols')
        .update({
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', protocolId);
    }
  } catch (err) {
    console.error('Log error:', err);
  }
}
