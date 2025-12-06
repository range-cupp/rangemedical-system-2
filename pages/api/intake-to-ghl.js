// pages/api/intake-to-ghl.js
// Webhook to send medical intake form data to GoHighLevel

export default async function handler(req, res) {
  // Set CORS headers
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
    const intakeData = req.body;
    
    console.log('📥 Received intake data:', {
      name: `${intakeData.firstName} ${intakeData.lastName}`,
      email: intakeData.email,
      phone: intakeData.phone
    });

    // GoHighLevel API Configuration
    const GHL_API_KEY = process.env.GHL_API_KEY;
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.error('❌ Missing GoHighLevel API credentials');
      return res.status(500).json({
        success: false,
        error: 'GoHighLevel API not configured. Add GHL_API_KEY and GHL_LOCATION_ID to environment variables.'
      });
    }

    // Format phone number for GHL (should be +1XXXXXXXXXX)
    let formattedPhone = intakeData.phone || '';
    formattedPhone = formattedPhone.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Build contact data for GoHighLevel
    const contactData = {
      firstName: intakeData.firstName || '',
      lastName: intakeData.lastName || '',
      email: intakeData.email || '',
      phone: formattedPhone,
      dateOfBirth: intakeData.dateOfBirth || '',
      address1: intakeData.streetAddress || intakeData.address || '',
      city: intakeData.city || '',
      state: intakeData.state || '',
      postalCode: intakeData.postalCode || intakeData.zipCode || '',
      country: intakeData.country || 'US',
      locationId: GHL_LOCATION_ID,
      source: 'Medical Intake Form',
      tags: ['intake-form-completed'],
      customFields: [
        {
          key: 'medical_intake_form',
          field_value: 'Complete'
        }
      ]
    };

    console.log('📤 Sending to GoHighLevel:', {
      name: `${contactData.firstName} ${contactData.lastName}`,
      email: contactData.email,
      locationId: GHL_LOCATION_ID
    });

    // Step 1: Search for existing contact by email
    let contactId = null;
    
    try {
      const searchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(contactData.email)}`,
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
        if (searchResult.contact && searchResult.contact.id) {
          contactId = searchResult.contact.id;
          console.log('✅ Found existing contact:', contactId);
        }
      }
    } catch (searchError) {
      console.log('⚠️ Contact search failed, will create new:', searchError.message);
    }

    // Step 2: Create or Update contact
    let contactResponse;
    
    if (contactId) {
      // Update existing contact
      console.log('📝 Updating existing contact...');
      contactResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            phone: contactData.phone,
            dateOfBirth: contactData.dateOfBirth,
            address1: contactData.address1,
            city: contactData.city,
            state: contactData.state,
            postalCode: contactData.postalCode,
            country: contactData.country,
            customFields: contactData.customFields,
            tags: contactData.tags
          })
        }
      );
    } else {
      // Create new contact
      console.log('📝 Creating new contact...');
      contactResponse = await fetch(
        'https://services.leadconnectorhq.com/contacts/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactData)
        }
      );
    }

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error('❌ GHL API error:', contactResponse.status, errorText);
      throw new Error(`GoHighLevel API error: ${contactResponse.status} - ${errorText}`);
    }

    const contactResult = await contactResponse.json();
    contactId = contactId || contactResult.contact?.id;

    console.log('✅ Contact saved:', contactId);

    // Step 3: If we have a PDF URL, add it to contact notes
    if (intakeData.pdfUrl && contactId) {
      try {
        console.log('📎 Adding PDF link to contact notes...');
        
        await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              body: `📋 Medical Intake Form Submitted\n\nPDF Document: ${intakeData.pdfUrl}\n\nSubmitted: ${new Date().toLocaleString()}`
            })
          }
        );
        
        console.log('✅ Note added with PDF link');
      } catch (noteError) {
        console.warn('⚠️ Could not add note:', noteError.message);
      }
    }

    // Step 4: Add tag to trigger workflow (optional)
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
              tags: ['intake-form-completed', 'new-patient']
            })
          }
        );
        console.log('✅ Tags added');
      } catch (tagError) {
        console.warn('⚠️ Could not add tags:', tagError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: contactId ? 'Contact updated in GoHighLevel' : 'Contact created in GoHighLevel',
      contactId: contactId,
      data: {
        name: `${contactData.firstName} ${contactData.lastName}`,
        email: contactData.email,
        customFieldUpdated: 'medical_intake_form = Complete'
      }
    });

  } catch (error) {
    console.error('❌ Intake to GHL error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
}
