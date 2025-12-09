// /pages/api/symptoms-questionnaire.js
// Saves symptoms questionnaire to Supabase and sends note to GoHighLevel

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
      gender,
      firstName,
      lastName,
      dateOfBirth,
      assessmentDate,
      email,
      phone,
      additionalNotes,
      symptoms,
      signatureData,
      noteText
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, firstName, lastName'
      });
    }

    const GHL_API_KEY = process.env.GHL_API_KEY;
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

    let results = {
      success: true,
      ghlContactFound: false,
      ghlNoteAdded: false,
      supabaseSaved: false,
      errors: []
    };

    // Format phone for GHL (+1XXXXXXXXXX)
    let formattedPhone = phone || '';
    formattedPhone = formattedPhone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    }

    // ========================================
    // STEP 1: Find or create contact in GHL
    // ========================================
    let contactId = null;

    if (GHL_API_KEY) {
      try {
        console.log('🔍 Searching for contact in GHL:', email);

        // Search for existing contact
        const searchResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            }
          }
        );

        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          if (searchResult.contact?.id) {
            contactId = searchResult.contact.id;
            results.ghlContactFound = true;
            console.log('✅ Found existing contact:', contactId);
          }
        }

        // If no contact found, create one
        if (!contactId) {
          console.log('📝 Creating new contact in GHL');
          const createResponse = await fetch(
            'https://services.leadconnectorhq.com/contacts/',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                firstName,
                lastName,
                email,
                phone: formattedPhone,
                dateOfBirth,
                locationId: GHL_LOCATION_ID,
                source: 'Symptoms Questionnaire',
                tags: ['symptoms-questionnaire']
              })
            }
          );

          if (createResponse.ok) {
            const createResult = await createResponse.json();
            contactId = createResult.contact?.id;
            results.ghlContactFound = true;
            console.log('✅ Created new contact:', contactId);
          }
        }

        // Add note to contact
        if (contactId && noteText) {
          console.log('📎 Adding symptoms note to contact...');
          const noteResponse = await fetch(
            `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                body: noteText
              })
            }
          );

          if (noteResponse.ok) {
            results.ghlNoteAdded = true;
            console.log('✅ Note added to contact');
          } else {
            const noteError = await noteResponse.text();
            console.warn('⚠️ Could not add note:', noteError);
            results.errors.push(`GHL note error: ${noteError}`);
          }
        }

        // Add tag
        if (contactId) {
          try {
            await fetch(
              `https://services.leadconnectorhq.com/contacts/${contactId}/tags`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${GHL_API_KEY}`,
                  'Version': '2021-07-28',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  tags: ['symptoms-questionnaire', `${gender}-questionnaire`]
                })
              }
            );
            console.log('✅ Tags added');
          } catch (tagError) {
            console.warn('⚠️ Could not add tags:', tagError.message);
          }
        }

      } catch (ghlError) {
        console.error('❌ GHL error:', ghlError);
        results.errors.push(`GHL error: ${ghlError.message}`);
      }
    } else {
      console.warn('⚠️ GHL_API_KEY not configured');
      results.errors.push('GHL_API_KEY not configured');
    }

    // ========================================
    // STEP 2: Save to Supabase
    // ========================================
    try {
      console.log('💾 Saving to Supabase...');

      // First, find or create patient
      let patientId = null;

      // Check if patient exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('email', email)
        .single();

      if (existingPatient) {
        patientId = existingPatient.id;
        console.log('✅ Found existing patient:', patientId);
      } else {
        // Create new patient
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            date_of_birth: dateOfBirth,
            gender: gender,
            ghl_contact_id: contactId,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (patientError) {
          console.error('Patient insert error:', patientError);
          results.errors.push(`Patient insert error: ${patientError.message}`);
        } else {
          patientId = newPatient.id;
          console.log('✅ Created new patient:', patientId);
        }
      }

      // Save questionnaire
      if (patientId) {
        const { data: questionnaire, error: questionnaireError } = await supabase
          .from('symptoms_questionnaires')
          .insert({
            patient_id: patientId,
            gender: gender,
            assessment_date: assessmentDate,
            symptoms: symptoms,
            additional_notes: additionalNotes,
            signature_data: signatureData,
            ghl_contact_id: contactId,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (questionnaireError) {
          console.error('Questionnaire insert error:', questionnaireError);
          results.errors.push(`Questionnaire insert error: ${questionnaireError.message}`);
        } else {
          results.supabaseSaved = true;
          results.questionnaireId = questionnaire.id;
          console.log('✅ Questionnaire saved:', questionnaire.id);
        }
      }

    } catch (supabaseError) {
      console.error('❌ Supabase error:', supabaseError);
      results.errors.push(`Supabase error: ${supabaseError.message}`);
    }

    // Return results
    return res.status(200).json(results);

  } catch (error) {
    console.error('❌ Symptoms questionnaire error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
}
