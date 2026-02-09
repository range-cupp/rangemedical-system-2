// /pages/api/service-log/index.js
// Unified Service Log API
// Range Medical - 2026-02-09
//
// This is the master API for logging ALL services delivered.
// When a log entry is created, it:
// 1. Checks if patient has an active package for this service
// 2. Decrements from package if found (or flags for billing)
// 3. Creates/updates protocol for tracking
// 4. Returns feedback about what happened

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map category to program_type for protocols
const CATEGORY_TO_PROGRAM_TYPE = {
  'testosterone': 'hrt',
  'weight_loss': 'weight_loss',
  'vitamin': 'vitamin',
  'peptide': 'peptide',
  'iv_therapy': 'iv_therapy',
  'hbot': 'hbot',
  'red_light': 'red_light'
};

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
    console.error('Service log API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// GET - Fetch logs by category
async function handleGet(req, res) {
  const { category, patient_id, limit = 100 } = req.query;

  try {
    // Try service_logs first
    let query = supabase
      .from('service_logs')
      .select('*')
      .order('entry_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (category) {
      query = query.eq('category', category);
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    const { data: logs, error } = await query;

    if (error) {
      // Table might not exist yet, try injection_logs as fallback
      if (error.code === '42P01') {
        return await handleGetFallback(req, res);
      }
      console.error('Error fetching service logs:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // If service_logs is empty, also check injection_logs for this category
    if (!logs || logs.length === 0) {
      return await handleGetFallback(req, res);
    }

    // Get patient names for logs without them
    const formattedLogs = await enrichLogsWithPatientNames(logs || []);

    return res.status(200).json({ success: true, logs: formattedLogs });
  } catch (err) {
    console.error('Error in handleGet:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Fallback to injection_logs table if service_logs doesn't exist
async function handleGetFallback(req, res) {
  const { category, patient_id, limit = 100 } = req.query;

  let query = supabase
    .from('injection_logs')
    .select('*')
    .order('entry_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  if (category) {
    query = query.eq('category', category);
  }

  if (patient_id) {
    query = query.eq('patient_id', patient_id);
  }

  const { data: logs, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  const formattedLogs = await enrichLogsWithPatientNames(logs || []);
  return res.status(200).json({ success: true, logs: formattedLogs });
}

// Helper: Add patient names to logs
async function enrichLogsWithPatientNames(logs) {
  const formattedLogs = [];

  for (const log of logs) {
    let patientName = log.patient_name || 'Unknown';

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
        // Ignore lookup errors
      }
    }

    formattedLogs.push({
      ...log,
      patient_name: patientName
    });
  }

  return formattedLogs;
}

// POST - Create log entry with package/protocol automation
async function handlePost(req, res) {
  const {
    patient_id,
    category,
    entry_type, // injection, pickup, session
    entry_date,
    medication,
    dosage,
    weight,
    quantity,
    supply_type,
    duration,
    notes
  } = req.body;

  if (!patient_id || !category) {
    return res.status(400).json({ success: false, error: 'Missing required fields: patient_id and category' });
  }

  const logDate = entry_date || new Date().toISOString().split('T')[0];

  try {
    // 1. Create the log entry
    const logData = {
      patient_id,
      category,
      entry_type: entry_type || 'injection',
      entry_date: logDate,
      medication: medication || null,
      dosage: dosage || null,
      weight: weight ? parseFloat(weight) : null,
      quantity: quantity ? parseInt(quantity) : null,
      supply_type: supply_type || null,
      duration: duration ? parseInt(duration) : null,
      notes: notes || null
    };

    // Try service_logs first, fall back to injection_logs
    let log, logError;

    const { data: serviceLog, error: serviceLogError } = await supabase
      .from('service_logs')
      .insert([logData])
      .select()
      .single();

    if (serviceLogError && serviceLogError.code === '42P01') {
      // Table doesn't exist, use injection_logs
      const { data: injLog, error: injError } = await supabase
        .from('injection_logs')
        .insert([logData])
        .select()
        .single();
      log = injLog;
      logError = injError;
    } else {
      log = serviceLog;
      logError = serviceLogError;
    }

    if (logError) throw logError;

    // 2. Check for active package and decrement if found
    const packageUpdate = await checkAndDecrementPackage(patient_id, category, entry_type);

    // 3. Update or create protocol based on entry type
    let protocolUpdate = { updated: false };

    if (entry_type === 'pickup') {
      // For pickups, update last_refill_date on protocol
      protocolUpdate = await syncPickupWithProtocol(patient_id, category, logDate, supply_type, quantity);
    } else if (entry_type === 'injection' || entry_type === 'session') {
      // For injections/sessions, try to increment session count
      protocolUpdate = await incrementOrCreateProtocol(patient_id, category, logDate, medication);
    }

    return res.status(200).json({
      success: true,
      log,
      package_update: packageUpdate,
      protocol_update: protocolUpdate
    });
  } catch (err) {
    console.error('Error creating service log:', err);
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
    supply_type,
    duration,
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
      supply_type: supply_type || null,
      duration: duration ? parseInt(duration) : null,
      notes: notes || null
    };

    // Try service_logs first
    let log, error;

    const { data: sLog, error: sError } = await supabase
      .from('service_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (sError && sError.code === '42P01') {
      const { data: iLog, error: iError } = await supabase
        .from('injection_logs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      log = iLog;
      error = iError;
    } else {
      log = sLog;
      error = sError;
    }

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
    // Try service_logs first
    const { error: sError } = await supabase
      .from('service_logs')
      .delete()
      .eq('id', id);

    if (sError && sError.code === '42P01') {
      const { error: iError } = await supabase
        .from('injection_logs')
        .delete()
        .eq('id', id);
      if (iError) throw iError;
    } else if (sError) {
      throw sError;
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting log:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================
// PACKAGE CHECKING & DECREMENTING
// ============================================

async function checkAndDecrementPackage(patient_id, category, entry_type) {
  const programType = CATEGORY_TO_PROGRAM_TYPE[category];
  if (!programType) {
    return { no_package: true, reason: 'Category not trackable' };
  }

  try {
    // Find active package/protocol with remaining sessions
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('id, program_type, program_name, total_sessions, sessions_used, status')
      .eq('patient_id', patient_id)
      .eq('program_type', programType)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking packages:', error);
      return { no_package: true, reason: 'Error checking packages' };
    }

    if (!protocols || protocols.length === 0) {
      return { no_package: true, reason: 'No active package found' };
    }

    const protocol = protocols[0];
    const sessionsUsed = protocol.sessions_used || 0;
    const totalSessions = protocol.total_sessions || 0;

    // Check if package has remaining sessions
    if (totalSessions > 0 && sessionsUsed >= totalSessions) {
      return { no_package: true, reason: 'Package exhausted' };
    }

    // Decrement from package (increment sessions_used)
    const newSessionsUsed = sessionsUsed + 1;
    const remaining = totalSessions > 0 ? totalSessions - newSessionsUsed : 'unlimited';

    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        sessions_used: newSessionsUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', protocol.id);

    if (updateError) {
      console.error('Error decrementing package:', updateError);
      return { decremented: false, reason: 'Error updating package' };
    }

    // Check if package is now complete
    if (totalSessions > 0 && newSessionsUsed >= totalSessions) {
      await supabase
        .from('protocols')
        .update({ status: 'completed' })
        .eq('id', protocol.id);
    }

    return {
      decremented: true,
      protocol_id: protocol.id,
      package_name: protocol.program_name,
      sessions_used: newSessionsUsed,
      total_sessions: totalSessions,
      remaining: remaining
    };
  } catch (err) {
    console.error('Error in checkAndDecrementPackage:', err);
    return { no_package: true, reason: err.message };
  }
}

// ============================================
// PROTOCOL SYNCING
// ============================================

async function syncPickupWithProtocol(patient_id, category, logDate, supply_type, quantity) {
  const programType = CATEGORY_TO_PROGRAM_TYPE[category];
  if (!programType) {
    return { updated: false, reason: 'Category not trackable' };
  }

  try {
    // Find active protocol
    const { data: protocols, error: findError } = await supabase
      .from('protocols')
      .select('id, last_refill_date, supply_type')
      .eq('patient_id', patient_id)
      .eq('program_type', programType)
      .eq('status', 'active')
      .limit(1);

    if (findError) {
      console.error('Error finding protocol:', findError);
      return { updated: false, reason: 'Error finding protocol' };
    }

    if (!protocols || protocols.length === 0) {
      // No protocol exists, create one
      return await createProtocolFromPickup(patient_id, category, programType, logDate, supply_type, quantity);
    }

    const protocol = protocols[0];

    // Update protocol with pickup info
    const updateData = {
      last_refill_date: logDate,
      updated_at: new Date().toISOString()
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
      new_last_refill_date: logDate
    };
  } catch (err) {
    console.error('Error syncing pickup:', err);
    return { updated: false, reason: err.message };
  }
}

async function incrementOrCreateProtocol(patient_id, category, logDate, medication) {
  const programType = CATEGORY_TO_PROGRAM_TYPE[category];
  if (!programType) {
    return { updated: false, reason: 'Category not trackable' };
  }

  try {
    // Find active protocol
    const { data: protocols, error: findError } = await supabase
      .from('protocols')
      .select('id, sessions_used, total_sessions, injections_completed')
      .eq('patient_id', patient_id)
      .eq('program_type', programType)
      .eq('status', 'active')
      .limit(1);

    if (findError) {
      console.error('Error finding protocol:', findError);
      return { updated: false, reason: 'Error finding protocol' };
    }

    if (!protocols || protocols.length === 0) {
      // No protocol exists, create one
      return await createProtocolFromSession(patient_id, category, programType, logDate, medication);
    }

    const protocol = protocols[0];

    // Increment appropriate counter
    const currentSessions = protocol.sessions_used || protocol.injections_completed || 0;
    const newCount = currentSessions + 1;

    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        sessions_used: newCount,
        injections_completed: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', protocol.id);

    if (updateError) {
      console.error('Error incrementing protocol:', updateError);
      return { updated: false, reason: 'Error updating protocol' };
    }

    return {
      updated: true,
      protocol_id: protocol.id,
      sessions_used: newCount
    };
  } catch (err) {
    console.error('Error incrementing protocol:', err);
    return { updated: false, reason: err.message };
  }
}

async function createProtocolFromPickup(patient_id, category, programType, logDate, supply_type, quantity) {
  try {
    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert({
        patient_id,
        program_type: programType,
        program_name: getCategoryDisplayName(category),
        status: 'active',
        start_date: logDate,
        last_refill_date: logDate,
        supply_type: supply_type || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating protocol:', error);
      return { created: false, reason: 'Error creating protocol' };
    }

    return {
      created: true,
      protocol_id: protocol.id
    };
  } catch (err) {
    console.error('Error creating protocol from pickup:', err);
    return { created: false, reason: err.message };
  }
}

async function createProtocolFromSession(patient_id, category, programType, logDate, medication) {
  try {
    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert({
        patient_id,
        program_type: programType,
        program_name: medication || getCategoryDisplayName(category),
        status: 'active',
        start_date: logDate,
        sessions_used: 1,
        injections_completed: 1,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating protocol:', error);
      return { created: false, reason: 'Error creating protocol' };
    }

    return {
      created: true,
      protocol_id: protocol.id
    };
  } catch (err) {
    console.error('Error creating protocol from session:', err);
    return { created: false, reason: err.message };
  }
}

function getCategoryDisplayName(category) {
  const names = {
    'testosterone': 'HRT - Testosterone',
    'weight_loss': 'Weight Loss Program',
    'vitamin': 'Vitamin Injections',
    'peptide': 'Peptide Therapy',
    'iv_therapy': 'IV Therapy',
    'hbot': 'Hyperbaric Oxygen Therapy',
    'red_light': 'Red Light Therapy'
  };
  return names[category] || category;
}
