// /pages/api/patient-portal/[token]/session.js
// Mark session complete - works with existing injection_logs
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { protocol_id, session_number } = req.body;

  if (!protocol_id) {
    return res.status(400).json({ error: 'protocol_id required' });
  }

  try {
    // Verify protocol exists and token matches
    let protocol = null;
    let isOldTable = false;

    // Try old protocols table first
    const { data: oldProtocol } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', protocol_id)
      .maybeSingle();

    if (oldProtocol) {
      protocol = oldProtocol;
      isOldTable = true;
    } else {
      // Try new table
      const { data: newProtocol } = await supabase
        .from('patient_protocols')
        .select('*')
        .eq('id', protocol_id)
        .maybeSingle();
      
      if (newProtocol) {
        protocol = newProtocol;
      }
    }

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // For peptide protocols with session numbers (day 1, day 2, etc)
    if (session_number) {
      // Check if log exists
      const { data: existingLog } = await supabase
        .from('injection_logs')
        .select('*')
        .eq('protocol_id', protocol_id)
        .eq('day_number', session_number)
        .maybeSingle();

      if (existingLog) {
        // Toggle completion
        const newCompleted = !existingLog.completed;
        
        await supabase
          .from('injection_logs')
          .update({
            completed: newCompleted,
            completed_at: newCompleted ? new Date().toISOString().split('T')[0] : null
          })
          .eq('id', existingLog.id);

        // Update protocol count
        const { data: allCompleted } = await supabase
          .from('injection_logs')
          .select('id')
          .eq('protocol_id', protocol_id)
          .eq('completed', true);

        const completedCount = allCompleted?.length || 0;
        
        if (isOldTable) {
          await supabase
            .from('protocols')
            .update({ injections_completed: completedCount })
            .eq('id', protocol_id);
        } else {
          await supabase
            .from('patient_protocols')
            .update({ sessions_completed: completedCount })
            .eq('id', protocol_id);
        }

        return res.status(200).json({ success: true, completed: newCompleted });
      } else {
        // Create new log
        await supabase
          .from('injection_logs')
          .insert({
            protocol_id,
            day_number: session_number,
            completed: true,
            completed_at: new Date().toISOString().split('T')[0]
          });

        // Update protocol count
        const { data: allCompleted } = await supabase
          .from('injection_logs')
          .select('id')
          .eq('protocol_id', protocol_id)
          .eq('completed', true);

        const completedCount = allCompleted?.length || 0;
        
        if (isOldTable) {
          await supabase
            .from('protocols')
            .update({ injections_completed: completedCount })
            .eq('id', protocol_id);
        } else {
          await supabase
            .from('patient_protocols')
            .update({ sessions_completed: completedCount })
            .eq('id', protocol_id);
        }

        return res.status(200).json({ success: true, completed: true });
      }
    }

    // For HRT/Weight Loss (no session number)
    const today = new Date().toISOString().split('T')[0];
    const nextSessionNum = (protocol.sessions_completed || protocol.injections_completed || 0) + 1;

    await supabase
      .from('injection_logs')
      .insert({
        protocol_id,
        day_number: nextSessionNum,
        completed: true,
        completed_at: today
      });

    if (isOldTable) {
      await supabase
        .from('protocols')
        .update({ injections_completed: nextSessionNum })
        .eq('id', protocol_id);
    } else {
      await supabase
        .from('patient_protocols')
        .update({ sessions_completed: nextSessionNum })
        .eq('id', protocol_id);
    }

    return res.status(200).json({ success: true, session_number: nextSessionNum });

  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
