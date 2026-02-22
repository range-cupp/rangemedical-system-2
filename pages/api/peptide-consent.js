// pages/api/peptide-consent.js
// Webhook for peptide consent forms - saves to GoHighLevel AND Range Medical database

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    contactCreated: false,
    contactId: null,
    customFieldUpdated: false,
    noteAdded: false,
    rangeDbSaved: false,
    errors: []
  };

  try {
    const consentData = req.body;
    
    // GoHighLevel API v2.0 Configuration
    const GHL_API_KEY = process.env.GHL_API_KEY;
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
    
    console.log('=== Peptide Consent Integration Start ===');
    console.log('Processing consent for:', consentData.email);

    // ============================================================
    // STEP 1: CREATE/UPDATE CONTACT IN GOHIGHLEVEL
    // ============================================================
    const contactData = {
      firstName: consentData.firstName || '',
      lastName: consentData.lastName || '',
      email: consentData.email || '',
      phone: consentData.phone || '',
      dateOfBirth: consentData.dateOfBirth || '',
      country: 'US',
      locationId: GHL_LOCATION_ID
    };

    console.log('Step 1: Creating/updating GoHighLevel contact...');
    const contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(contactData)
    });

    if (contactResponse.ok) {
      const result = await contactResponse.json();
      const contactId = result.contact?.id || result.id;
      results.contactCreated = true;
      results.contactId = contactId;
      console.log('✅ GHL Contact created/updated:', contactId);

      // Update custom field for peptide consent
      try {
        const updateResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            customFields: [{ key: 'peptide_consent', field_value: 'Complete' }]
          })
        });
        
        if (updateResponse.ok) {
          results.customFieldUpdated = true;
          console.log('✅ Custom field "peptide_consent" marked as Complete');
        }
      } catch (e) {
        console.warn('⚠️ Custom field update failed:', e.message);
      }

      // Add note with PDF link
      if (consentData.pdfUrl) {
        console.log('Step 2: Adding note with peptide consent PDF...');
        
        try {
          const noteResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28'
            },
            body: JSON.stringify({
              body: `💉 Peptide Therapy & Injection Consent Signed

View PDF: ${consentData.pdfUrl}

Consent Date: ${consentData.consentDate}
Date Submitted: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Patient: ${consentData.firstName} ${consentData.lastName}
Email: ${consentData.email}`,
              userId: contactId
            })
          });

          if (noteResponse.ok) {
            results.noteAdded = true;
            console.log('✅ Note added with peptide consent PDF link');
          } else {
            const noteText = await noteResponse.text();
            console.error('❌ Note creation failed:', noteText);
            results.errors.push(`Note: Status ${noteResponse.status}`);
          }
        } catch (noteError) {
          console.error('❌ Note error:', noteError);
          results.errors.push(`Note: ${noteError.message}`);
        }
      }
    } else {
      const errorText = await contactResponse.text();
      console.error('❌ GHL contact creation failed:', errorText);
      results.errors.push(`GHL contact: ${errorText}`);
    }

    // ============================================================
    // STEP 2: SAVE TO RANGE MEDICAL DATABASE
    // ============================================================
    console.log('\nStep 3: Saving to Range Medical database...');
    
    try {
      // Import Supabase client dynamically
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Check if patient exists
      const { data: existingPatient } = await supabaseClient
        .from('patients')
        .select('id')
        .eq('email', consentData.email)
        .single();

      let patientId;

      if (existingPatient) {
        // Update existing patient
        const { error: updateError } = await supabaseClient
          .from('patients')
          .update({
            phone: consentData.phone || '',
            date_of_birth: consentData.dateOfBirth || null
          })
          .eq('id', existingPatient.id);

        if (updateError) throw updateError;
        patientId = existingPatient.id;
        console.log('✅ Patient updated:', patientId);
      } else {
        // Create new patient
        const { data: newPatient, error: insertError } = await supabaseClient
          .from('patients')
          .insert([{
            name: `${consentData.firstName} ${consentData.lastName}`,
            email: consentData.email,
            phone: consentData.phone || '',
            date_of_birth: consentData.dateOfBirth || null,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        patientId = newPatient.id;
        console.log('✅ Patient created:', patientId);
      }

      // Save peptide consent document
      if (consentData.pdfUrl && patientId) {
        const { error: docError } = await supabaseClient
          .from('medical_documents')
          .insert([{
            patient_id: patientId,
            document_type: 'Peptide Therapy Consent',
            document_url: consentData.pdfUrl,
            uploaded_at: new Date().toISOString(),
            notes: `Signed on ${consentData.consentDate}`
          }]);

        if (docError) {
          console.warn('⚠️ Document save failed:', docError.message);
          results.errors.push(`Document: ${docError.message}`);
        } else {
          console.log('✅ Peptide consent document saved');
        }
      }

      results.rangeDbSaved = true;
      console.log('✅ Range Medical database updated');

    } catch (dbError) {
      console.error('❌ Range Medical DB error:', dbError);
      results.errors.push(`Range DB: ${dbError.message}`);
    }

    console.log('\n=== Peptide Consent Integration Complete ===');
    console.log('Results:', JSON.stringify(results, null, 2));

    return res.status(200).json({ 
      success: true,
      ...results,
      message: 'Peptide consent saved to GoHighLevel and Range Medical database'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      results: results
    });
  }
}
