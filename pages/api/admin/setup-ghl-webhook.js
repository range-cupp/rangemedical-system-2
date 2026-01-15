// /pages/api/admin/setup-ghl-webhook.js
// One-time setup script to register webhook in GoHighLevel
// This tells GHL to send invoice/payment data to our webhook

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Check admin auth
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    return res.status(400).json({ 
      error: 'Missing GHL_API_KEY or GHL_LOCATION_ID in environment variables' 
    });
  }

  const WEBHOOK_URL = 'https://app.range-medical.com/api/protocol-webhook';

  try {
    // First, list existing webhooks to see what's there
    console.log('Fetching existing webhooks...');
    const listResponse = await fetch(
      `https://services.leadconnectorhq.com/webhooks/?locationId=${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );

    const existingWebhooks = await listResponse.json();
    console.log('Existing webhooks:', JSON.stringify(existingWebhooks, null, 2));

    // Check if our webhook already exists
    const existingHook = existingWebhooks.webhooks?.find(
      w => w.url === WEBHOOK_URL
    );

    if (existingHook) {
      // Delete existing webhook so we can recreate with correct events
      console.log('Deleting existing webhook:', existingHook.id);
      await fetch(
        `https://services.leadconnectorhq.com/webhooks/${existingHook.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        }
      );
    }

    // Create new webhook with correct payment/invoice events
    console.log('Creating webhook for payment events...');
    const createResponse = await fetch(
      'https://services.leadconnectorhq.com/webhooks/',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          locationId: GHL_LOCATION_ID,
          events: [
            'InvoicePaymentReceived',
            'PaymentReceived'
          ]
        })
      }
    );

    const createResult = await createResponse.json();
    console.log('Create webhook result:', JSON.stringify(createResult, null, 2));

    if (!createResponse.ok) {
      return res.status(400).json({
        error: 'Failed to create webhook',
        details: createResult
      });
    }

    // List webhooks again to confirm
    const confirmResponse = await fetch(
      `https://services.leadconnectorhq.com/webhooks/?locationId=${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );
    const confirmedWebhooks = await confirmResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Webhook registered successfully',
      webhook: createResult,
      all_webhooks: confirmedWebhooks.webhooks
    });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({
      error: 'Failed to setup webhook',
      message: error.message
    });
  }
}
