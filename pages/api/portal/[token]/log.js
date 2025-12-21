// /pages/api/portal/[token]/log.js
// Log injection completion - simplified
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { block_id, day_number, completed } = req.body;

    console.log('Log request:', { token, block_id, day_number, completed });

    if (!block_id || !day_number) {
      return res.status(400).json({ error: 'block_id and day_number required' });
    }

    // Find protocol by ID (block_id is the protocol ID)
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, access_token, injections_completed')
      .eq('id', block_id)
      .single();

    if (protocolError || !protocol) {
      console.error('Protocol not found:', protocolError);
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Verify token matches
    if (protocol.access_token !== token) {
      console.error('Token mismatch:', { expected: protocol.access_token, got: token });
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if log already exists for this day
    const { data: existingLog } = await supabase
      .from('injection_logs')
      .select('id, completed')
      .eq('protocol_id', block_id)
      .eq('day_number', day_number)
      .maybeSingle();

    if (existingLog) {
      // Update existing log
      const newCompleted = completed !== undefined ? completed : !existingLog.completed;
      
      await supabase
        .from('injection_logs')
        .update({ 
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', existingLog.id);

      // Update protocol count
      const countChange = newCompleted !== existingLog.completed 
        ? (newCompleted ? 1 : -1) 
        : 0;
      
      if (countChange !== 0) {
        await supabase
          .from('protocols')
          .update({ 
            injections_completed: Math.max(0, (protocol.injections_completed || 0) + countChange)
          })
          .eq('id', block_id);
      }

      return res.status(200).json({ success: true, toggled: true, completed: newCompleted });
    } else {
      // Create new log
      const shouldComplete = completed !== false;
      
      await supabase
        .from('injection_logs')
        .insert({
          protocol_id: block_id,
          day_number: day_number,
          completed: shouldComplete,
          completed_at: shouldComplete ? new Date().toISOString().split('T')[0] : null
        });

      // Update protocol count if completed
      if (shouldComplete) {
        await supabase
          .from('protocols')
          .update({ 
            injections_completed: (protocol.injections_completed || 0) + 1
          })
          .eq('id', block_id);
      }

      return res.status(200).json({ success: true, created: true, completed: shouldComplete });
    }

  } catch (error) {
    console.error('Log error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
