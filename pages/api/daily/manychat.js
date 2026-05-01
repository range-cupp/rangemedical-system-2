// POST /api/daily/manychat
// Webhook endpoint: ManyChat fires this when a user gives an email inside a DM flow.
// Authenticated via Authorization: Bearer <MANYCHAT_WEBHOOK_SECRET>.
//
// Expected body:
//   {
//     "email": "user@example.com",
//     "ig_handle": "@somehandle",            // optional
//     "manychat_subscriber_id": "12345"      // optional
//   }

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { subscribeAndSendWelcome } from '../../../lib/daily-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAuthorized(req) {
  const expected = process.env.MANYCHAT_WEBHOOK_SECRET;
  if (!expected) return false;

  // Accept either "Authorization: Bearer SECRET" or "x-manychat-secret: SECRET".
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    return timingSafeEqualStrings(auth.slice(7), expected);
  }
  const headerSecret = req.headers['x-manychat-secret'];
  if (headerSecret) {
    return timingSafeEqualStrings(headerSecret, expected);
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const rawEmail = (req.body?.email || '').toString().trim().toLowerCase();
    if (!rawEmail || !EMAIL_RX.test(rawEmail)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const igHandle = (req.body?.ig_handle || '').toString().trim() || null;
    const manychatId = (req.body?.manychat_subscriber_id || '').toString().trim() || null;

    const result = await subscribeAndSendWelcome({
      supabase,
      email: rawEmail,
      source: 'manychat',
      metadata: {
        ig_handle: igHandle,
        manychat_subscriber_id: manychatId,
      },
    });

    return res.status(200).json({
      success: true,
      already_subscribed: result.alreadySubscribed,
    });
  } catch (err) {
    console.error('[daily/manychat] error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
