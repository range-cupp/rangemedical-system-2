// /pages/api/admin/ghl-search.js
// Search GHL contacts by email or name
// Range Medical

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

  try {
    const searchUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(query)}&limit=10`;

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'GHL API error' });
    }

    const data = await response.json();
    const contacts = (data.contacts || []).map(c => ({
      id: c.id,
      name: c.contactName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      email: c.email,
      phone: c.phone
    }));

    return res.status(200).json({ contacts });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
