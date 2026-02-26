// /pages/api/admin/protocols/[id]/session.js
// Toggle session completion - Range Medical

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

  const { session_number } = req.body;

  if (!session_number) {
    return res.status(400).json({ error: 'session_number required' });
  }

  try {
    // Check if log exists for this day
    const { data: existingLog } = await supabase
      .from('injection_logs')
      .select('*')
      .eq('protocol_id', id)
      .eq('day_number', session_number)
      .maybeSingle();

    const today = new Date().toISOString().split('T')[0];

    if (existingLog) {
      // Toggle completion
      const newCompleted = !existingLog.completed;
      
      await supabase
        .from('injection_logs')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? today : null
        })
        .eq('id', existingLog.id);

      // Update protocol completed count
      await updateProtocolCount(id);

      return res.status(200).json({
        success: true,
        completed: newCompleted,
        session_number
      });
    } else {
      // Create new log as completed
      await supabase
        .from('injection_logs')
        .insert({
          protocol_id: id,
          day_number: session_number,
          completed: true,
          completed_at: today
        });

      // Update protocol completed count
      await updateProtocolCount(id);

      return res.status(200).json({
        success: true,
        completed: true,
        session_number
      });
    }

  } catch (error) {
    console.error('Session toggle error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function updateProtocolCount(protocolId) {
  // Count completed logs
  const { data: completedLogs } = await supabase
    .from('injection_logs')
    .select('id')
    .eq('protocol_id', protocolId)
    .eq('completed', true);

  const count = completedLogs?.length || 0;

  // Update protocols table
  await supabase
    .from('protocols')
    .update({ injections_completed: count, sessions_used: count })
    .eq('id', protocolId);
}
