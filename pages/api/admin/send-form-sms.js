// /pages/api/admin/send-form-sms.js
// Send consent/form links to patients via GHL SMS
// Range Medical

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ghlContactId, patientName, formType, formUrl } = req.body;

  // Validate required fields
  if (!ghlContactId) {
    return res.status(400).json({ error: 'Missing GHL contact ID' });
  }
  if (!formType || !formUrl) {
    return res.status(400).json({ error: 'Missing form type or URL' });
  }

  // Build the message
  const firstName = patientName || 'there';
  const message = `Hi ${firstName}! Please complete your ${formType} for Range Medical: ${formUrl}`;

  try {
    // Send SMS via GHL Conversations API
    const response = await fetch(
      'https://services.leadconnectorhq.com/conversations/messages',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-04-15'
        },
        body: JSON.stringify({
          type: 'SMS',
          contactId: ghlContactId,
          message: message
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GHL SMS error:', response.status, errorData);
      
      // Provide helpful error message
      if (response.status === 401) {
        return res.status(500).json({ error: 'GHL API key invalid or expired' });
      }
      if (response.status === 400) {
        return res.status(400).json({ error: 'Invalid contact ID or phone number' });
      }
      
      return res.status(500).json({ error: 'Failed to send SMS via GHL' });
    }

    const result = await response.json();
    
    console.log(`SMS sent to contact ${ghlContactId}: ${formType}`);
    
    return res.status(200).json({ 
      success: true, 
      messageId: result.messageId,
      message: `Sent ${formType} link to patient`
    });

  } catch (error) {
    console.error('Send SMS error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send SMS' });
  }
}
