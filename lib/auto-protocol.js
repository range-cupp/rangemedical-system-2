// Auto-Create or Extend Protocol After POS Charge
// Maps POS service categories to protocol types and creates/extends protocols automatically
// Range Medical - 2026-02-24

import { createClient } from '@supabase/supabase-js';
import { findPeptideInfo, WEIGHT_LOSS_DOSAGES } from './protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ================================================================
// NEXT EXPECTED DATE CALCULATION
// Single source of truth — reused by assign.js, extend-wl.js, and buildProtocolData/extendProtocol below
// ================================================================
export function calculateNextExpectedDate({ protocolType, startDate, supplyType, pickupFrequency }) {
  if (!startDate || protocolType === 'labs') return null;
  const start = new Date(startDate + 'T12:00:00');

  if (protocolType === 'weight_loss') {
    const days = pickupFrequency || 28;
    start.setDate(start.getDate() + days);
    return start.toISOString().split('T')[0];
  }
  if (protocolType === 'hrt') {
    const supplyDays = { prefilled_1week: 7, prefilled_2week: 14, prefilled_4week: 28, vial_5ml: 70, vial_10ml: 140 };
    start.setDate(start.getDate() + (supplyDays[supplyType] || 30));
    return start.toISOString().split('T')[0];
  }
  if (protocolType === 'peptide') {
    start.setDate(start.getDate() + 30);
    return start.toISOString().split('T')[0];
  }
  // In-clinic types (hbot, rlt, iv, injection) — default weekly
  start.setDate(start.getDate() + 7);
  return start.toISOString().split('T')[0];
}

// ================================================================
// CATEGORY → PROTOCOL TYPE MAPPING
// ================================================================
const CATEGORY_TO_PROTOCOL = {
  labs: 'labs',
  lab_panels: 'labs',
  hbot: 'hbot',
  red_light: 'rlt',
  hrt: 'hrt',
  weight_loss: 'weight_loss',
  iv_therapy: 'iv',
  specialty_iv: 'iv',
  injection_standard: 'injection',
  injection_premium: 'injection',
  injection_pack: 'injection',
  nad_injection: 'injection',
  peptide: 'peptide',
};

// Categories that should be skipped
const SKIP_CATEGORIES = ['custom', 'assessment', 'programs', 'combo_membership'];

// For the 'regenerative' category (from seed data), parse the service name
function resolveRegenerativeType(serviceName) {
  const lower = (serviceName || '').toLowerCase();
  if (lower.includes('hbot')) return 'hbot';
  if (lower.includes('red light') || lower.includes('rlt')) return 'rlt';
  return null;
}

// ================================================================
// SESSION COUNT PARSING
// ================================================================
function parseSessionCount(serviceName) {
  const match = (serviceName || '').match(/(\d+)[- ]?Pack/i);
  return match ? parseInt(match[1], 10) : 1;
}

