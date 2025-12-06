// pages/api/intakes/index.js
// Handles intake form submissions - saves to Supabase database

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return all intakes (for admin view)
    try {
      const { data, error } = await supabase
        .from('intakes')
        .select('*, patients(id, name, email)')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching intakes:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = req.body;

    console.log('📥 Received intake submission:', {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email
    });

    // Validate required fields
    if (!formData.email || !formData.firstName || !formData.lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email'
      });
    }

    const email = formData.email.toLowerCase().trim();

    // ============================================
    // 1. FIND OR CREATE PATIENT
    // ============================================

    let patientId;
    let isNewPatient = false;

    // Check if patient exists by email
    const { data: existingPatient, error: findError } = await supabase
      .from('patients')
      .select('id, name, email')
      .eq('email', email)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding patient:', findError);
      throw findError;
    }

    if (existingPatient) {
      // Update existing patient
      console.log('📝 Updating existing patient:', existingPatient.id);
      
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone || null,
          date_of_birth: formData.dateOfBirth || null,
          address: formData.streetAddress || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.postalCode || null
        })
        .eq('id', existingPatient.id);

      if (updateError) throw updateError;
      patientId = existingPatient.id;

    } else {
      // Create new patient
      console.log('🆕 Creating new patient...');
      
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert([{
          name: `${formData.firstName} ${formData.lastName}`,
          email: email,
          phone: formData.phone || null,
          date_of_birth: formData.dateOfBirth || null,
          address: formData.streetAddress || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.postalCode || null
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating patient:', createError);
        throw createError;
      }

      patientId = newPatient.id;
      isNewPatient = true;
      console.log('✅ Created patient:', patientId);
    }

    // ============================================
    // 2. UPLOAD FILES TO STORAGE (if provided)
    // ============================================

    let photoIdUrl = null;
    let signatureUrl = null;

    // Upload Photo ID
    if (formData.photoId && formData.photoId.startsWith('data:')) {
      try {
        const base64Data = formData.photoId.split(',')[1];
        const mimeType = formData.photoId.split(';')[0].split(':')[1];
        const extension = mimeType.split('/')[1] || 'jpg';
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = `photo-ids/${patientId}/${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('medical-documents')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('medical-documents')
            .getPublicUrl(filePath);
          photoIdUrl = urlData.publicUrl;
          console.log('✅ Photo ID uploaded:', photoIdUrl);
        }
      } catch (e) {
        console.warn('⚠️ Photo ID upload failed:', e.message);
      }
    }

    // Upload Signature
    if (formData.signature && formData.signature.startsWith('data:')) {
      try {
        const base64Data = formData.signature.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = `signatures/${patientId}/${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from('medical-documents')
          .upload(filePath, buffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('medical-documents')
            .getPublicUrl(filePath);
          signatureUrl = urlData.publicUrl;
          console.log('✅ Signature uploaded:', signatureUrl);
        }
      } catch (e) {
        console.warn('⚠️ Signature upload failed:', e.message);
      }
    }

    // ============================================
    // 3. CREATE INTAKE RECORD
    // ============================================

    const intakeData = {
      patient_id: patientId,

      // Personal Information
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: email,
      phone: formData.phone || null,
      date_of_birth: formData.dateOfBirth || null,
      gender: formData.gender || null,

      // Address
      street_address: formData.streetAddress || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postalCode || null,

      // Health Concerns
      what_brings_you_in: formData.whatBringsYou || null,
      currently_injured: formData.injured === 'Yes',
      injury_description: formData.injuryDescription || null,
      injury_location: formData.injuryLocation || null,
      injury_when_occurred: formData.injuryDate || null,

      // Medical History (store as JSONB)
      medical_conditions: formData.medicalHistory || {},

      // Medications & HRT
      on_hrt: formData.onHRT === 'Yes',
      hrt_details: formData.hrtDetails || null,
      on_other_medications: formData.onMedications === 'Yes',
      current_medications: formData.currentMedications || null,
      medication_notes: formData.medicationNotes || null,

      // Allergies
      has_allergies: formData.hasAllergies === 'Yes',
      allergies: formData.allergies || null,
      allergy_reactions: formData.allergyReactions || null,

      // Guardian
      guardian_name: formData.guardianName || null,

      // File URLs
      photo_id_url: photoIdUrl,
      signature_url: signatureUrl,
      pdf_url: formData.pdfUrl || null,

      // Consent
      consent_given: formData.consent === 'Yes',

      // Metadata
      submitted_at: new Date().toISOString()
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

    console.log('✅ Intake saved:', intake.id);

    // ============================================
    // 4. RETURN SUCCESS
    // ============================================

    return res.status(201).json({
      success: true,
      message: isNewPatient ? 'New patient and intake created' : 'Intake added to existing patient',
      intakeId: intake.id,
      patientId: patientId,
      isNewPatient: isNewPatient,
      photoIdUploaded: !!photoIdUrl,
      signatureUploaded: !!signatureUrl
    });

  } catch (error) {
    console.error('❌ Intake submission error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
}
