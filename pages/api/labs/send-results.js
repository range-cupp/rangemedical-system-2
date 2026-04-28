// pages/api/labs/send-results.js
// Send lab results link to patient via SMS
// Link: /patient/labs?id={lab_uuid}
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

  const { lab_id, patient_id } = req.body;
  if (!lab_id || !patient_id) {
    return res.status(400).json({ error: 'lab_id and patient_id are required' });
  }

  try {
    // Fetch lab metadata
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('id, test_date, panel_type, lab_type')
      .eq('id', lab_id)
      .single();

    if (labError || !lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    // Fetch patient phone
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, phone, cell_phone, gender')
      .eq('id', patient_id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const rawPhone = patient.cell_phone || patient.phone;
    if (!rawPhone) {
      return res.status(400).json({ error: 'No phone number on file for this patient' });
    }

    const phone = normalizePhone(rawPhone);
    if (!phone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
    // Use the lab UUID directly as the access token — UUIDs are cryptographically random
    const labUrl = `${BASE_URL}/patient/labs?id=${lab.id}`;

    const firstName = patient.first_name || (patient.name || '').split(' ')[0] || 'there';
    const testDate = lab.test_date
      ? new Date(lab.test_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' , timeZone: 'America/Los_Angeles' })
      : 'your recent';

    const message = `Hi ${firstName}! Your ${testDate} lab results from Range Medical are ready.\n\n${labUrl}\n\nTap each result to learn what it means. Questions? Call (949) 997-3988.`;

    // Send SMS
    const smsResult = await sendSMS({ to: phone, message });

    // Log in comms
    try {
      await logComm({
        channel: 'sms',
        messageType: 'lab_results',
        message,
        patientId: patient_id,
        patientName: patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        source: 'lab-results-send',
        recipient: phone,
        status: smsResult.success ? 'sent' : 'error',
        errorMessage: smsResult.error || null,
        twilioMessageSid: smsResult.messageSid || null,
        provider: smsResult.provider || null,
      });
    } catch (logErr) {
      console.error('Lab results comms log error:', logErr);
    }

    return res.status(200).json({
      success: true,
      url: labUrl,
      sent_to: phone,
      sms: smsResult,
    });
  } catch (err) {
    console.error('send-results error:', err);
    return res.status(500).json({ error: err.message });
  }
}
