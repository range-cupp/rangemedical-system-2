// GET /api/lead-magnet/unsubscribe?id=<subscriber_id>
// POST (Gmail one-click) also supported.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const id = req.query?.id;
  if (!id) {
    return res.status(400).send('Missing subscriber ID');
  }

  await supabase.rpc('unsubscribe_lead_magnet', { p_id: id });

  if (req.method === 'POST') {
    return res.status(200).end();
  }

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:-apple-system,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#1a1a1a;">
  <h2>You're unsubscribed.</h2>
  <p style="color:#666;">You won't receive any more emails from this sequence. No hard feelings.</p>
  <p style="color:#666;font-size:14px;margin-top:32px;">— Chris, Range Medical</p>
</body></html>`);
}
