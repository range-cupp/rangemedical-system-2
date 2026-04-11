// /pages/api/quotes/[token].js
// Public read + view tracking for a quote
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token required' });

  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('token', token)
      .single();
    if (error || !quote) return res.status(404).json({ error: 'Not found' });

    if (req.method === 'GET') {
      // Preview mode — skip view tracking (admin preview)
      if (req.query.preview === 'true') {
        return res.status(200).json({ ...quote, _preview: true });
      }

      // Track view
      const now = new Date().toISOString();
      const update = {
        last_viewed_at: now,
        view_count: (quote.view_count || 0) + 1,
      };
      if (!quote.first_viewed_at) {
        update.first_viewed_at = now;
        if (quote.status === 'sent' || quote.status === 'draft') update.status = 'viewed';
      }
      await supabase.from('quotes').update(update).eq('id', quote.id);
      return res.status(200).json({ ...quote, ...update });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('quote token api error', err);
    return res.status(500).json({ error: err.message });
  }
}
