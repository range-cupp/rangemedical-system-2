// /pages/api/patients/[id]/send-symptoms.js
// Send symptoms questionnaire link via GHL SMS

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

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

    if (!patient.phone && !patient.ghl_contact_id) {
      return res.status(400).json({ error: 'Patient has no phone number' });
    }

    const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'there';
    const firstName = patient.first_name || 'there';
    
    // Build questionnaire URL
    const questionnaireUrl = `https://app.range-medical.com/symptom-questionnaire?email=${encodeURIComponent(patient.email || '')}&name=${encodeURIComponent(patientName)}`;

    // SMS Message
    const message = `Hi ${firstName}, please complete your Range Medical symptoms questionnaire before your visit: ${questionnaireUrl}`;

    // If we have GHL contact ID, send via GHL
    if (patient.ghl_contact_id && GHL_API_KEY) {
      const ghlResponse = await fetch(
        `https://services.leadconnectorhq.com/conversations/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            type: 'SMS',
            contactId: patient.ghl_contact_id,
            message: message
          })
        }
      );

      if (!ghlResponse.ok) {
        const errorData = await ghlResponse.json();
        console.error('GHL Error:', errorData);
        return res.status(500).json({ 
          error: 'Failed to send SMS via GHL',
          details: errorData,
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
    }

    // No GHL contact, return the link to copy
    return res.status(200).json({
      success: true,
      message: 'No GHL contact ID - use this link',
      link: questionnaireUrl,
      smsText: message
    });

  } catch (error) {
    console.error('Send symptoms error:', error);
    return res.status(500).json({ error: error.message });
  }
}