// ================================================================
// PROTOCOL DEFAULTS BY TYPE
// ================================================================
function buildProtocolData(protocolType, serviceName, patientId) {
  const today = new Date().toISOString().split('T')[0];
  const sessions = parseSessionCount(serviceName);

  const base = {
    patient_id: patientId,
    program_type: protocolType,
    status: 'active',
    start_date: today,
    created_at: new Date().toISOString(),
  };

  switch (protocolType) {
    case 'weight_loss': {
      // Find the first dose for this medication from WEIGHT_LOSS_DOSAGES
      const doses = WEIGHT_LOSS_DOSAGES[serviceName];
      const startingDose = doses ? doses[0] : null;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 28);
      return {
        ...base,
        program_name: `Weight Loss - ${serviceName}`,
        medication: serviceName,
        selected_dose: startingDose,
        starting_dose: startingDose,
        frequency: 'Weekly',
        delivery_method: 'take_home',
        total_sessions: 4,
        sessions_used: 0,
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'weight_loss', startDate: today, pickupFrequency: 28 }),
      };
    }

    case 'hrt': {
      return {
        ...base,
        program_name: `HRT - ${serviceName}`,
        medication: serviceName,
        frequency: '2x per week',
        delivery_method: 'take_home',
        next_expected_date: calculateNextExpectedDate({ protocolType: 'hrt', startDate: today }),
      };
    }

    case 'hbot': {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + sessions * 7);
      return {
        ...base,
        program_name: sessions > 1 ? `HBOT - ${sessions} Pack` : 'HBOT Session',
        total_sessions: sessions,
        sessions_used: 0,
        delivery_method: 'in_clinic',
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'hbot', startDate: today }),
      };
    }

    case 'rlt': {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + sessions * 7);
      return {
        ...base,
        program_name: sessions > 1 ? `Red Light Therapy - ${sessions} Pack` : 'Red Light Therapy',
        total_sessions: sessions,
        sessions_used: 0,
        delivery_method: 'in_clinic',
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'rlt', startDate: today }),
      };
    }

    case 'iv': {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      return {
        ...base,
        program_name: serviceName,
        medication: serviceName,
        total_sessions: 1,
        sessions_used: 0,
        delivery_method: 'in_clinic',
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'iv', startDate: today }),
      };
    }

    case 'injection': {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + sessions * 7);
      return {
        ...base,
        program_name: sessions > 1 ? `${serviceName}` : serviceName,
        medication: serviceName,
        total_sessions: sessions,
        sessions_used: 0,
        delivery_method: 'in_clinic',
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'injection', startDate: today }),
      };
    }

    case 'peptide': {
      const peptideInfo = findPeptideInfo(serviceName);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      return {
        ...base,
        program_name: `Peptide - ${serviceName}`,
        medication: serviceName,
        selected_dose: peptideInfo?.startingDose || null,
        frequency: peptideInfo?.frequency || null,
        delivery_method: 'take_home',
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'peptide', startDate: today }),
      };
    }

    case 'labs': {
      // Parse Essential vs Elite from name
      const lower = (serviceName || '').toLowerCase();
      const panelType = lower.includes('elite') ? 'elite' : 'essential';
      return {
        ...base,
        program_name: serviceName,
        medication: panelType === 'elite' ? 'Elite Panel' : 'Essential Panel',
        lab_panel_type: panelType,
        lab_stage: 'blood_draw_complete',
        delivery_method: 'in_clinic',
      };
    }

    default:
      return null;
  }
}

// ================================================================
// FIND EXISTING ACTIVE PROTOCOL
// ================================================================
async function findExistingProtocol(patientId, protocolType, medication) {
  // Labs always get a new protocol (each purchase = new lab draw)
  if (protocolType === 'labs') return null;

  let query = supabase
    .from('protocols')
    .select('*')
    .eq('patient_id', patientId)
    .eq('program_type', protocolType);

  // For weight_loss/hrt/peptide, also match medication
  if (['weight_loss', 'hrt', 'peptide'].includes(protocolType) && medication) {
    query = query.eq('medication', medication);
  }

  // Include recently expired (within 30 days) for take-home types
  if (['weight_loss', 'hrt', 'peptide'].includes(protocolType)) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query.in('status', ['active', 'expired', 'completed'])
      .or(`end_date.is.null,end_date.gte.${thirtyDaysAgo.toISOString().split('T')[0]}`);
  } else {
    query = query.eq('status', 'active');
  }

  query = query.order('created_at', { ascending: false }).limit(1);

  const { data, error } = await query;
  if (error) {
    console.error('Error finding existing protocol:', error);
    return null;
  }
  return data?.[0] || null;
}

