// /pages/api/protocols/[id]/hrt-refill.js
// Process HRT refill - log refill and reset supply timer
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { addGHLNote, updateGHLContact } from '../../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { supply_type, dose, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  try {
    // Get protocol with patient info
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select(`
        *,
        patients (
          id,
          name,
          ghl_contact_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Calculate supply duration for logging
    let supplyDuration = '';
    if (supply_type === 'vial') {
      supplyDuration = '10-16 weeks (vial)';
    } else {
      supplyDuration = '4 weeks (8 prefilled)';
    }

    // Log the refill
    const logEntry = {
      protocol_id: id,
      patient_id: protocol.patient_id,
      log_type: 'refill',
      log_date: today,
      notes: `Refill: ${supply_type} - ${dose}. ${notes || ''}`
    };

    const { error: logError } = await supabase
      .from('protocol_logs')
      .insert(logEntry);

    if (logError) {
      console.error('Log insert error:', logError);
    }

    // Update protocol with new supply type and dose
    const existingNotes = protocol.notes || '';
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n\n[${today}] Refill: ${supply_type}, ${dose}. Supply: ${supplyDuration}. ${notes || ''}`
      : `[${today}] Refill: ${supply_type}, ${dose}. Supply: ${supplyDuration}. ${notes || ''}`;

    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        selected_dose: dose,
        status: 'active',
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Sync to GHL
    const contactId = protocol.patients?.ghl_contact_id;
    const patientName = protocol.patients?.name || 'Unknown';

    if (contactId) {
      const ghlNote = `🔄 HRT REFILL PROCESSED

Date: ${today}
Supply Type: ${supply_type === 'vial' ? 'Vial (10ml)' : 'Prefilled Syringes (8)'}
Current Dose: ${dose}
Expected Duration: ${supplyDuration}
${notes ? `Notes: ${notes}` : ''}`;

      await addGHLNote(contactId, ghlNote);

      // Update custom fields
      await updateGHLContact(contactId, {
        'hrt__last_refill_date': today,
        'hrt__supply_type': supply_type,
        'hrt__current_dose': dose
      });
    }

    console.log(`✓ HRT Refill processed for ${patientName}: ${supply_type}, ${dose}`);

    return res.status(200).json({
      success: true,
      message: 'Refill processed',
      supply_type: supply_type,
      dose: dose,
      supply_duration: supplyDuration
    });

  } catch (err) {
    console.error('HRT refill error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
