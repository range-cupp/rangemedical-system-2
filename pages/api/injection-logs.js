// /pages/api/injection-logs.js
// Injection Logs API - CRUD operations
// Range Medical - 2026-01-29 - Fixed column names

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
    return res.status(500).json({ success: false, error: error.message });
  }
}

// GET - Fetch logs by category
async function handleGet(req, res) {
  const { category, patient_id, limit = 100 } = req.query;
  
  try {
    // Simple query - only select columns that exist
    let query = supabase
      .from('injection_logs')
      .select('*')
      .order('entry_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    // Filter by patient if provided
    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }
    
    const { data: logs, error } = await query;
    
    if (error) {
      console.error('Error fetching injection logs:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    // If we have logs, try to get patient names for any that don't have them
    const formattedLogs = [];
    
    for (const log of (logs || [])) {
      let patientName = log.patient_name || 'Unknown';
      
      // If we don't have patient_name stored, try to look it up
      if (!log.patient_name && log.patient_id) {
        try {
          const { data: patient } = await supabase
            .from('patients')
            .select('first_name, last_name, name, email')
            .eq('id', log.patient_id)
            .single();
          
          if (patient) {
            if (patient.first_name || patient.last_name) {
              patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
            } else if (patient.name) {
              patientName = patient.name;
            } else if (patient.email) {
              patientName = patient.email;
            }
          }
        } catch (e) {
          // Ignore lookup errors, use 'Unknown'
        }
      }
      
      formattedLogs.push({
        ...log,
        patient_name: patientName
      });
    }
    
    return res.status(200).json({ success: true, logs: formattedLogs });
  } catch (err) {
    console.error('Error in handleGet:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST - Create log entry AND sync with protocol
async function handlePost(req, res) {
  const {
    patient_id,
    category,
    entry_type,
    entry_date,
    medication,
    dosage,
    weight,
    quantity,
    supply_type,
    notes
  } = req.body;
  
  if (!patient_id || !category) {
    return res.status(400).json({ success: false, error: 'Missing required fields: patient_id and category' });
  }
  
  const logDate = entry_date || new Date().toISOString().split('T')[0];
  
  try {
    // 1. Create the log entry - only use columns that exist
    const logData = {
      patient_id,
      category,
      entry_type: entry_type || 'injection',
      entry_date: logDate,
      medication: medication || null,
      dosage: dosage || null,
      weight: weight ? parseFloat(weight) : null,
      quantity: quantity ? parseInt(quantity) : null,
      notes: notes || null
    };
    
    const { data: log, error: logError } = await supabase
      .from('injection_logs')
      .insert([logData])
      .select()
      .single();
    
    if (logError) throw logError;
    
    // 2. Try to sync with protocol based on category
    let protocolUpdate = { updated: false, reason: null };
    
    if (entry_type === 'pickup') {
      // For pickups, update the protocol's last_refill_date
      protocolUpdate = await syncPickupWithProtocol(patient_id, category, logDate, supply_type);
    }
    
    return res.status(200).json({ 
      success: true, 
      log,
      protocol_update: protocolUpdate
    });
  } catch (err) {
    console.error('Error creating log:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT - Update existing log entry
async function handlePut(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing log ID' });
  }
  
  const {
    entry_type,
    entry_date,
    medication,
    dosage,
    weight,
    quantity,
    notes
  } = req.body;
  
  try {
    const updateData = {
      entry_type: entry_type || 'injection',
      entry_date: entry_date || null,
      medication: medication || null,
      dosage: dosage || null,
      weight: weight ? parseFloat(weight) : null,
      quantity: quantity ? parseInt(quantity) : null,
      notes: notes || null
    };
    
    const { data: log, error } = await supabase
      .from('injection_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({ success: true, log });
  } catch (err) {
    console.error('Error updating log:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE - Remove log entry
async function handleDelete(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing log ID' });
  }
  
  try {
    const { error } = await supabase
      .from('injection_logs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting log:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Helper: Sync pickup with protocol
async function syncPickupWithProtocol(patient_id, category, logDate, supply_type) {
  try {
    // Map category to program_type
    const programTypeMap = {
      'testosterone': 'hrt',
      'weight_loss': 'weight_loss'
    };
    
    const programType = programTypeMap[category];
    if (!programType) {
      return { updated: false, reason: 'Category does not have protocol tracking' };
    }
    
    // Find the patient's active protocol for this category
    const { data: protocols, error: findError } = await supabase
      .from('protocols')
      .select('id, program_type, last_refill_date, supply_type')
      .eq('patient_id', patient_id)
      .eq('program_type', programType)
      .eq('status', 'active')
      .limit(1);
    
    if (findError) {
      console.error('Error finding protocol:', findError);
      return { updated: false, reason: 'Error finding protocol' };
    }
    
    if (!protocols || protocols.length === 0) {
      return { updated: false, reason: 'No active protocol found for this patient/category' };
    }
    
    const protocol = protocols[0];
    
    // Update the protocol
    const updateData = {
      last_refill_date: logDate
    };
    
    if (supply_type) {
      updateData.supply_type = supply_type;
    }
    
    const { error: updateError } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', protocol.id);
    
    if (updateError) {
      console.error('Error updating protocol:', updateError);
      return { updated: false, reason: 'Error updating protocol' };
    }
    
    return { 
      updated: true, 
      protocol_id: protocol.id,
      new_last_refill_date: logDate,
      changes: { supply_type }
    };
  } catch (err) {
    console.error('Error syncing pickup with protocol:', err);
    return { updated: false, reason: err.message };
  }
}
