// /pages/api/protocols/[id]/logs/[logId].js
// Update or delete a protocol log entry
// Range Medical
// UPDATED: 2026-03-17 — Consolidated to service_logs as single source of truth

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id: protocolId, logId } = req.query;

  if (!protocolId || !logId) {
    return res.status(400).json({ error: 'Protocol ID and Log ID required' });
  }

  // PUT - Update entry_date on an existing log entry
  if (req.method === 'PUT') {
    const { log_date } = req.body;
    if (!log_date) {
      return res.status(400).json({ error: 'log_date is required' });
    }
    try {
      // Try service_logs first
      const { data, error } = await supabase
        .from('service_logs')
        .update({ entry_date: log_date })
        .eq('id', logId)
        .eq('protocol_id', protocolId)
        .select()
        .single();

      if (error) {
        // Fallback to protocol_logs for system/audit entries
        const { data: plData, error: plError } = await supabase
          .from('protocol_logs')
          .update({ log_date })
          .eq('id', logId)
          .eq('protocol_id', protocolId)
          .select()
          .single();
        if (plError) throw plError;
        return res.status(200).json(plData);
      }
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error updating log:', error);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get protocol to update sessions_used
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('sessions_used, status')
      .eq('id', protocolId)
      .single();

    if (fetchError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Try to delete from service_logs first
    const { error: slError } = await supabase
      .from('service_logs')
      .delete()
      .eq('id', logId)
      .eq('protocol_id', protocolId);

    if (slError) {
      // Fallback to protocol_logs for system/audit entries
      const { error: plError } = await supabase
        .from('protocol_logs')
        .delete()
        .eq('id', logId)
        .eq('protocol_id', protocolId);
      if (plError) throw plError;
    }

    // Decrement sessions_used
    const newSessionsUsed = Math.max(0, (protocol.sessions_used || 1) - 1);
    const updates = { sessions_used: newSessionsUsed };

    if (protocol.status === 'completed' && newSessionsUsed > 0) {
      updates.status = 'active';
    }

    await supabase
      .from('protocols')
      .update(updates)
      .eq('id', protocolId);

    return res.status(200).json({ success: true, message: 'Log deleted' });

  } catch (error) {
    console.error('Error deleting log:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
