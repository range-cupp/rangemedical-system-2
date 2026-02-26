// pages/api/send-forms-sms.js
// Sends selected form links via SMS using GoHighLevel API

const FORM_DEFINITIONS = {
  'intake': { name: 'Medical Intake', path: '/intake' },
  'hipaa': { name: 'HIPAA Notice', path: '/consent/hipaa' },
  'blood-draw': { name: 'Blood Draw Consent', path: '/consent/blood-draw' },
  'hrt': { name: 'HRT Consent', path: '/consent/hrt' },
  'peptide': { name: 'Peptide Consent', path: '/consent/peptide' },
  'iv': { name: 'IV/Injection Consent', path: '/consent/iv' },
  'hbot': { name: 'HBOT Consent', path: '/consent/hbot' },
  'weight-loss': { name: 'Weight Loss Consent', path: '/consent/weight-loss' },
  'red-light': { name: 'Red Light Therapy Consent', path: '/consent/red-light' },
  'prp': { name: 'PRP Consent', path: '/consent/prp' },
  'exosome-iv': { name: 'Exosome IV Consent', path: '/consent/exosome-iv' },
};

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
    const { phone, firstName, formIds } = req.body;

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });
    }

    if (!formIds || formIds.length === 0) {
      return res.status(400).json({ error: 'At least one form must be selected' });
    }

    // Validate form IDs
    const validFormIds = formIds.filter(id => FORM_DEFINITIONS[id]);
    if (validFormIds.length === 0) {
      return res.status(400).json({ error: 'No valid forms selected' });
    }

    // Format phone for GHL (+1 prefix)
    const formattedPhone = '+1' + phone;

    // Build the base URL - USE APP DOMAIN for GHL sync to work
    const baseUrl = 'https://app.range-medical.com';

    // Step 1: Find or create contact in GHL
    let contactId = null;

    const searchParams = new URLSearchParams({
      locationId: GHL_LOCATION_ID,
      query: formattedPhone
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

    // Build tags based on forms being sent
    const formTags = validFormIds.map(id => `${id}-pending`);
    const allTags = ['forms-sent', ...formTags];

    // If no contact found, create one
    if (!contactId) {
      const createPayload = {
        firstName: firstName || 'New',
        lastName: 'Patient',
        phone: formattedPhone,
        locationId: GHL_LOCATION_ID,
        tags: allTags
      };

      const createResponse = await fetch(
        'https://services.leadconnectorhq.com/contacts/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPayload)
        }
      );

      if (createResponse.ok) {
        const createData = await createResponse.json();
        contactId = createData.contact?.id;
        console.log('Created new contact:', contactId);
      } else {
        const errorData = await createResponse.json();
        console.error('Failed to create contact:', errorData);
        return res.status(500).json({ error: 'Failed to create contact in system' });
      }
    } else {
      // Update existing contact with tags
      await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tags: allTags,
            firstName: firstName || undefined
          })
        }
      );
    }

    // Step 2: Build SMS message with contactId in URLs for patient linking
    const greeting = firstName ? `Hi ${firstName}! ` : '';
    const cidParam = contactId ? `?cid=${contactId}` : '';

    let messageBody;

    if (validFormIds.length === 1) {
      // Single form - simple message
      const form = FORM_DEFINITIONS[validFormIds[0]];
      messageBody = `${greeting}Range Medical here. Please complete your ${form.name} before your visit:\n\n${baseUrl}${form.path}${cidParam}\n\nQuestions? (949) 997-3988\nReply STOP to unsubscribe.`;
    } else {
      // Multiple forms - list them out
      const formLinks = validFormIds.map(id => {
        const form = FORM_DEFINITIONS[id];
        return `• ${form.name}: ${baseUrl}${form.path}${cidParam}`;
      }).join('\n');

      messageBody = `${greeting}Range Medical here. Please complete these forms before your visit:\n\n${formLinks}\n\nQuestions? (949) 997-3988\nReply STOP to unsubscribe.`;
    }

    // Step 3: Send SMS via GHL
    const smsResponse = await fetch(
      'https://services.leadconnectorhq.com/conversations/messages',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'SMS',
          contactId: contactId,
          message: messageBody
        })
      }
    );

    if (!smsResponse.ok) {
      const smsError = await smsResponse.json();
      console.error('SMS send failed:', JSON.stringify(smsError));

      const ghlMsg = smsError.message || smsError.msg || JSON.stringify(smsError);

      if (ghlMsg.includes('opt') || ghlMsg.includes('consent')) {
        return res.status(400).json({
          error: 'Patient has opted out of SMS or consent required'
        });
      }

      return res.status(500).json({
        error: `Failed to send SMS: ${ghlMsg}`
      });
    }

    console.log('SMS sent successfully');

    // Step 4: Add note to contact
    const formNames = validFormIds.map(id => FORM_DEFINITIONS[id].name).join(', ');
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
          body: `Forms sent via SMS on ${new Date().toLocaleString()}:\n${formNames}`,
          userId: null
        })
      }
    );

    return res.status(200).json({ 
      success: true, 
      contactId,
      formsSent: validFormIds.length,
      message: 'Forms sent successfully'
    });

  } catch (error) {
    console.error('Send forms SMS error:', error);
    return res.status(500).json({ 
      error: 'Server error. Please try again.' 
    });
  }
}
