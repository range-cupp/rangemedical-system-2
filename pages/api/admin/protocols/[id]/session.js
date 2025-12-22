// /pages/api/admin/protocols/[id]/session.js
// Mark session complete (admin side)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, status } = req.body;

  try {
    // Check if this is a generated session ID
    if (session_id?.startsWith('generated-')) {
      const sessionNumber = parseInt(session_id.replace('generated-', ''));
      
      // Check if session exists in protocol_sessions
      const { data: existing } = await supabase
        .from('protocol_sessions')
        .select('id')
        .eq('protocol_id', id)
        .eq('session_number', sessionNumber)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from('protocol_sessions')
          .update({
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            completed_by: 'staff'
          })
          .eq('id', existing.id);
      } else {
        // Create new session record
        const { data: protocol } = await supabase
          .from('protocols')
          .select('start_date')
          .eq('id', id)
          .maybeSingle();

        let scheduledDate = null;
        if (protocol?.start_date) {
          const start = new Date(protocol.start_date);
          start.setDate(start.getDate() + sessionNumber - 1);
          scheduledDate = start.toISOString().split('T')[0];
        }

        await supabase
          .from('protocol_sessions')
          .insert({
            protocol_id: id,
            session_number: sessionNumber,
            scheduled_date: scheduledDate,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            completed_by: 'staff'
          });
      }

      // Also update old injection_logs for backward compatibility
      const { data: existingLog } = await supabase
        .from('injection_logs')
        .select('id, completed')
        .eq('protocol_id', id)
        .eq('day_number', sessionNumber)
        .maybeSingle();

      if (existingLog) {
        await supabase
          .from('injection_logs')
          .update({
            completed: status === 'completed',
            completed_at: status === 'completed' ? new Date().toISOString().split('T')[0] : null
          })
          .eq('id', existingLog.id);
      } else {
        await supabase
          .from('injection_logs')
          .insert({
            protocol_id: id,
            day_number: sessionNumber,
            completed: status === 'completed',
            completed_at: status === 'completed' ? new Date().toISOString().split('T')[0] : null
          });
      }
    } else {
      // Update by session ID
      await supabase
        .from('protocol_sessions')
        .update({
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          completed_by: 'staff'
        })
        .eq('id', session_id);
    }

    // Update protocol completed count
    const { data: completedSessions } = await supabase
      .from('protocol_sessions')
      .select('id')
      .eq('protocol_id', id)
      .eq('status', 'completed');

    // Try patient_protocols first
    const { error: newError } = await supabase
      .from('patient_protocols')
      .update({
        sessions_completed: completedSessions?.length || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Also update old protocols table
    if (newError) {
      // Count from injection_logs for old table
      const { data: completedLogs } = await supabase
        .from('injection_logs')
        .select('id')
        .eq('protocol_id', id)
        .eq('completed', true);

      await supabase
        .from('protocols')
        .update({
          injections_completed: completedLogs?.length || 0
        })
        .eq('id', id);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Session update error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
