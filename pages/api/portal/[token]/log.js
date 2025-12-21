// /pages/api/portal/[token]/log.js
// Log injection/action completion
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

    if (!block_id) {
      return res.status(400).json({ error: 'block_id required' });
    }

    // Verify token matches this protocol
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, access_token, injections_completed, start_date')
      .eq('id', block_id)
      .single();

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Verify access
    if (protocol.access_token !== token) {
      // Try patient_tokens as fallback
      const { data: tokenData } = await supabase
        .from('patient_tokens')
        .select('patient_id')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (!tokenData) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Calculate day number if not provided
    let dayNum = day_number;
    if (!dayNum && protocol.start_date) {
      const start = new Date(protocol.start_date);
      const today = new Date();
      dayNum = Math.floor((today - start) / 86400000) + 1;
    }
    dayNum = dayNum || 1;

    // Check if already logged
    const { data: existing } = await supabase
      .from('injection_logs')
      .select('id, completed')
      .eq('protocol_id', block_id)
      .eq('day_number', dayNum)
      .maybeSingle();

    const shouldComplete = completed !== false;

    if (existing) {
      // Toggle existing log
      if (shouldComplete === existing.completed) {
        // Toggle off
        await supabase
          .from('injection_logs')
          .update({ completed: !existing.completed })
          .eq('id', existing.id);

        // Update count
        const newCount = Math.max(0, (protocol.injections_completed || 0) + (existing.completed ? -1 : 1));
        await supabase
          .from('protocols')
          .update({ injections_completed: newCount })
          .eq('id', block_id);
      } else {
        // Update to new state
        await supabase
          .from('injection_logs')
          .update({ completed: shouldComplete })
          .eq('id', existing.id);

        const delta = shouldComplete ? 1 : -1;
        await supabase
          .from('protocols')
          .update({ injections_completed: Math.max(0, (protocol.injections_completed || 0) + delta) })
          .eq('id', block_id);
      }
    } else {
      // Create new log
      await supabase
        .from('injection_logs')
        .insert({
          protocol_id: block_id,
          day_number: dayNum,
          completed: shouldComplete,
          completed_at: new Date().toISOString().split('T')[0]
        });

      if (shouldComplete) {
        await supabase
          .from('protocols')
          .update({ injections_completed: (protocol.injections_completed || 0) + 1 })
          .eq('id', block_id);
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Log error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
