// /pages/api/protocols/[id]/extend-wl.js
// Extend an existing weight loss protocol (for renewals/refills)
// Range Medical - 2026-02-08

import { createClient } from '@supabase/supabase-js';
import { addGHLNote } from '../../../../lib/ghl-sync';
import { calculateNextExpectedDate } from '../../../../lib/auto-protocol';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const {
    purchaseId,
    newDose,           // If dose changed (titration)
    newMedication,     // If medication needs to be set/changed
    extensionDays,     // Number of days to extend (based on pickup frequency)
    pickupFrequency,   // Set pickup frequency if not already set
    notes
  } = req.body;

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

    // Calculate extension days based on pickup_frequency if not provided
    const daysToExtend = extensionDays || protocol.pickup_frequency || 28;

    // Calculate new end date
    const currentEndDate = protocol.end_date ? new Date(protocol.end_date + 'T12:00:00') : new Date();
    const today = new Date();

    // If current end date is in the past, start from today
    const startFrom = currentEndDate < today ? today : currentEndDate;
    startFrom.setDate(startFrom.getDate() + daysToExtend);
    const newEndDate = startFrom.toISOString().split('T')[0];

    // Add sessions for the new period (weekly injections)
    const additionalSessions = Math.floor(daysToExtend / 7);
    const newTotalSessions = (protocol.total_sessions || 0) + additionalSessions;

    // Build update data
    const updateData = {
      end_date: newEndDate,
      total_sessions: newTotalSessions,
      last_refill_date: new Date().toISOString().split('T')[0],
      next_expected_date: calculateNextExpectedDate({
        protocolType: 'weight_loss',
        startDate: new Date().toISOString().split('T')[0],
        pickupFrequency: daysToExtend,
      }),
      status: 'active', // Reactivate if was expired
      updated_at: new Date().toISOString()
    };

    // Handle medication update (for TBD cases)
    const oldMedication = protocol.medication;
    let medicationChanged = false;
    if (newMedication && newMedication !== oldMedication) {
      updateData.medication = newMedication;
      medicationChanged = true;
    }

    // Set pickup_frequency if provided and not already set
    if (pickupFrequency && !protocol.pickup_frequency) {
      updateData.pickup_frequency = pickupFrequency;
    }

    // Handle dose change (titration)
    const oldDose = protocol.selected_dose;
    let doseChanged = false;
    if (newDose && newDose !== oldDose) {
      // If no starting_dose set OR it's "TBD", use the new dose as starting
      if (!protocol.starting_dose || protocol.starting_dose === 'TBD') {
        updateData.starting_dose = newDose;
      } else if (oldDose && oldDose !== 'TBD') {
        // Keep original starting_dose, just update selected_dose
      }
      updateData.selected_dose = newDose;
      doseChanged = oldDose && oldDose !== 'TBD' && oldDose !== newDose;
    }

    // Add notes if provided
    if (notes || doseChanged || medicationChanged) {
      const existingNotes = protocol.notes || '';
      const dateStr = new Date().toISOString().split('T')[0];
      let refillNote = `[${dateStr}] Renewed.`;
      if (medicationChanged) {
        refillNote += ` Medication: ${newMedication}.`;
      }
      if (doseChanged) {
        refillNote += ` Dose: ${oldDose} → ${newDose}.`;
      } else if (newDose && oldDose === 'TBD') {
        refillNote += ` Dose set: ${newDose}.`;
      }
      if (notes) {
        refillNote += ` ${notes}`;
      }
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

    // Create a log entry for the renewal
    const { error: logError } = await supabase
      .from('protocol_logs')
      .insert({
        protocol_id: id,
        patient_id: protocol.patient_id,
        log_type: 'renewal',
        log_date: new Date().toISOString().split('T')[0],
        notes: `Protocol renewed. New end date: ${newEndDate}. Sessions: ${protocol.total_sessions || 0} → ${newTotalSessions}${doseChanged ? `. Dose: ${oldDose} → ${newDose}` : ''}${notes ? `. ${notes}` : ''}`
      });

    if (logError) {
      console.error('Error creating renewal log:', logError);
    }

    // Add note to GHL
    if (ghlContactId) {
      const displayMedication = newMedication || protocol.medication || 'Weight Loss';
      const displayDose = newDose || protocol.selected_dose || 'N/A';

      const ghlNote = `⚖️ WEIGHT LOSS PROTOCOL RENEWED

Patient: ${patientName}
Medication: ${displayMedication}${medicationChanged ? ` (was: ${oldMedication})` : ''}
Dose: ${displayDose}${doseChanged ? ` (was: ${oldDose})` : ''}
Previous End: ${protocol.end_date || 'Not set'}
New End: ${newEndDate}

Protocol extended for ${daysToExtend} days. Sessions: ${protocol.total_sessions || 0} → ${newTotalSessions}.${notes ? `\n\nNotes: ${notes}` : ''}`;

      try {
        await addGHLNote(ghlContactId, ghlNote);
      } catch (ghlError) {
        console.error('GHL note error (non-fatal):', ghlError);
      }
    }

    console.log(`✓ WL protocol ${id} extended for ${patientName}. New end date: ${newEndDate}`);

    return res.status(200).json({
      success: true,
      message: 'Weight loss protocol renewed',
      protocol: updatedProtocol,
      newEndDate,
      doseChanged,
      previousDose: doseChanged ? oldDose : null
    });

  } catch (error) {
    console.error('Error extending WL protocol:', error);
    return res.status(500).json({ error: error.message });
  }
}
