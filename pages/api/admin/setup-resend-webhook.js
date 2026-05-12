// One-time setup: registers the Resend webhook for open/click/bounce tracking.
// Call once, then delete this file.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    // Check existing webhooks first
    const existing = await resend.webhooks.list();
    const webhooks = existing?.data?.data || existing?.data || [];

    const targetUrl = 'https://app.range-medical.com/api/webhooks/resend';
    const alreadyExists = webhooks.some(w => w.endpoint_url === targetUrl);

    if (alreadyExists) {
      return res.json({ message: 'Webhook already registered', webhooks });
    }

    const result = await resend.webhooks.create({
      endpoint_url: targetUrl,
      events: [
        'email.delivered',
        'email.opened',
        'email.clicked',
        'email.bounced',
        'email.complained',
      ],
    });

    return res.json({ success: true, webhook: result?.data || result });
  } catch (err) {
    console.error('Setup webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
