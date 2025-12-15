// /pages/api/intake-to-ghl.js
// Syncs medical intake form data to GoHighLevel CRM
// Creates/updates contact, adds comprehensive note with all document links

export default async function handler(req, res) {
  // CORS headers
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
    const {
      firstName,
      lastName,
      preferredName,
      email,
      phone,
      dateOfBirth,
      streetAddress,
      city,
      state,
      postalCode,
      country,
      pdfUrl,
      photoIdUrl,
      signatureUrl
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: email, firstName, lastName' 
      });
    }

    const GHL_API_KEY = process.env.GHL_API_KEY;
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.error('Missing GHL credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing GHL credentials'
      });
    }

    // Format phone for GHL (+1XXXXXXXXXX)
    let formattedPhone = phone ? phone.replace(/\D/g, '') : '';
    if (formattedPhone && formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone && formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    } else if (formattedPhone && !formattedPhone.startsWith('+')) {
      formattedPhone = '+1' + formattedPhone;
    }

    // Format date of birth for GHL (YYYY-MM-DD)
    let formattedDOB = dateOfBirth || '';

    console.log('📤 Processing intake for:', firstName, lastName, email);

    // Step 1: Search for existing contact by email
    let contactId = null;
    try {
      const searchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
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
      console.warn('⚠️ Contact search failed (will create new):', searchError.message);
    }

    // Step 2: Create or update contact
    const contactData = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: formattedPhone || undefined,
      address1: streetAddress || undefined,
      city: city || undefined,
      state: state || undefined,
      postalCode: postalCode || undefined,
      country: country || 'US',
      dateOfBirth: formattedDOB || undefined,
      source: 'Medical Intake Form',
      customFields: [
        {
          key: 'medical_intake_form',
          field_value: 'Complete'
        }
      ]
    };

    // Add preferred name to custom field if provided
    if (preferredName) {
      contactData.customFields.push({
        key: 'preferred_name',
        field_value: preferredName
      });
    }

    // Remove undefined values
    Object.keys(contactData).forEach(key => {
      if (contactData[key] === undefined) {
        delete contactData[key];
      }
    });

    let contactResponse;
    if (contactId) {
      // Update existing contact
      contactResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactData)
        }
      );
    } else {
      // Create new contact
      contactData.locationId = GHL_LOCATION_ID;
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
      console.error('❌ GHL contact error:', contactResponse.status, errorText);
      throw new Error(`GoHighLevel API error: ${contactResponse.status} - ${errorText}`);
    }

    const contactResult = await contactResponse.json();
    contactId = contactId || contactResult.contact?.id;

    console.log('✅ Contact saved:', contactId);

    // Step 3: Add comprehensive note with all document links
    if (contactId) {
      try {
        console.log('📝 Adding intake completion note...');
        
        const submissionDate = new Date().toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        let noteBody = `📋 MEDICAL INTAKE FORM COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${firstName} ${lastName}${preferredName ? ` (Preferred: ${preferredName})` : ''}
Email: ${email}
Phone: ${formattedPhone || 'Not provided'}
DOB: ${dateOfBirth || 'Not provided'}
Submitted: ${submissionDate}

📄 DOCUMENTS:
─────────────────────────────────`;

        if (pdfUrl) {
          noteBody += `\n\n📑 Medical Intake PDF:\n${pdfUrl}`;
        }
        
        if (photoIdUrl) {
          noteBody += `\n\n🪪 Photo ID:\n${photoIdUrl}`;
        }
        
        if (signatureUrl) {
          noteBody += `\n\n✍️ Patient Signature:\n${signatureUrl}`;
        }

        noteBody += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Intake form successfully processed
Custom field updated: medical_intake_form = Complete`;
        
        const noteResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              body: noteBody
            })
          }
        );
        
        if (noteResponse.ok) {
          console.log('✅ Note added successfully');
        } else {
          const noteError = await noteResponse.text();
          console.warn('⚠️ Note creation returned:', noteResponse.status, noteError);
        }
      } catch (noteError) {
        console.warn('⚠️ Could not add note:', noteError.message);
      }
    }

    // Step 4: Add tags for workflow triggers
    if (contactId) {
      try {
        const tagResponse = await fetch(
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
        
        if (tagResponse.ok) {
          console.log('✅ Tags added: intake-form-completed, new-patient');
        }
      } catch (tagError) {
        console.warn('⚠️ Could not add tags:', tagError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: contactId ? 'Contact updated in GoHighLevel' : 'Contact created in GoHighLevel',
      contactId: contactId,
      data: {
        name: `${firstName} ${lastName}`,
        email: email,
        customFieldUpdated: 'medical_intake_form = Complete',
        noteAdded: true,
        tagsAdded: ['intake-form-completed', 'new-patient']
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
