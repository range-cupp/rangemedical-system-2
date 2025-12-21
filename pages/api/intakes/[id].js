// /pages/api/intakes.js
// Medical Intake Form API
// Range Medical
//
// Now captures ghl_contact_id from form submission (passed via URL parameter)
// Auto-links to patient record via ghl_contact_id

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS
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
    const data = req.body;
    
    console.log('📋 Intake submission received');
    console.log('  - Name:', data.firstName, data.lastName);
    console.log('  - Email:', data.email);
    console.log('  - GHL Contact ID:', data.ghlContactId || '(none)');

    // Try to find existing patient by ghl_contact_id first, then email, then phone
    let patientId = null;
    let patientCreated = false;
    
    // 1. Try ghl_contact_id (most reliable)
    if (data.ghlContactId) {
      const { data: patientByGhl } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', data.ghlContactId)
        .single();
      
      if (patientByGhl) {
        patientId = patientByGhl.id;
        console.log('  - Found patient by GHL ID:', patientId);
      }
    }
    
    // 2. Try email
    if (!patientId && data.email) {
      const { data: patientByEmail } = await supabase
        .from('patients')
        .select('id')
        .ilike('email', data.email)
        .single();
      
      if (patientByEmail) {
        patientId = patientByEmail.id;
        console.log('  - Found patient by email:', patientId);
      }
    }
    
    // 3. Try phone
    if (!patientId && data.phone) {
      const normalizedPhone = data.phone.replace(/\D/g, '').slice(-10);
      const { data: patients } = await supabase
        .from('patients')
        .select('id, phone');
      
      const match = patients?.find(p => {
        const pPhone = p.phone?.replace(/\D/g, '').slice(-10);
        return pPhone === normalizedPhone;
      });
      
      if (match) {
        patientId = match.id;
        console.log('  - Found patient by phone:', patientId);
      }
    }

    // 4. If no patient found, CREATE one from intake data
    if (!patientId) {
      console.log('  - No patient found, creating new patient...');
      
      const newPatient = {
        ghl_contact_id: data.ghlContactId || null,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender,
        address: data.streetAddress,
        city: data.city,
        state: data.state,
        zip: data.postalCode,
        country: data.country,
        source: 'intake_form',
        created_at: new Date().toISOString()
      };

      const { data: createdPatient, error: createError } = await supabase
        .from('patients')
        .insert(newPatient)
        .select()
        .single();

      if (createError) {
        console.error('  - Failed to create patient:', createError.message);
        // Continue anyway - intake will be saved without patient link
      } else {
        patientId = createdPatient.id;
        patientCreated = true;
        console.log('  - ✅ Created new patient:', patientId);
      }
    }

    // Insert intake record
    const intakeData = {
      patient_id: patientId,
      ghl_contact_id: data.ghlContactId || null,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      date_of_birth: data.dateOfBirth || null,
      gender: data.gender,
      street_address: data.streetAddress,
      city: data.city,
      state: data.state,
      country: data.country,
      postal_code: data.postalCode,
      what_brings_you_in: data.whatBringsYou,
      currently_injured: data.injured === 'Yes',
      injury_description: data.injuryDescription,
      injury_location: data.injuryLocation,
      injury_when_occurred: data.injuryDate,
      medical_conditions: data.medicalHistory,
      on_hrt: data.onHRT === 'Yes',
      hrt_details: data.hrtDetails,
      on_medications: data.onMedications === 'Yes',
      current_medications: data.currentMedications,
      medication_notes: data.medicationNotes,
      has_allergies: data.hasAllergies === 'Yes',
      allergies: data.allergies,
      allergy_reactions: data.allergyReactions,
      guardian_name: data.guardianName,
      photo_id_url: data.photoIdUrl,
      signature_url: data.signatureUrl,
      pdf_url: data.pdfUrl,
      consent_given: data.consent === 'Yes',
      submitted_at: new Date().toISOString()
    };

    const { data: intake, error: intakeError } = await supabase
      .from('intakes')
      .insert(intakeData)
      .select()
      .single();

    if (intakeError) {
      console.error('❌ Intake insert error:', intakeError);
      throw intakeError;
    }

    console.log('✅ Intake saved:', intake.id);
    console.log('  - Patient:', patientId, patientCreated ? '(NEW)' : '(existing)');

    return res.status(200).json({
      success: true,
      intakeId: intake.id,
      patientId: patientId,
      patientCreated: patientCreated,
      linked: !!patientId
    });

  } catch (error) {
    console.error('Intake API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
