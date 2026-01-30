// /pages/api/admin/debug-ghl-contacts.js
// Debug GHL contacts and appointments API
// Range Medical

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export default async function handler(req, res) {
  const { name } = req.query;
  const searchName = name || 'Amir';

  const results = {
    env: {
      hasApiKey: !!GHL_API_KEY,
      apiKeyPrefix: GHL_API_KEY ? GHL_API_KEY.substring(0, 10) + '...' : 'missing',
      locationId: GHL_LOCATION_ID
    },
    searchingFor: searchName,
    tests: []
  };

  // Test 1: Get contacts
  try {
    const contactsUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=5`;
    const contactsResponse = await fetch(contactsUrl, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28'
      }
    });

    const contactsText = await contactsResponse.text();
    let contactsData;
    try {
      contactsData = JSON.parse(contactsText);
    } catch {
      contactsData = { raw: contactsText.substring(0, 500) };
    }

    results.tests.push({
      test: 'Get Contacts',
      url: contactsUrl,
      status: contactsResponse.status,
      ok: contactsResponse.ok,
      contactCount: contactsData.contacts?.length || 0,
      firstContact: contactsData.contacts?.[0] ? {
        id: contactsData.contacts[0].id,
        name: contactsData.contacts[0].name || `${contactsData.contacts[0].firstName} ${contactsData.contacts[0].lastName}`,
        phone: contactsData.contacts[0].phone
      } : null,
      error: contactsData.error || contactsData.message || null
    });

    // Test 2: Get appointments for first contact
    if (contactsData.contacts?.[0]?.id) {
      const contactId = contactsData.contacts[0].id;
      const appointmentsUrl = `https://services.leadconnectorhq.com/contacts/${contactId}/appointments`;

      const aptsResponse = await fetch(appointmentsUrl, {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      });

      const aptsText = await aptsResponse.text();
      let aptsData;
      try {
        aptsData = JSON.parse(aptsText);
      } catch {
        aptsData = { raw: aptsText.substring(0, 500) };
      }

      results.tests.push({
        test: 'Get Contact Appointments',
        url: appointmentsUrl,
        contactId: contactId,
        status: aptsResponse.status,
        ok: aptsResponse.ok,
        appointmentCount: aptsData.events?.length || aptsData.appointments?.length || 0,
        dataKeys: Object.keys(aptsData),
        sample: aptsData.events?.[0] || aptsData.appointments?.[0] || null,
        error: aptsData.error || aptsData.message || null
      });
    }

  } catch (e) {
    results.tests.push({
      test: 'Get Contacts',
      error: e.message
    });
  }

  // Test 3: Search for a specific contact by name (configurable via query param)
  try {
    const searchUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(searchName)}`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28'
      }
    });

    const searchData = await searchResponse.json();

    results.tests.push({
      test: `Search Contact: ${searchName}`,
      url: searchUrl,
      status: searchResponse.status,
      contactCount: searchData.contacts?.length || 0,
      contacts: (searchData.contacts || []).slice(0, 3).map(c => ({
        id: c.id,
        name: c.name || `${c.firstName} ${c.lastName}`
      }))
    });

    // If found, get their appointments with FULL data
    if (searchData.contacts?.[0]?.id) {
      const contactId = searchData.contacts[0].id;
      const aptsUrl = `https://services.leadconnectorhq.com/contacts/${contactId}/appointments`;
      const aptsResponse = await fetch(aptsUrl, {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      });

      const aptsData = await aptsResponse.json();

      results.tests.push({
        test: `Get ${searchName} Appointments`,
        contactId,
        status: aptsResponse.status,
        appointmentCount: aptsData.events?.length || 0,
        // Show full appointment data for debugging
        fullAppointments: (aptsData.events || []).slice(0, 3)
      });
    }

  } catch (e) {
    results.tests.push({
      test: 'Search Contact',
      error: e.message
    });
  }

  return res.status(200).json(results);
}
