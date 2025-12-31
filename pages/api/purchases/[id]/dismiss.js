// /pages/api/purchases/[id]/dismiss.js
// Dismiss a purchase from the pipeline

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Purchase ID required' });
  }

  try {
    const { error } = await supabase
      .from('purchases')
      .update({ dismissed: true })
      .eq('id', id);

    if (error) {
      console.error('Dismiss error:', error);
      return res.status(500).json({ error: 'Failed to dismiss' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
