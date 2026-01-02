// /pages/api/protocols/[id]/log-session.js
// Log a session or injection for a protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { log_date, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  try {
    // Get current protocol
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Create log entry
    const { error: logError } = await supabase
      .from('protocol_logs')
      .insert({
        protocol_id: id,
        patient_id: protocol.patient_id,
        log_type: 'injection',
        log_date: log_date || new Date().toISOString().split('T')[0],
        notes: notes || null
      });

    if (logError) {
      console.error('Error creating log:', logError);
      // Continue even if log fails - still increment sessions
    }

    // Increment sessions_used if session-based
    if (protocol.total_sessions) {
      const newSessionsUsed = (protocol.sessions_used || 0) + 1;
      
      const updates = {
        sessions_used: newSessionsUsed,
        updated_at: new Date().toISOString()
      };

      // Auto-complete if all sessions used
      if (newSessionsUsed >= protocol.total_sessions) {
        updates.status = 'completed';
      }

      const { error: updateError } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error logging session:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
