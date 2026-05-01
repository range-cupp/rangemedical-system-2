// POST /api/daily/subscribe
// Public endpoint: landing page email capture form posts here.
// Inserts subscriber, sends welcome email 1 immediately.

import { createClient } from '@supabase/supabase-js';
import { subscribeAndSendWelcome } from '../../../lib/daily-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawEmail = (req.body?.email || '').toString().trim().toLowerCase();
    if (!rawEmail || !EMAIL_RX.test(rawEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email.' });
    }

    const metadata = {
      utm_source: req.body?.utm_source || null,
      utm_medium: req.body?.utm_medium || null,
      utm_campaign: req.body?.utm_campaign || null,
      ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || null,
      user_agent: req.headers['user-agent'] || null,
    };

    await subscribeAndSendWelcome({
      supabase,
      email: rawEmail,
      source: 'landing_page',
      metadata,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[daily/subscribe] error:', err);
    return res.status(500).json({ error: 'Something went wrong. Try again in a sec.' });
  }
}
