// /pages/api/ghl/send-sms.js
// Send SMS via GHL API
// Range Medical

const GHL_API_KEY = process.env.GHL_API_KEY;

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

  const { contact_id, message } = req.body;

  if (!contact_id || !message) {
    return res.status(400).json({ error: 'Missing contact_id or message' });
  }

  try {
    // Send SMS via GHL Conversations API
    const response = await fetch(
      `https://services.leadconnectorhq.com/conversations/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          type: 'SMS',
          contactId: contact_id,
          message: message
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL SMS error:', response.status, errorText);
      return res.status(500).json({ 
        error: 'Failed to send SMS',
        details: errorText 
      });
    }

    const result = await response.json();
    console.log('SMS sent to:', contact_id);

    return res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      messageId: result.messageId || result.id
    });

  } catch (err) {
    console.error('SMS error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
