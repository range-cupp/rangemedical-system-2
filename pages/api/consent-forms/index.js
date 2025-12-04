// pages/api/consent-forms/index.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { 
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        consent_date,
        consent_given,
        signature_url
      } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !email || !date_of_birth || !signature_url) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Find or create patient by email
      let patient;
      
      // First, try to find existing patient by email
      const { data: existingPatients, error: findError } = await supabase
        .from('patients')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (findError) {
        console.error('Error finding patient:', findError);
      }

      if (existingPatients && existingPatients.length > 0) {
        // Patient exists
        patient = existingPatients[0];
        console.log('Found existing patient:', patient.id);
      } else {
        // Create new patient
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            name: `${first_name} ${last_name}`,
            email: email,
            phone: phone || null,
            date_of_birth: date_of_birth
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating patient:', createError);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to create patient record',
            details: createError.message 
          });
        }

        patient = newPatient;
        console.log('Created new patient:', patient.id);
      }

      // Insert consent form
      const { data: consentData, error: consentError } = await supabase
        .from('consent_forms')
        .insert({
          patient_id: patient.id,
          first_name,
          last_name,
          email,
          phone: phone || null,
          date_of_birth,
          consent_type: 'Blood Draw',
          consent_date: consent_date || new Date().toISOString().split('T')[0],
          consent_given: consent_given !== false,
          signature_url
        })
        .select()
        .single();

      if (consentError) {
        console.error('Database error:', consentError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save consent form',
          details: consentError.message 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Consent form submitted successfully',
        consentId: consentData.id,
        patientId: patient.id
      });

    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const { patient_id } = req.query;

      if (!patient_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing patient_id parameter' 
        });
      }

      // Get all consent forms for patient
      const { data, error } = await supabase
        .from('consent_forms')
        .select('*')
        .eq('patient_id', patient_id)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch consent forms',
          details: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        consents: data || []
      });

    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
