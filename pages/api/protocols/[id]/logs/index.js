// /pages/api/protocols/[id]/logs/index.js
// Protocol Logs API - GET all logs, POST new log
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  // GET - Get all logs for a protocol
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('protocol_logs')
        .select('*')
        .eq('protocol_id', id)
        .order('log_date', { ascending: false });

      if (error) {
        console.error('Error fetching logs:', error);
        return res.status(500).json({ error: 'Failed to fetch logs' });
      }

      return res.status(200).json(data || []);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // POST - Create new log entry
  if (req.method === 'POST') {
    try {
      const { patient_id, log_date, log_type, weight, notes, logged_by } = req.body;

      if (!log_date) {
        return res.status(400).json({ error: 'Date is required' });
      }

      // Create the log entry
      const { data: log, error: logError } = await supabase
        .from('protocol_logs')
        .insert({
          protocol_id: id,
          patient_id: patient_id,
          log_date: log_date,
          log_type: log_type || 'injection',
          weight: weight ? parseFloat(weight) : null,
          notes: notes || null,
          logged_by: logged_by || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (logError) {
        console.error('Error creating log:', logError);
        return res.status(500).json({ error: 'Failed to create log', details: logError.message });
      }

      // If this is an injection/session, update the protocol's sessions_used
      if (log_type === 'injection' || log_type === 'session') {
        // Get current protocol
        const { data: protocol } = await supabase
          .from('protocols')
          .select('sessions_used, total_sessions')
          .eq('id', id)
          .single();

        if (protocol) {
          const newSessionsUsed = (protocol.sessions_used || 0) + 1;
          const updates = {
            sessions_used: newSessionsUsed,
            updated_at: new Date().toISOString()
          };

          // If all sessions used, mark as completed
          if (protocol.total_sessions && newSessionsUsed >= protocol.total_sessions) {
            updates.status = 'completed';
          }

          await supabase
            .from('protocols')
            .update(updates)
            .eq('id', id);
        }
      }

      return res.status(200).json(log);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
