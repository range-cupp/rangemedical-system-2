import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../../lib/date-utils';
import { guardDoseChange } from '../../../../lib/dose-change-guard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API helper
async function addGHLNote(contactId, note) {
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: note })
    });
    return response.ok;
  } catch (err) {
    console.error('GHL note error:', err);
    return false;
  }
}

async function updateGHLContact(contactId, customFields) {
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customFields })
    });
    return response.ok;
  } catch (err) {
    console.error('GHL update error:', err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { refill_date, supply_type, dose, notes } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  try {
    // Get protocol with patient info
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('*, patients(name, ghl_contact_id)')
      .eq('id', id)
      .single();

    if (fetchError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const refillDateStr = refill_date || todayPacific();

    // Calculate supply duration for logging
    let supplyDuration = '';
    let supplyLabel = '';
    
    if (supply_type === 'vial_10ml' || supply_type === 'vial') {
      // Vial 10ml: 200mg/ml × 10ml = 2000mg total
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
      
      const vialWeeks = Math.floor(2000 / weeklyMg);
      supplyDuration = `${vialWeeks} weeks`;
      supplyLabel = `Vial 10ml (${vialWeeks} weeks at ${dose})`;
    } else if (supply_type === 'vial_5ml') {
      // Vial 5ml: 200mg/ml × 5ml = 1000mg total
      let weeklyMg = 120;
      
      if (dose && (dose.includes('100mg') || dose.includes('0.5ml'))) {
        weeklyMg = 200;
      } else if (dose && (dose.includes('80mg') || dose.includes('0.4ml'))) {
        weeklyMg = 160;
      } else if (dose && (dose.includes('70mg') || dose.includes('0.35ml'))) {
        weeklyMg = 140;
      } else if (dose && (dose.includes('60mg') || dose.includes('0.3ml'))) {
        weeklyMg = 120;
      }
      
      const vialWeeks = Math.floor(1000 / weeklyMg);
      supplyDuration = `${vialWeeks} weeks`;
      supplyLabel = `Vial 5ml (${vialWeeks} weeks at ${dose})`;
    } else {
      // Prefilled — use quantity if available
      const qty = protocol.quantity || 8;
      const freq = protocol.injection_frequency || 2;
      const weeks = Math.round(qty / freq);
      supplyDuration = `${weeks} week${weeks !== 1 ? 's' : ''}`;
      supplyLabel = `Pre-filled (${qty} injections)`;
    }

    // Log the refill entry
    const logEntry = {
      protocol_id: id,
      log_type: 'refill',
      log_date: refillDateStr,
      dose: dose,
      notes: `Refill: ${supplyLabel} - ${dose}. ${notes || ''}`
    };

    const { error: logError } = await supabase
      .from('protocol_logs')
      .insert(logEntry);

    if (logError) {
      console.error('Log insert error:', logError);
    }

    // Update protocol with new supply type, dose, AND last_refill_date
    const existingNotes = protocol.notes || '';
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n\n[${refillDateStr}] Refill: ${supplyLabel}, ${dose}. Supply: ${supplyDuration}. ${notes || ''}`
      : `[${refillDateStr}] Refill: ${supplyLabel}, ${dose}. Supply: ${supplyDuration}. ${notes || ''}`;

    // Normalize supply_type for storage
    const normalizedSupplyType = supply_type === 'vial' ? 'vial_10ml' : supply_type;

    // Gate HRT dose increases — must go through the Dose Change modal → Burgess SMS approval.
    // Refills should come in at the current dose; if different, that's a clinical dose change.
    const refillUpdate = {
      supply_type: normalizedSupplyType,
      selected_dose: dose,
      last_refill_date: refillDateStr,
      status: 'active',
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    };
    if (dose && dose !== protocol.selected_dose) {
      const guard = await guardDoseChange(
        supabase,
        protocol,
        { selected_dose: dose },
        {
          mode: 'reject',
          approvedRequestId: req.body.approved_dose_change_request_id,
        }
      );
      if (!guard.allowed) {
        return res.status(400).json({
          error: guard.reason,
          requires_approval: true,
          category: guard.category,
        });
      }
    }

    const { error: updateError } = await supabase
      .from('protocols')
      .update(refillUpdate)
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update protocol' });
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
        'hrt__supply_type': normalizedSupplyType,
        'hrt__current_dose': dose
      });
    }

    console.log(`✓ HRT Refill processed for ${patientName}: ${normalizedSupplyType}, ${dose}, refill date: ${refillDateStr}`);

    return res.status(200).json({
      success: true,
      message: 'Refill processed',
      supply_type: normalizedSupplyType,
      dose: dose,
      last_refill_date: refillDateStr,
      supply_duration: supplyDuration
    });

  } catch (err) {
    console.error('HRT refill error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
