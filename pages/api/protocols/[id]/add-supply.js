// /pages/api/protocols/[id]/add-supply.js
// Add supply/refill to an existing protocol (e.g., HRT monthly refill)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { addGHLNote } from '../../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { purchaseId, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  try {
    // Get current protocol with patient info
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('*, patients(id, name, ghl_contact_id)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const patientName = protocol.patients?.name || 'Unknown Patient';
    const ghlContactId = protocol.patients?.ghl_contact_id;

    // Calculate new end date (extend by 30 days for monthly supply)
    const currentEndDate = protocol.end_date ? new Date(protocol.end_date + 'T12:00:00') : new Date();
    const today = new Date();

    // If current end date is in the past, start from today
    const startFrom = currentEndDate < today ? today : currentEndDate;
    startFrom.setDate(startFrom.getDate() + 30);
    const newEndDate = startFrom.toISOString().split('T')[0];

    // Update protocol with extended end date and refill info
    const updateData = {
      end_date: newEndDate,
      last_refill_date: new Date().toISOString().split('T')[0],
      status: 'active', // Reactivate if was completed
      updated_at: new Date().toISOString()
    };

    // Add notes if provided
    if (notes) {
      const existingNotes = protocol.notes || '';
      const refillNote = `[${new Date().toISOString().split('T')[0]}] Refill added. ${notes}`;
      updateData.notes = existingNotes ? `${existingNotes}\n${refillNote}` : refillNote;
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

    // Create a log entry for the refill
    const { error: logError } = await supabase
      .from('protocol_logs')
      .insert({
        protocol_id: id,
        patient_id: protocol.patient_id,
        log_type: 'refill',
        log_date: new Date().toISOString().split('T')[0],
        notes: `Supply added. New end date: ${newEndDate}${notes ? `. ${notes}` : ''}`
      });

    if (logError) {
      console.error('Error creating refill log:', logError);
    }

    // Add note to GHL
    if (ghlContactId) {
      const ghlNote = `💊 HRT SUPPLY ADDED

Protocol: ${protocol.program_name}
${protocol.medication ? `Medication: ${protocol.medication}` : ''}
Previous End: ${protocol.end_date || 'Not set'}
New End: ${newEndDate}

Supply extended for another month.${notes ? `\n\nNotes: ${notes}` : ''}`;

      try {
        await addGHLNote(ghlContactId, ghlNote);
      } catch (ghlError) {
        console.error('GHL note error (non-fatal):', ghlError);
      }
    }

    console.log(`✓ Supply added to protocol ${id} for ${patientName}. New end date: ${newEndDate}`);

    return res.status(200).json({
      success: true,
      message: 'Supply added to protocol',
      protocol: updatedProtocol,
      newEndDate
    });

  } catch (error) {
    console.error('Error adding supply to protocol:', error);
    return res.status(500).json({ error: error.message });
  }
}
