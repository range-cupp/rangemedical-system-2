// pages/api/intake-to-ghl.js
// Syncs intake form data to GoHighLevel - creates/updates contact

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.error('Missing GHL credentials');
    return res.status(500).json({ error: 'GHL configuration missing' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      zip,
      customFieldKey,
      customFieldValue,
      tags,
      signatureUrl,
      pdfUrl,
      intakeData
    } = req.body;

    // Format phone number for GHL (remove non-digits, ensure +1 prefix)
    let formattedPhone = phone?.replace(/\D/g, '');
    if (formattedPhone && formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone && formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    }

    // First, try to find existing contact by email or phone
    let contactId = null;
    
    const searchParams = new URLSearchParams({
      locationId: GHL_LOCATION_ID,
      query: email || formattedPhone
    });

    const searchResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/?${searchParams}`,
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
      const searchData = await searchResponse.json();
      if (searchData.contacts && searchData.contacts.length > 0) {
        contactId = searchData.contacts[0].id;
        console.log('Found existing contact:', contactId);
      }
    }

    // Build custom fields object
    const customFields = [];
    if (customFieldKey && customFieldValue) {
      customFields.push({
        key: customFieldKey,
        field_value: customFieldValue
      });
    }
    
    // Add signature URL as custom field
    if (signatureUrl) {
      customFields.push({
        key: 'intake_signature_url',
        field_value: signatureUrl
      });
    }

    // Build notes from intake data
    let notes = `MEDICAL INTAKE FORM SUBMITTED\n`;
    notes += `Date: ${new Date().toLocaleDateString()}\n`;
    notes += `Patient: ${firstName} ${lastName}\n`;
    notes += `Email: ${email || 'N/A'}\n`;
    notes += `Phone: ${phone || 'N/A'}\n`;
    notes += `DOB: ${dateOfBirth || 'N/A'}\n`;
    notes += `\n`;
    
    if (intakeData) {
      if (intakeData.whatBringsYou) {
        notes += `What brings you in: ${intakeData.whatBringsYou}\n`;
      }
      if (intakeData.injured === 'Yes') {
        notes += `Injured: Yes\n`;
        if (intakeData.injuryDescription) {
          notes += `Injury details: ${intakeData.injuryDescription}\n`;
        }
      }
      if (intakeData.conditions && intakeData.conditions !== 'None') {
        notes += `Medical conditions: ${intakeData.conditions}\n`;
      }
      if (intakeData.onHRT === 'Yes') {
        notes += `On HRT: Yes\n`;
        if (intakeData.hrtDetails) {
          notes += `HRT details: ${intakeData.hrtDetails}\n`;
        }
      }
      if (intakeData.onMedications === 'Yes') {
        notes += `On medications: Yes\n`;
        if (intakeData.currentMedications) {
          notes += `Current medications: ${intakeData.currentMedications}\n`;
        }
      }
      if (intakeData.hasAllergies === 'Yes') {
        notes += `Has allergies: Yes\n`;
        if (intakeData.allergies) {
          notes += `Allergies: ${intakeData.allergies}\n`;
        }
      }
    }
    
    if (pdfUrl) {
      notes += `\nPDF: ${pdfUrl}\n`;
    }
    
    if (signatureUrl) {
      notes += `Signature: ${signatureUrl}\n`;
    }

    // Build contact payload
    const contactPayload = {
      firstName,
      lastName,
      email,
      phone: formattedPhone,
      locationId: GHL_LOCATION_ID,
      tags: tags || [],
      customFields: customFields.length > 0 ? customFields : undefined
    };

    // Add address if provided
    if (address) contactPayload.address1 = address;
    if (city) contactPayload.city = city;
    if (state) contactPayload.state = state;
    if (zip) contactPayload.postalCode = zip;

    // Add date of birth if provided (format: YYYY-MM-DD for GHL)
    if (dateOfBirth) {
      // Convert MM/DD/YYYY to YYYY-MM-DD if needed
      let dobFormatted = dateOfBirth;
      if (dateOfBirth.includes('/')) {
        const [month, day, year] = dateOfBirth.split('/');
        dobFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      contactPayload.dateOfBirth = dobFormatted;
    }

    let response;
    
    if (contactId) {
      // Update existing contact
      response = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactPayload)
        }
      );
    } else {
      // Create new contact
      response = await fetch(
        'https://services.leadconnectorhq.com/contacts/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactPayload)
        }
      );
    }

    const result = await response.json();

    if (!response.ok) {
      console.error('GHL API Error:', result);
      return res.status(response.status).json({ 
        error: 'GHL sync failed', 
        details: result 
      });
    }

    // Get the contact ID from response
    const finalContactId = contactId || result.contact?.id;

    // Add a note to the contact with intake details
    if (finalContactId) {
      try {
        console.log('Adding note to contact:', finalContactId);
        console.log('Note content:', notes);
        
        const noteResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/${finalContactId}/notes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              body: notes,
              userId: null // System note
            })
          }
        );
        
        if (!noteResponse.ok) {
          const noteError = await noteResponse.json();
          console.error('Failed to add note - Status:', noteResponse.status);
          console.error('Note error details:', noteError);
        } else {
          console.log('✅ Note added successfully');
        }
      } catch (noteError) {
        console.error('Failed to add note:', noteError);
        // Don't fail the whole request for note errors
      }
    } else {
      console.error('No contact ID available for note');
    }

    console.log('GHL sync successful:', finalContactId);
    
    return res.status(200).json({ 
      success: true, 
      contactId: finalContactId,
      action: contactId ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('GHL sync error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
