// pages/api/consent-to-ghl.js
// Syncs consent form data to GoHighLevel - updates contact with consent status and adds note

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
      consentType,
      consentDate,
      customFieldKey,
      customFieldValue,
      tags,
      signatureUrl,
      pdfUrl,
      healthScreening // For IV consent G6PD alerts
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
    
    const searchQuery = email || formattedPhone;
    if (searchQuery) {
      const searchParams = new URLSearchParams({
        locationId: GHL_LOCATION_ID,
        query: searchQuery
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
    }

    // Build custom fields array
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
        key: `${consentType}_signature_url`,
        field_value: signatureUrl
      });
    }
    
    // Add PDF URL as custom field
    if (pdfUrl) {
      customFields.push({
        key: `${consentType}_pdf_url`,
        field_value: pdfUrl
      });
    }

    // Add consent date
    if (consentDate) {
      customFields.push({
        key: `${consentType}_date`,
        field_value: consentDate
      });
    }

    // Build contact payload
    const contactPayload = {
      locationId: GHL_LOCATION_ID,
      tags: tags || [],
      customFields: customFields.length > 0 ? customFields : undefined
    };

    // Add contact info if provided (for new contacts or updates)
    if (firstName) contactPayload.firstName = firstName;
    if (lastName) contactPayload.lastName = lastName;
    if (email) contactPayload.email = email;
    if (formattedPhone) contactPayload.phone = formattedPhone;

    // Add date of birth if provided (format: YYYY-MM-DD for GHL)
    if (dateOfBirth) {
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

    // Build note content based on consent type
    let noteContent = '';
    
    const consentNames = {
      'blood-draw': 'Blood Draw Consent',
      'hrt': 'HRT Consent',
      'peptide': 'Peptide Therapy Consent',
      'hbot': 'HBOT Consent',
      'iv': 'IV & Injection Consent',
      'weight-loss': 'Weight Loss Program Consent',
      'hipaa': 'HIPAA Acknowledgment'
    };
    
    const consentName = consentNames[consentType] || `${consentType} Consent`;
    noteContent = `${consentName.toUpperCase()} SIGNED\n`;
    noteContent += `Date: ${consentDate || new Date().toLocaleDateString()}\n`;
    noteContent += `Patient: ${firstName} ${lastName}\n`;
    
    if (pdfUrl) {
      noteContent += `PDF: ${pdfUrl}\n`;
    }

    // Add health screening info for IV consent
    if (healthScreening) {
      if (healthScreening.g6pdCritical) {
        noteContent += `\n🚨 CRITICAL ALERT: G6PD Deficiency detected!\n`;
        if (healthScreening.gettingMB) noteContent += `- Getting Methylene Blue: YES\n`;
        if (healthScreening.gettingVC) noteContent += `- Getting High Dose Vitamin C: YES\n`;
        noteContent += `LAB TESTING REQUIRED BEFORE TREATMENT\n`;
      }
      if (healthScreening.yesAnswers && healthScreening.yesAnswers.length > 0) {
        noteContent += `\n⚠️ Health screening flags:\n`;
        healthScreening.yesAnswers.forEach(answer => {
          noteContent += `- ${answer}\n`;
        });
      }
    }

    // Add note to contact
    if (finalContactId) {
      try {
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
              body: noteContent,
              userId: null // System note
            })
          }
        );
        
        if (!noteResponse.ok) {
          const noteError = await noteResponse.json();
          console.error('Failed to add note:', noteError);
        } else {
          console.log('Note added successfully');
        }
      } catch (noteError) {
        console.error('Failed to add note:', noteError);
        // Don't fail the whole request for note errors
      }
    }

    // Remove pending tag if it exists
    try {
      const pendingTag = `${consentType}-pending`;
      const contactResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/${finalContactId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        }
      );
      
      if (contactResponse.ok) {
        const contactData = await contactResponse.json();
        const currentTags = contactData.contact?.tags || [];
        const updatedTags = currentTags.filter(tag => tag !== pendingTag);
        
        if (updatedTags.length !== currentTags.length) {
          await fetch(
            `https://services.leadconnectorhq.com/contacts/${finalContactId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ tags: updatedTags })
            }
          );
        }
      }
    } catch (tagError) {
      console.error('Failed to remove pending tag:', tagError);
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
