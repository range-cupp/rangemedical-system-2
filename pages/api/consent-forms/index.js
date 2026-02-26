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

      // GHL contact ID (for patient matching)
      ghlContactId,

      // Consent details
      consentDate,
      consentGiven,

      // Additional data (optional, for consents with extra fields)
      additionalData,

      // File URLs
      signatureUrl,
      pdfUrl
    } = req.body;

    // Validate required fields (email not required — HIPAA form may only have phone)
    if (!consentType || !consentDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: consentType, consentDate'
      });
    }

    console.log(`📋 Processing ${consentType} consent for ${firstName || ''} ${lastName || ''}`);

    // Match patient in priority order: ghl_contact_id → email (ilike) → phone
    let patientId = null;

    if (ghlContactId) {
      const { data } = await supabase.from('patients').select('id')
        .eq('ghl_contact_id', ghlContactId).single();
      if (data) patientId = data.id;
    }

    if (!patientId && email) {
      const { data } = await supabase.from('patients').select('id')
        .ilike('email', email.trim()).single();
      if (data) patientId = data.id;
    }

    if (!patientId && phone) {
      const normalized = phone.replace(/\D/g, '').slice(-10);
      if (normalized.length === 10) {
        const { data } = await supabase.from('patients').select('id, phone')
          .or(`phone.ilike.%${normalized}%`);
        if (data?.length > 0) patientId = data[0].id;
      }
    }

    if (patientId) {
      console.log('Matched patient:', patientId);
    } else {
      console.log('No patient match found — saving consent with patient_id: null');
    }

    // Insert consent record
    const consentData = {
      patient_id: patientId,
      consent_type: consentType,
      first_name: firstName || null,
      last_name: lastName || null,
      email: email ? email.toLowerCase() : null,
      phone: phone || null,
      date_of_birth: dateOfBirth || null,
      ghl_contact_id: ghlContactId || null,
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
