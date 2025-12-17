// /pages/api/admin/send-form-sms.js
// Send Form Link via SMS
// Range Medical

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, message } = req.body;

  if (!contactId || !message) {
    return res.status(400).json({ error: 'contactId and message are required' });
  }

  if (!GHL_API_KEY) {
    return res.status(500).json({ error: 'GHL API key not configured' });
  }

  try {
    // Send SMS via GHL
    const response = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: contactId,
        message: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GHL SMS error:', errorData);
      throw new Error(errorData.message || 'Failed to send SMS');
    }

    const result = await response.json();
    console.log('✅ Form SMS sent:', { contactId, messageLength: message.length });

    return res.status(200).json({ 
      success: true,
      messageId: result.messageId || result.id
    });

  } catch (error) {
    console.error('Send form SMS error:', error);
    return res.status(500).json({ error: error.message });
  }
}
