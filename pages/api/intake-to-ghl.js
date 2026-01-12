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
    console.log('=== INTAKE TO GHL API CALLED ===');
    
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
      signatureUrl,
      pdfUrl,
      photoIdUrl,
      intakeData
    } = req.body;

    // Format phone number for GHL (E.164 format: +1XXXXXXXXXX)
    let formattedPhone = null;
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) {
        formattedPhone = '+1' + digits;
      } else if (digits.length === 11 && digits.startsWith('1')) {
        formattedPhone = '+' + digits;
      }
    }

    console.log('Input phone:', phone);
    console.log('Formatted phone:', formattedPhone);

    // First, try to find existing contact by email or phone
    let contactId = null;
    
    if (email || formattedPhone) {
      const searchQuery = email || formattedPhone;
      const searchParams = new URLSearchParams({
        locationId: GHL_LOCATION_ID,
        query: searchQuery
      });

      console.log('Searching for contact:', searchQuery);

      const searchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/?${searchParams}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
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
    }

    // Build notes from intake data
    let notes = `══════════════════════════════════════\n`;
    notes += `   MEDICAL INTAKE FORM SUBMITTED\n`;
    notes += `══════════════════════════════════════\n\n`;
    notes += `Date: ${new Date().toLocaleDateString()}\n`;
    notes += `Patient: ${firstName} ${lastName}\n`;
    notes += `Email: ${email || 'N/A'}\n`;
    notes += `Phone: ${phone || 'N/A'}\n`;
    notes += `DOB: ${dateOfBirth || 'N/A'}\n`;
    notes += `\n`;
    
    if (intakeData) {
      if (intakeData.whatBringsYou) {
        notes += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        notes += `CHIEF COMPLAINT:\n`;
        notes += `${intakeData.whatBringsYou}\n\n`;
      }
      
      if (intakeData.injured === 'Yes') {
        notes += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        notes += `INJURY:\n`;
        notes += `Currently Injured: Yes\n`;
        if (intakeData.injuryDescription) notes += `Description: ${intakeData.injuryDescription}\n`;
        if (intakeData.injuryLocation) notes += `Location: ${intakeData.injuryLocation}\n`;
        if (intakeData.injuryDate) notes += `When: ${intakeData.injuryDate}\n`;
        notes += `\n`;
      }
      
      // Show all medical history responses
      if (intakeData.medicalHistory) {
        notes += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        notes += `MEDICAL HISTORY:\n`;
        const conditionOrder = [
          'hypertension', 'highCholesterol', 'heartDisease', 
          'diabetes', 'thyroid', 'depression', 
          'kidney', 'liver', 'autoimmune', 'cancer'
        ];
        conditionOrder.forEach(key => {
          const condition = intakeData.medicalHistory[key];
          if (condition) {
            let line = `• ${condition.label}: ${condition.response || 'Not answered'}`;
            if (condition.response === 'Yes') {
              if (condition.type) line += ` (Type: ${condition.type})`;
              if (condition.year) line += ` (Diagnosed: ${condition.year})`;
            }
            notes += line + '\n';
          }
        });
        notes += `\n`;
      }
      
      // HRT
      notes += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      notes += `MEDICATIONS & ALLERGIES:\n`;
      notes += `On HRT: ${intakeData.onHRT || 'N/A'}\n`;
      if (intakeData.onHRT === 'Yes' && intakeData.hrtDetails) {
        notes += `HRT Details: ${intakeData.hrtDetails}\n`;
      }
      
      notes += `On Other Medications: ${intakeData.onMedications || 'N/A'}\n`;
      if (intakeData.onMedications === 'Yes' && intakeData.currentMedications) {
        notes += `Medications: ${intakeData.currentMedications}\n`;
      }
      
      notes += `Has Allergies: ${intakeData.hasAllergies || 'N/A'}\n`;
      if (intakeData.hasAllergies === 'Yes' && intakeData.allergies) {
        notes += `Allergies: ${intakeData.allergies}\n`;
      }
      notes += `\n`;
    }
    
    notes += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    notes += `DOCUMENTS:\n`;
    if (pdfUrl) notes += `PDF: ${pdfUrl}\n`;
    if (photoIdUrl) notes += `Photo ID: ${photoIdUrl}\n`;
    if (signatureUrl) notes += `Signature: ${signatureUrl}\n`;

    // Build MINIMAL contact payload - only include fields with values
    const contactPayload = {
      locationId: GHL_LOCATION_ID
    };
    
    if (firstName) contactPayload.firstName = firstName;
    if (lastName) contactPayload.lastName = lastName;
    if (email) contactPayload.email = email;
    if (formattedPhone) contactPayload.phone = formattedPhone;
    if (address) contactPayload.address1 = address;
    if (city) contactPayload.city = city;
    if (state) contactPayload.state = state;
    if (zip) contactPayload.postalCode = zip;

    // Format DOB for GHL (YYYY-MM-DD)
    if (dateOfBirth) {
      let dobFormatted = dateOfBirth;
      if (dateOfBirth.includes('/')) {
        const parts = dateOfBirth.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts;
          dobFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      contactPayload.dateOfBirth = dobFormatted;
    }

    console.log('Contact payload:', JSON.stringify(contactPayload, null, 2));

    let response;
    let finalContactId = contactId;
    
    if (contactId) {
      // Update existing contact
      console.log('Updating existing contact:', contactId);
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
      console.log('Creating new contact');
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

    const responseText = await response.text();
    console.log('GHL Response status:', response.status);
    console.log('GHL Response body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse GHL response:', responseText);
      return res.status(500).json({ 
        error: 'Invalid GHL response', 
        details: responseText 
      });
    }

    if (!response.ok) {
      console.error('GHL API Error:', result);
      return res.status(response.status).json({ 
        error: 'GHL sync failed', 
        details: result 
      });
    }

    // Get contact ID from response if we created a new one
    if (!finalContactId && result.contact?.id) {
      finalContactId = result.contact.id;
    }

    // Add note to contact
    if (finalContactId) {
      console.log('Adding note to contact:', finalContactId);
      
      const noteResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/${finalContactId}/notes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ body: notes })
        }
      );
      
      const noteText = await noteResponse.text();
      console.log('Note response status:', noteResponse.status);
      console.log('Note response:', noteText);
      
      if (noteResponse.ok) {
        console.log('✅ Note added successfully');
      } else {
        console.error('❌ Failed to add note');
      }
    }

    // Add tag for intake submitted
    if (finalContactId) {
      try {
        await fetch(
          `https://services.leadconnectorhq.com/contacts/${finalContactId}/tags`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tags: ['intake-submitted'] })
          }
        );
        console.log('✅ Tag added');
      } catch (tagError) {
        console.error('Tag error:', tagError);
      }
    }

    console.log('✅ GHL sync complete:', finalContactId);
    
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
