// /pages/api/webhooks/stripe.js
// Stripe Webhook Handler — sends SMS notification to owner on website purchases
// Listens for checkout.session.completed (from buy.stripe.com Payment Links)
// Range Medical

import Stripe from 'stripe';
import { findGHLContactByPhone } from '../../../lib/ghl-sync';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const GHL_API_KEY = process.env.GHL_API_KEY;
const OWNER_PHONE = '9496900339';

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

// Send SMS via GHL
async function sendSMS(contactId, message) {
  if (!GHL_API_KEY || !contactId) return false;
  try {
    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: contactId,
        message: message
      })
    });
    return response.ok;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
}

// Format dollar amount
function formatAmount(cents) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      const items = lineItems.data.map(item => item.description || item.price?.product?.name || 'Unknown item');
      const itemList = items.join(', ');

      // Customer info
      const customerEmail = session.customer_details?.email || session.customer_email || 'unknown';
      const customerName = session.customer_details?.name || customerEmail;
      const amount = formatAmount(session.amount_total);

      // Build notification message
      const message = `💰 New Purchase!\n\n${customerName}\n${itemList}\n${amount}\n\nvia range-medical.com`;

      // Look up owner's GHL contact ID by phone
      const ownerContactId = await findGHLContactByPhone(OWNER_PHONE);

      if (ownerContactId) {
        const sent = await sendSMS(ownerContactId, message);
        if (sent) {
          console.log(`Purchase notification SMS sent for ${amount} — ${itemList}`);
        } else {
          console.error('Failed to send purchase notification SMS');
        }
      } else {
        console.error('Owner GHL contact not found for phone:', OWNER_PHONE);
      }
    } catch (err) {
      // Don't fail the webhook response — Stripe would retry
      console.error('Error processing checkout notification:', err.message);
    }
  }

  // Always return 200 to acknowledge receipt (prevents Stripe retries)
  return res.status(200).json({ received: true });
}
