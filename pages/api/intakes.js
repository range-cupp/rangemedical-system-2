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

    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName' 
      });
    }

    // Build the intake record
    const intakeRecord = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      date_of_birth: formData.dateOfBirth || null,
      gender: formData.gender || null,
      street_address: formData.streetAddress || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postalCode || null,
      what_brings_you: formData.whatBringsYou || null,
      injured: formData.injured || null,
      injury_description: formData.injuryDescription || null,
      injury_location: formData.injuryLocation || null,
      injury_date: formData.injuryDate || null,
      conditions: formData.conditions || null,
      on_hrt: formData.onHRT || null,
      hrt_details: formData.hrtDetails || null,
      on_medications: formData.onMedications || null,
      current_medications: formData.currentMedications || null,
      medication_notes: formData.medicationNotes || null,
      has_allergies: formData.hasAllergies || null,
      allergies: formData.allergies || null,
      allergy_reactions: formData.allergyReactions || null,
      guardian_name: formData.guardianName || null,
      consent: formData.consent || null,
      signature_url: formData.signatureUrl || null,
      pdf_url: formData.pdfUrl || null,
      photo_id_url: formData.photoIdUrl || null,
      submitted_at: new Date().toISOString()
    };

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

    console.log('Intake form saved:', data.id);

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
