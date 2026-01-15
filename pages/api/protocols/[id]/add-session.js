// /pages/api/protocols/[id]/add-session.js
// Add a session to an existing pack (10-pack, 12-pack, etc.)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query; // protocol id
  const { purchaseId, sessionCount = 1 } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

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

    // Calculate new sessions used
    const currentUsed = protocol.sessions_used || 0;
    const totalSessions = protocol.total_sessions || 0;
    const newUsed = currentUsed + sessionCount;

    // Check if pack is full
    if (totalSessions > 0 && newUsed > totalSessions) {
      return res.status(400).json({ 
        error: `Pack only has ${totalSessions - currentUsed} sessions remaining` 
      });
    }

    // Determine if protocol should be completed
    const newStatus = (totalSessions > 0 && newUsed >= totalSessions) ? 'completed' : protocol.status;

    // Update protocol
    const { data: updated, error: updateError } = await supabase
      .from('protocols')
      .update({ 
        sessions_used: newUsed,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update protocol' });
    }

    // Mark purchase as handled if provided
    if (purchaseId) {
      await supabase
        .from('purchases')
        .update({ 
          protocol_created: true,
          protocol_id: id
        })
        .eq('id', purchaseId);
    }

    return res.status(200).json({ 
      success: true, 
      protocol: updated,
      message: `Session added. Now ${newUsed} of ${totalSessions} used.`
    });

  } catch (error) {
    console.error('Add session error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
