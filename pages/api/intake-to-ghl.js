// pages/api/intake-to-ghl.js
// Webhook to send medical intake form data to GoHighLevel API v2.0
// SIMPLIFIED VERSION - Creates contact without custom field first

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

    // Simple contact data - NO custom fields yet
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

    console.log('Contact data:', JSON.stringify(contactData, null, 2));

    // Step 1: Create contact
    console.log('Calling GoHighLevel API...');
    const contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(contactData)
    });

    const responseText = await contactResponse.text();
    console.log('GHL Status:', contactResponse.status);
    console.log('GHL Response:', responseText);

    if (!contactResponse.ok) {
      console.error('❌ GoHighLevel API Error');
      return res.status(500).json({ 
        success: false, 
        error: 'GoHighLevel API error',
        status: contactResponse.status,
        details: responseText
      });
    }

    const result = JSON.parse(responseText);
    const contactId = result.contact?.id || result.id;

    console.log('✅ Contact created:', contactId);

    // Step 2: Add PDF URL as a note
    if (intakeData.pdfUrl && contactId) {
      console.log('Adding PDF URL as note...');
      try {
        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            body: `📄 Medical Intake Form completed\n\nPDF: ${intakeData.pdfUrl}`,
            userId: contactId
          })
        });
        console.log('✅ Note added with PDF link');
      } catch (noteError) {
        console.warn('⚠️ Could not add note:', noteError.message);
      }
    }

    console.log('=== GoHighLevel Integration Complete ===');

    return res.status(200).json({ 
      success: true, 
      contactId,
      message: 'Contact created in GoHighLevel'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
}
