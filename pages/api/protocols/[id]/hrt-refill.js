// /pages/api/protocols/[id]/hrt-refill.js
// Process HRT refill - log refill and reset supply timer
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API helpers
async function addGHLNote(contactId, noteBody) {
  if (!contactId) return null;
  
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: noteBody })
    });
    return await response.json();
  } catch (err) {
    console.error('GHL note error:', err);
    return null;
  }
}

async function updateGHLContact(contactId, customFields) {
  if (!contactId) return null;
  
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customFields: customFields })
    });
    return await response.json();
  } catch (err) {
    console.error('GHL update error:', err);
    return null;
  }
}

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
  const { supply_type, dose, notes, refill_date } = req.body;

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

    // Use provided date or default to today
    const refillDateStr = refill_date || new Date().toISOString().split('T')[0];
    
    // Calculate supply duration based on type and dose
    let supplyDuration = '';
    let supplyLabel = '';
    
    // Check if it's a vial
    const isVial = supply_type === 'vial' || supply_type === 'vial_5ml' || supply_type === 'vial_10ml';
    
    if (isVial) {
      // Determine vial size (default to 10ml for backwards compatibility)
      const vialMl = supply_type === 'vial_5ml' ? 5 : 10;
      const totalMg = 200 * vialMl;
      
      // Calculate duration based on dose
      let weeklyMg = 120; // default
      
      if (dose && (dose.includes('100mg') || dose.includes('0.5ml'))) {
        weeklyMg = 200;
      } else if (dose && (dose.includes('80mg') || dose.includes('0.4ml'))) {
        weeklyMg = 160;
      } else if (dose && (dose.includes('70mg') || dose.includes('0.35ml'))) {
        weeklyMg = 140;
      } else if (dose && (dose.includes('60mg') || dose.includes('0.3ml'))) {
        weeklyMg = 120;
      }
      
      const vialWeeks = Math.floor(totalMg / weeklyMg);
      supplyDuration = `${vialWeeks} weeks`;
      supplyLabel = `Vial ${vialMl}ml (${vialWeeks} weeks at ${dose})`;
    } else if (supply_type === 'prefilled_2week') {
      supplyDuration = '2 weeks';
      supplyLabel = 'Pre-filled 2 Week (4 injections)';
    } else {
      supplyDuration = '4 weeks';
      supplyLabel = 'Pre-filled 4 Week (8 injections)';
    }

    // Log the refill
    const logEntry = {
      protocol_id: id,
      patient_id: protocol.patient_id,
      log_type: 'refill',
      log_date: refillDateStr,
      notes: `Refill: ${supplyLabel} - ${dose}. ${notes || ''}`
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
      ? `${existingNotes}\n\n[${refillDateStr}] Refill: ${supplyLabel}, ${dose}. Supply: ${supplyDuration}. ${notes || ''}`
      : `[${refillDateStr}] Refill: ${supplyLabel}, ${dose}. Supply: ${supplyDuration}. ${notes || ''}`;

    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        supply_type: supply_type,
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

Date: ${refillDateStr}
Supply Type: ${supplyLabel}
Current Dose: ${dose}
Expected Duration: ${supplyDuration}
${notes ? `Notes: ${notes}` : ''}`;

      await addGHLNote(contactId, ghlNote);

      // Update custom fields
      await updateGHLContact(contactId, {
        'hrt__last_refill_date': refillDateStr,
        'hrt__supply_type': supply_type,
        'hrt__current_dose': dose
      });
    }

    console.log(`✓ HRT Refill processed for ${patientName}: ${supplyLabel}, ${dose} on ${refillDateStr}`);

    return res.status(200).json({
      success: true,
      message: 'Refill processed',
      refill_date: refillDateStr,
      supply_type: supply_type,
      dose: dose,
      supply_duration: supplyDuration
    });

  } catch (err) {
    console.error('HRT refill error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
