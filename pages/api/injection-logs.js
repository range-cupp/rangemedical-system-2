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
      case 'PUT':
        return await handlePut(req, res);
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
    protocol_id,     // Optional: direct link to protocol
    category,
    entry_type,      // 'injection' or 'pickup'
    entry_date,      // Date of the entry (can be backdated)
    medication,
    dosage,
    supply_type,     // For HRT: 'vial_10ml', 'prefilled_2week', 'prefilled_4week'
    quantity,        // For prefilled: number of syringes
    weight,          // For weight loss: current weight in lbs
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
      protocol_id,
      category,
      entry_type: entry_type || 'injection',
      entry_date: logDate,
      medication,
      dosage,
      supply_type,
      quantity,
      weight: weight ? parseFloat(weight) : null,
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
  } else if (['hbot', 'iv', 'rlt', 'injection', 'peptide'].includes(category)) {
    // Session-based protocols - increment sessions_used
    protocolUpdate = await incrementSessionProtocol(patient_id, category, protocol_id);
  }
  
  return res.status(201).json({
    success: true,
    log: logEntry,
    protocol_update: protocolUpdate
  });
}

// Sync HRT Protocol when pickup is logged
async function syncHRTProtocol(patientId, ghlContactId, supplyType, dosage, logDate) {
  console.log('syncHRTProtocol called:', { patientId, supplyType, dosage, logDate });
  
  // Find the patient's HRT protocol - don't filter by status initially
  const { data: protocols, error: findError } = await supabase
    .from('protocols')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  
  if (findError) {
    console.error('Error finding HRT protocol:', findError);
    return { updated: false, error: findError.message };
  }
  
  console.log('Found protocols for patient:', protocols?.length || 0);
  
  // Find HRT protocol (any status except completed)
  const hrtProtocol = (protocols || []).find(p => {
    const med = (p.medication || '').toLowerCase();
    const name = (p.program_name || '').toLowerCase();
    const type = (p.program_type || '').toLowerCase();
    const status = (p.status || '').toLowerCase();
    
    const isHRT = med.includes('hrt') || med.includes('testosterone') || 
                  name.includes('hrt') || type.includes('hrt');
    const isNotCompleted = status !== 'completed';
    
    return isHRT && isNotCompleted;
  });
  
  if (!hrtProtocol) {
    console.log('No HRT protocol found for patient:', patientId);
    return { updated: false, reason: 'No HRT protocol found' };
  }
  
  console.log('Found HRT protocol:', hrtProtocol.id, hrtProtocol.medication);
  
  // Update the protocol with new refill date and supply type
  const updateData = {
    last_refill_date: logDate,
    updated_at: new Date().toISOString()
  };
  
  // Set supply_type based on what was passed
  if (supplyType) {
    updateData.supply_type = supplyType;
  }
  
  // Store the dose info
  if (dosage) {
    updateData.selected_dose = dosage;
  }
  
  console.log('Updating protocol with:', updateData);
  
  const { data: updatedProtocol, error: updateError } = await supabase
    .from('protocols')
    .update(updateData)
    .eq('id', hrtProtocol.id)
    .select()
    .single();
  
  if (updateError) {
    console.error('Error updating HRT protocol:', updateError);
    return { updated: false, error: updateError.message };
  }
  
  console.log('Protocol updated successfully:', updatedProtocol?.last_refill_date);
  
  return {
    updated: true,
    protocol_id: hrtProtocol.id,
    changes: updateData,
    new_last_refill_date: updatedProtocol?.last_refill_date
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

// Increment session for session-based protocols (HBOT, IV, RLT, Injection, Peptide)
async function incrementSessionProtocol(patientId, category, protocolId = null) {
  let protocol = null;
  
  // If we have a protocol_id, use it directly
  if (protocolId) {
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', protocolId)
      .single();
    
    if (!error && data) {
      protocol = data;
    }
  }
  
  // If no protocol found via ID, search for it
  if (!protocol) {
    // Map category to program_type values
    const typeMap = {
      'hbot': ['hbot', 'hyperbaric'],
      'iv': ['iv', 'iv_therapy'],
      'rlt': ['rlt', 'red_light', 'red light'],
      'injection': ['injection'],
      'peptide': ['peptide']
    };
    
    const matchTypes = typeMap[category] || [category];
    
    // Find the patient's active protocol of this type
    const { data: protocols, error: findError } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patientId)
      .neq('status', 'completed')
      .order('created_at', { ascending: false });
    
    if (findError) {
      console.error('Error finding protocol:', findError);
      return { updated: false, error: findError.message };
    }
    
    // Find matching protocol
    protocol = (protocols || []).find(p => {
      const programType = (p.program_type || '').toLowerCase();
      const programName = (p.program_name || '').toLowerCase();
      const medication = (p.medication || '').toLowerCase();
      
      return matchTypes.some(type => 
        programType.includes(type) || 
        programName.includes(type) || 
        medication.includes(type)
      );
    });
  }
  
  if (!protocol) {
    console.log(`No active ${category} protocol found for patient:`, patientId);
    return { updated: false, reason: `No active ${category} protocol found` };
  }
  
  const newSessionsUsed = (protocol.sessions_used || 0) + 1;
  const totalSessions = protocol.total_sessions || 0;
  
  // Check if protocol should be marked completed
  const isComplete = totalSessions > 0 && newSessionsUsed >= totalSessions;
  
  const updateData = {
    sessions_used: newSessionsUsed,
    updated_at: new Date().toISOString()
  };
  
  if (isComplete) {
    updateData.status = 'completed';
  }
  
  const { error: updateError } = await supabase
    .from('protocols')
    .update(updateData)
    .eq('id', protocol.id);
  
  if (updateError) {
    console.error('Error updating protocol session:', updateError);
    return { updated: false, error: updateError.message };
  }
  
  console.log(`Session logged: ${category} - ${newSessionsUsed}/${totalSessions} for patient ${patientId}`);
  
  return {
    updated: true,
    protocol_id: protocol.id,
    sessions_used: newSessionsUsed,
    total_sessions: totalSessions,
    completed: isComplete
  };
}

// PUT - Update injection log
async function handlePut(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Log ID is required' });
  }
  
  const {
    entry_type,
    entry_date,
    medication,
    dosage,
    supply_type,
    quantity,
    notes
  } = req.body;
  
  const updateData = {
    updated_at: new Date().toISOString()
  };
  
  if (entry_type !== undefined) updateData.entry_type = entry_type;
  if (entry_date !== undefined) updateData.entry_date = entry_date;
  if (medication !== undefined) updateData.medication = medication;
  if (dosage !== undefined) updateData.dosage = dosage;
  if (supply_type !== undefined) updateData.supply_type = supply_type;
  if (quantity !== undefined) updateData.quantity = quantity;
  if (notes !== undefined) updateData.notes = notes;
  
  const { data, error } = await supabase
    .from('injection_logs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating injection log:', error);
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json({ success: true, log: data });
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
