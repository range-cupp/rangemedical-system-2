// /pages/api/admin/ghl-webhooks.js
// Diagnostic endpoint to check GHL webhook configuration

export default async function handler(req, res) {
  // Check admin auth
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

  if (!GHL_API_KEY) {
    return res.status(400).json({ 
      error: 'Missing GHL_API_KEY',
      hasLocationId: !!GHL_LOCATION_ID
    });
  }

  try {
    // List existing webhooks
    const webhooksResponse = await fetch(
      `https://services.leadconnectorhq.com/webhooks/?locationId=${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );

    const webhooksData = await webhooksResponse.json();

    // Known GHL webhook events for invoices/payments
    const knownPaymentEvents = [
      'InvoicePaymentReceived',
      'PaymentReceived', 
      'InvoiceCreated',
      'InvoiceSent',
      'InvoiceVoided',
      'InvoiceDeleted',
      'OrderSubmitted',
      'OrderCompleted',
      'PaymentCompleted'
    ];

    return res.status(200).json({
      success: true,
      location_id: GHL_LOCATION_ID,
      existing_webhooks: webhooksData.webhooks || [],
      webhook_count: webhooksData.webhooks?.length || 0,
      suggested_events: knownPaymentEvents,
      note: 'To register a new webhook, POST to /api/admin/setup-ghl-webhook'
    });

  } catch (error) {
    console.error('GHL API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch webhooks',
      message: error.message
    });
  }
}
