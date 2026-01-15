// /pages/api/admin/webhook-status.js
// Check and re-register GHL webhook
// Range Medical

export default async function handler(req, res) {
  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
  const WEBHOOK_URL = 'https://app.range-medical.com/api/protocol-webhook';

  // Check if env vars are set
  if (!GHL_API_KEY) {
    return res.status(400).json({
      error: 'GHL_API_KEY not configured',
      hint: 'Add GHL_API_KEY to your Vercel environment variables'
    });
  }

  if (!GHL_LOCATION_ID) {
    return res.status(400).json({
      error: 'GHL_LOCATION_ID not configured', 
      hint: 'Add GHL_LOCATION_ID to your Vercel environment variables'
    });
  }

  try {
    // GET = Check current webhooks
    if (req.method === 'GET') {
      const listResponse = await fetch(
        `https://services.leadconnectorhq.com/webhooks/?locationId=${GHL_LOCATION_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        }
      );

      const responseText = await listResponse.text();
      console.log('GHL Response Status:', listResponse.status);
      console.log('GHL Response:', responseText);

      if (!listResponse.ok) {
        return res.status(400).json({
          error: 'GHL API error',
          status: listResponse.status,
          response: responseText,
          hint: listResponse.status === 401 ? 'API key may be expired or invalid' : 'Check GHL API status'
        });
      }

      let webhooks;
      try {
        webhooks = JSON.parse(responseText);
      } catch (e) {
        return res.status(400).json({
          error: 'Invalid JSON from GHL',
          response: responseText.substring(0, 500)
        });
      }
      
      // Find our webhook
      const ourWebhook = webhooks.webhooks?.find(w => w.url?.includes('protocol-webhook'));
      
      return res.status(200).json({
        status: 'Webhook Status',
        location_id: GHL_LOCATION_ID,
        api_key_set: !!GHL_API_KEY,
        api_key_preview: GHL_API_KEY ? `${GHL_API_KEY.substring(0, 10)}...` : 'not set',
        expected_url: WEBHOOK_URL,
        webhooks_found: webhooks.webhooks?.length || 0,
        our_webhook: ourWebhook || 'NOT FOUND - need to register',
        all_webhooks: webhooks.webhooks || []
      });
    }

    // POST = Re-register webhook
    if (req.method === 'POST') {
      // First, list existing webhooks
      const listResponse = await fetch(
        `https://services.leadconnectorhq.com/webhooks/?locationId=${GHL_LOCATION_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        }
      );

      const listText = await listResponse.text();
      let existingWebhooks;
      try {
        existingWebhooks = JSON.parse(listText);
      } catch (e) {
        return res.status(400).json({
          error: 'Failed to parse GHL response',
          response: listText.substring(0, 500)
        });
      }
      
      // Delete existing protocol-webhook if it exists
      for (const hook of (existingWebhooks.webhooks || [])) {
        if (hook.url?.includes('protocol-webhook')) {
          console.log('Deleting existing webhook:', hook.id);
          await fetch(
            `https://services.leadconnectorhq.com/webhooks/${hook.id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28'
              }
            }
          );
        }
      }

      // Create new webhook
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

      const createText = await createResponse.text();
      console.log('Create webhook response:', createText);

      let createResult;
      try {
        createResult = JSON.parse(createText);
      } catch (e) {
        return res.status(400).json({
          error: 'Failed to parse create response',
          status: createResponse.status,
          response: createText.substring(0, 500)
        });
      }

      if (!createResponse.ok) {
        return res.status(400).json({
          error: 'Failed to create webhook',
          status: createResponse.status,
          details: createResult
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Webhook registered successfully',
        webhook: createResult
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Webhook status error:', error);
    return res.status(500).json({
      error: 'Failed to check/register webhook',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
