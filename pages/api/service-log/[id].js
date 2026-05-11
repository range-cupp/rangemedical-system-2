// /pages/api/service-log/[id].js
// Service log entry management — GET single entry, DELETE (void) entry

import { createClient } from '@supabase/supabase-js';
import { recountProtocolSessions } from '../../../lib/recount-protocol-sessions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing service log ID' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('service_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: 'Entry not found' });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { data: entry, error: fetchErr } = await supabase
      .from('service_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const { error: delErr } = await supabase
      .from('service_logs')
      .delete()
      .eq('id', id);

    if (delErr) {
      console.error('[service-log] Delete error:', delErr);
      return res.status(500).json({ error: 'Failed to delete entry' });
    }

    // Recount from service_logs (single source of truth) instead of blind decrement
    if (entry.protocol_id && (entry.entry_type === 'injection' || entry.entry_type === 'session')) {
      await recountProtocolSessions(supabase, entry.protocol_id);
    }

    return res.status(200).json({ success: true, deleted_id: id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
