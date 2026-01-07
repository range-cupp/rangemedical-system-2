// /pages/api/protocols/[id]/logs.js
// Get all logs for a protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  try {
    // Get logs ordered by date descending (most recent first)
    const { data: logs, error } = await supabase
      .from('protocol_logs')
      .select('*')
      .eq('protocol_id', id)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch logs error:', error);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }

    return res.status(200).json({
      success: true,
      logs: logs || [],
      count: logs?.length || 0
    });

  } catch (err) {
    console.error('Get logs error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
