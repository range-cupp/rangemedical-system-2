// /pages/api/protocols/[id]/add-sessions.js
// Add or deduct sessions on an existing protocol
// Mode 'add': increases total_sessions (patient bought more sessions)
// Mode 'deduct': increases sessions_used (patient paying for sessions from existing pack)
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
  const { sessionsToAdd, mode = 'add', purchaseId, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  if (!sessionsToAdd || sessionsToAdd < 1) {
    return res.status(400).json({ error: 'sessionsToAdd must be a positive number' });
  }

  const count = parseInt(sessionsToAdd);

  try {
    // Get current protocol
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('*, patients(id, name, ghl_contact_id)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const currentTotal = protocol.total_sessions || 0;
    const currentUsed = protocol.sessions_used || 0;
    const updateData = { updated_at: new Date().toISOString() };
    let logMessage;

    if (mode === 'deduct') {
      // Deduct: increment sessions_used (patient is paying for sessions consumed from pack)
      const newUsed = currentUsed + count;
      updateData.sessions_used = newUsed;

      // Mark as completed if all sessions are now used
      if (currentTotal > 0 && newUsed >= currentTotal) {
        updateData.status = 'completed';
      }

      logMessage = `Deducted ${count} sessions (${currentUsed} → ${newUsed} used of ${currentTotal}).`;
    } else {
      // Add: increment total_sessions (patient bought more sessions to add to pack)
      const newTotal = currentTotal + count;
      updateData.total_sessions = newTotal;
      updateData.status = 'active'; // reactivate if was completed

      logMessage = `Added ${count} sessions (${currentTotal} → ${newTotal} total).`;
    }

    // Append notes if provided
    if (notes) {
      const existingNotes = protocol.notes || '';
      const sessionNote = `[${new Date().toISOString().split('T')[0]}] ${logMessage} ${notes}`;
      updateData.notes = existingNotes ? `${existingNotes}\n${sessionNote}` : sessionNote;
    }

    const { data: updatedProtocol, error: updateError } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Link purchase to protocol
    if (purchaseId) {
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({
          protocol_id: id,
          protocol_created: true
        })
        .eq('id', purchaseId);

      if (purchaseError) {
        console.error('Error linking purchase:', purchaseError);
      }
    }

    // Create a log entry
    const { error: logError } = await supabase
      .from('protocol_logs')
      .insert({
        protocol_id: id,
        patient_id: protocol.patient_id,
        log_type: mode === 'deduct' ? 'session' : 'renewal',
        log_date: new Date().toISOString().split('T')[0],
        notes: `${logMessage}${notes ? ` ${notes}` : ''}`
      });

    if (logError) {
      console.error('Error creating session log:', logError);
    }

    return res.status(200).json({
      success: true,
      mode,
      protocol: updatedProtocol,
      sessionsChanged: count
    });
  } catch (error) {
    console.error('Error in add-sessions:', error);
    return res.status(500).json({ error: error.message });
  }
}
