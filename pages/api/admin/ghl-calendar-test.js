// /pages/api/admin/ghl-calendar-test.js
// Test GHL Calendar/Appointments API endpoints
// Range Medical

export default async function handler(req, res) {
  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

  const today = new Date();
  const startTime = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endTime = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  // Test calendar ID
  const testCalendarId = '68f01d9a238b376bfa9a758c'; // Range Injections

  const results = {
    env: { locationId: GHL_LOCATION_ID },
    dateRange: { startTime, endTime },
    tests: []
  };

  // Test 1: List all calendars
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/?locationId=${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );
    const text = await response.text();
    results.tests.push({
      test: 'List Calendars',
      endpoint: `/calendars/?locationId=${GHL_LOCATION_ID}`,
      status: response.status,
      ok: response.ok,
      response: text.substring(0, 1000)
    });
  } catch (e) {
    results.tests.push({ test: 'List Calendars', error: e.message });
  }

  // Test 2: Get appointments using /calendars/events
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?locationId=${GHL_LOCATION_ID}&startTime=${startTime}&endTime=${endTime}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );
    const text = await response.text();
    results.tests.push({
      test: 'Get Events (all calendars)',
      endpoint: `/calendars/events?locationId=...&startTime=...&endTime=...`,
      status: response.status,
      ok: response.ok,
      response: text.substring(0, 1000)
    });
  } catch (e) {
    results.tests.push({ test: 'Get Events', error: e.message });
  }

  // Test 3: Get appointments for specific calendar
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?locationId=${GHL_LOCATION_ID}&calendarId=${testCalendarId}&startTime=${startTime}&endTime=${endTime}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );
    const text = await response.text();
    results.tests.push({
      test: 'Get Events (specific calendar)',
      endpoint: `/calendars/events?calendarId=${testCalendarId}&...`,
      status: response.status,
      ok: response.ok,
      response: text.substring(0, 1000)
    });
  } catch (e) {
    results.tests.push({ test: 'Get Events (specific)', error: e.message });
  }

  // Test 4: Try /appointments endpoint
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/appointments/?locationId=${GHL_LOCATION_ID}&startDate=${startTime}&endDate=${endTime}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );
    const text = await response.text();
    results.tests.push({
      test: 'Get Appointments (appointments endpoint)',
      endpoint: `/appointments/?locationId=...`,
      status: response.status,
      ok: response.ok,
      response: text.substring(0, 1000)
    });
  } catch (e) {
    results.tests.push({ test: 'Appointments endpoint', error: e.message });
  }

  // Test 5: Try calendar/{id}/appointments
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${testCalendarId}/appointments?startTime=${startTime}&endTime=${endTime}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );
    const text = await response.text();
    results.tests.push({
      test: 'Get Calendar Appointments',
      endpoint: `/calendars/${testCalendarId}/appointments`,
      status: response.status,
      ok: response.ok,
      response: text.substring(0, 1000)
    });
  } catch (e) {
    results.tests.push({ test: 'Calendar Appointments', error: e.message });
  }

  return res.status(200).json(results);
}
