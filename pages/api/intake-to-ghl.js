// pages/api/intake-to-ghl.js
// Fault-tolerant webhook: Creates contact, then tries custom field + PDF
// Returns success even if custom field or PDF upload fail

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    contactCreated: false,
    contactId: null,
    customFieldUpdated: false,
    pdfUploaded: false,
    errors: []
  };

  try {
    const intakeData = req.body;
    
    // GoHighLevel API v2.0 Configuration
    const GHL_API_KEY = 'pit-e2ba8047-4b3a-48ba-b105-dc67e936d71b';
    const GHL_LOCATION_ID = 'WICdvbXmTjQORW6GiHWW';
    
    console.log('=== GoHighLevel Integration Start ===');
    console.log('Processing intake for:', intakeData.email);

    // ============================================================
    // STEP 1: CREATE CONTACT (CRITICAL - Must succeed)
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

    console.log('Step 1: Creating contact...');
    const contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(contactData)
    });

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error('❌ Contact creation failed:', errorText);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create contact',
        details: errorText
      });
    }

    const result = await contactResponse.json();
    const contactId = result.contact?.id || result.id;
    
    results.contactCreated = true;
    results.contactId = contactId;
    console.log('✅ Contact created:', contactId);

    // ============================================================
    // STEP 2: UPDATE CUSTOM FIELD (Non-critical - log if fails)
    // ============================================================
    if (contactId) {
      console.log('\nStep 2: Updating custom field...');
      try {
        // Try format 1: customFields array
        const updateResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            customFields: [
              {
                key: 'medical_intake_form',
                field_value: 'Complete'
              }
            ]
          })
        });

        const updateText = await updateResponse.text();
        console.log('Custom field update response:', updateResponse.status, updateText);

        if (updateResponse.ok) {
          results.customFieldUpdated = true;
          console.log('✅ Custom field updated (format 1)');
        } else {
          // Try format 2: customField object
          console.log('Trying alternative custom field format...');
          const altResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28'
            },
            body: JSON.stringify({
              customField: {
                medical_intake_form: 'Complete'
              }
            })
          });
          
          if (altResponse.ok) {
            results.customFieldUpdated = true;
            console.log('✅ Custom field updated (format 2)');
          } else {
            const altText = await altResponse.text();
            console.warn('⚠️ Custom field update failed:', altText);
            results.errors.push(`Custom field: ${altText}`);
          }
        }
      } catch (updateError) {
        console.warn('⚠️ Custom field error:', updateError.message);
        results.errors.push(`Custom field: ${updateError.message}`);
      }
    }

    // ============================================================
    // STEP 3: UPLOAD PDF (Non-critical - log if fails)
    // ============================================================
    if (intakeData.pdfUrl && contactId) {
      console.log('\nStep 3: Uploading PDF to documents...');
      console.log('PDF URL:', intakeData.pdfUrl);
      
      try {
        // Method 1: Upload by URL
        console.log('Trying method 1: File URL upload...');
        const uploadResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileUrl: intakeData.pdfUrl,
            fileName: `Medical_Intake_${intakeData.firstName}_${intakeData.lastName}.pdf`
          })
        });

        const uploadText = await uploadResponse.text();
        console.log('Upload response:', uploadResponse.status, uploadText);

        if (uploadResponse.ok) {
          results.pdfUploaded = true;
          console.log('✅ PDF uploaded (method 1)');
        } else {
          // Method 2: Download PDF and upload as base64
          console.log('Trying method 2: Base64 upload...');
          
          const pdfResponse = await fetch(intakeData.pdfUrl);
          const pdfBuffer = await pdfResponse.arrayBuffer();
          const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
          
          const base64Response = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              locationId: GHL_LOCATION_ID,
              contactId: contactId,
              fileData: pdfBase64,
              fileName: `Medical_Intake_${intakeData.firstName}_${intakeData.lastName}.pdf`,
              hosted: true
            })
          });

          const base64Text = await base64Response.text();
          console.log('Base64 upload response:', base64Response.status, base64Text);

          if (base64Response.ok) {
            results.pdfUploaded = true;
            console.log('✅ PDF uploaded (method 2)');
          } else {
            // Method 3: Add as note
            console.log('Trying method 3: Add as note...');
            const noteResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                body: `📄 Medical Intake Form Completed\n\nView PDF: ${intakeData.pdfUrl}\n\nDate: ${new Date().toLocaleDateString()}`,
                userId: contactId
              })
            });

            if (noteResponse.ok) {
              results.pdfUploaded = true; // Link added as note
              console.log('✅ PDF link added as note (method 3)');
            } else {
              const noteText = await noteResponse.text();
              console.warn('⚠️ All PDF upload methods failed');
              results.errors.push(`PDF upload: ${noteText}`);
            }
          }
        }
      } catch (uploadError) {
        console.warn('⚠️ PDF upload error:', uploadError.message);
        results.errors.push(`PDF upload: ${uploadError.message}`);
      }
    }

    console.log('\n=== GoHighLevel Integration Complete ===');
    console.log('Results:', JSON.stringify(results, null, 2));

    // Return success if contact was created, even if other steps failed
    return res.status(200).json({ 
      success: true,
      contactId: results.contactId,
      contactCreated: results.contactCreated,
      customFieldUpdated: results.customFieldUpdated,
      pdfUploaded: results.pdfUploaded,
      errors: results.errors,
      message: results.contactCreated 
        ? 'Contact created successfully. Check errors array for any optional step failures.'
        : 'Failed to create contact'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      results: results
    });
  }
}
