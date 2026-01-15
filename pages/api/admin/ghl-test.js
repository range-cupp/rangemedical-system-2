// /pages/api/admin/ghl-test.js
// Test GHL API connection
// Range Medical

export default async function handler(req, res) {
  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

  const results = {
    env_vars: {
      GHL_API_KEY: GHL_API_KEY ? `${GHL_API_KEY.substring(0, 15)}...` : 'NOT SET',
      GHL_LOCATION_ID: GHL_LOCATION_ID || 'NOT SET'
    },
    tests: []
  };

  // Test 1: Try the locations endpoint (simpler)
  try {
    const locResponse = await fetch(
      `https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );
    const locText = await locResponse.text();
    results.tests.push({
      test: 'Get Location',
      endpoint: `/locations/${GHL_LOCATION_ID}`,
      status: locResponse.status,
      ok: locResponse.ok,
      response: locText.substring(0, 300)
    });
  } catch (e) {
    results.tests.push({
      test: 'Get Location',
      error: e.message
    });
  }

  // Test 2: Try webhooks with different version
  try {
    const webhookResponse = await fetch(
      `https://services.leadconnectorhq.com/webhooks/?locationId=${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-04-15'  // Try older version
        }
      }
    );
    const webhookText = await webhookResponse.text();
    results.tests.push({
      test: 'List Webhooks (v2021-04-15)',
      status: webhookResponse.status,
      ok: webhookResponse.ok,
      response: webhookText.substring(0, 300)
    });
  } catch (e) {
    results.tests.push({
      test: 'List Webhooks (v2021-04-15)',
      error: e.message
    });
  }

  // Test 3: Try contacts endpoint to verify API key works
  try {
    const contactsResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );
    const contactsText = await contactsResponse.text();
    results.tests.push({
      test: 'List Contacts',
      status: contactsResponse.status,
      ok: contactsResponse.ok,
      response: contactsText.substring(0, 300)
    });
  } catch (e) {
    results.tests.push({
      test: 'List Contacts',
      error: e.message
    });
  }

  // Test 4: Try the newer webhooks endpoint format
  try {
    const webhook2Response = await fetch(
      `https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}/webhooks`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );
    const webhook2Text = await webhook2Response.text();
    results.tests.push({
      test: 'List Webhooks (alt endpoint)',
      endpoint: `/locations/${GHL_LOCATION_ID}/webhooks`,
      status: webhook2Response.status,
      ok: webhook2Response.ok,
      response: webhook2Text.substring(0, 300)
    });
  } catch (e) {
    results.tests.push({
      test: 'List Webhooks (alt endpoint)',
      error: e.message
    });
  }

  return res.status(200).json(results);
}
