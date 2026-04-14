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
import { createProtocol } from '../../../lib/create-protocol';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sync weight to patient_vitals when logged via service_log
async function syncWeightToVitals(patient_id, weight, entry_date, recorded_by) {
  if (!patient_id || !weight) return;
  try {
    const logDate = entry_date || todayPacific();
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
    is_secondary_med, // true when logging a secondary medication pickup (e.g. HCG on an HRT protocol)
    secondary_med_details, // { num_vials, dosage, frequency } for secondary med supply tracking
  } = req.body;

  if (!patient_id || !category) {
    return res.status(400).json({ success: false, error: 'Missing required fields: patient_id and category' });
  }

  const logDate = entry_date || todayPacific();

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

    // ── Weight loss pickup: auto-create injection schedule entries ──
    // When a pickup is logged with quantity > 0, create individual injection entries
    // for each week so the View Details timeline populates correctly.
    const wlPickupQty = isWeightLossType(category) && resolvedEntryType === 'pickup' && quantity && parseInt(quantity) > 0 ? parseInt(quantity) : 0;
    if (wlPickupQty > 0) {
      // Extract per-injection dose from pickup dosage (e.g., "4 week supply @ 2mg" → "2mg")
      const pickupDosage = dosage || '';
      const atMatch = pickupDosage.match(/@\s*(.+)/);
      const injectionDose = atMatch ? atMatch[1].trim() : pickupDosage;

      const injectionLogs = [];
      for (let i = 0; i < wlPickupQty; i++) {
        const injDate = new Date(logDate + 'T12:00:00');
        injDate.setDate(injDate.getDate() + i * 7);
        const injDateStr = injDate.toISOString().split('T')[0];
        const injLogData = {
          patient_id,
          category,
          entry_type: 'injection',
          entry_date: injDateStr,
          medication: medication || null,
          dosage: injectionDose || null,
          weight: null,
          quantity: 1,
          notes: `Dispensed on ${logDate} (${wlPickupQty}-injection pickup, week ${i + 1} of ${wlPickupQty})`,
          protocol_id: protocol_id || null,
          administered_by: administered_by || null,
          fulfillment_method: fulfillment_method || 'in_clinic',
        };
        const { data: injLog, error: injErr } = await supabase
          .from('service_logs')
          .insert([injLogData])
          .select()
          .single();
        if (!injErr && injLog) {
          injectionLogs.push(injLog);
        } else {
          console.error(`[service-log] Failed to create WL injection entry for ${injDateStr}:`, injErr);
        }
      }
      console.log(`[service-log] Created ${injectionLogs.length} injection entries from WL pickup (qty ${wlPickupQty})`);
    }

    // ── HRT pickup: auto-create injection entries for each prefilled syringe ──
    // When an HRT medication pickup is logged (e.g. 3 prefilled syringes), create individual
    // injection entries dated to the patient's actual injection schedule (2x/week = Mon/Thu pattern).
    const isHRTPickup = category === 'testosterone' && resolvedEntryType === 'pickup' && quantity && parseInt(quantity) > 0;
    const hrtPickupQty = isHRTPickup ? parseInt(quantity) : 0;
    const hrtInjectionLogs = [];

    if (hrtPickupQty > 0) {
      // Extract per-injection dose from pickup dosage (e.g. "3 prefilled @ 0.35ml/70mg" → "0.35ml/70mg")
      const pickupDosage = dosage || '';
      const atMatch = pickupDosage.match(/@\s*(.+)/);
      const injectionDose = atMatch ? atMatch[1].trim() : pickupDosage;

      // Calculate injection dates based on frequency
      // 2x/week: alternating 3-day and 4-day gaps (Mon→Thu→Mon→Thu...)
      // 3x/week: 2, 2, 3 pattern (MWF)
      // daily: every day
      const freq = injection_frequency ? parseInt(injection_frequency) : 2;

      let dayOffset = 0;
      let useShortGap = true; // Start with short gap (3 days for 2x/week)

      for (let i = 0; i < hrtPickupQty; i++) {
        if (freq >= 7) {
          dayOffset += 1; // daily
        } else if (freq === 3) {
          const gaps = [2, 2, 3]; // MWF pattern
          dayOffset += gaps[i % 3];
        } else {
          // 2x/week: 3, 4 alternating (Mon→Thu = 3 days, Thu→Mon = 4 days)
          dayOffset += useShortGap ? 3 : 4;
          useShortGap = !useShortGap;
        }

        const injDate = new Date(logDate + 'T12:00:00');
        injDate.setDate(injDate.getDate() + dayOffset);
        const injDateStr = injDate.toISOString().split('T')[0];

        const injLogData = {
          patient_id,
          category,
          entry_type: 'injection',
          entry_date: injDateStr,
          medication: medication || null,
          dosage: injectionDose || null,
          quantity: 1,
          notes: `Take-home injection (dispensed ${logDate}, ${hrtPickupQty}-syringe pickup, ${i + 1} of ${hrtPickupQty})`,
          protocol_id: protocol_id || null,
          injection_method: injection_method || null,
          fulfillment_method: 'take_home',
        };

        const { data: injLog, error: injErr } = await supabase
          .from('service_logs')
          .insert([injLogData])
          .select()
          .single();

        if (!injErr && injLog) {
          hrtInjectionLogs.push(injLog);
        } else {
          console.error(`[service-log] Failed to create HRT injection entry for ${injDateStr}:`, injErr);
        }
      }
      console.log(`[service-log] Created ${hrtInjectionLogs.length} injection entries from HRT pickup (qty ${hrtPickupQty})`);
    }

    // 1b. Auto-decrement recovery enrollment if patient has one for this category
    let recoveryUpdate = null;
    if (['hbot', 'red_light'].includes(category) && resolvedEntryType === 'session') {
      try {
        const { data: activeEnrollments } = await supabase
          .from('recovery_enrollments')
          .select('id, modality_preference, sessions_used, sessions_allowed, recovery_offers(offer_type)')
          .eq('patient_id', patient_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (activeEnrollments && activeEnrollments.length > 0) {
          // Find the enrollment whose modality matches this category
          const matchingEnrollment = activeEnrollments.find(e => {
            if (e.modality_preference === 'COMBINED') return true; // matches both
            if (e.modality_preference === 'HBOT_ONLY' && category === 'hbot') return true;
            if (e.modality_preference === 'RLT_ONLY' && category === 'red_light') return true;
            return false;
          });

          if (matchingEnrollment && matchingEnrollment.sessions_used < matchingEnrollment.sessions_allowed) {
            // For COMBINED: only count as 1 Recovery Session when BOTH hbot+rlt logged same day
            // We increment on the first one logged, skip on the second
            let shouldIncrement = true;
            if (matchingEnrollment.modality_preference === 'COMBINED') {
              const otherCategory = category === 'hbot' ? 'red_light' : 'hbot';
              const { data: sameDayOther } = await supabase
                .from('service_logs')
                .select('id')
                .eq('patient_id', patient_id)
                .eq('entry_date', logDate)
                .eq('category', otherCategory)
                .eq('entry_type', 'session')
                .limit(1);
              // If the other modality was already logged today, don't increment again
              if (sameDayOther && sameDayOther.length > 0) {
                shouldIncrement = false;
              }
            }

            if (shouldIncrement) {
              const newUsed = matchingEnrollment.sessions_used + 1;
              const updateData = { sessions_used: newUsed, updated_at: new Date().toISOString() };
              if (newUsed >= matchingEnrollment.sessions_allowed && matchingEnrollment.recovery_offers?.offer_type !== 'MEMBERSHIP') {
                updateData.status = 'completed';
              }
              await supabase
                .from('recovery_enrollments')
                .update(updateData)
                .eq('id', matchingEnrollment.id);

              recoveryUpdate = {
                enrollment_id: matchingEnrollment.id,
                sessions_used: newUsed,
                sessions_allowed: matchingEnrollment.sessions_allowed,
              };
            }
          }
        }
      } catch (recoveryErr) {
        console.error('[service-log] Recovery enrollment update error (non-fatal):', recoveryErr.message);
      }
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

    if (resolvedEntryType === 'pickup' && is_secondary_med && protocol_id) {
      // Secondary medication pickup (e.g. HCG on an HRT protocol) — update secondary_medication_details JSONB
      protocolUpdate = await syncSecondaryMedPickup(protocol_id, medication, logDate, secondary_med_details);
    } else if (resolvedEntryType === 'pickup') {
      // For primary pickups, update last_refill_date and medication details on protocol
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

    // Final safety: count-based sessions_used sync
    // Always recalculate from actual service_log count to prevent drift from multiple increment paths
    if (targetProtocolId && (resolvedEntryType === 'injection' || resolvedEntryType === 'session')) {
      const { count: actualCount } = await supabase
        .from('service_logs')
        .select('*', { count: 'exact', head: true })
        .eq('protocol_id', targetProtocolId)
        .in('entry_type', ['injection', 'session']);

      await supabase
        .from('protocols')
        .update({ sessions_used: actualCount || 0 })
        .eq('id', targetProtocolId);

      console.log(`[service-log] Count-based sync: sessions_used=${actualCount} for protocol ${targetProtocolId}`);
    }

    // HRT pickup: sync sessions_used and link auto-created injection entries to the protocol
    // The pickup itself doesn't increment sessions_used, but the auto-created injection entries should count.
    if (hrtPickupQty > 0 && hrtInjectionLogs.length > 0) {
      const hrtProtocolId = targetProtocolId || protocolUpdate?.protocol_id;
      if (hrtProtocolId) {
        // Link auto-created injection entries to the protocol (in case protocol_id wasn't known at creation)
        const injLogIds = hrtInjectionLogs.map(l => l.id);
        await supabase
          .from('service_logs')
          .update({ protocol_id: hrtProtocolId })
          .in('id', injLogIds);

        // Recount all injection/session entries for this protocol
        const { count: hrtCount } = await supabase
          .from('service_logs')
          .select('*', { count: 'exact', head: true })
          .eq('protocol_id', hrtProtocolId)
          .in('entry_type', ['injection', 'session']);

        await supabase
          .from('protocols')
          .update({ sessions_used: hrtCount || 0, updated_at: new Date().toISOString() })
          .eq('id', hrtProtocolId);

        // Update next_expected_date to after the last auto-created injection
        const lastHrtInjDate = hrtInjectionLogs[hrtInjectionLogs.length - 1].entry_date;
        const freq = injection_frequency ? parseInt(injection_frequency) : 2;
        const nextGapDays = freq >= 7 ? 1 : freq === 3 ? 2 : (hrtPickupQty % 2 === 1 ? 4 : 3);
        const nextAfterLast = new Date(lastHrtInjDate + 'T12:00:00');
        nextAfterLast.setDate(nextAfterLast.getDate() + nextGapDays);

        await supabase
          .from('protocols')
          .update({ next_expected_date: nextAfterLast.toISOString().split('T')[0] })
          .eq('id', hrtProtocolId);

        console.log(`[service-log] HRT pickup sync: sessions_used=${hrtCount}, next_expected=${nextAfterLast.toISOString().split('T')[0]} for protocol ${hrtProtocolId}`);
      }
    }

    return res.status(200).json({
      success: true,
      log,
      package_update: packageUpdate,
      protocol_update: protocolUpdate,
      recovery_update: recoveryUpdate,
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
      entry_date: entry_date || null,
      medication: medication || null,
      dosage: dosage || null,
      weight: weight ? parseFloat(weight) : null,
      quantity: quantity ? parseInt(quantity) : null,
      supply_type: supply_type || null,
      duration: duration ? parseInt(duration) : null,
      notes: notes || null,
    };

    // Only update entry_type if explicitly provided — don't default to 'injection'
    if (entry_type) {
      updateData.entry_type = entry_type;
    }

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

// Recalculate protocol state after an edit (date/weight/dose change)
// Counts actual injection/session entries — single source of truth for sessions_used
async function recalcProtocolAfterEdit(protocolId) {
  try {
    // Count injection/session entries (same pattern as recalcProtocolAfterDelete)
    const { count: sessionsUsed } = await supabase
      .from('service_logs')
      .select('*', { count: 'exact', head: true })
      .eq('protocol_id', protocolId)
      .in('entry_type', ['injection', 'session']);

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
      sessions_used: sessionsUsed || 0,
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

    console.log(`✓ Protocol ${protocolId} recalculated after edit: sessions_used=${sessionsUsed}, last_visit=${lastDate}`);
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

  // For weight loss pickups, don't increment sessions_used — pickups are fulfillment events,
  // not actual injections. sessions_used should only track injections taken.
  if (category === 'weight_loss' && (entry_type === 'pickup' || entry_type === 'med_pickup')) {
    return { no_package: true, reason: 'Weight loss pickups do not decrement sessions' };
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
// SECONDARY MEDICATION PICKUP SYNCING
// ============================================

// Default refill intervals for secondary medications (days)
const SECONDARY_MED_REFILL_DAYS = {
  'HCG': 90,           // ~3 months (1 vial/month × 3 vials)
  'Gonadorelin': 30,   // ~1 month per vial
  'Nandrolone': 90,    // ~3 months
};

async function syncSecondaryMedPickup(protocolId, medication, logDate, details = {}) {
  try {
    // Fetch current secondary_medication_details from protocol
    const { data: protocol, error: fetchErr } = await supabase
      .from('protocols')
      .select('id, secondary_medications, secondary_medication_details')
      .eq('id', protocolId)
      .single();

    if (fetchErr || !protocol) {
      console.error('syncSecondaryMedPickup: protocol not found', fetchErr);
      return { updated: false, reason: 'Protocol not found' };
    }

    // Parse existing details
    let existingDetails = [];
    if (protocol.secondary_medication_details) {
      existingDetails = typeof protocol.secondary_medication_details === 'string'
        ? JSON.parse(protocol.secondary_medication_details)
        : protocol.secondary_medication_details;
    }

    // Calculate next_expected_date
    const numVials = details.num_vials || 1;
    const defaultRefillDays = SECONDARY_MED_REFILL_DAYS[medication] || 90;
    // Scale refill interval by number of vials (1 vial = 30 days for HCG)
    const perVialDays = defaultRefillDays / 3; // HCG default is 90 for 3 vials
    const refillDays = Math.round(numVials * perVialDays);
    const nextDate = new Date(logDate + 'T12:00:00');
    nextDate.setDate(nextDate.getDate() + refillDays);
    const nextExpected = nextDate.toISOString().split('T')[0];

    // Build the updated entry for this medication
    const updatedEntry = {
      medication,
      supply_type: details.supply_type || 'vial',
      num_vials: numVials,
      dosage: details.dosage || null,
      frequency: details.frequency || null,
      last_refill_date: logDate,
      next_expected_date: nextExpected,
    };

    // Upsert: replace existing entry for this medication, or add new
    const idx = existingDetails.findIndex(d => d.medication === medication);
    if (idx >= 0) {
      existingDetails[idx] = updatedEntry;
    } else {
      existingDetails.push(updatedEntry);
    }

    // Also ensure the medication is in secondary_medications array
    let secMeds = [];
    if (protocol.secondary_medications) {
      secMeds = typeof protocol.secondary_medications === 'string'
        ? JSON.parse(protocol.secondary_medications)
        : protocol.secondary_medications;
    }
    if (!secMeds.includes(medication)) {
      secMeds.push(medication);
    }

    // Update protocol
    const { error: updateErr } = await supabase
      .from('protocols')
      .update({
        secondary_medication_details: existingDetails,
        secondary_medications: JSON.stringify(secMeds),
        updated_at: new Date().toISOString(),
      })
      .eq('id', protocolId);

    if (updateErr) {
      console.error('syncSecondaryMedPickup: update failed', updateErr);
      return { updated: false, reason: updateErr.message };
    }

    console.log(`✓ Secondary med pickup: ${medication} × ${numVials} vials on ${logDate}, next refill ${nextExpected}`);
    return {
      updated: true,
      protocol_id: protocolId,
      medication,
      next_expected_date: nextExpected,
    };
  } catch (err) {
    console.error('syncSecondaryMedPickup error:', err);
    return { updated: false, reason: err.message };
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
      .select('id, last_refill_date, supply_type, end_date, dose_per_injection, injections_per_week')
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
    // NOTE: Do NOT overwrite protocol.delivery_method here.
    // The protocol's delivery_method tracks HOW the patient receives meds (take_home, in_clinic, overnight).
    // The pickup's delivery_method tracks WHAT was picked up (vial_10ml, prefilled_2week, etc.)
    // and is already stored on the service_log entry. Overwriting causes the protocol to
    // disappear from the Medications admin page which filters on delivery_method = 'take_home'.
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
      } else if (supply_type && (supply_type === 'prefilled' || supply_type.startsWith('prefilled_')) && quantity) {
        // Prefilled syringes: walk the injection schedule to find the NEXT injection date after supply runs out
        // For 2x/week (Mon/Thu), 3 injections cover days +3, +7, +10 — next needed at day +14
        const ipw = parseInt(protocol.injection_frequency) || 2;
        let dayOff = 0;
        let shortGap = true;
        for (let i = 0; i < quantity + 1; i++) { // +1 to get NEXT injection date
          if (ipw >= 7) { dayOff += 1; }
          else if (ipw === 3) { dayOff += [2, 2, 3][i % 3]; }
          else { dayOff += shortGap ? 3 : 4; shortGap = !shortGap; }
        }
        daysUntilNext = dayOff;
      } else if (supply_type === 'vial_5ml') {
        // Calculate from actual dose if available, otherwise default
        const dpi = parseFloat(protocol.dose_per_injection);
        const ipw = parseInt(protocol.injections_per_week);
        if (dpi > 0 && ipw > 0) {
          daysUntilNext = Math.round(5.0 / (dpi * ipw) * 7);
        } else {
          daysUntilNext = 70; // ~10 weeks default for 5ml vial
        }
      } else if (supply_type === 'vial_10ml' || supply_type === 'vial') {
        // Calculate from actual dose if available, otherwise default
        const dpi = parseFloat(protocol.dose_per_injection);
        const ipw = parseInt(protocol.injections_per_week);
        if (dpi > 0 && ipw > 0) {
          daysUntilNext = Math.round(10.0 / (dpi * ipw) * 7);
        } else {
          daysUntilNext = 70; // ~10 weeks default for 10ml vial
        }
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
      // Don't overwrite program_name — it's standardized to "Weight Loss Protocol", "HRT Protocol", etc.
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
    } else if (supply_type && (supply_type === 'prefilled' || supply_type.startsWith('prefilled_')) && quantity) {
      // Prefilled syringes: walk the 2x/week schedule to find next injection date after supply runs out
      let dayOff = 0;
      let shortGap = true;
      for (let i = 0; i < quantity + 1; i++) {
        dayOff += shortGap ? 3 : 4;
        shortGap = !shortGap;
      }
      daysUntilNext = dayOff;
    } else if (supply_type === 'vial_10ml' || supply_type === 'vial') {
      daysUntilNext = 70;
    }

    const nextDate = new Date(pickupDate);
    nextDate.setDate(nextDate.getDate() + daysUntilNext);

    // Determine HRT type from medication name
    const isHRT = programType === 'hrt';
    const isFemale = isHRT && medication && medication.toLowerCase().includes('100mg');
    const hrtType = isHRT ? (isFemale ? 'female' : 'male') : null;

    const isWL = isWeightLossType(programType);
    const result = await createProtocol({
      patient_id,
      program_type: isWL ? 'weight_loss' : programType,
      program_name: isHRT ? 'HRT Protocol' : isWL ? 'Weight Loss Protocol' : (medication || getCategoryDisplayName(category)),
      medication: medication || null,
      selected_dose: dosage || null,
      frequency: isWL ? 'Weekly' : null,
      start_date: logDate,
      end_date: nextDate.toISOString().split('T')[0],
      last_refill_date: logDate,
      last_visit_date: logDate,
      next_expected_date: nextDate.toISOString().split('T')[0],
      supply_type: supply_type || null,
      hrt_type: hrtType,
      secondary_medications: isHRT ? '[]' : null,
    }, {
      source: 'service-log',
      skipDuplicateCheck: true, // service log fallback — protocol should exist but doesn't
    });

    if (!result.success) {
      console.error('Error creating protocol:', result.error);
      return { created: false, reason: 'Error creating protocol' };
    }

    return {
      created: true,
      protocol_id: result.protocol.id,
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

    const isWLSession = isWeightLossType(programType);
    const result = await createProtocol({
      patient_id,
      program_type: isWLSession ? 'weight_loss' : programType,
      program_name: isHRT ? 'HRT Protocol' : isWLSession ? 'Weight Loss Protocol' : (medication || getCategoryDisplayName(category)),
      medication: medication || null,
      selected_dose: dosage || null,
      frequency: isWLSession ? 'Weekly' : null,
      start_date: logDate,
      last_visit_date: logDate,
      next_expected_date: nextExpectedDate,
      delivery_method: 'in_clinic',
      sessions_used: 1,
      hrt_type: hrtTypeSession,
      secondary_medications: isHRT ? '[]' : null,
    }, {
      source: 'service-log',
      skipDuplicateCheck: true,
    });

    if (!result.success) {
      console.error('Error creating protocol:', result.error);
      return { created: false, reason: 'Error creating protocol' };
    }

    return {
      created: true,
      protocol_id: result.protocol.id,
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
    'weight_loss': 'Weight Loss Protocol',
    'vitamin': 'Vitamin Injections',
    'peptide': 'Peptide Protocol',
    'iv_therapy': 'IV Therapy',
    'hbot': 'Hyperbaric Oxygen Therapy',
    'red_light': 'Red Light Therapy',
    'supplement': 'Supplement / Product'
  };
  return names[category] || category;
}
