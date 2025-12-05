// pages/api/intake-to-ghl.js
// Webhook to send medical intake form data to GoHighLevel API v2.0

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const intakeData = req.body;
    
    // GoHighLevel API v2.0 Configuration
    const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-e2ba8047-4b3a-48ba-b105-dc67e936d71b';
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';
    
    console.log('Processing intake form for GoHighLevel...');

    // Extract demographic data
    const contactData = {
      firstName: intakeData.firstName || intakeData.first_name || '',
      lastName: intakeData.lastName || intakeData.last_name || '',
      email: intakeData.email || '',
      phone: intakeData.phone || '',
      dateOfBirth: intakeData.dateOfBirth || intakeData.dob || '',
      address1: intakeData.address || intakeData.street_address || '',
      city: intakeData.city || '',
      state: intakeData.state || '',
      postalCode: intakeData.zipCode || intakeData.zip || intakeData.postal_code || '',
      country: intakeData.country || 'US',
      locationId: GHL_LOCATION_ID,
      customField: {
        medical_intake_form: 'Complete'
      }
    };

    console.log('Creating/updating contact in GoHighLevel:', {
      email: contactData.email,
      name: `${contactData.firstName} ${contactData.lastName}`
    });

    // Step 1: Create or update contact in GoHighLevel (API v2.0)
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
      console.error('GoHighLevel contact creation failed:', errorText);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create contact in GoHighLevel',
        details: errorText
      });
    }

    const contactResult = await contactResponse.json();
    const contactId = contactResult.contact?.id;

    console.log('Contact created/updated:', contactId);

    // Step 2: Upload PDF if provided
    if (intakeData.pdfUrl || intakeData.pdf_url) {
      const pdfUrl = intakeData.pdfUrl || intakeData.pdf_url;
      
      console.log('Uploading PDF to GoHighLevel:', pdfUrl);

      try {
        // Upload file to contact using API v2.0
        const uploadResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/files/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileUrl: pdfUrl,
            fileName: `Medical_Intake_${contactData.firstName}_${contactData.lastName}.pdf`
          })
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('PDF upload failed:', errorText);
          // Don't fail the whole request if PDF upload fails
        } else {
          console.log('PDF uploaded successfully');
        }
      } catch (uploadError) {
        console.error('PDF upload error:', uploadError);
        // Continue even if upload fails
      }
    }

    // Step 3: Update custom field to mark as complete
    try {
      const updateResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customField: {
            medical_intake_form: 'Complete'
          }
        })
      });

      if (updateResponse.ok) {
        console.log('Custom field "Medical Intake Form" marked as Complete');
      }
    } catch (updateError) {
      console.error('Custom field update error:', updateError);
      // Continue even if custom field update fails
    }

    return res.status(200).json({ 
      success: true, 
      contactId,
      message: 'Contact created and intake form marked as complete in GoHighLevel'
    });

  } catch (error) {
    console.error('Error processing intake form:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
