// /pages/api/protocols/[id]/add-sessions.js
// Add sessions to an existing protocol (e.g., adding 12 sessions from a new vitamin pack purchase)
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
  const { sessionsToAdd, purchaseId, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  if (!sessionsToAdd || sessionsToAdd < 1) {
    return res.status(400).json({ error: 'sessionsToAdd must be a positive number' });
  }

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
    const newTotal = currentTotal + parseInt(sessionsToAdd);

    // Update protocol with new total_sessions and reactivate if completed
    const updateData = {
      total_sessions: newTotal,
      status: 'active',
      updated_at: new Date().toISOString()
    };

    // Append notes if provided
    if (notes) {
      const existingNotes = protocol.notes || '';
      const sessionNote = `[${new Date().toISOString().split('T')[0]}] Added ${sessionsToAdd} sessions. ${notes}`;
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
        log_type: 'renewal',
        log_date: new Date().toISOString().split('T')[0],
        notes: `Added ${sessionsToAdd} sessions (${currentTotal} → ${newTotal}).${notes ? ` ${notes}` : ''}`
      });

    if (logError) {
      console.error('Error creating session log:', logError);
    }

    return res.status(200).json({
      success: true,
      protocol: updatedProtocol,
      previousTotal: currentTotal,
      newTotal,
      sessionsAdded: parseInt(sessionsToAdd)
    });
  } catch (error) {
    console.error('Error adding sessions:', error);
    return res.status(500).json({ error: error.message });
  }
}
