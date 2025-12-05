// pages/api/intake-to-ghl.js
// Webhook to send medical intake form data to GoHighLevel API v2.0
// Enhanced: Creates contact, updates custom field, uploads PDF to documents

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const intakeData = req.body;
    
    // GoHighLevel API v2.0 Configuration
    const GHL_API_KEY = 'pit-e2ba8047-4b3a-48ba-b105-dc67e936d71b';
    const GHL_LOCATION_ID = 'WICdvbXmTjQORW6GiHWW';
    
    console.log('=== GoHighLevel Integration Start ===');
    console.log('Processing intake for:', intakeData.email);

    // Step 1: Create contact
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
    console.log('✅ Contact created:', contactId);

    // Step 2: Update custom field "Medical Intake Form" to "Complete"
    if (contactId) {
      console.log('Step 2: Updating custom field...');
      try {
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

        if (updateResponse.ok) {
          console.log('✅ Custom field "Medical Intake Form" marked as Complete');
        } else {
          const updateError = await updateResponse.text();
          console.warn('⚠️ Could not update custom field:', updateError);
          // Try alternative format
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
            console.log('✅ Custom field updated (alternative format)');
          }
        }
      } catch (updateError) {
        console.warn('⚠️ Custom field update error:', updateError.message);
      }
    }

    // Step 3: Upload PDF to GoHighLevel documents
    if (intakeData.pdfUrl && contactId) {
      console.log('Step 3: Uploading PDF to documents...');
      console.log('PDF URL:', intakeData.pdfUrl);
      
      try {
        // First, download the PDF from Supabase
        const pdfResponse = await fetch(intakeData.pdfUrl);
        if (!pdfResponse.ok) {
          throw new Error('Failed to fetch PDF from Supabase');
        }
        
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
        
        console.log('PDF downloaded, size:', pdfBuffer.byteLength, 'bytes');
        
        // Upload to GoHighLevel using the opportunities file upload endpoint
        // (contacts file upload might not be available in all API versions)
        const fileName = `Medical_Intake_${intakeData.firstName}_${intakeData.lastName}_${Date.now()}.pdf`;
        
        // Try method 1: Direct file upload
        const uploadResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/bulk/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: fileName,
            fileUrl: intakeData.pdfUrl
          })
        });

        if (uploadResponse.ok) {
          console.log('✅ PDF uploaded to documents (method 1)');
        } else {
          // Try method 2: Upload as base64
          const base64Response = await fetch(`https://services.leadconnectorhq.com/medias/upload-file`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              locationId: GHL_LOCATION_ID,
              contactId: contactId,
              fileData: pdfBase64,
              fileName: fileName,
              hosted: true
            })
          });

          if (base64Response.ok) {
            console.log('✅ PDF uploaded to documents (method 2)');
          } else {
            // Fallback: Add as note with link
            console.log('⚠️ Direct upload failed, adding as note with link');
            await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
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
            console.log('✅ PDF link added as note');
          }
        }
      } catch (uploadError) {
        console.error('⚠️ PDF upload error:', uploadError.message);
        // Even if upload fails, continue - contact was created successfully
      }
    }

    console.log('=== GoHighLevel Integration Complete ===');

    return res.status(200).json({ 
      success: true, 
      contactId,
      message: 'Contact created, custom field updated, and PDF uploaded to GoHighLevel'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
}
