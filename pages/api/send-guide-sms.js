// pages/api/send-guide-sms.js
// Sends a guide link via SMS using GoHighLevel API

const GUIDE_DEFINITIONS = {
  'hrt-guide': { name: 'HRT Guide', path: '/hrt-guide' },
  'tirzepatide-guide': { name: 'Tirzepatide Guide', path: '/tirzepatide-guide' },
  'retatrutide-guide': { name: 'Retatrutide Guide', path: '/retatrutide-guide' },
  'weight-loss-medication-guide-page': { name: 'WL Medication Guide', path: '/weight-loss-medication-guide-page' },
  'bpc-tb4-guide': { name: 'BPC/TB4 Guide', path: '/bpc-tb4-guide' },
  'glow-guide': { name: 'GLOW Guide', path: '/glow-guide' },
  'ghk-cu-guide': { name: 'GHK-Cu Guide', path: '/ghk-cu-guide' },
  '3x-blend-guide': { name: '3x Blend Guide', path: '/3x-blend-guide' },
  'nad-guide': { name: 'NAD+ Guide', path: '/nad-guide' },
  'methylene-blue-iv-guide': { name: 'Methylene Blue Guide', path: '/methylene-blue-iv-guide' },
  'methylene-blue-combo-iv-guide': { name: 'MB+VitC Combo Guide', path: '/methylene-blue-combo-iv-guide' },
  'glutathione-iv-guide': { name: 'Glutathione Guide', path: '/glutathione-iv-guide' },
  'vitamin-c-iv-guide': { name: 'Vitamin C Guide', path: '/vitamin-c-iv-guide' },
  'range-iv-guide': { name: 'Range IV Guide', path: '/range-iv-guide' },
  'cellular-reset-guide': { name: 'Cellular Reset Guide', path: '/cellular-reset-guide' },
  'hbot-guide': { name: 'HBOT Guide', path: '/hbot-guide' },
  'red-light-guide': { name: 'Red Light Guide', path: '/red-light-guide' },
  'combo-membership-guide': { name: 'Combo Membership', path: '/combo-membership-guide' },
  'hbot-membership-guide': { name: 'HBOT Membership', path: '/hbot-membership-guide' },
  'rlt-membership-guide': { name: 'RLT Membership', path: '/rlt-membership-guide' },
  'essential-panel-male-guide': { name: 'Essential Male Panel', path: '/essential-panel-male-guide' },
  'essential-panel-female-guide': { name: 'Essential Female Panel', path: '/essential-panel-female-guide' },
  'elite-panel-male-guide': { name: 'Elite Male Panel', path: '/elite-panel-male-guide' },
  'elite-panel-female-guide': { name: 'Elite Female Panel', path: '/elite-panel-female-guide' },
  'the-blu-guide': { name: 'The Blu', path: '/the-blu-guide' },
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
    const { phone, firstName, guideId } = req.body;

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });
    }

    if (!guideId || !GUIDE_DEFINITIONS[guideId]) {
      return res.status(400).json({ error: 'Valid guide selection required' });
    }

    const guide = GUIDE_DEFINITIONS[guideId];
    const formattedPhone = '+1' + phone;
    const baseUrl = 'https://www.range-medical.com';

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

    // If no contact found, create one
    if (!contactId) {
      const createPayload = {
        firstName: firstName || 'New',
        lastName: 'Patient',
        phone: formattedPhone,
        locationId: GHL_LOCATION_ID,
        tags: ['guide-sent']
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
    }

    // Step 2: Build and send SMS
    const greeting = firstName ? `Hi ${firstName}! ` : '';
    const messageBody = `${greeting}Here's your guide: ${baseUrl}${guide.path} - Range Medical\n\nQuestions? (949) 997-3988\nReply STOP to unsubscribe.`;

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

    console.log('Guide SMS sent successfully');

    // Step 3: Add note to contact
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
          body: `Guide sent via SMS: ${guide.name} on ${new Date().toLocaleString()}`,
          userId: null
        })
      }
    );

    return res.status(200).json({
      success: true,
      contactId,
      message: 'Guide sent successfully'
    });

  } catch (error) {
    console.error('Send guide SMS error:', error);
    return res.status(500).json({
      error: 'Server error. Please try again.'
    });
  }
}
