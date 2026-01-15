// /pages/api/symptoms/submit.js
// Submit symptom questionnaire responses

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    email, 
    phone,
    firstName,
    lastName,
    responses,
    questionnaireName = 'core',
    responseType = 'baseline'
  } = req.body;

  try {
    // Find patient by email or phone
    let patient = null;
    
    if (email) {
      const { data } = await supabase
        .from('patients')
        .select('id, ghl_contact_id')
        .eq('email', email)
        .single();
      patient = data;
    }
    
    if (!patient && phone) {
      // Clean phone number for matching
      const cleanPhone = phone.replace(/\D/g, '');
      const { data } = await supabase
        .from('patients')
        .select('id, ghl_contact_id')
        .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${phone}%`)
        .single();
      patient = data;
    }

    // Create patient if not found
    if (!patient) {
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          first_name: firstName || '',
          last_name: lastName || '',
          email: email || null,
          phone: phone || null
        })
        .select('id, ghl_contact_id')
        .single();
      
      if (patientError) throw patientError;
      patient = newPatient;
    }

    // Calculate overall score (average of numeric responses)
    let overallScore = null;
    const numericValues = Object.values(responses).filter(v => typeof v === 'number');
    if (numericValues.length > 0) {
      overallScore = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    }

    // Save symptom response
    const { data: response, error: responseError } = await supabase
      .from('symptom_responses')
      .insert({
        patient_id: patient.id,
        ghl_contact_id: patient.ghl_contact_id,
        questionnaire_name: questionnaireName,
        response_type: responseType,
        responses: responses,
        overall_score: overallScore,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (responseError) throw responseError;

    return res.status(200).json({ 
      success: true, 
      responseId: response.id,
      patientId: patient.id,
      overallScore
    });

  } catch (error) {
    console.error('Error submitting symptoms:', error);
    return res.status(500).json({ error: error.message });
  }
}
