// GET /api/oxygen/subscribers
// Returns all 30-day email series subscribers

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: subscribers, error } = await supabase
      .from('oxygen_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Fetch subscribers error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ subscribers });
  } catch (error) {
    console.error('Fetch subscribers error:', error);
    return res.status(500).json({ error: error.message });
  }
}
