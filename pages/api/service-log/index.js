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
import { isWeightLossType } from '../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sync weight to patient_vitals when logged via service_log
async function syncWeightToVitals(patient_id, weight, entry_date, recorded_by) {
  if (!patient_id || !weight) return;
  try {
    const logDate = entry_date || new Date().toISOString().split('T')[0];
    // Check if vitals already exist for this date
    const dayStart = logDate + 'T00:00:00Z';
    const dayEnd = logDate + 'T23:59:59Z';
    const { data: existing } = await supabase
      .from('patient_vitals')
      .select('id')
      .eq('patient_id', patient_id)
      .gte('recorded_at', dayStart)
      .lte('recorded_at', dayEnd)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('patient_vitals')
        .update({ weight_lbs: parseFloat(weight), recorded_by: recorded_by || 'Service Log' })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('patient_vitals')
        .insert({
          patient_id,
          weight_lbs: parseFloat(weight),
          recorded_by: recorded_by || 'Service Log',
          recorded_at: new Date(logDate + 'T12:00:00Z').toISOString(),
        });
    }
  } catch (err) {
    console.error('syncWeightToVitals error (non-fatal):', err.message);
  }
}

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
  const { category, patient_id, search, limit = 100 } = req.query;

  try {
    // If searching, find matching patient IDs first so we can filter server-side
    let searchPatientIds = null;
    if (search && search.trim().length >= 2) {
      const term = search.trim().toLowerCase();
      // Search patients by name
      const { data: matchingPatients } = await supabase
        .from('patients')
        .select('id')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,name.ilike.%${term}%`)
        .limit(50);

      searchPatientIds = (matchingPatients || []).map(p => p.id);

      // If no patients match the name, still allow medication search below
    }

    // Fetch from BOTH tables and merge results
    let allLogs = [];

    // 1. Try service_logs
    let serviceQuery = supabase
      .from('service_logs')
      .select('*')
      .order('entry_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (category) {
      serviceQuery = serviceQuery.eq('category', category);
    }
    if (patient_id) {
      serviceQuery = serviceQuery.eq('patient_id', patient_id);
    }

    // Server-side patient filter for search
    if (searchPatientIds !== null && searchPatientIds.length > 0) {
      serviceQuery = serviceQuery.in('patient_id', searchPatientIds);
    } else if (searchPatientIds !== null && searchPatientIds.length === 0) {
      // No patients matched name — try medication search only
      const term = search.trim();
      serviceQuery = serviceQuery.ilike('medication', `%${term}%`);
    }

    serviceQuery = serviceQuery.limit(parseInt(limit));
    const { data: serviceLogs, error: serviceError } = await serviceQuery;

    if (!serviceError && serviceLogs) {
      allLogs = [...serviceLogs];
    }

    // 2. Also fetch from injection_logs (historical data)
    let injectionQuery = supabase
      .from('injection_logs')
      .select('*')
      .order('entry_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (category) {
      injectionQuery = injectionQuery.eq('category', category);
    }
    if (patient_id) {
      injectionQuery = injectionQuery.eq('patient_id', patient_id);
    }

    // Server-side patient filter for search
    if (searchPatientIds !== null && searchPatientIds.length > 0) {
      injectionQuery = injectionQuery.in('patient_id', searchPatientIds);
    } else if (searchPatientIds !== null && searchPatientIds.length === 0) {
      const term = search.trim();
      injectionQuery = injectionQuery.ilike('medication', `%${term}%`);
    }

    injectionQuery = injectionQuery.limit(parseInt(limit));
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
    delivery_method, // From protocol-types: prefilled_1..8 or vial
    duration,
    notes,
    protocol_id, // optional: link to a specific protocol (e.g. when patient has multiple vitamin protocols)
    administered_by,
    lot_number,
    expiration_date,
    signature_url,
    injection_method, // IM or subq
    injection_frequency, // injections per week (e.g. 2, 3, 7)
    fulfillment_method, // in_clinic or overnight
    tracking_number, // shipping tracking number for overnighted pickups
  } = req.body;

  if (!patient_id || !category) {
    return res.status(400).json({ success: false, error: 'Missing required fields: patient_id and category' });
  }

  const logDate = entry_date || new Date().toISOString().split('T')[0];

  try {
    // 1. Create the log entry
    // Session-based services default to 'session' type; others default to 'injection'
    const resolvedEntryType = entry_type || (['hbot', 'iv_therapy', 'red_light'].includes(category) ? 'session' : 'injection');

    // ── Duplicate check ──
    // Only check injection/session/pickup entries (not misc). Skip if force:true.
    if (!req.body.force && ['injection', 'session', 'pickup'].includes(resolvedEntryType)) {
      let dupQuery = supabase
        .from('service_logs')
        .select('id, entry_date, category, entry_type, medication')
        .eq('patient_id', patient_id)
        .eq('entry_date', logDate)
        .eq('category', category)
        .eq('entry_type', resolvedEntryType);

      // For typed entries, also match on medication so different meds on the same day aren't flagged
      if (medication && ['injection', 'pickup'].includes(resolvedEntryType)) {
        dupQuery = dupQuery.eq('medication', medication);
      }

      const { data: existingEntries } = await dupQuery.limit(3);

      if (existingEntries && existingEntries.length > 0) {
        const dupMsg = `A ${resolvedEntryType} for this patient was already logged on ${logDate}${medication ? ` (${medication})` : ''}. Use force:true to log anyway.`;
        return res.status(409).json({
          success: false,
          duplicate: true,
          existing: existingEntries,
          error: dupMsg,
          message: dupMsg
        });
      }
    }
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
      notes: notes || null,
      protocol_id: protocol_id || null,
      administered_by: administered_by || null,
      lot_number: lot_number || null,
      expiration_date: expiration_date || null,
      signature_url: signature_url || null,
      signed_at: signature_url ? new Date().toISOString() : null,
      fulfillment_method: fulfillment_method || null,
      tracking_number: tracking_number || null,
    };

    // Try service_logs first, fall back to injection_logs
    let log, logError;

    let { data: serviceLog, error: serviceLogError } = await supabase
      .from('service_logs')
      .insert([logData])
      .select()
      .single();

    // If fulfillment columns don't exist yet, retry without them
    if (serviceLogError && serviceLogError.message?.includes('fulfillment_method')) {
      delete logData.fulfillment_method;
      delete logData.tracking_number;
      ({ data: serviceLog, error: serviceLogError } = await supabase
        .from('service_logs')
        .insert([logData])
        .select()
        .single());
    }

    if (serviceLogError && serviceLogError.code === '42P01') {
      // Table doesn't exist, use injection_logs
      delete logData.fulfillment_method;
      delete logData.tracking_number;
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

    // ── Sync weight to patient_vitals (bidirectional sync) ──
    if (weight) {
      await syncWeightToVitals(patient_id, weight, logDate, administered_by);
    }

    // ── Weight loss multi-injection: create additional entries for future weeks ──
    // When staff logs a weight loss injection with quantity > 1, it means the patient
    // picked up multiple injections at once (e.g., 2 weeks' worth). Create individual
    // service_log entries for each week so the protocol schedule fills correctly.
    const wlMultiQty = isWeightLossType(category) && resolvedEntryType === 'injection' && quantity && parseInt(quantity) > 1 ? parseInt(quantity) : 0;
    const additionalLogs = [];
    if (wlMultiQty > 1) {
      for (let i = 1; i < wlMultiQty; i++) {
        const futureDate = new Date(logDate + 'T12:00:00');
        futureDate.setDate(futureDate.getDate() + i * 7);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        const extraLogData = {
          patient_id,
          category,
          entry_type: 'injection',
          entry_date: futureDateStr,
          medication: medication || null,
          dosage: dosage || null,
          weight: null, // only first entry gets the weigh-in
          quantity: 1,
          notes: `Dispensed on ${logDate} (${wlMultiQty}-injection pickup, week ${i + 1} of ${wlMultiQty})`,
          protocol_id: protocol_id || null,
          administered_by: administered_by || null,
          fulfillment_method: fulfillment_method || 'in_clinic',
        };
        const { data: extraLog, error: extraErr } = await supabase
          .from('service_logs')
          .insert([extraLogData])
          .select()
          .single();
        if (!extraErr && extraLog) {
          additionalLogs.push(extraLog);
        } else {
          console.error(`[service-log] Failed to create extra WL entry for ${futureDateStr}:`, extraErr);
        }
      }
      console.log(`[service-log] Created ${additionalLogs.length} additional WL entries for multi-injection pickup`);
    }

    // 2. Check for active package and decrement if found
    // Skip protocol logic for supplements — they're one-time purchases, not ongoing protocols
    const packageUpdate = category === 'supplement'
      ? { no_package: true, reason: 'Supplements do not link to protocols' }
      : await checkAndDecrementPackage(patient_id, category, resolvedEntryType, protocol_id);

    // 3. Update or create protocol based on entry type
    // Use resolvedEntryType (not raw entry_type) to ensure protocol updates always run
    let protocolUpdate = { updated: false };

    console.log('[service-log] POST:', { patient_id, category, entry_type, resolvedEntryType, protocol_id, logDate, wlMultiQty });
    console.log('[service-log] packageUpdate:', JSON.stringify(packageUpdate));

    if (resolvedEntryType === 'pickup') {
      // For pickups, update last_refill_date and medication details on protocol
      protocolUpdate = await syncPickupWithProtocol(patient_id, category, logDate, supply_type, quantity, medication, dosage, delivery_method);
    } else if (resolvedEntryType === 'injection' || resolvedEntryType === 'session') {
      // For injections/sessions, increment session count and update medication details
      // Pass package info so incrementOrCreateProtocol can avoid double-incrementing sessions_used
      // and can target the exact protocol that was already decremented
      // For multi-injection WL entries, pass the quantity so sessions_used increments correctly
      protocolUpdate = await incrementOrCreateProtocol(
        patient_id, category, logDate, medication, dosage,
        protocol_id || (packageUpdate.decremented ? packageUpdate.protocol_id : null),
        packageUpdate.decremented || false,
        wlMultiQty > 1 ? wlMultiQty : 1
      );
    }

    console.log('[service-log] protocolUpdate:', JSON.stringify(protocolUpdate));

    // Safety net: directly update next_expected_date on the protocol after any injection/session.
    // This guarantees the update even if incrementOrCreateProtocol hit an edge case.
    // Only apply if this entry is the chronologically latest — don't let backdated entries overwrite.
    const targetProtocolId = protocol_id || protocolUpdate?.protocol_id || (packageUpdate.decremented ? packageUpdate.protocol_id : null);
    if (targetProtocolId && (resolvedEntryType === 'injection' || resolvedEntryType === 'session')) {
      // For multi-injection WL entries, find the last entry date (furthest out)
      const lastEntryDate = wlMultiQty > 1 && additionalLogs.length > 0
        ? additionalLogs[additionalLogs.length - 1].entry_date
        : logDate;

      const { data: latestForSafety } = await supabase
        .from('service_logs')
        .select('entry_date')
        .eq('patient_id', patient_id)
        .in('entry_type', ['injection', 'session'])
        .order('entry_date', { ascending: false })
        .limit(1);

      if (!latestForSafety?.[0] || lastEntryDate >= latestForSafety[0].entry_date) {
        const nextDate = new Date(lastEntryDate + 'T12:00:00');
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
        console.log('[service-log] Safety net skipped: backdated entry', lastEntryDate, 'is older than latest', latestForSafety[0].entry_date);
      }
    }

    // Update protocol injection_method / injection_frequency if provided
    if (targetProtocolId && (injection_method || injection_frequency)) {
      const protoUpdate = {};
      if (injection_method) protoUpdate.injection_method = injection_method;
      if (injection_frequency) protoUpdate.injection_frequency = parseInt(injection_frequency);
      await supabase.from('protocols').update(protoUpdate).eq('id', targetProtocolId);
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
    notes,
    fulfillment_method,
    tracking_number,
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
      notes: notes || null,
    };

    // Add fulfillment fields if provided
    if (fulfillment_method !== undefined) {
      updateData.fulfillment_method = fulfillment_method || null;
      updateData.tracking_number = tracking_number || null;
    }

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

    // Sync weight to patient_vitals if updated
    if (log && weight) {
      await syncWeightToVitals(log.patient_id, weight, log.entry_date);
    }

    // Recalculate protocol state after edit (date/weight changes affect tracking)
    if (log?.protocol_id) {
      await recalcProtocolAfterEdit(log.protocol_id);
    }

    return res.status(200).json({ success: true, log });
  } catch (err) {
    console.error('Error updating log:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE - Remove log entry and sync protocol
async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing log ID' });
  }

  try {
    // Fetch entry before deleting (service_logs is the single source of truth)
    const { data: slEntry } = await supabase
      .from('service_logs')
      .select('*')
      .eq('id', id)
      .single();

    let deletedEntry = slEntry;

    if (slEntry) {
      const { error: sError } = await supabase
        .from('service_logs')
        .delete()
        .eq('id', id);
      if (sError) throw sError;
    } else {
      // Fallback: try injection_logs (legacy)
      const { data: ilEntry } = await supabase
        .from('injection_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (ilEntry) {
        deletedEntry = ilEntry;
        const { error: iError } = await supabase
          .from('injection_logs')
          .delete()
          .eq('id', id);
        if (iError) throw iError;
      } else {
        return res.status(404).json({ success: false, error: 'Log entry not found' });
      }
    }

    // Recalculate protocol state after deletion
    if (deletedEntry?.protocol_id) {
      await recalcProtocolAfterDelete(deletedEntry.protocol_id, deletedEntry.patient_id, deletedEntry.category);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting log:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Recalculate protocol state after an injection/session is deleted
async function recalcProtocolAfterDelete(protocolId, patientId, category) {
  try {
    // Count remaining injection/session entries from service_logs (single source of truth)
    const { count: sessionsUsed } = await supabase
      .from('service_logs')
      .select('*', { count: 'exact', head: true })
      .eq('protocol_id', protocolId)
      .in('entry_type', ['injection', 'session']);

    // Find the most recent remaining injection date
    const { data: latestSL } = await supabase
      .from('service_logs')
      .select('entry_date')
      .eq('protocol_id', protocolId)
      .in('entry_type', ['injection', 'session'])
      .order('entry_date', { ascending: false })
      .limit(1);

    const lastDate = latestSL?.[0]?.entry_date || null;

    const updateData = {
      sessions_used: sessionsUsed,
      updated_at: new Date().toISOString(),
    };

    if (lastDate) {
      updateData.last_visit_date = lastDate;
      // Recalculate next_expected_date from the most recent injection + 7 days
      const nextDate = new Date(lastDate + 'T12:00:00');
      nextDate.setDate(nextDate.getDate() + 7);
      updateData.next_expected_date = nextDate.toISOString().split('T')[0];
    } else {
      // All injections cleared — reset dates
      updateData.last_visit_date = null;
      updateData.next_expected_date = null;
    }

    const { error } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', protocolId);

    if (error) {
      console.error('recalcProtocolAfterDelete update error:', error);
    } else {
      console.log(`✓ Protocol ${protocolId} recalculated after delete: sessions_used=${sessionsUsed}, last_visit=${lastDate}`);
    }
  } catch (err) {
    console.error('recalcProtocolAfterDelete error:', err);
  }
}

// Recalculate protocol state after an edit (date/weight change)
async function recalcProtocolAfterEdit(protocolId) {
  try {
    // Find the most recent injection/session date
    const { data: latestSL } = await supabase
      .from('service_logs')
      .select('entry_date')
      .eq('protocol_id', protocolId)
      .in('entry_type', ['injection', 'session'])
      .order('entry_date', { ascending: false })
      .limit(1);

    const lastDate = latestSL?.[0]?.entry_date || null;

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (lastDate) {
      updateData.last_visit_date = lastDate;
      const nextDate = new Date(lastDate + 'T12:00:00');
      nextDate.setDate(nextDate.getDate() + 7);
      updateData.next_expected_date = nextDate.toISOString().split('T')[0];
    }

    await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', protocolId);
  } catch (err) {
    console.error('recalcProtocolAfterEdit error:', err);
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

async function syncPickupWithProtocol(patient_id, category, logDate, supply_type, quantity, medication, dosage, delivery_method) {
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
    // Update delivery_method on protocol (from protocol-types: prefilled_1..8 or vial)
    if (delivery_method) {
      updateData.delivery_method = delivery_method;
    }
    if (medication) {
      updateData.medication = medication;
      // Don't overwrite program_name — it's standardized to "HRT Protocol" etc.
    }
    if (dosage && !isWeightLossType(category)) {
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
      let daysUntilNext = 30; // default monthly

      if (isWeightLossType(category) && quantity) {
        // Weight loss pickups: quantity = weeks of supply (1-4)
        daysUntilNext = quantity * 7;
      } else if (supply_type === 'prefilled_4week' || quantity === 8) {
        daysUntilNext = 28; // 4 weeks
      } else if (supply_type === 'prefilled_2week' || quantity === 4) {
        daysUntilNext = 14; // 2 weeks
      } else if (supply_type === 'prefilled_1week' || quantity === 2) {
        daysUntilNext = 7; // 1 week
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

async function incrementOrCreateProtocol(patient_id, category, logDate, medication, dosage, protocol_id = null, alreadyIncremented = false, incrementBy = 1) {
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
        .select('id, sessions_used, total_sessions, frequency, injection_day, delivery_method, end_date, program_type, status')
        .eq('id', protocol_id)
        .limit(1);
      protocols = result.data;
      findError = result.error;
    } else {
      // Find active protocol by program_type (original behavior)
      const result = await supabase
        .from('protocols')
        .select('id, sessions_used, total_sessions, frequency, injection_day, delivery_method, end_date, program_type, status')
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
    // incrementBy supports multi-injection pickups (e.g., 2 WL injections at once = +2)
    const currentSessions = typeof protocol.sessions_used === 'number' ? protocol.sessions_used : 0;
    const newCount = alreadyIncremented ? currentSessions : currentSessions + incrementBy;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Re-activate if the protocol was completed but staff is still logging against it
    if (protocol.status === 'completed') {
      updateData.status = 'active';
    }

    if (!alreadyIncremented) {
      updateData.sessions_used = newCount;
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
        // For multi-injection pickups, skip ahead by incrementBy intervals
        // e.g., 2 injections picked up = next due in 2 weeks, not 1
        nextDate.setDate(nextDate.getDate() + dayInterval * incrementBy);
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
    let daysUntilNext = 30; // default monthly

    if (isWeightLossType(category) && quantity) {
      // Weight loss pickups: quantity = weeks of supply (1-4)
      daysUntilNext = quantity * 7;
    } else if (supply_type === 'prefilled_4week' || quantity === 8) {
      daysUntilNext = 28;
    } else if (supply_type === 'prefilled_2week' || quantity === 4) {
      daysUntilNext = 14;
    } else if (supply_type === 'prefilled_1week' || quantity === 2) {
      daysUntilNext = 7;
    } else if (supply_type === 'vial_10ml' || supply_type === 'vial') {
      daysUntilNext = 70;
    }

    const nextDate = new Date(pickupDate);
    nextDate.setDate(nextDate.getDate() + daysUntilNext);

    // Determine HRT type from medication name
    const isHRT = programType === 'hrt';
    const isFemale = isHRT && medication && medication.toLowerCase().includes('100mg');
    const hrtType = isHRT ? (isFemale ? 'female' : 'male') : null;

    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert({
        patient_id,
        program_type: programType,
        program_name: isHRT ? 'HRT Protocol' : (medication || getCategoryDisplayName(category)),
        medication: medication || null,
        selected_dose: dosage || null,
        status: 'active',
        start_date: logDate,
        end_date: nextDate.toISOString().split('T')[0],
        last_refill_date: logDate,
        last_visit_date: logDate,
        next_expected_date: nextDate.toISOString().split('T')[0],
        supply_type: supply_type || null,
        hrt_type: hrtType,
        secondary_medications: isHRT ? '[]' : null,
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

    // Determine HRT type from medication name
    const isHRT = programType === 'hrt';
    const isFemaleSession = isHRT && medication && medication.toLowerCase().includes('100mg');
    const hrtTypeSession = isHRT ? (isFemaleSession ? 'female' : 'male') : null;

    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert({
        patient_id,
        program_type: programType,
        program_name: isHRT ? 'HRT Protocol' : (medication || getCategoryDisplayName(category)),
        medication: medication || null,
        selected_dose: dosage || null,
        status: 'active',
        start_date: logDate,
        last_visit_date: logDate,
        next_expected_date: nextExpectedDate,
        delivery_method: 'in_clinic',
        sessions_used: 1,
        injections_completed: 1,
        hrt_type: hrtTypeSession,
        secondary_medications: isHRT ? '[]' : null,
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
    'testosterone': 'HRT Protocol',
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
