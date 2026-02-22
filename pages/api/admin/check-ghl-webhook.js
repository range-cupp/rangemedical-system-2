// /pages/api/admin/check-ghl-webhook.js
// Check and re-register GHL webhook for payment events
// Range Medical

export default async function handler(req, res) {
  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
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
      
      return res.status(200).json({
        status: 'Current webhooks',
        location_id: GHL_LOCATION_ID,
        webhook_url: WEBHOOK_URL,
        webhooks: webhooks.webhooks || [],
        has_payment_webhook: webhooks.webhooks?.some(w => 
          w.url === WEBHOOK_URL && 
          (w.events?.includes('InvoicePaymentReceived') || w.events?.includes('PaymentReceived'))
        )
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
      
      // Delete existing webhook if it exists
      const existingHook = existingWebhooks.webhooks?.find(w => w.url === WEBHOOK_URL);
      if (existingHook) {
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

      // Create new webhook with payment events
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
              'PaymentReceived',
              'OrderSubmitted'
            ]
          })
        }
      );

      const createResult = await createResponse.json();

      if (!createResponse.ok) {
        return res.status(400).json({
          error: 'Failed to create webhook',
          details: createResult
        });
      }

      return res.status(200).json({
        status: 'Webhook registered successfully',
        webhook: createResult,
        events: ['InvoicePaymentReceived', 'PaymentReceived', 'OrderSubmitted']
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('GHL webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
