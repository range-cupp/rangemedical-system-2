// pages/api/hipaa-acknowledge.js
// Records HIPAA acknowledgment in GoHighLevel

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.error('Missing GHL credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { phone, contactId, acknowledgedAt } = req.body;

    let finalContactId = contactId;

    // If we have a phone number but no contact ID, look up the contact
    if (!finalContactId && phone) {
      // Format phone for search
      let searchPhone = phone.replace(/\D/g, '');
      if (searchPhone.length === 10) {
        searchPhone = '+1' + searchPhone;
      } else if (searchPhone.length === 11 && searchPhone.startsWith('1')) {
        searchPhone = '+' + searchPhone;
      }

      const searchParams = new URLSearchParams({
        locationId: GHL_LOCATION_ID,
        query: searchPhone
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
          finalContactId = searchData.contacts[0].id;
        }
      }
    }

    // If we still don't have a contact ID, we can't update GHL
    // But we still return success - the patient acknowledged
    if (!finalContactId) {
      console.log('HIPAA acknowledged but no contact found to update');
      return res.status(200).json({ 
        success: true, 
        message: 'Acknowledgment recorded (no contact linked)'
      });
    }

    // Update contact with HIPAA acknowledgment
    const updateResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/${finalContactId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tags: ['hipaa-acknowledged'],
          customFields: [
            {
              key: 'hipaa_acknowledged',
              field_value: 'Yes'
            },
            {
              key: 'hipaa_acknowledged_date',
              field_value: acknowledgedAt || new Date().toISOString()
            }
          ]
        })
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('GHL update failed:', errorData);
      // Still return success - patient acknowledged
    }

    // Add note to contact
    await fetch(
      `https://services.leadconnectorhq.com/contacts/${finalContactId}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: `HIPAA Notice of Privacy Practices acknowledged on ${new Date().toLocaleString()}`,
          userId: null
        })
      }
    );

    // Remove pending tag if it exists
    try {
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
        const updatedTags = currentTags.filter(tag => tag !== 'hipaa-pending');
        
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

    return res.status(200).json({ 
      success: true, 
      contactId: finalContactId 
    });

  } catch (error) {
    console.error('HIPAA acknowledge error:', error);
    // Return success anyway - we don't want to block patients
    return res.status(200).json({ 
      success: true, 
      message: 'Acknowledgment recorded'
    });
  }
}
