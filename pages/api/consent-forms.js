// pages/api/consent-forms.js
// Saves consent form data to Supabase database

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      consentType,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      consentDate,
      consentGiven,
      signatureUrl,
      pdfUrl
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !consentType) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, consentType' 
      });
    }

    // Insert into consent_forms table
    const { data, error } = await supabase
      .from('consent_forms')
      .insert({
        consent_type: consentType,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        consent_date: consentDate || new Date().toISOString().split('T')[0],
        consent_given: consentGiven || true,
        signature_url: signatureUrl || null,
        pdf_url: pdfUrl || null,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to save consent form',
        details: error.message 
      });
    }

    console.log('Consent form saved:', data.id);

    return res.status(200).json({
      success: true,
      message: 'Consent form saved successfully',
      id: data.id
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
