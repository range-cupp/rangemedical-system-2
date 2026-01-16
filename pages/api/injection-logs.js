// =====================================================
// RANGE MEDICAL - INJECTION LOGS API
// /pages/api/injection-logs.js
// Now syncs with protocol records for accurate pipeline tracking
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return handleGet(req, res);
    } else if (req.method === 'POST') {
      return handlePost(req, res);
    } else if (req.method === 'DELETE') {
      return handleDelete(req, res);
    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Injection logs API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET - Fetch logs by category
async function handleGet(req, res) {
  const { category } = req.query;
  
  let query = supabase
    .from('injection_logs')
    .select(`
      *,
      patients:patient_id (
        id,
        name,
        full_name,
        email,
        phone
      )
    `)
    .order('entry_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data: logs, error } = await query;
  
  if (error) {
    console.error('Fetch logs error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
  
  // Format logs with patient names
  const formattedLogs = (logs || []).map(log => ({
    ...log,
    patient_name: log.patients?.name || log.patients?.full_name || 'Unknown'
  }));
  
  // Calculate stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  
  const categoryLogs = formattedLogs.filter(l => !category || l.category === category);
  const today = categoryLogs.filter(l => new Date(l.created_at) >= todayStart).length;
  const week = categoryLogs.filter(l => new Date(l.created_at) >= weekStart).length;
  
  return res.status(200).json({
    success: true,
    logs: formattedLogs,
    stats: { today, week }
  });
}

// POST - Create log entry AND sync with protocol
async function handlePost(req, res) {
  const {
    patient_id,
    ghl_contact_id,
    category,
    entry_type,
    entry_date,
    medication,
    dosage,
    notes
  } = req.body;
  
  if (!patient_id || !category) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  // Use provided date or default to today
  const logDate = entry_date || new Date().toISOString().split('T')[0];
  
  // 1. Create the injection log entry
  const { data: logEntry, error: logError } = await supabase
    .from('injection_logs')
    .insert({
      patient_id,
      ghl_contact_id,
      category,
      entry_type: entry_type || 'injection',
      entry_date: logDate,
      medication,
      dosage,
      notes,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (logError) {
    console.error('Create log error:', logError);
    return res.status(500).json({ success: false, error: logError.message });
  }
  
  // 2. Sync with protocol based on category
  let protocolUpdate = null;
  
  if (category === 'testosterone') {
    protocolUpdate = await syncHRTProtocol(patient_id, ghl_contact_id, entry_type, dosage, medication, logDate);
  } else if (category === 'weight_loss') {
    protocolUpdate = await syncWeightLossProtocol(patient_id, ghl_contact_id, entry_type, dosage, logDate);
  }
  // Vitamin injections don't have protocol tracking
  
  return res.status(200).json({
    success: true,
    log: logEntry,
    protocolUpdate
  });
}

// Sync HRT Protocol when testosterone entry is logged
async function syncHRTProtocol(patientId, ghlContactId, entryType, dosage, medication, entryDate) {
  // Find the patient's active HRT protocol
  const { data: protocols, error: findError } = await supabase
    .from('protocols')
    .select('*')
    .or(`patient_id.eq.${patientId},ghl_contact_id.eq.${ghlContactId}`)
    .in('category', ['HRT', 'Male HRT', 'Female HRT'])
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (findError || !protocols || protocols.length === 0) {
    console.log('No active HRT protocol found for patient:', patientId);
    return { updated: false, reason: 'No active HRT protocol found' };
  }
  
  const protocol = protocols[0];
  const logDate = entryDate || new Date().toISOString().split('T')[0];
  
  if (entryType === 'pickup') {
    // Parse the dosage to determine supply type
    // Format: "2 vials (10mL @ 200mg/ml)" or "8 prefilled @ 0.5ml (100mg)"
    let supplyType = protocol.supply_type || 'prefilled_4week';
    let currentDose = protocol.current_dose;
    
    if (dosage) {
      if (dosage.includes('vial')) {
        supplyType = 'vial_10ml';
      } else if (dosage.includes('prefilled')) {
        // Extract quantity to determine 2-week or 4-week
        const match = dosage.match(/^(\d+)\s+prefilled/);
        if (match) {
          const qty = parseInt(match[1]);
          supplyType = qty <= 4 ? 'prefilled_2week' : 'prefilled_4week';
        }
        
        // Extract dose from prefilled
        const doseMatch = dosage.match(/@\s*([0-9.]+ml)/);
        if (doseMatch) {
          // Convert to the format used in HRT pipeline
          const mlValue = doseMatch[1];
          // Calculate mg based on concentration (Male=200mg/ml, Female=100mg/ml)
          const isFemale = medication && medication.toLowerCase().includes('female');
          const concentration = isFemale ? 100 : 200;
          const ml = parseFloat(mlValue);
          const mg = Math.round(ml * concentration);
          currentDose = `${mlValue}/${mg}mg`;
        }
      }
    }
    
    // Update the protocol
    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        last_refill_date: logDate,
        supply_type: supplyType,
        current_dose: currentDose || protocol.current_dose,
        updated_at: new Date().toISOString()
      })
      .eq('id', protocol.id);
    
    if (updateError) {
      console.error('Failed to update HRT protocol:', updateError);
      return { updated: false, reason: updateError.message };
    }
    
    return { 
      updated: true, 
      protocolId: protocol.id,
      changes: { last_refill_date: logDate, supply_type: supplyType }
    };
    
  } else if (entryType === 'injection') {
    // For in-clinic injections, just log it (no supply tracking needed)
    // Could add injection count if needed later
    
    // Add to protocol_logs for history
    await supabase
      .from('protocol_logs')
      .insert({
        protocol_id: protocol.id,
        log_type: 'injection',
        log_date: today,
        dose: dosage,
        notes: `In-clinic injection logged`,
        created_at: new Date().toISOString()
      });
    
    return { 
      updated: true, 
      protocolId: protocol.id,
      changes: { logged_injection: true }
    };
  }
  
  return { updated: false, reason: 'Unknown entry type' };
}

// Sync Weight Loss Protocol when entry is logged
async function syncWeightLossProtocol(patientId, ghlContactId, entryType, dosage, entryDate) {
  // Find the patient's active Weight Loss protocol
  const { data: protocols, error: findError } = await supabase
    .from('protocols')
    .select('*')
    .or(`patient_id.eq.${patientId},ghl_contact_id.eq.${ghlContactId}`)
    .ilike('category', '%weight%loss%')
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (findError || !protocols || protocols.length === 0) {
    console.log('No active Weight Loss protocol found for patient:', patientId);
    return { updated: false, reason: 'No active Weight Loss protocol found' };
  }
  
  const protocol = protocols[0];
  const logDate = entryDate || new Date().toISOString().split('T')[0];
  
  if (entryType === 'pickup') {
    // Parse week supply from dosage: "4 week supply"
    let weeksSupply = 4;
    if (dosage) {
      const match = dosage.match(/(\d+)\s*week/);
      if (match) {
        weeksSupply = parseInt(match[1]);
      }
    }
    
    // Add injections to total (1 injection per week)
    const currentTotal = protocol.total_sessions || protocol.total_injections || 0;
    const newTotal = currentTotal + weeksSupply;
    
    // Reset start date to today for supply tracking
    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        total_sessions: newTotal,
        start_date: logDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', protocol.id);
    
    if (updateError) {
      console.error('Failed to update Weight Loss protocol:', updateError);
      return { updated: false, reason: updateError.message };
    }
    
    return { 
      updated: true, 
      protocolId: protocol.id,
      changes: { 
        total_sessions: newTotal,
        start_date: logDate,
        added_injections: weeksSupply
      }
    };
    
  } else if (entryType === 'injection') {
    // Increment injections used
    const currentUsed = protocol.sessions_used || protocol.injections_used || 0;
    
    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        sessions_used: currentUsed + 1,
        last_injection_date: logDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', protocol.id);
    
    if (updateError) {
      console.error('Failed to update Weight Loss protocol:', updateError);
      return { updated: false, reason: updateError.message };
    }
    
    // Also add to protocol_logs for history
    await supabase
      .from('protocol_logs')
      .insert({
        protocol_id: protocol.id,
        log_type: 'injection',
        log_date: today,
        dose: dosage,
        notes: `In-clinic injection #${currentUsed + 1}`,
        created_at: new Date().toISOString()
      });
    
    return { 
      updated: true, 
      protocolId: protocol.id,
      changes: { 
        sessions_used: currentUsed + 1,
        last_injection_date: logDate
      }
    };
  }
  
  return { updated: false, reason: 'Unknown entry type' };
}

// DELETE - Remove log entry
async function handleDelete(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing log ID' });
  }
  
  const { error } = await supabase
    .from('injection_logs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Delete log error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
  
  return res.status(200).json({ success: true });
}
