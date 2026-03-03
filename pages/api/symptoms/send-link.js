// /pages/api/symptoms/send-link.js
// Send symptoms questionnaire link via SMS to patient
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { resolveGHLContactId } from '../../../lib/ghl-sync';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
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

    const patientPhone = patient.phone || phone;
    if (!patientPhone) {
      return res.status(400).json({ error: 'Patient has no phone number' });
    }

    // Resolve GHL contact ID (validates stored ID, falls back to phone search)
    const ghlContactId = await resolveGHLContactId(patient.ghl_contact_id, {
      phone: patientPhone,
      patientId: patient.id,
      supabase
    });

    if (!ghlContactId) {
      return res.status(400).json({ error: 'Could not find GHL contact — check patient phone number' });
    }

    // Build the questionnaire link
    const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : name?.split(' ')[0] || 'there');
    const displayName = name || patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const questionnaireUrl = `${BASE_URL}/symptom-questionnaire?patient=${patientId}&name=${encodeURIComponent(displayName)}`;

    // Build SMS message
    const message = `Hi ${firstName}! Range Medical here.\n\nPlease take a moment to complete your symptoms questionnaire. It helps us track your progress and tailor your treatment:\n\n${questionnaireUrl}\n\n- Range Medical`;

    // Send SMS via GHL
    const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: ghlContactId,
        message
      })
    });

    if (!smsRes.ok) {
      const errorData = await smsRes.text();
      console.error('GHL SMS error:', errorData);
      return res.status(500).json({ error: 'Failed to send SMS' });
    }

    // Log the communication
    await logComm({
      channel: 'sms',
      messageType: 'symptoms_questionnaire_link',
      message,
      source: 'patient-profile',
      patientId: patient.id,
      ghlContactId,
      patientName: displayName
    });

    return res.status(200).json({ success: true, message: 'SMS sent successfully' });

  } catch (error) {
    console.error('Error sending symptoms link:', error);
    return res.status(500).json({ error: error.message });
  }
}
