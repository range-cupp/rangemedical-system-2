const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, firstName, lastName, wantsPTRecommendation } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Update GHL contact with PT preference
    if (GHL_API_KEY) {
      // Find the contact by email
      const searchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        }
      );

      const searchData = await searchResponse.json();
      const contact = searchData.contacts?.find(c => c.email?.toLowerCase() === email.toLowerCase());

      if (contact) {
        // Add tag based on PT preference
        const ptTag = wantsPTRecommendation ? 'wants_pt_referral' : 'declined_pt_referral';
        const existingTags = contact.tags || [];

        // Remove any existing PT tags and add the new one
        const filteredTags = existingTags.filter(t => t !== 'wants_pt_referral' && t !== 'declined_pt_referral');
        const newTags = [...filteredTags, ptTag];

        // Update contact tags
        await fetch(
          `https://services.leadconnectorhq.com/contacts/${contact.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28'
            },
            body: JSON.stringify({
              tags: newTags
            })
          }
        );

        // Add a note about PT preference
        const noteBody = wantsPTRecommendation
          ? `✅ Patient interested in Range Sports Therapy referral (from injury assessment results page)`
          : `❌ Patient declined Range Sports Therapy referral`;

        await fetch(
          `https://services.leadconnectorhq.com/contacts/${contact.id}/notes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ body: noteBody })
          }
        );

        // If they want PT referral, send an SMS notification
        if (wantsPTRecommendation) {
          const notifyContactId = process.env.RESEARCH_NOTIFY_CONTACT_ID || 'a2IWAaLOI1kJGJGYMCU2';
          const message = `PT Referral Request!\n\n${firstName} ${lastName}\n${email}\n\nPatient wants Range Sports Therapy referral from injury assessment.`;

          await fetch(
            'https://services.leadconnectorhq.com/conversations/messages',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-04-15',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: 'SMS',
                contactId: notifyContactId,
                message: message
              })
            }
          );

          console.log('PT referral SMS notification sent');
        }

        console.log(`PT preference updated for ${email}: ${ptTag}`);
      } else {
        console.warn(`Contact not found for email: ${email}`);
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Update PT preference error:', error);
    return res.status(500).json({ error: 'Failed to update preference' });
  }
}
