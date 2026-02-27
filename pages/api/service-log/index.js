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
  'red_light': 'red_light',
  'supplement': 'supplement'
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
    // Fetch from BOTH tables and merge results
    let allLogs = [];

    // 1. Try service_logs
    let serviceQuery = supabase
      .from('service_logs')
      .select('*')
      .order('entry_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (category) {
      serviceQuery = serviceQuery.eq('category', category);
    }
    if (patient_id) {
      serviceQuery = serviceQuery.eq('patient_id', patient_id);
    }

    const { data: serviceLogs, error: serviceError } = await serviceQuery;

    if (!serviceError && serviceLogs) {
      allLogs = [...serviceLogs];
    }

    // 2. Also fetch from injection_logs (historical data)
    let injectionQuery = supabase
      .from('injection_logs')
      .select('*')
      .order('entry_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (category) {
      injectionQuery = injectionQuery.eq('category', category);
    }
    if (patient_id) {
      injectionQuery = injectionQuery.eq('patient_id', patient_id);
    }

    const { data: injectionLogs, error: injectionError } = await injectionQuery;

    if (!injectionError && injectionLogs) {
      // Add injection_logs entries, marking source for deduplication
      allLogs = [...allLogs, ...injectionLogs];
    }

    // Sort combined results by date (most recent first)
    allLogs.sort((a, b) => {
      const dateA = new Date(a.entry_date || a.created_at);
      const dateB = new Date(b.entry_date || b.created_at);
      return dateB - dateA;
    });

    // Limit to requested amount
    allLogs = allLogs.slice(0, parseInt(limit));

    // Get patient names for logs without them
    const formattedLogs = await enrichLogsWithPatientNames(allLogs);

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
    notes,
    protocol_id // optional: link to a specific protocol (e.g. when patient has multiple vitamin protocols)
  } = req.body;

  if (!patient_id || !category) {
    return res.status(400).json({ success: false, error: 'Missing required fields: patient_id and category' });
  }

  const logDate = entry_date || new Date().toISOString().split('T')[0];

  try {
    // 1. Create the log entry
    // Session-based services default to 'session' type; others default to 'injection'
    const resolvedEntryType = entry_type || (['hbot', 'iv_therapy', 'red_light'].includes(category) ? 'session' : 'injection');
    const logData = {
      patient_id,
      category,
      entry_type: resolvedEntryType,
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
    // Skip protocol logic for supplements — they're one-time purchases, not ongoing protocols
    const packageUpdate = category === 'supplement'
      ? { no_package: true, reason: 'Supplements do not link to protocols' }
      : await checkAndDecrementPackage(patient_id, category, resolvedEntryType, protocol_id);

    // 3. Update or create protocol based on entry type
    // Use resolvedEntryType (not raw entry_type) to ensure protocol updates always run
    let protocolUpdate = { updated: false };

    console.log('[service-log] POST:', { patient_id, category, entry_type, resolvedEntryType, protocol_id, logDate });
    console.log('[service-log] packageUpdate:', JSON.stringify(packageUpdate));

    if (resolvedEntryType === 'pickup') {
      // For pickups, update last_refill_date and medication details on protocol
      protocolUpdate = await syncPickupWithProtocol(patient_id, category, logDate, supply_type, quantity, medication, dosage);
    } else if (resolvedEntryType === 'injection' || resolvedEntryType === 'session') {
      // For injections/sessions, increment session count and update medication details
      // Pass package info so incrementOrCreateProtocol can avoid double-incrementing sessions_used
      // and can target the exact protocol that was already decremented
      protocolUpdate = await incrementOrCreateProtocol(
        patient_id, category, logDate, medication, dosage,
        protocol_id || (packageUpdate.decremented ? packageUpdate.protocol_id : null),
        packageUpdate.decremented || false
      );
    }

    console.log('[service-log] protocolUpdate:', JSON.stringify(protocolUpdate));

    // Safety net: directly update next_expected_date on the protocol after any injection/session.
    // This guarantees the update even if incrementOrCreateProtocol hit an edge case.
    // Only apply if this entry is the chronologically latest — don't let backdated entries overwrite.
    const targetProtocolId = protocol_id || protocolUpdate?.protocol_id || (packageUpdate.decremented ? packageUpdate.protocol_id : null);
    if (targetProtocolId && (resolvedEntryType === 'injection' || resolvedEntryType === 'session')) {
      const { data: latestForSafety } = await supabase
        .from('service_logs')
        .select('entry_date')
        .eq('patient_id', patient_id)
        .in('entry_type', ['injection', 'session'])
        .order('entry_date', { ascending: false })
        .limit(1);

      if (!latestForSafety?.[0] || logDate >= latestForSafety[0].entry_date) {
        const nextDate = new Date(logDate + 'T12:00:00');
        nextDate.setDate(nextDate.getDate() + 7);
        const nextExpected = nextDate.toISOString().split('T')[0];

        const { error: safetyErr } = await supabase
          .from('protocols')
          .update({
            next_expected_date: nextExpected,
            last_visit_date: logDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetProtocolId);

        if (safetyErr) {
          console.error('[service-log] Safety net update failed:', safetyErr);
        } else {
          console.log('[service-log] Safety net: next_expected_date set to', nextExpected, 'for protocol', targetProtocolId);
        }
      } else {
        console.log('[service-log] Safety net skipped: backdated entry', logDate, 'is older than latest', latestForSafety[0].entry_date);
      }
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
  const { id, source } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing log ID' });
  }

  try {
    // If source is specified, delete from that table directly
    if (source === 'protocol_logs') {
      const { error } = await supabase.from('protocol_logs').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    // Try service_logs first
    const { data: sData, error: sError } = await supabase
      .from('service_logs')
      .delete()
      .eq('id', id)
      .select();

    if (sError) throw sError;

    // If nothing was deleted from service_logs, try injection_logs
    if (!sData || sData.length === 0) {
      const { data: iData, error: iError } = await supabase
        .from('injection_logs')
        .delete()
        .eq('id', id)
        .select();

      if (iError) throw iError;

      // If nothing was deleted from injection_logs, try protocol_logs
      if (!iData || iData.length === 0) {
        const { error: pError } = await supabase
          .from('protocol_logs')
          .delete()
          .eq('id', id);

        if (pError) throw pError;
      }
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

async function checkAndDecrementPackage(patient_id, category, entry_type, protocol_id = null) {
  const programType = CATEGORY_TO_PROGRAM_TYPE[category];
  if (!programType) {
    return { no_package: true, reason: 'Category not trackable' };
  }

  try {
    let protocols, error;

    if (protocol_id) {
      // Fetch the specific protocol by ID (don't filter by status — if the UI
      // explicitly linked to this protocol, honor it even if completed)
      const result = await supabase
        .from('protocols')
        .select('id, program_type, program_name, total_sessions, sessions_used, status')
        .eq('id', protocol_id)
        .limit(1);
      protocols = result.data;
      error = result.error;
    } else {
      // Find active package/protocol by program_type (original behavior)
      const result = await supabase
        .from('protocols')
        .select('id, program_type, program_name, total_sessions, sessions_used, status')
        .eq('patient_id', patient_id)
        .eq('program_type', programType)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
      protocols = result.data;
      error = result.error;
    }

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

    // Note: Do NOT mark protocol as completed here.
    // Completion is handled by incrementOrCreateProtocol after it updates next_expected_date.

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

async function syncPickupWithProtocol(patient_id, category, logDate, supply_type, quantity, medication, dosage) {
  const programType = CATEGORY_TO_PROGRAM_TYPE[category];
  if (!programType) {
    return { updated: false, reason: 'Category not trackable' };
  }

  try {
    // Find active protocol
    const { data: protocols, error: findError } = await supabase
      .from('protocols')
      .select('id, last_refill_date, supply_type, end_date')
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
      return await createProtocolFromPickup(patient_id, category, programType, logDate, supply_type, quantity, medication, dosage);
    }

    const protocol = protocols[0];

    // Update protocol with pickup info including medication details
    const updateData = {
      last_visit_date: logDate,
      updated_at: new Date().toISOString()
    };

    if (supply_type) {
      updateData.supply_type = supply_type;
    }
    if (medication) {
      updateData.medication = medication;
      updateData.program_name = medication;
    }
    if (dosage) {
      updateData.selected_dose = dosage;
    }

    // Only update date-scheduling fields if this is the chronologically latest pickup.
    // Backdated entries should not overwrite next_expected_date from a more recent pickup.
    const { data: latestPickup } = await supabase
      .from('service_logs')
      .select('entry_date')
      .eq('patient_id', patient_id)
      .eq('category', category)
      .eq('entry_type', 'pickup')
      .order('entry_date', { ascending: false })
      .limit(1);

    const isLatestPickup = !latestPickup?.[0] || logDate >= latestPickup[0].entry_date;

    if (isLatestPickup) {
      updateData.last_refill_date = logDate;

      // Calculate next_expected_date based on supply type
      const pickupDate = new Date(logDate + 'T00:00:00');
      let daysUntilNext = 14; // default 2 weeks

      if (supply_type === 'prefilled_4week' || quantity === 8) {
        daysUntilNext = 28; // 4 weeks
      } else if (supply_type === 'prefilled_2week' || quantity === 4) {
        daysUntilNext = 14; // 2 weeks
      } else if (supply_type === 'vial_10ml' || supply_type === 'vial') {
        // Vial typically lasts 8-12 weeks depending on dose
        // Default to 10 weeks for vial
        daysUntilNext = 70;
      }

      const nextDate = new Date(pickupDate);
      nextDate.setDate(nextDate.getDate() + daysUntilNext);
      updateData.next_expected_date = nextDate.toISOString().split('T')[0];

      // For prefilled pickups, extend end_date to match supply period (pickup = billing event)
      // For vial pickups, don't touch end_date — billing cycle is separate from supply duration
      const isVial = supply_type === 'vial_10ml' || supply_type === 'vial';
      if (!isVial) {
        const currentEndDate = protocol.end_date ? new Date(protocol.end_date + 'T12:00:00') : null;
        if (!currentEndDate || nextDate > currentEndDate) {
          updateData.end_date = updateData.next_expected_date;
        }
      }
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
      next_expected_date: updateData.next_expected_date,
      medication,
      dosage
    };
  } catch (err) {
    console.error('Error syncing pickup:', err);
    return { updated: false, reason: err.message };
  }
}

async function incrementOrCreateProtocol(patient_id, category, logDate, medication, dosage, protocol_id = null, alreadyIncremented = false) {
  const programType = CATEGORY_TO_PROGRAM_TYPE[category];
  if (!programType) {
    return { updated: false, reason: 'Category not trackable' };
  }

  console.log('[incrementOrCreateProtocol] called:', { patient_id, category, programType, protocol_id, alreadyIncremented, logDate });

  try {
    let protocols, findError;

    if (protocol_id) {
      // Fetch the specific protocol by ID (don't filter by status — if the UI
      // explicitly linked to this protocol, honor it even if completed)
      const result = await supabase
        .from('protocols')
        .select('id, sessions_used, total_sessions, injections_completed, frequency, injection_day, delivery_method, end_date, program_type, status')
        .eq('id', protocol_id)
        .limit(1);
      protocols = result.data;
      findError = result.error;
    } else {
      // Find active protocol by program_type (original behavior)
      const result = await supabase
        .from('protocols')
        .select('id, sessions_used, total_sessions, injections_completed, frequency, injection_day, delivery_method, end_date, program_type, status')
        .eq('patient_id', patient_id)
        .eq('program_type', programType)
        .eq('status', 'active')
        .limit(1);
      protocols = result.data;
      findError = result.error;
    }

    console.log('[incrementOrCreateProtocol] query result:', { found: protocols?.length, findError, protocol_id_used: protocol_id || 'by program_type' });

    if (findError) {
      console.error('Error finding protocol:', findError);
      return { updated: false, reason: 'Error finding protocol' };
    }

    if (!protocols || protocols.length === 0) {
      // No protocol exists, create one
      console.log('[incrementOrCreateProtocol] No protocol found, creating new one');
      return await createProtocolFromSession(patient_id, category, programType, logDate, medication, dosage);
    }

    const protocol = protocols[0];
    console.log('[incrementOrCreateProtocol] Found protocol:', { id: protocol.id, status: protocol.status, sessions_used: protocol.sessions_used, total_sessions: protocol.total_sessions, frequency: protocol.frequency, delivery_method: protocol.delivery_method });

    // If checkAndDecrementPackage already incremented sessions_used, don't double-count.
    // Just read the current values instead of incrementing again.
    // Use typeof check to handle sessions_used === 0 correctly (0 is falsy in JS)
    const currentSessions = typeof protocol.sessions_used === 'number' ? protocol.sessions_used
      : typeof protocol.injections_completed === 'number' ? protocol.injections_completed
      : 0;
    const newCount = alreadyIncremented ? currentSessions : currentSessions + 1;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Re-activate if the protocol was completed but staff is still logging against it
    if (protocol.status === 'completed') {
      updateData.status = 'active';
    }

    if (!alreadyIncremented) {
      updateData.sessions_used = newCount;
      updateData.injections_completed = newCount;
    }

    // Only update date-scheduling fields if this is the chronologically latest session.
    // Backdated entries should not overwrite next_expected_date from a more recent visit.
    const { data: latestSession } = await supabase
      .from('service_logs')
      .select('entry_date')
      .eq('patient_id', patient_id)
      .eq('category', category)
      .in('entry_type', ['injection', 'session'])
      .order('entry_date', { ascending: false })
      .limit(1);

    const isLatestSession = !latestSession?.[0] || logDate >= latestSession[0].entry_date;

    if (isLatestSession) {
      updateData.last_visit_date = logDate;

      // Calculate next_expected_date
      // For take-home peptide protocols, next_expected_date = end of supply (end_date)
      // since the patient self-administers daily at home
      if (protocol.program_type === 'peptide' && protocol.delivery_method === 'take_home' && protocol.end_date) {
        updateData.next_expected_date = protocol.end_date;
      } else {
        const freq = (protocol.frequency || '').toLowerCase();
        let dayInterval = 7; // default weekly
        if (freq.includes('daily') || freq.includes('every day')) dayInterval = 1;
        else if (freq.includes('10 day')) dayInterval = 10;
        else if (freq.includes('2 week') || freq.includes('every 2')) dayInterval = 14;
        else if (freq.includes('monthly')) dayInterval = 28;
        else if (freq.includes('every other day')) dayInterval = 2;
        else if (freq.includes('5 on')) dayInterval = 1;

        const nextDate = new Date(logDate + 'T12:00:00');
        nextDate.setDate(nextDate.getDate() + dayInterval);
        updateData.next_expected_date = nextDate.toISOString().split('T')[0];

        // Extend end_date if next_expected_date is past it, so protocol doesn't show
        // as overdue while patient is still actively being treated
        if (protocol.end_date && updateData.next_expected_date > protocol.end_date) {
          updateData.end_date = updateData.next_expected_date;
        }
      }
    }

    // Also update medication and dosage if provided
    // Skip overwriting medication/program_name when protocol_id was explicitly provided,
    // since the protocol already has the correct medication set
    if (medication && !protocol_id) {
      updateData.medication = medication;
      updateData.program_name = medication;
    }
    if (dosage && !protocol_id) {
      updateData.selected_dose = dosage;
    }

    console.log('[incrementOrCreateProtocol] Updating protocol:', { protocol_id: protocol.id, updateData, alreadyIncremented, currentSessions, newCount });

    const { error: updateError } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', protocol.id);

    if (updateError) {
      console.error('[incrementOrCreateProtocol] UPDATE FAILED:', updateError);
      return { updated: false, reason: 'Error updating protocol: ' + updateError.message };
    }

    console.log('[incrementOrCreateProtocol] Protocol updated successfully:', { protocol_id: protocol.id, next_expected_date: updateData.next_expected_date });

    // Note: Don't auto-complete based on session count here.
    // The complete-protocols cron handles completion based on end_date.
    // Auto-completing on session exhaustion causes the protocol to vanish
    // from the Active list mid-workflow (e.g. monthly memberships that renew).

    return {
      updated: true,
      protocol_id: protocol.id,
      sessions_used: newCount,
      medication,
      dosage
    };
  } catch (err) {
    console.error('Error incrementing protocol:', err);
    return { updated: false, reason: err.message };
  }
}

async function createProtocolFromPickup(patient_id, category, programType, logDate, supply_type, quantity, medication, dosage) {
  try {
    // Calculate next_expected_date based on supply type
    const pickupDate = new Date(logDate + 'T00:00:00');
    let daysUntilNext = 14; // default 2 weeks

    if (supply_type === 'prefilled_4week' || quantity === 8) {
      daysUntilNext = 28;
    } else if (supply_type === 'prefilled_2week' || quantity === 4) {
      daysUntilNext = 14;
    } else if (supply_type === 'vial_10ml' || supply_type === 'vial') {
      daysUntilNext = 70;
    }

    const nextDate = new Date(pickupDate);
    nextDate.setDate(nextDate.getDate() + daysUntilNext);

    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert({
        patient_id,
        program_type: programType,
        program_name: medication || getCategoryDisplayName(category),
        medication: medication || null,
        selected_dose: dosage || null,
        status: 'active',
        start_date: logDate,
        end_date: nextDate.toISOString().split('T')[0],
        last_refill_date: logDate,
        last_visit_date: logDate,
        next_expected_date: nextDate.toISOString().split('T')[0],
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
      protocol_id: protocol.id,
      next_expected_date: nextDate.toISOString().split('T')[0],
      medication,
      dosage
    };
  } catch (err) {
    console.error('Error creating protocol from pickup:', err);
    return { created: false, reason: err.message };
  }
}

async function createProtocolFromSession(patient_id, category, programType, logDate, medication, dosage) {
  try {
    // Calculate next_expected_date (default weekly interval)
    const sessionDate = new Date(logDate + 'T12:00:00');
    sessionDate.setDate(sessionDate.getDate() + 7);
    const nextExpectedDate = sessionDate.toISOString().split('T')[0];

    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert({
        patient_id,
        program_type: programType,
        program_name: medication || getCategoryDisplayName(category),
        medication: medication || null,
        selected_dose: dosage || null,
        status: 'active',
        start_date: logDate,
        last_visit_date: logDate,
        next_expected_date: nextExpectedDate,
        delivery_method: 'in_clinic',
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
      protocol_id: protocol.id,
      next_expected_date: nextExpectedDate,
      medication,
      dosage
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
    'red_light': 'Red Light Therapy',
    'supplement': 'Supplement / Product'
  };
  return names[category] || category;
}
