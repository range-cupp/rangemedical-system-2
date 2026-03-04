// /pages/api/webhooks/stripe.js
// Stripe Webhook Handler — sends SMS + email notification to owner on website purchases
// Listens for checkout.session.completed (from buy.stripe.com Payment Links)
// Range Medical

import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_PHONE = '+19496900339';
const OWNER_EMAIL = 'chriscupp8181@gmail.com';

// Disable body parsing — Stripe needs raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Read raw body from request
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Format dollar amount
function formatAmount(cents) {
  if (!cents) return '$0.00';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Send SMS via Twilio
async function sendTwilioSMS(message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: OWNER_PHONE,
        From: fromNumber,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Twilio SMS error:', response.status, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Twilio SMS error:', err);
    return false;
  }
}

// Send purchase notification email
async function sendNotificationEmail({ customerName, customerEmail, items, amount }) {
  const itemList = items.join(', ');
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #000; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">💰 New Website Purchase</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
            <td style="padding: 8px 0; font-size: 14px; text-align: right;">${customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Item</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${itemList}</td>
          </tr>
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #6b7280; font-size: 16px; font-weight: 600;">Total</td>
            <td style="padding: 12px 0; font-weight: 700; font-size: 20px; text-align: right; color: #16a34a;">${amount}</td>
          </tr>
        </table>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
          ${now} · via range-medical.com Payment Link
        </div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: OWNER_EMAIL,
      subject: `💰 New Purchase: ${amount} — ${items[0] || 'Website Purchase'}`,
      html: html,
    });
    return true;
  } catch (err) {
    console.error('Notification email error:', err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Read raw body and verify signature
  let event;
  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed (Payment Link purchases)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Get line items to identify what was purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
      const items = lineItems.data.map(item => item.description || 'Unknown item');

      // Customer info
      const customerEmail = session.customer_details?.email || session.customer_email || 'unknown';
      const customerName = session.customer_details?.name || customerEmail;
      const amount = formatAmount(session.amount_total);

      // Send SMS via Twilio
      const smsMessage = `💰 New Purchase!\n\n${customerName}\n${items.join(', ')}\n${amount}\n\nvia range-medical.com`;
      const smsSent = await sendTwilioSMS(smsMessage);

      // Also send email notification
      const emailSent = await sendNotificationEmail({ customerName, customerEmail, items, amount });

      console.log(`Purchase notification: ${amount} — ${items.join(', ')} (SMS: ${smsSent ? 'sent' : 'failed'}, Email: ${emailSent ? 'sent' : 'failed'})`);
    } catch (err) {
      // Don't fail the webhook response — Stripe would retry
      console.error('Error processing checkout notification:', err.message);
    }
  }

  // Always return 200 to acknowledge receipt (prevents Stripe retries)
  return res.status(200).json({ received: true });
}
