// /pages/api/notes/by-protocol.js
// Fetch clinical notes linked to a specific protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { protocol_id } = req.query;
  if (!protocol_id) {
    return res.status(400).json({ error: 'protocol_id is required' });
  }

  try {
    const { data, error } = await supabase
      .from('patient_notes')
      .select('id, body, raw_input, note_date, source, created_by, created_at, pinned, protocol_id, protocol_name')
      .eq('protocol_id', protocol_id)
      .order('note_date', { ascending: false });

    if (error) {
      // Fallback if protocol columns don't exist yet
      const { data: fallback, error: fbError } = await supabase
        .from('patient_notes')
        .select('id, body, note_date, source, created_at')
        .eq('protocol_id', protocol_id)
        .order('note_date', { ascending: false });

      if (fbError) throw fbError;
      return res.status(200).json({ notes: fallback || [] });
    }

    return res.status(200).json({ notes: data || [] });
  } catch (error) {
    console.error('Notes by protocol fetch error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch notes' });
  }
}
