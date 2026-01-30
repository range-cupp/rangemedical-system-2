// /pages/api/admin/debug-ghl-contacts.js
// Debug GHL contacts and appointments API
// Range Medical

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export default async function handler(req, res) {
  const { name, date } = req.query;
  const searchName = name || 'Amir';
  const targetDate = date || new Date().toISOString().split('T')[0];

  const results = {
    env: {
      hasApiKey: !!GHL_API_KEY,
      apiKeyPrefix: GHL_API_KEY ? GHL_API_KEY.substring(0, 10) + '...' : 'missing',
      locationId: GHL_LOCATION_ID
    },
    searchingFor: searchName,
    targetDate,
    tests: []
  };

  // Search for contact by name
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
      status: searchResponse.status,
      contactCount: searchData.contacts?.length || 0,
      contacts: (searchData.contacts || []).slice(0, 5).map(c => ({
        id: c.id,
        name: c.name || `${c.firstName} ${c.lastName}`
      }))
    });

    // Get appointments for first matching contact
    if (searchData.contacts?.[0]?.id) {
      const contact = searchData.contacts[0];
      const contactId = contact.id;
      const aptsUrl = `https://services.leadconnectorhq.com/contacts/${contactId}/appointments`;
      const aptsResponse = await fetch(aptsUrl, {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      });

      const aptsData = await aptsResponse.json();
      const allAppointments = aptsData.events || [];

      // Filter to target date
      const todayAppointments = allAppointments.filter(apt => {
        const aptDate = (apt.startTime || '').split(/[T ]/)[0];
        return aptDate === targetDate;
      });

      // Get all appointments sorted by date desc
      const sortedAppointments = [...allAppointments].sort((a, b) =>
        (b.startTime || '').localeCompare(a.startTime || '')
      );

      results.tests.push({
        test: `${searchName} Appointments`,
        contactId,
        contactName: contact.name || `${contact.firstName} ${contact.lastName}`,
        totalAppointments: allAppointments.length,
        appointmentsOnTargetDate: todayAppointments.length,
        todayAppointments: todayAppointments.map(a => ({
          id: a.id,
          title: a.title,
          startTime: a.startTime,
          status: a.appointmentStatus || a.status,
          calendarId: a.calendarId
        })),
        mostRecentAppointments: sortedAppointments.slice(0, 5).map(a => ({
          id: a.id,
          title: a.title,
          startTime: a.startTime,
          status: a.appointmentStatus || a.status
        }))
      });
    }

  } catch (e) {
    results.tests.push({
      test: 'Search Error',
      error: e.message
    });
  }

  return res.status(200).json(results);
}
