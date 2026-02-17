// /pages/api/protocols/[id]/logs/[logId].js
// Delete a protocol log entry
// Range Medical

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

  // PUT - Update log_date on an existing log entry
  if (req.method === 'PUT') {
    const { log_date } = req.body;
    if (!log_date) {
      return res.status(400).json({ error: 'log_date is required' });
    }
    try {
      const { data, error } = await supabase
        .from('protocol_logs')
        .update({ log_date })
        .eq('id', logId)
        .eq('protocol_id', protocolId)
        .select()
        .single();

      if (error) throw error;
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

    // Delete the log entry
    const { error: deleteError } = await supabase
      .from('protocol_logs')
      .delete()
      .eq('id', logId)
      .eq('protocol_id', protocolId);

    if (deleteError) {
      throw deleteError;
    }

    // Decrement sessions_used
    const newSessionsUsed = Math.max(0, (protocol.sessions_used || 1) - 1);
    
    // Update protocol
    const updates = { sessions_used: newSessionsUsed };
    
    // If protocol was completed but now has unused sessions, reactivate it
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