// ================================================================
// EXTEND EXISTING PROTOCOL
// ================================================================
async function extendProtocol(protocol, protocolType, serviceName) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentEndDate = protocol.end_date ? new Date(protocol.end_date + 'T12:00:00') : today;
  const startFrom = currentEndDate < today ? today : currentEndDate;

  const updateData = {
    status: 'active',
    updated_at: new Date().toISOString(),
  };

  switch (protocolType) {
    case 'weight_loss': {
      // Add 28 days from current/today end
      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + 28);
      const additionalSessions = Math.floor(28 / 7);
      updateData.end_date = newEnd.toISOString().split('T')[0];
      updateData.total_sessions = (protocol.total_sessions || 0) + additionalSessions;
      updateData.last_refill_date = todayStr;
      updateData.next_expected_date = calculateNextExpectedDate({ protocolType: 'weight_loss', startDate: todayStr, pickupFrequency: 28 });
      break;
    }

    case 'hrt': {
      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + 30);
      updateData.end_date = newEnd.toISOString().split('T')[0];
      updateData.next_expected_date = calculateNextExpectedDate({ protocolType: 'hrt', startDate: todayStr });
      break;
    }

    case 'hbot':
    case 'rlt':
    case 'injection': {
      const newSessions = parseSessionCount(serviceName);
      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + newSessions * 7);
      updateData.total_sessions = (protocol.total_sessions || 0) + newSessions;
      updateData.end_date = newEnd.toISOString().split('T')[0];
      updateData.next_expected_date = calculateNextExpectedDate({ protocolType, startDate: todayStr });
      break;
    }

    case 'iv': {
      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + 7);
      updateData.total_sessions = (protocol.total_sessions || 0) + 1;
      updateData.end_date = newEnd.toISOString().split('T')[0];
      updateData.next_expected_date = calculateNextExpectedDate({ protocolType: 'iv', startDate: todayStr });
      break;
    }

    case 'peptide': {
      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + 30);
      updateData.end_date = newEnd.toISOString().split('T')[0];
      updateData.next_expected_date = calculateNextExpectedDate({ protocolType: 'peptide', startDate: todayStr });
      break;
    }
  }

  const { error } = await supabase
    .from('protocols')
    .update(updateData)
    .eq('id', protocol.id);

  if (error) {
    console.error('Error extending protocol:', error);
    return null;
  }

  // Create renewal log
  if (protocolType === 'weight_loss') {
    await supabase
      .from('protocol_logs')
      .insert({
        protocol_id: protocol.id,
        patient_id: protocol.patient_id,
        log_type: 'renewal',
        log_date: todayStr,
        notes: `Auto-renewed via POS purchase. New end date: ${updateData.end_date}. Sessions: ${protocol.total_sessions || 0} → ${updateData.total_sessions || protocol.total_sessions}.`,
      })
      .then(({ error: logErr }) => {
        if (logErr) console.error('Renewal log error:', logErr);
      });
  }

  return protocol.id;
}

// ================================================================
// MAIN: AUTO CREATE OR EXTEND PROTOCOL
// ================================================================
export async function autoCreateOrExtendProtocol({ patientId, serviceCategory, serviceName, purchaseId }) {
  try {
    // Skip excluded categories
    if (!serviceCategory || SKIP_CATEGORIES.includes(serviceCategory)) return;

    // Resolve protocol type
    let protocolType = CATEGORY_TO_PROTOCOL[serviceCategory];

    // Handle regenerative category by parsing service name
    if (!protocolType && serviceCategory === 'regenerative') {
      protocolType = resolveRegenerativeType(serviceName);
    }

    if (!protocolType) {
      console.log(`Auto-protocol: skipping unknown category "${serviceCategory}"`);
      return;
    }

    // Determine medication for matching
    const medication = ['weight_loss', 'hrt', 'peptide'].includes(protocolType) ? serviceName : null;

    // Check for existing active protocol
    const existing = await findExistingProtocol(patientId, protocolType, medication);

    let protocolId;

    if (existing) {
      // Extend existing protocol
      protocolId = await extendProtocol(existing, protocolType, serviceName);
      console.log(`Auto-protocol: extended ${protocolType} protocol ${protocolId} for patient ${patientId}`);
    } else {
      // Create new protocol
      const protocolData = buildProtocolData(protocolType, serviceName, patientId);
      if (!protocolData) return;

      const { data, error } = await supabase
        .from('protocols')
        .insert(protocolData)
        .select('id')
        .single();

      if (error) {
        console.error('Auto-protocol create error:', error);
        return;
      }
      protocolId = data.id;
      console.log(`Auto-protocol: created ${protocolType} protocol ${protocolId} for patient ${patientId}`);
    }

    // Link purchase to protocol
    if (protocolId && purchaseId) {
      const { error: linkErr } = await supabase
        .from('purchases')
        .update({ protocol_id: protocolId, protocol_created: true })
        .eq('id', purchaseId);

      if (linkErr) {
        console.error('Auto-protocol: error linking purchase:', linkErr);
      }
    }
  } catch (err) {
    console.error('Auto-protocol error:', err);
  }
}
