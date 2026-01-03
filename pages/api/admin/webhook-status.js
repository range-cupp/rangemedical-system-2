// /pages/api/admin/webhook-status.js
// Check and re-register GHL webhook
// Range Medical

export default async function handler(req, res) {
  const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';
  const WEBHOOK_URL = 'https://app.range-medical.com/api/protocol-webhook';

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

      const webhooks = await listResponse.json();
      
      // Find our webhook
      const ourWebhook = webhooks.webhooks?.find(w => w.url?.includes('protocol-webhook'));
      
      return res.status(200).json({
        status: 'Webhook Status',
        location_id: GHL_LOCATION_ID,
        expected_url: WEBHOOK_URL,
        webhooks_found: webhooks.webhooks?.length || 0,
        our_webhook: ourWebhook || 'NOT FOUND',
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

      const existingWebhooks = await listResponse.json();
      
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

      const createResult = await createResponse.json();
      console.log('Create webhook result:', JSON.stringify(createResult, null, 2));

      if (!createResponse.ok) {
        return res.status(400).json({
          error: 'Failed to create webhook',
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
      message: error.message
    });
  }
}
