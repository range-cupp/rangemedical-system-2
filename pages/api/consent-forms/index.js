// /pages/api/consent-forms/index.js
// Saves consent form submissions to Supabase database

import { createClient } from '@supabase/supabase-js';

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

  try {
    const {
      // Consent type
      consentType,
      
      // Patient info
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      
      // Consent details
      consentDate,
      consentGiven,
      
      // Additional data (optional, for consents with extra fields)
      additionalData,
      
      // File URLs
      signatureUrl,
      pdfUrl
    } = req.body;

    // Validate required fields
    if (!consentType || !firstName || !lastName || !email || !consentDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: consentType, firstName, lastName, email, consentDate'
      });
    }

    console.log(`📋 Processing ${consentType} consent for ${firstName} ${lastName}`);

    // Try to find existing patient by email
    let patientId = null;
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingPatient) {
      patientId = existingPatient.id;
      console.log('Found existing patient:', patientId);
    } else {
      // Create new patient record
      const fullName = `${firstName} ${lastName}`.trim();
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: phone || null,
          date_of_birth: dateOfBirth || null
        })
        .select('id')
        .single();

      if (patientError) {
        console.error('Error creating patient:', patientError);
        // Continue without patient link
      } else {
        patientId = newPatient.id;
        console.log('Created new patient:', patientId);
      }
    }

    // Insert consent record
    const consentData = {
      patient_id: patientId,
      consent_type: consentType,
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      phone: phone || null,
      date_of_birth: dateOfBirth || null,
      consent_date: consentDate,
      consent_given: consentGiven || false,
      additional_data: additionalData || {},
      signature_url: signatureUrl || null,
      pdf_url: pdfUrl || null,
      submitted_at: new Date().toISOString()
    };

    const { data: consent, error: consentError } = await supabase
      .from('consents')
      .insert(consentData)
      .select('id')
      .single();

    if (consentError) {
      console.error('Error saving consent:', consentError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save consent',
        details: consentError.message
      });
    }

    console.log(`✅ ${consentType} consent saved! ID:`, consent.id);

    return res.status(200).json({
      success: true,
      consentId: consent.id,
      patientId: patientId,
      consentType: consentType
    });

  } catch (error) {
    console.error('Consent API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
