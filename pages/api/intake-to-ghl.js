// /pages/api/intake-to-ghl.js
// Syncs medical intake form data to GoHighLevel CRM

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
      // Patient info
      firstName,
      lastName,
      preferredName,
      email,
      phone,
      dateOfBirth,
      
      // Address
      streetAddress,
      city,
      state,
      postalCode,
      country,
      
      // Document URLs
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

    const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

    // Format phone for GHL (+1XXXXXXXXXX)
    let formattedPhone = phone ? phone.replace(/\D/g, '') : '';
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Search for existing contact by email
    const searchUrl = `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`;
    
    console.log('Searching for existing contact:', email);
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });

    const searchData = await searchResponse.json();
    console.log('Search result:', JSON.stringify(searchData));
    
    let contactId = searchData.contact?.id;
    let isNewContact = !contactId;

    // Prepare contact data - keeping it simple to avoid GHL rejections
    const contactData = {
      firstName,
      lastName,
      email,
      source: 'Website Medical Intake'
    };

    // Only add optional fields if they have values
    if (formattedPhone) contactData.phone = formattedPhone;
    if (streetAddress) contactData.address1 = streetAddress;
    if (city) contactData.city = city;
    if (state) contactData.state = state;
    if (postalCode) contactData.postalCode = postalCode;
    if (country) contactData.country = country;
    
    // Format DOB for GHL (YYYY-MM-DD)
    if (dateOfBirth) {
      contactData.dateOfBirth = dateOfBirth;
    }

    let contactResponse;

    if (contactId) {
      // Update existing contact
      console.log('Updating existing GHL contact:', contactId);
      console.log('Update payload:', JSON.stringify(contactData));
      
      contactResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(contactData)
      });
    } else {
      // Create new contact
      console.log('Creating new GHL contact');
      
      contactData.locationId = GHL_LOCATION_ID;
      
      console.log('Create payload:', JSON.stringify(contactData));
      
      contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(contactData)
      });
    }

    const contactResult = await contactResponse.json();
    console.log('GHL response status:', contactResponse.status);
    console.log('GHL response:', JSON.stringify(contactResult));
    
    if (!contactResponse.ok) {
      console.error('GHL contact error:', contactResult);
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to create/update contact',
        details: contactResult,
        statusCode: contactResponse.status
      });
    }

    contactId = contactResult.contact?.id || contactId;

    // Try to add tags separately (won't fail the whole request if it doesn't work)
    try {
      await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          tags: ['intake-submitted']
        })
      });
      console.log('Tags added');
    } catch (tagError) {
      console.warn('Could not add tags (non-critical):', tagError.message);
    }

    // Build note with document links
    let noteBody = `📋 MEDICAL INTAKE FORM SUBMITTED\n`;
    noteBody += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    noteBody += `Patient: ${firstName} ${lastName}\n`;
    if (preferredName) noteBody += `Preferred Name: ${preferredName}\n`;
    noteBody += `Email: ${email}\n`;
    if (formattedPhone) noteBody += `Phone: ${formattedPhone}\n`;
    if (dateOfBirth) noteBody += `DOB: ${dateOfBirth}\n`;
    noteBody += `\n`;
    
    if (streetAddress || city || state) {
      noteBody += `📍 ADDRESS:\n`;
      if (streetAddress) noteBody += `${streetAddress}\n`;
      if (city || state || postalCode) {
        noteBody += `${city || ''}, ${state || ''} ${postalCode || ''}\n`;
      }
      noteBody += `\n`;
    }
    
    if (pdfUrl || photoIdUrl || signatureUrl) {
      noteBody += `📄 DOCUMENTS:\n`;
      noteBody += `─────────────────────────────\n`;
      
      if (pdfUrl) {
        noteBody += `📑 Complete Medical Intake PDF:\n${pdfUrl}\n\n`;
      }
      
      if (photoIdUrl) {
        noteBody += `🪪 Photo ID:\n${photoIdUrl}\n\n`;
      }
      
      if (signatureUrl) {
        noteBody += `✍️ Signature:\n${signatureUrl}\n\n`;
      }
    }
    
    noteBody += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    noteBody += `Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT`;

    // Add note to contact
    if (contactId) {
      try {
        const noteResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            body: noteBody
          })
        });

        const noteResult = await noteResponse.json();
        console.log('Note response:', noteResponse.status, JSON.stringify(noteResult));

        if (!noteResponse.ok) {
          console.warn('Failed to add note:', noteResult);
        } else {
          console.log('Note added successfully');
        }
      } catch (noteError) {
        console.warn('Note error:', noteError.message);
      }
    }

    return res.status(200).json({
      success: true,
      contactId,
      isNewContact,
      message: isNewContact ? 'Contact created successfully' : 'Contact updated successfully'
    });

  } catch (error) {
    console.error('GHL Intake API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
