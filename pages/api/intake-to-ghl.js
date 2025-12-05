// pages/api/intake-to-ghl.js
// Enhanced webhook: Saves to GoHighLevel AND Range Medical database

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
    const intakeData = req.body;
    
    // GoHighLevel API v2.0 Configuration
    const GHL_API_KEY = 'pit-e2ba8047-4b3a-48ba-b105-dc67e936d71b';
    const GHL_LOCATION_ID = 'WICdvbXmTjQORW6GiHWW';
    
    console.log('=== Dual Integration Start ===');
    console.log('Processing intake for:', intakeData.email);

    // ============================================================
    // STEP 1: CREATE CONTACT IN GOHIGHLEVEL
    // ============================================================
    const contactData = {
      firstName: intakeData.firstName || '',
      lastName: intakeData.lastName || '',
      email: intakeData.email || '',
      phone: intakeData.phone || '',
      dateOfBirth: intakeData.dateOfBirth || '',
      address1: intakeData.address || '',
      city: intakeData.city || '',
      state: intakeData.state || '',
      postalCode: intakeData.zipCode || '',
      country: 'US',
      locationId: GHL_LOCATION_ID
    };

    console.log('Step 1: Creating GoHighLevel contact...');
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
      console.log('✅ GHL Contact created:', contactId);

      // Update custom field
      try {
        const updateResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            customFields: [{ key: 'medical_intake_form', field_value: 'Complete' }]
          })
        });
        if (updateResponse.ok) {
          results.customFieldUpdated = true;
          console.log('✅ Custom field updated');
        }
      } catch (e) {
        console.warn('⚠️ Custom field update failed:', e.message);
      }

      // Add note with PDF link
      if (intakeData.pdfUrl) {
        console.log('Step 2: Adding note with PDF link...');
        console.log('PDF URL:', intakeData.pdfUrl);
        
        try {
          const noteResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28'
            },
            body: JSON.stringify({
              body: `📄 Medical Intake Form Completed

View PDF: ${intakeData.pdfUrl}

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Patient: ${intakeData.firstName} ${intakeData.lastName}
Email: ${intakeData.email}`,
              userId: contactId
            })
          });

          const noteText = await noteResponse.text();
          console.log('Note response:', noteResponse.status, noteText);

          if (noteResponse.ok) {
            results.noteAdded = true;
            console.log('✅ Note added with PDF link');
          } else {
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
      // Import Supabase client dynamically (works better in serverless)
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseClient = createClient(
        'https://teivfptpozltpqwahgdl.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMxNDksImV4cCI6MjA4MDI4OTE0OX0.NrI1AykMBOh91mM9BFvpSH0JwzGrkv5ADDkZinh0elc'
      );

      // First, create or get patient
      const patientData = {
        name: `${intakeData.firstName} ${intakeData.lastName}`,
        email: intakeData.email,
        phone: intakeData.phone || '',
        date_of_birth: intakeData.dateOfBirth || null,
        gender: intakeData.gender || null,
        address: intakeData.address || '',
        city: intakeData.city || '',
        state: intakeData.state || '',
        zip_code: intakeData.zipCode || '',
        created_at: new Date().toISOString()
      };

      // Check if patient exists
      const { data: existingPatient } = await supabaseClient
        .from('patients')
        .select('id')
        .eq('email', intakeData.email)
        .single();

      let patientId;

      if (existingPatient) {
        // Update existing patient
        const { error: updateError } = await supabaseClient
          .from('patients')
          .update(patientData)
          .eq('id', existingPatient.id);

        if (updateError) throw updateError;
        patientId = existingPatient.id;
        console.log('✅ Patient updated:', patientId);
      } else {
        // Create new patient
        const { data: newPatient, error: insertError } = await supabaseClient
          .from('patients')
          .insert([patientData])
          .select()
          .single();

        if (insertError) throw insertError;
        patientId = newPatient.id;
        console.log('✅ Patient created:', patientId);
      }

      // Save medical intake document
      if (intakeData.pdfUrl && patientId) {
        const { error: docError } = await supabaseClient
          .from('medical_documents')
          .insert([{
            patient_id: patientId,
            document_type: 'Medical Intake Form',
            document_url: intakeData.pdfUrl,
            uploaded_at: new Date().toISOString(),
            notes: 'Completed via online intake form'
          }]);

        if (docError) {
          console.warn('⚠️ Document save failed:', docError.message);
          results.errors.push(`Document: ${docError.message}`);
        } else {
          console.log('✅ Medical document saved');
        }
      }

      results.rangeDbSaved = true;
      console.log('✅ Range Medical database updated');

    } catch (dbError) {
      console.error('❌ Range Medical DB error:', dbError);
      results.errors.push(`Range DB: ${dbError.message}`);
    }

    console.log('\n=== Dual Integration Complete ===');
    console.log('Results:', JSON.stringify(results, null, 2));

    return res.status(200).json({ 
      success: true,
      ...results,
      message: 'Data saved to GoHighLevel and Range Medical database'
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
