// pages/api/intake-to-ghl.js
// Webhook to send medical intake form data to GoHighLevel

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const intakeData = req.body;
    
    // GoHighLevel API Configuration
    const GHL_API_KEY = process.env.GHL_API_KEY; // Add to Vercel env vars
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID; // Add to Vercel env vars
    
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.error('Missing GoHighLevel API credentials');
      return res.status(500).json({ 
        success: false, 
        error: 'GoHighLevel API not configured' 
      });
    }

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
      customFields: [
        {
          key: 'medical_intake_form',
          field_value: 'Complete'
        }
      ]
    };

    console.log('Creating/updating contact in GoHighLevel:', {
      email: contactData.email,
      name: `${contactData.firstName} ${contactData.lastName}`
    });

    // Step 1: Create or update contact in GoHighLevel
    const contactResponse = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
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

    const contact = await contactResponse.json();
    const contactId = contact.contact?.id;

    console.log('Contact created/updated:', contactId);

    // Step 2: Upload PDF if provided
    if (intakeData.pdfUrl || intakeData.pdf_url) {
      const pdfUrl = intakeData.pdfUrl || intakeData.pdf_url;
      
      console.log('Uploading PDF to GoHighLevel:', pdfUrl);

      // Download the PDF
      const pdfResponse = await fetch(pdfUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

      // Upload to GoHighLevel
      const uploadResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
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
    }

    // Step 3: Mark custom field as complete (already done in contact creation)
    console.log('Custom field "Medical Intake Form" marked as Complete');

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
