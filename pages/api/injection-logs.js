// /pages/api/injection-logs.js
// Injection Logs API - Creates logs AND syncs with protocols
// Range Medical - Updated 2026-01-16

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Injection logs API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// GET - Fetch injection logs with patient names
async function handleGet(req, res) {
  const { patient_id, category, limit = 100 } = req.query;
  
  let query = supabase
    .from('injection_logs')
    .select(`
      *,
      patients (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .order('entry_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));
  
  if (patient_id) {
    query = query.eq('patient_id', patient_id);
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Add patient_name to each log
  const logsWithNames = (data || []).map(log => {
    const patient = log.patients;
    let patientName = 'Unknown';
    if (patient) {
      const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
      patientName = name || patient.email || 'Unknown';
    }
    return {
      ...log,
      patient_name: patientName,
      patients: undefined // Remove nested object
    };
  });
  
  return res.status(200).json({ success: true, logs: logsWithNames });
}

// POST - Create log entry AND sync with protocol
async function handlePost(req, res) {
  const {
    patient_id,
    ghl_contact_id,
    category,
    entry_type,      // 'injection' or 'pickup'
    entry_date,      // Date of the entry (can be backdated)
    medication,
    dosage,
    supply_type,     // For HRT: 'vial_10ml', 'prefilled_2week', 'prefilled_4week'
    quantity,        // For prefilled: number of syringes
    notes
  } = req.body;
  
  if (!patient_id || !category) {
    return res.status(400).json({ success: false, error: 'Missing required fields: patient_id and category' });
  }
  
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
      supply_type,
      quantity,
      notes,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (logError) {
    console.error('Error creating injection log:', logError);
    return res.status(500).json({ success: false, error: logError.message });
  }
  
  // 2. Sync with protocol based on category and entry type
  let protocolUpdate = null;
  
  if (entry_type === 'pickup') {
    if (category === 'testosterone' || category === 'hrt') {
      protocolUpdate = await syncHRTProtocol(patient_id, ghl_contact_id, supply_type, dosage, logDate);
    } else if (category === 'weight_loss') {
      protocolUpdate = await syncWeightLossProtocol(patient_id, ghl_contact_id, quantity, logDate);
    }
    // Peptides and vitamins don't track pickups the same way
  } else if (entry_type === 'injection' && category === 'weight_loss') {
    // In-clinic injection - increment sessions_used
    protocolUpdate = await incrementWeightLossSession(patient_id, ghl_contact_id);
  }
  
  return res.status(201).json({
    success: true,
    log: logEntry,
    protocol_update: protocolUpdate
  });
}

// Sync HRT Protocol when pickup is logged
async function syncHRTProtocol(patientId, ghlContactId, supplyType, dosage, logDate) {
  // Find the patient's active HRT protocol
  let query = supabase
    .from('protocols')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  // Try patient_id first
  if (patientId) {
    query = query.eq('patient_id', patientId);
  }
  
  const { data: protocols, error: findError } = await query;
  
  if (findError) {
    console.error('Error finding HRT protocol:', findError);
    return { updated: false, error: findError.message };
  }
  
  // Find HRT protocol
  const hrtProtocol = (protocols || []).find(p => {
    const med = (p.medication || '').toLowerCase();
    const name = (p.program_name || '').toLowerCase();
    const type = (p.program_type || '').toLowerCase();
    return med.includes('hrt') || med.includes('testosterone') || 
           name.includes('hrt') || type.includes('hrt');
  });
  
  if (!hrtProtocol) {
    console.log('No active HRT protocol found for patient:', patientId);
    return { updated: false, reason: 'No active HRT protocol found' };
  }
  
  // Update the protocol with new refill date and supply type
  const updateData = {
    last_refill_date: logDate,
    updated_at: new Date().toISOString()
  };
  
  if (supplyType) {
    updateData.supply_type = supplyType;
  }
  
  if (dosage) {
    updateData.selected_dose = dosage;
  }
  
  const { error: updateError } = await supabase
    .from('protocols')
    .update(updateData)
    .eq('id', hrtProtocol.id);
  
  if (updateError) {
    console.error('Error updating HRT protocol:', updateError);
    return { updated: false, error: updateError.message };
  }
  
  return {
    updated: true,
    protocol_id: hrtProtocol.id,
    changes: updateData
  };
}

// Sync Weight Loss Protocol when pickup is logged (take-home)
async function syncWeightLossProtocol(patientId, ghlContactId, quantity, logDate) {
  // Find the patient's active weight loss protocol
  let query = supabase
    .from('protocols')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (patientId) {
    query = query.eq('patient_id', patientId);
  }
  
  const { data: protocols, error: findError } = await query;
  
  if (findError) {
    console.error('Error finding weight loss protocol:', findError);
    return { updated: false, error: findError.message };
  }
  
  // Find weight loss protocol
  const wlProtocol = (protocols || []).find(p => {
    const med = (p.medication || '').toLowerCase();
    const name = (p.program_name || '').toLowerCase();
    const type = (p.program_type || '').toLowerCase();
    return med.includes('semaglutide') || med.includes('tirzepatide') || 
           med.includes('retatrutide') || name.includes('weight') || 
           type.includes('weight');
  });
  
  if (!wlProtocol) {
    console.log('No active weight loss protocol found for patient:', patientId);
    return { updated: false, reason: 'No active weight loss protocol found' };
  }
  
  // For take-home: reset start_date and set total_sessions (injections)
  const totalInjections = parseInt(quantity) || wlProtocol.total_sessions || 4;
  
  const updateData = {
    start_date: logDate,
    total_sessions: totalInjections,
    sessions_used: 0, // Reset since they're taking home new supply
    last_refill_date: logDate,
    updated_at: new Date().toISOString()
  };
  
  const { error: updateError } = await supabase
    .from('protocols')
    .update(updateData)
    .eq('id', wlProtocol.id);
  
  if (updateError) {
    console.error('Error updating weight loss protocol:', updateError);
    return { updated: false, error: updateError.message };
  }
  
  return {
    updated: true,
    protocol_id: wlProtocol.id,
    changes: updateData
  };
}

// Increment weight loss session for in-clinic injection
async function incrementWeightLossSession(patientId, ghlContactId) {
  // Find the patient's active weight loss protocol
  let query = supabase
    .from('protocols')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (patientId) {
    query = query.eq('patient_id', patientId);
  }
  
  const { data: protocols, error: findError } = await query;
  
  if (findError) {
    console.error('Error finding weight loss protocol:', findError);
    return { updated: false, error: findError.message };
  }
  
  // Find weight loss protocol
  const wlProtocol = (protocols || []).find(p => {
    const med = (p.medication || '').toLowerCase();
    const name = (p.program_name || '').toLowerCase();
    const type = (p.program_type || '').toLowerCase();
    return med.includes('semaglutide') || med.includes('tirzepatide') || 
           med.includes('retatrutide') || name.includes('weight') || 
           type.includes('weight');
  });
  
  if (!wlProtocol) {
    return { updated: false, reason: 'No active weight loss protocol found' };
  }
  
  const newSessionsUsed = (wlProtocol.sessions_used || 0) + 1;
  
  const { error: updateError } = await supabase
    .from('protocols')
    .update({
      sessions_used: newSessionsUsed,
      updated_at: new Date().toISOString()
    })
    .eq('id', wlProtocol.id);
  
  if (updateError) {
    return { updated: false, error: updateError.message };
  }
  
  return {
    updated: true,
    protocol_id: wlProtocol.id,
    sessions_used: newSessionsUsed,
    total_sessions: wlProtocol.total_sessions
  };
}

// DELETE - Delete injection log
async function handleDelete(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Log ID is required' });
  }
  
  const { error } = await supabase
    .from('injection_logs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting injection log:', error);
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json({ success: true });
}
