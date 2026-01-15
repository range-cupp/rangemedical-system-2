// /pages/api/admin/protocol/[id]/session.js
// Add a session to an existing protocol
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

  // POST - Add a session
  if (req.method === 'POST') {
    const { purchase_id, session_date, notes } = req.body;

    try {
      // Get current protocol
      const { data: protocol, error: fetchError } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      // Calculate new session count
      const currentSessions = protocol.injections_completed || 0;
      const newSessionCount = currentSessions + 1;
      const totalSessions = protocol.total_sessions;

      // Check if pack is already full
      if (totalSessions && newSessionCount > totalSessions) {
        return res.status(400).json({ 
          error: 'Session pack is full', 
          details: `${currentSessions}/${totalSessions} sessions already used` 
        });
      }

      // Determine if protocol should be marked complete
      const newStatus = (totalSessions && newSessionCount >= totalSessions) ? 'completed' : protocol.status;

      // Update protocol
      const { data: updatedProtocol, error: updateError } = await supabase
        .from('protocols')
        .update({
          injections_completed: newSessionCount,
          status: newStatus,
          updated_at: new Date().toISOString(),
          notes: notes ? `${protocol.notes || ''}\n[${new Date().toLocaleDateString()}] ${notes}`.trim() : protocol.notes
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Protocol update error:', updateError);
        return res.status(500).json({ error: 'Failed to add session', details: updateError.message });
      }

      // Link purchase to protocol if provided
      if (purchase_id) {
        await supabase
          .from('purchases')
          .update({ protocol_id: id })
          .eq('id', purchase_id);
      }

      // Return success with updated info
      return res.status(200).json({
        success: true,
        protocol: updatedProtocol,
        session: {
          number: newSessionCount,
          total: totalSessions,
          remaining: totalSessions ? totalSessions - newSessionCount : null,
          completed: newStatus === 'completed'
        }
      });

    } catch (error) {
      console.error('Session add error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  // GET - Get session history (from notes or future sessions table)
  if (req.method === 'GET') {
    const { data: protocol, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    return res.status(200).json({
      sessions_used: protocol.injections_completed || 0,
      total_sessions: protocol.total_sessions,
      remaining: protocol.total_sessions ? protocol.total_sessions - (protocol.injections_completed || 0) : null,
      status: protocol.status
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
