// /pages/api/gift/send-notification.js
// Sends a one-time gift notification SMS to a recipient
// Protected by CRON_SECRET — safe to call from scheduled tasks
// Range Medical

import { sendSMS, normalizePhone } from '../../../lib/send-sms';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check — same pattern as cron jobs
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to, recipient_name, gift, from_name, gift_url } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Missing required field: to' });
  }

  const phone = normalizePhone(to);
  if (!phone) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const firstName = (recipient_name || 'there').split(' ')[0];
  const giftLabel = gift || 'Essential Lab Panel';
  const giftFrom = from_name || 'a friend';
  const url = gift_url || 'https://app.range-medical.com/gift/essential-panel';

  const message =
    `Hi ${firstName}! ${giftFrom} has gifted you a ${giftLabel} at Range Medical in Newport Beach (valued at $350). ` +
    `Here's everything you need to know and how to redeem it: ${url} 🎁`;

  const result = await sendSMS({
    to: phone,
    message,
    log: {
      messageType: 'gift_notification',
      source: 'gift-send-notification',
    },
  });

  if (result.success) {
    console.log(`[gift-notification] Sent to ${phone} via ${result.provider}`);
    return res.status(200).json({
      success: true,
      provider: result.provider,
      messageSid: result.messageSid,
    });
  }

  console.error(`[gift-notification] SMS failed for ${phone}: ${result.error}`);
  return res.status(500).json({
    success: false,
    error: result.error,
  });
}
