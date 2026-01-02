// /pages/api/protocols/[id]/logs/[logId].js
// Protocol Log API - DELETE individual log
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id, logId } = req.query;

  if (!id || !logId) {
    return res.status(400).json({ error: 'Protocol ID and Log ID required' });
  }

  // DELETE - Delete a log entry
  if (req.method === 'DELETE') {
    try {
      // Get the log first to check its type
      const { data: log } = await supabase
        .from('protocol_logs')
        .select('log_type')
        .eq('id', logId)
        .single();

      // Delete the log
      const { error } = await supabase
        .from('protocol_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        console.error('Delete error:', error);
        return res.status(500).json({ error: 'Failed to delete log' });
      }

      // If this was an injection/session, decrement the protocol's sessions_used
      if (log && (log.log_type === 'injection' || log.log_type === 'session')) {
        const { data: protocol } = await supabase
          .from('protocols')
          .select('sessions_used, status')
          .eq('id', id)
          .single();

        if (protocol && protocol.sessions_used > 0) {
          const updates = {
            sessions_used: protocol.sessions_used - 1,
            updated_at: new Date().toISOString()
          };

          // If protocol was completed, reactivate it
          if (protocol.status === 'completed') {
            updates.status = 'active';
          }

          await supabase
            .from('protocols')
            .update(updates)
            .eq('id', id);
        }
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
