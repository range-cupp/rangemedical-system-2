// /pages/api/admin/setup-ghl-message-webhook.js
// Registers a GHL webhook for InboundMessage events
// This tells GHL to POST inbound SMS messages to our webhook endpoint
// Range Medical

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

async function safeJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, status: response.status };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  if (!GHL_API_KEY) {
    return res.status(400).json({ error: 'Missing GHL_API_KEY environment variable' });
  }

  if (!GHL_LOCATION_ID) {
    return res.status(400).json({ error: 'Missing GHL_LOCATION_ID environment variable' });
  }

  const WEBHOOK_URL = 'https://app.range-medical.com/api/webhooks/ghl-message';

  try {
    // 1. List existing webhooks
    const listRes = await fetch(
      `https://services.leadconnectorhq.com/webhooks/?locationId=${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
        },
      }
    );

    const existingData = await safeJson(listRes);

    if (!listRes.ok) {
      return res.status(400).json({
        error: 'Failed to list existing webhooks',
        status: listRes.status,
        details: existingData,
      });
    }

    const existingWebhooks = existingData.webhooks || [];

    // 2. Check if our message webhook already exists
    const existingHook = existingWebhooks.find(w => w.url === WEBHOOK_URL);

    if (existingHook) {
      // Delete and recreate to ensure correct events
      await fetch(
        `https://services.leadconnectorhq.com/webhooks/${existingHook.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
          },
        }
      );
    }

    // 3. Create webhook for inbound message events
    const createRes = await fetch(
      'https://services.leadconnectorhq.com/webhooks/',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          locationId: GHL_LOCATION_ID,
          events: [
            'InboundMessage',
          ],
        }),
      }
    );

    const createResult = await safeJson(createRes);

    if (!createRes.ok) {
      return res.status(400).json({
        error: 'Failed to create webhook',
        status: createRes.status,
        details: createResult,
      });
    }

    // 4. Confirm by listing webhooks again
    const confirmRes = await fetch(
      `https://services.leadconnectorhq.com/webhooks/?locationId=${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
        },
      }
    );
    const confirmedData = await safeJson(confirmRes);

    return res.status(200).json({
      success: true,
      message: 'GHL inbound message webhook registered successfully',
      webhook: createResult,
      webhookUrl: WEBHOOK_URL,
      allWebhooks: (confirmedData.webhooks || []).map(w => ({
        id: w.id,
        url: w.url,
        events: w.events,
      })),
    });

  } catch (error) {
    console.error('Setup GHL message webhook error:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
