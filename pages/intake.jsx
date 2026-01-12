// pages/api/intakes.js
// Saves medical intake form data to Supabase database

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
    const formData = req.body;
    console.log('=== INTAKES API CALLED ===');
    console.log('Form data received:', JSON.stringify(formData, null, 2));

    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName' 
      });
    }

    // Helper to convert Yes/No strings to boolean
    const toBool = (val) => {
      if (typeof val === 'boolean') return val;
      if (val === 'Yes' || val === 'yes' || val === true) return true;
      if (val === 'No' || val === 'no' || val === false) return false;
      return null;
    };

    // Helper to format date for database (YYYY-MM-DD)
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      // If already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // If in MM/DD/YYYY format
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return null;
    };

    // Extract medical history from the medicalHistory object
    const mh = formData.medicalHistory || {};

    // Build the intake record matching actual table columns
    const intakeRecord = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      date_of_birth: formatDate(formData.dateOfBirth),
      gender: formData.gender || null,
      street_address: formData.streetAddress || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postalCode || null,
      
      // What brings you in
      what_brings_you: formData.whatBringsYou || null,
      what_brings_you_in: formData.whatBringsYou || null,
      
      // Injury info
      injured: toBool(formData.injured),
      currently_injured: toBool(formData.injured),
      injury_description: formData.injuryDescription || null,
      injury_location: formData.injuryLocation || null,
      injury_date: formatDate(formData.injuryDate),
      injury_when_occurred: formData.injuryDate || null,
      
      // Individual medical conditions (booleans)
      high_blood_pressure: mh.hypertension?.response === 'Yes',
      high_blood_pressure_year: mh.hypertension?.year || null,
      
      high_cholesterol: mh.highCholesterol?.response === 'Yes',
      high_cholesterol_year: mh.highCholesterol?.year || null,
      
      heart_disease: mh.heartDisease?.response === 'Yes',
      heart_disease_year: mh.heartDisease?.year || null,
      heart_disease_type: mh.heartDisease?.type || null,
      
      diabetes: mh.diabetes?.response === 'Yes',
      diabetes_year: mh.diabetes?.year || null,
      diabetes_type: mh.diabetes?.type || null,
      
      thyroid_disorder: mh.thyroid?.response === 'Yes',
      thyroid_disorder_year: mh.thyroid?.year || null,
      thyroid_disorder_type: mh.thyroid?.type || null,
      
      depression_anxiety: mh.depression?.response === 'Yes',
      depression_anxiety_year: mh.depression?.year || null,
      
      kidney_disease: mh.kidney?.response === 'Yes',
      kidney_disease_year: mh.kidney?.year || null,
      kidney_disease_type: mh.kidney?.type || null,
      
      liver_disease: mh.liver?.response === 'Yes',
      liver_disease_year: mh.liver?.year || null,
      liver_disease_type: mh.liver?.type || null,
      
      autoimmune_disorder: mh.autoimmune?.response === 'Yes',
      autoimmune_disorder_year: mh.autoimmune?.year || null,
      autoimmune_disorder_type: mh.autoimmune?.type || null,
      
      cancer: mh.cancer?.response === 'Yes',
      cancer_year: mh.cancer?.year || null,
      cancer_type: mh.cancer?.type || null,
      
      // Store full medical history as JSONB too
      medical_conditions: formData.medicalHistory || null,
      
      // HRT
      on_hrt: toBool(formData.onHRT),
      hrt_details: formData.hrtDetails || null,
      
      // Medications
      on_medications: toBool(formData.onMedications),
      on_other_medications: toBool(formData.onMedications),
      current_medications: formData.currentMedications || null,
      medication_notes: formData.medicationNotes || null,
      
      // Allergies
      has_allergies: toBool(formData.hasAllergies),
      allergies: formData.allergies || null,
      allergy_reactions: formData.allergyReactions || null,
      
      // Other
      guardian_name: formData.guardianName || null,
      photo_id_url: formData.photoIdUrl || null,
      signature_url: formData.signatureUrl || null,
      pdf_url: formData.pdfUrl || null,
      consent_given: toBool(formData.consent) || true,
      submitted_at: new Date().toISOString()
    };

    console.log('Intake record to insert:', JSON.stringify(intakeRecord, null, 2));

    // Insert into intakes table
    const { data, error } = await supabase
      .from('intakes')
      .insert(intakeRecord)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to save intake form',
        details: error.message 
      });
    }

    console.log('✅ Intake form saved:', data.id);

    return res.status(200).json({
      success: true,
      message: 'Intake form saved successfully',
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
