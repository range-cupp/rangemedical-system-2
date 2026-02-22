// /pages/api/patients/[id]/send-symptoms.js
// Send symptoms questionnaire link via SMS

import { createClient } from '@supabase/supabase-js';
import { sendSMS } from '../../../../lib/twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Get patient info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.phone) {
      return res.status(400).json({ error: 'Patient has no phone number' });
    }

    const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'there';
    const firstName = patient.first_name || 'there';

    // Build questionnaire URL
    const questionnaireUrl = `https://app.range-medical.com/symptom-questionnaire?email=${encodeURIComponent(patient.email || '')}&name=${encodeURIComponent(patientName)}`;

    // SMS Message
    const message = `Hi ${firstName}, please complete your Range Medical symptoms questionnaire before your visit: ${questionnaireUrl}`;

    // Send via Twilio
    const smsResult = await sendSMS(patient.phone, message);

    if (!smsResult) {
      return res.status(500).json({
        error: 'Failed to send SMS',
        fallbackLink: questionnaireUrl
      });
    }

    // Log that we sent it
    await supabase
      .from('symptom_responses')
      .insert({
        patient_id: id,
        ghl_contact_id: patient.ghl_contact_id,
        questionnaire_name: 'core',
        response_type: 'invite_sent',
        responses: { sent_at: new Date().toISOString(), method: 'sms' }
      });

    return res.status(200).json({
      success: true,
      message: 'Symptoms questionnaire sent via SMS',
      sentTo: patient.phone
    });

  } catch (error) {
    console.error('Send symptoms error:', error);
    return res.status(500).json({ error: error.message });
  }
}
