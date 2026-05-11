// /pages/api/protocols/[id]/logs/[logId].js
// Update or delete a protocol log entry
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { deleteServiceLogEntry } from '../../../../../lib/service-log-engine';

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
    // Try service_logs via engine (handles recount)
    const { deleted, error: engineErr } = await deleteServiceLogEntry(supabase, logId);

    if (engineErr === 'Log entry not found') {
      // Fallback to protocol_logs for system/audit entries
      const { error: plError } = await supabase
        .from('protocol_logs')
        .delete()
        .eq('id', logId)
        .eq('protocol_id', protocolId);
      if (plError) throw plError;
    } else if (engineErr) {
      throw new Error(engineErr);
    }

    return res.status(200).json({ success: true, message: 'Log deleted' });

  } catch (error) {
    console.error('Error deleting log:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
