// /pages/api/service-log/[id].js
// Service log entry management — GET single entry, DELETE (void) entry
// Range Medical System

import { createClient } from '@supabase/supabase-js';

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
    // Get the entry first to check for protocol linkage
    const { data: entry, error: fetchErr } = await supabase
      .from('service_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // If linked to a protocol, decrement sessions_used
    if (entry.protocol_id && (entry.entry_type === 'injection' || entry.entry_type === 'session')) {
      const { data: protocol } = await supabase
        .from('protocols')
        .select('id, sessions_used, status, total_sessions')
        .eq('id', entry.protocol_id)
        .single();

      if (protocol && protocol.sessions_used > 0) {
        const newUsed = Math.max(0, (protocol.sessions_used || 0) - 1);
        const updates = { sessions_used: newUsed, updated_at: new Date().toISOString() };
        // If protocol was completed and we're removing a session, reactivate it
        if (protocol.status === 'completed' && newUsed < protocol.total_sessions) {
          updates.status = 'active';
        }
        await supabase.from('protocols').update(updates).eq('id', protocol.id);
      }
    }

    // Delete the entry
    const { error: delErr } = await supabase
      .from('service_logs')
      .delete()
      .eq('id', id);

    if (delErr) {
      console.error('[service-log] Delete error:', delErr);
      return res.status(500).json({ error: 'Failed to delete entry' });
    }

    return res.status(200).json({ success: true, deleted_id: id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
