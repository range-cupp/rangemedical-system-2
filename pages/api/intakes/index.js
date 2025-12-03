import { supabase } from '../../../lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Much smaller now since we only receive URLs
    }
  }
};

export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = req.body;
    console.log('Received intake form submission');

    // ============================================
    // 1. GET FILE URLS (already uploaded from browser)
    // ============================================
    
    const photoIdUrl = formData.photoIdUrl || null;
    const signatureUrl = formData.signatureUrl || null;
    
    console.log('Photo ID URL:', photoIdUrl);
    console.log('Signature URL:', signatureUrl);

    // ============================================
    // 2. FIND OR CREATE PATIENT
    // ============================================

    let patientId = null;

    // Try to find patient by email
    if (formData.email) {
      const { data: existingPatients, error: searchError } = await supabase
        .from('patients')
        .select('id')
        .eq('email', formData.email.toLowerCase().trim())
        .limit(1);

      if (!searchError && existingPatients && existingPatients.length > 0) {
        patientId = existingPatients[0].id;
        console.log('Found existing patient:', patientId);
      }
    }

    // If no patient found by email, try by phone
    if (!patientId && formData.phone) {
      const { data: existingPatients, error: searchError } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', formData.phone.trim())
        .limit(1);

      if (!searchError && existingPatients && existingPatients.length > 0) {
        patientId = existingPatients[0].id;
        console.log('Found existing patient by phone:', patientId);
      }
    }

    // Create new patient if not found
    if (!patientId) {
      const newPatient = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email?.toLowerCase().trim() || null,
        phone: formData.phone?.trim() || null,
        date_of_birth: formData.dateOfBirth || null
      };

      const { data: createdPatient, error: createError } = await supabase
        .from('patients')
        .insert([newPatient])
        .select()
        .single();

      if (createError) {
        console.error('Error creating patient:', createError);
        throw createError;
      }

      patientId = createdPatient.id;
      console.log('Created new patient:', patientId);
    }

    // ============================================
    // 3. CREATE INTAKE RECORD
    // ============================================

    const intakeData = {
      patient_id: patientId,
      
      // Personal Information
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email?.toLowerCase().trim() || null,
      phone: formData.phone?.trim() || null,
      date_of_birth: formData.dateOfBirth || null,
      gender: formData.gender || null,
      
      // Address
      street_address: formData.streetAddress || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postalCode || null,
      
      // Health Concerns
      what_brings_you: formData.whatBringsYou || null,
      injured: formData.injured === 'Yes',
      injury_description: formData.injuryDescription || null,
      injury_location: formData.injuryLocation || null,
      injury_date: formData.injuryDate || null,
      
      // Medical History (store as JSONB)
      medical_conditions: formData.medicalHistory || {},
      
      // Medications & HRT
      on_hrt: formData.onHRT === 'Yes',
      hrt_details: formData.hrtDetails || null,
      on_medications: formData.onMedications === 'Yes',
      current_medications: formData.currentMedications || null,
      medication_notes: formData.medicationNotes || null,
      
      // Allergies
      has_allergies: formData.hasAllergies === 'Yes',
      allergies: formData.allergies || null,
      allergy_reactions: formData.allergyReactions || null,
      
      // Guardian
      guardian_name: formData.guardianName || null,
      
      // File URLs (already uploaded to Storage)
      photo_id_url: photoIdUrl,
      signature_url: signatureUrl,
      pdf_url: null, // PDF generation handled client-side
      
      // Consent
      consent_given: formData.consent === 'Yes',
      
      // Metadata
      submitted_at: formData.submissionDate ? new Date(formData.submissionDate) : new Date()
    };

    const { data: intake, error: intakeError } = await supabase
      .from('intakes')
      .insert([intakeData])
      .select()
      .single();

    if (intakeError) {
      console.error('Error creating intake:', intakeError);
      throw intakeError;
    }

    console.log('Intake form saved successfully:', intake.id);

    // ============================================
    // 4. RETURN SUCCESS
    // ============================================

    res.status(201).json({
      success: true,
      message: 'Intake form submitted successfully',
      intakeId: intake.id,
      patientId: patientId,
      photoIdUrl: photoIdUrl,
      signatureUrl: signatureUrl
    });

  } catch (error) {
    console.error('Error processing intake form:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process intake form',
      details: error.message 
    });
  }
}
