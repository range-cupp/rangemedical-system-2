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

    // ============================================
    // STEP 1: Search for existing contact
    // ============================================
    let contactId = null;
    let isNewContact = true;

    try {
      // Try the duplicate search endpoint first
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
      console.log('Duplicate search response:', JSON.stringify(searchData));
      
      // Check various response formats GHL might use
      if (searchData.contact?.id) {
        contactId = searchData.contact.id;
        console.log('Found contact via .contact.id:', contactId);
      } else if (searchData.contacts && searchData.contacts.length > 0) {
        contactId = searchData.contacts[0].id;
        console.log('Found contact via .contacts[0].id:', contactId);
      } else if (searchData.id) {
        contactId = searchData.id;
        console.log('Found contact via .id:', contactId);
      }
    } catch (searchError) {
      console.log('Duplicate search failed, will try to create:', searchError.message);
    }

    // If duplicate search didn't find it, try lookup by email
    if (!contactId) {
      try {
        const lookupUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(email)}`;
        
        console.log('Trying contact lookup by email...');
        
        const lookupResponse = await fetch(lookupUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });

        const lookupData = await lookupResponse.json();
        console.log('Lookup response:', JSON.stringify(lookupData));
        
        if (lookupData.contacts && lookupData.contacts.length > 0) {
          // Find exact email match
          const exactMatch = lookupData.contacts.find(c => 
            c.email?.toLowerCase() === email.toLowerCase()
          );
          if (exactMatch) {
            contactId = exactMatch.id;
            console.log('Found contact via lookup:', contactId);
          }
        }
      } catch (lookupError) {
        console.log('Lookup failed:', lookupError.message);
      }
    }

    isNewContact = !contactId;
    console.log('Is new contact:', isNewContact, 'Contact ID:', contactId);

    // ============================================
    // STEP 2: Create or Update contact
    // ============================================
    const contactData = {
      firstName,
      lastName,
      email,
      source: 'Website Medical Intake'
    };

    if (formattedPhone) contactData.phone = formattedPhone;
    if (streetAddress) contactData.address1 = streetAddress;
    if (city) contactData.city = city;
    if (state) contactData.state = state;
    if (postalCode) contactData.postalCode = postalCode;
    if (country) contactData.country = country;
    if (dateOfBirth) contactData.dateOfBirth = dateOfBirth;

    let contactResponse;
    let contactResult;

    if (contactId) {
      // UPDATE existing contact
      console.log('Updating existing contact:', contactId);
      
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
      
      contactResult = await contactResponse.json();
      console.log('Update response:', contactResponse.status, JSON.stringify(contactResult));
      
    } else {
      // CREATE new contact
      console.log('Creating new contact');
      contactData.locationId = GHL_LOCATION_ID;
      
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
      
      contactResult = await contactResponse.json();
      console.log('Create response:', contactResponse.status, JSON.stringify(contactResult));
      
      // If we get duplicate error, extract the contact ID and update instead
      if (!contactResponse.ok && contactResult.message?.includes('duplicated')) {
        console.log('Duplicate detected, extracting contact info...');
        
        // Try to get contact ID from error response meta
        if (contactResult.meta?.contactId) {
          contactId = contactResult.meta.contactId;
        } else if (contactResult.meta?.id) {
          contactId = contactResult.meta.id;
        }
        
        // If we got an ID from the error, try updating
        if (contactId) {
          console.log('Retrying as update with ID:', contactId);
          
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
          
          contactResult = await contactResponse.json();
          isNewContact = false;
          console.log('Retry update response:', contactResponse.status, JSON.stringify(contactResult));
        }
      }
    }
    
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

    // ============================================
    // STEP 3: Add tags (non-blocking)
    // ============================================
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
      console.warn('Could not add tags:', tagError.message);
    }

    // ============================================
    // STEP 4: Add note with documents
    // ============================================
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
      if (pdfUrl) noteBody += `📑 Complete Medical Intake PDF:\n${pdfUrl}\n\n`;
      if (photoIdUrl) noteBody += `🪪 Photo ID:\n${photoIdUrl}\n\n`;
      if (signatureUrl) noteBody += `✍️ Signature:\n${signatureUrl}\n\n`;
    }
    
    noteBody += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    noteBody += `Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT`;

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
          body: JSON.stringify({ body: noteBody })
        });

        const noteResult = await noteResponse.json();
        console.log('Note response:', noteResponse.status);

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
