import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page, event, sessionId, metadata, referrer } = req.body;

    if (!page || !event) {
      return res.status(400).json({ error: 'page and event are required.' });
    }

    await supabase.from('page_events').insert({
      page,
      event,
      session_id: sessionId || null,
      metadata: metadata || {},
      referrer: referrer || null,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Analytics track error:', err);
    return res.status(500).json({ error: 'Failed to track event.' });
  }
}
