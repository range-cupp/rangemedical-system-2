// /pages/api/admin/send-patient-text.js
// Unified SMS API for Portal and Onboarding links
// Range Medical

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    patient_name, 
    patient_phone, 
    access_token, 
    ghl_contact_id,
    message_type = 'portal'
  } = req.body;

  if (!patient_phone || !access_token) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Build the appropriate URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';
  
  let message;
  if (message_type === 'onboard') {
    const onboardUrl = `${baseUrl}/onboard/${access_token}`;
    message = `Hi ${patient_name?.split(' ')[0] || 'there'}! Welcome to Range Medical. Take 2 minutes to set your goals and help us personalize your care: ${onboardUrl}`;
  } else {
    const portalUrl = `${baseUrl}/portal/${access_token}`;
    message = `Hi ${patient_name?.split(' ')[0] || 'there'}! Here's your Range portal to track your progress and log your treatments: ${portalUrl}`;
  }

  // Try GHL API first
  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;

  if (ghlApiKey && ghlLocationId && ghl_contact_id) {
    try {
      const ghlRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-04-15'
        },
        body: JSON.stringify({
          type: 'SMS',
          contactId: ghl_contact_id,
          message: message
        })
      });

      if (ghlRes.ok) {
        const data = await ghlRes.json();
        return res.status(200).json({ 
          success: true, 
          method: 'ghl',
          messageId: data.messageId,
          message_type
        });
      } else {
        console.error('GHL SMS failed:', await ghlRes.text());
      }
    } catch (err) {
      console.error('GHL SMS error:', err);
    }
  }

  // Fallback: return SMS link for manual sending
  const formattedPhone = patient_phone.replace(/\D/g, '');
  const smsLink = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;

  return res.status(200).json({
    success: true,
    method: 'manual',
    sms_link: smsLink,
    message,
    message_type,
    note: 'GHL not available, use SMS link'
  });
}
