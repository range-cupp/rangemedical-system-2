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

  if ((protocolType || '').includes('weight_loss')) {
    const days = pickupFrequency || 28;
    start.setDate(start.getDate() + days);
    return start.toISOString().split('T')[0];
  }
  if ((protocolType || '').includes('hrt')) {
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
  injection_pack: 'injection',
  peptide: 'peptide',
  vials: 'peptide',
  combo_membership: 'combo_membership',
};

// Categories that should be skipped
const SKIP_CATEGORIES = ['custom', 'assessment', 'programs'];

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
function buildProtocolData(protocolType, serviceName, patientId, opts = {}) {
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
      // Parse the actual medication name from the service name
      // "Retatrutide — Monthly (One-Time) — 4 mg/week x2" → "Retatrutide"
      let wlMedication = opts.medication || serviceName;
      if (!opts.medication) {
        const parts = (serviceName || '').split('—').map(s => s.trim());
        if (parts.length >= 2) {
          wlMedication = parts[0].trim();
        } else {
          const lower = (serviceName || '').toLowerCase();
          if (lower.includes('semaglutide')) wlMedication = 'Semaglutide';
          else if (lower.includes('tirzepatide')) wlMedication = 'Tirzepatide';
          else if (lower.includes('retatrutide')) wlMedication = 'Retatrutide';
        }
      }

      // Parse quantity multiplier from name: "x2" means 2 months, "x3" means 3 months
      const qtyMatch = (serviceName || '').match(/x(\d+)/i);
      const months = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const totalSessions = months * 4; // 4 weekly injections per month
      const durationDays = months * 28;

      // Find the first dose for this medication from WEIGHT_LOSS_DOSAGES
      const doses = WEIGHT_LOSS_DOSAGES[wlMedication];
      const startingDose = doses ? doses[0] : null;

      // Parse dose from service name if available: "4 mg/week" → "4mg"
      let parsedDose = startingDose;
      const doseMatch = (serviceName || '').match(/(\d+(?:\.\d+)?)\s*mg\/week/i);
      if (doseMatch) parsedDose = `${doseMatch[1]}mg`;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      return {
        ...base,
        program_name: `Weight Loss - ${wlMedication}`,
        medication: wlMedication,
        selected_dose: parsedDose,
        starting_dose: parsedDose || startingDose,
        frequency: 'Weekly',
        delivery_method: 'take_home',
        total_sessions: totalSessions,
        sessions_used: 0,
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'weight_loss', startDate: today, pickupFrequency: 28 }),
      };
    }

    case 'hrt': {
      const hrtEnd = new Date();
      hrtEnd.setDate(hrtEnd.getDate() + 30);
      return {
        ...base,
        program_name: 'HRT Protocol',
        medication: serviceName,
        frequency: '2x per week',
        delivery_method: 'take_home',
        end_date: hrtEnd.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'hrt', startDate: today }),
      };
    }

    case 'hbot': {
      // Check if this is a membership (vs session pack)
      const isHbotMembership = (serviceName || '').toLowerCase().includes('membership');
      if (isHbotMembership) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        return {
          ...base,
          program_name: 'Hyperbaric Recovery Membership',
          total_sessions: 4,
          sessions_used: 0,
          delivery_method: 'in_clinic',
          end_date: endDate.toISOString().split('T')[0],
          next_expected_date: calculateNextExpectedDate({ protocolType: 'hbot', startDate: today }),
        };
      }
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
      // Check if this is a membership (vs session pack)
      const isRltMembership = (serviceName || '').toLowerCase().includes('membership');
      if (isRltMembership) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        return {
          ...base,
          program_name: 'Red Light Reset Membership',
          total_sessions: 12,
          sessions_used: 0,
          delivery_method: 'in_clinic',
          end_date: endDate.toISOString().split('T')[0],
          next_expected_date: calculateNextExpectedDate({ protocolType: 'rlt', startDate: today }),
        };
      }
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
      endDate.setDate(endDate.getDate() + sessions * 7);
      return {
        ...base,
        program_name: sessions > 1 ? `IV Therapy - ${sessions} Pack` : serviceName,
        medication: serviceName,
        total_sessions: sessions,
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
      // Detect if this is a vial purchase: "Tesamorelin / Ipamorelin Vial" or "GLOW Vial"
      const isVialPurchase = (serviceName || '').toLowerCase().includes('vial');

      let peptideMed = serviceName;
      if (isVialPurchase) {
        // Strip "Vial" suffix to get peptide name
        peptideMed = (serviceName || '').replace(/\s*Vial\s*/i, '').trim();
      } else {
        // Parse from prefilled format: "Peptide Protocol — 10 Day — BPC-157 (500mcg)" → "BPC-157"
        const parts = (serviceName || '').split('—').map(s => s.trim());
        if (parts.length >= 3) {
          const peptidePart = parts.slice(2).join(' — ');
          const parenMatch = peptidePart.match(/^(.+?)\s*\((.+)\)$/);
          peptideMed = parenMatch ? parenMatch[1].trim() : peptidePart;
        }
      }

      const peptideInfo = findPeptideInfo(peptideMed);
      const method = opts.deliveryMethod || 'take_home';

      if (isVialPurchase) {
        // Vial purchase — create protocol with num_vials=1, staff edits doses_per_vial later
        return {
          ...base,
          program_name: `Peptide Vial - ${peptideMed}`,
          medication: peptideMed,
          selected_dose: peptideInfo?.startingDose || null,
          frequency: peptideInfo?.frequency || null,
          delivery_method: 'take_home',
          num_vials: 1,
          doses_per_vial: null, // Staff sets this when starting the protocol
          duration_days: 30,
          total_sessions: null, // Calculated when doses_per_vial is set
          sessions_used: 0,
          end_date: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
          next_expected_date: calculateNextExpectedDate({ protocolType: 'peptide', startDate: today }),
          initial_journey_stage: 'dispensed',
          peptide_reminders_enabled: true,
        };
      }

      // Non-vial peptide (prefilled syringes)
      const duration = opts.durationDays || parseInt((serviceName || '').match(/(\d+)\s*Day/i)?.[1]) || 30;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      return {
        ...base,
        program_name: `Peptide - ${peptideMed}`,
        medication: peptideMed,
        selected_dose: peptideInfo?.startingDose || null,
        frequency: peptideInfo?.frequency || null,
        delivery_method: method,
        duration_days: duration,
        total_sessions: method === 'in_clinic' ? duration : null,
        sessions_used: method === 'in_clinic' ? 0 : null,
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'peptide', startDate: today }),
        initial_journey_stage: 'dispensed',
        peptide_reminders_enabled: true,
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

  // For weight_loss/peptide, also match medication
  // HRT matches by type only — product name != actual medication
  if (['weight_loss', 'peptide'].includes(protocolType) && medication) {
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
      // Parse quantity multiplier: "x2" = 2 months, "x3" = 3 months
      const wlQtyMatch = (serviceName || '').match(/x(\d+)/i);
      const wlMonths = wlQtyMatch ? parseInt(wlQtyMatch[1]) : 1;
      const wlDays = wlMonths * 28;
      const wlSessions = wlMonths * 4;

      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + wlDays);
      updateData.end_date = newEnd.toISOString().split('T')[0];
      updateData.total_sessions = (protocol.total_sessions || 0) + wlSessions;
      updateData.last_refill_date = todayStr;
      updateData.next_expected_date = calculateNextExpectedDate({ protocolType: 'weight_loss', startDate: todayStr, pickupFrequency: 28 });

      // Parse dose from service name if available: "4 mg/week" → "4mg"
      const wlDoseMatch = (serviceName || '').match(/(\d+(?:\.\d+)?)\s*mg\/week/i);
      if (wlDoseMatch) {
        updateData.selected_dose = `${wlDoseMatch[1]}mg`;
      }
      break;
    }

    case 'hrt': {
      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + 30);
      updateData.end_date = newEnd.toISOString().split('T')[0];
      updateData.last_payment_date = todayStr;
      // DO NOT update next_expected_date — that's managed by service log (pickups/injections)
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
      // Vial-based peptide: increment num_vials and recalculate
      if (protocol.doses_per_vial) {
        const newNumVials = (protocol.num_vials || 0) + 1;
        const totalDoses = newNumVials * protocol.doses_per_vial;
        const freq = (protocol.frequency || '').toLowerCase();

        // Calculate duration from total doses + frequency
        let durationDays;
        if (freq.includes('5 on') || freq.includes('5on')) {
          durationDays = Math.ceil(totalDoses / 5) * 7;
        } else if (freq.includes('every other') || freq.includes('eod')) {
          durationDays = totalDoses * 2;
        } else {
          // Default: daily
          durationDays = totalDoses;
        }

        const protocolStart = protocol.start_date ? new Date(protocol.start_date + 'T12:00:00') : today;
        const newEnd = new Date(protocolStart);
        newEnd.setDate(newEnd.getDate() + durationDays);

        updateData.num_vials = newNumVials;
        updateData.total_sessions = totalDoses;
        updateData.end_date = newEnd.toISOString().split('T')[0];
      } else {
        // Non-vial peptide: extend by 30 days
        const newEnd = new Date(startFrom);
        newEnd.setDate(newEnd.getDate() + 30);
        updateData.end_date = newEnd.toISOString().split('T')[0];
      }
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
  if ((protocolType || '').includes('weight_loss')) {
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
export async function autoCreateOrExtendProtocol({ patientId, serviceCategory, serviceName, purchaseId, deliveryMethod, durationDays }) {
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

    // Single IVs don't need protocols — only packs/memberships do
    if (protocolType === 'iv') {
      const lower = (serviceName || '').toLowerCase();
      if (!lower.includes('pack') && !lower.includes('membership')) {
        console.log(`Auto-protocol: skipping single IV "${serviceName}" (no protocol needed)`);
        return;
      }
    }

    // Handle combo memberships — create two separate protocols (HBOT + RLT)
    if (protocolType === 'combo_membership') {
      // Parse frequency from product name (1x/2x/3x)
      const lower = (serviceName || '').toLowerCase();
      let hbotSessions = 4, rltSessions = 4;
      if (lower.includes('3x')) { hbotSessions = 12; rltSessions = 12; }
      else if (lower.includes('2x')) { hbotSessions = 8; rltSessions = 8; }

      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const endDateStr = endDate.toISOString().split('T')[0];

      // Create HBOT protocol
      const { data: hbotProto, error: hbotErr } = await supabase
        .from('protocols')
        .insert({
          patient_id: patientId,
          program_name: `Combo Membership — HBOT`,
          program_type: 'hbot',
          total_sessions: hbotSessions,
          sessions_used: 0,
          delivery_method: 'in_clinic',
          status: 'active',
          start_date: today,
          end_date: endDateStr,
          next_expected_date: calculateNextExpectedDate({ protocolType: 'hbot', startDate: today }),
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (hbotErr) console.error('Auto-protocol: combo HBOT create error:', hbotErr);

      // Create RLT protocol
      const { data: rltProto, error: rltErr } = await supabase
        .from('protocols')
        .insert({
          patient_id: patientId,
          program_name: `Combo Membership — RLT`,
          program_type: 'rlt',
          total_sessions: rltSessions,
          sessions_used: 0,
          delivery_method: 'in_clinic',
          status: 'active',
          start_date: today,
          end_date: endDateStr,
          next_expected_date: calculateNextExpectedDate({ protocolType: 'rlt', startDate: today }),
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (rltErr) console.error('Auto-protocol: combo RLT create error:', rltErr);

      // Link purchase to HBOT protocol only (avoid duplicate linking)
      if (hbotProto?.id && purchaseId) {
        await supabase
          .from('purchases')
          .update({ protocol_id: hbotProto.id, protocol_created: true })
          .eq('id', purchaseId);
      }

      console.log(`Auto-protocol: created combo membership protocols (HBOT: ${hbotProto?.id}, RLT: ${rltProto?.id}) for patient ${patientId}`);
      return;
    }

    // Determine medication for matching
    // HRT matches by type only (not medication) — product name like "HRT Monthly Membership"
    // doesn't match actual medication like "Testosterone Cypionate"
    let medication = ['weight_loss', 'peptide'].includes(protocolType) ? serviceName : null;

    // For weight loss, parse actual medication name from product name
    // "Retatrutide — Monthly (One-Time) — 4 mg/week x2 ($75 off)" → "Retatrutide"
    // "Weight Loss Program" with no dash → check known medication names
    if (protocolType === 'weight_loss' && serviceName) {
      const parts = serviceName.split('—').map(s => s.trim());
      if (parts.length >= 2) {
        // First part is the medication name: "Retatrutide", "Semaglutide", "Tirzepatide"
        medication = parts[0].trim();
      } else {
        // No dashes — check if name contains a known WL medication
        const lower = serviceName.toLowerCase();
        if (lower.includes('semaglutide')) medication = 'Semaglutide';
        else if (lower.includes('tirzepatide')) medication = 'Tirzepatide';
        else if (lower.includes('retatrutide')) medication = 'Retatrutide';
        // else keep full serviceName as fallback
      }
    }

    // For peptides, parse actual medication name from product name
    // "Peptide Protocol — 10 Day — BPC-157 (500mcg)" → "BPC-157"
    if (protocolType === 'peptide' && serviceName) {
      const parts = serviceName.split('—').map(s => s.trim());
      if (parts.length >= 3) {
        const peptidePart = parts.slice(2).join(' — ');
        const parenMatch = peptidePart.match(/^(.+?)\s*\((.+)\)$/);
        medication = parenMatch ? parenMatch[1].trim() : peptidePart;
      }
    }

    // Check for existing active protocol
    const existing = await findExistingProtocol(patientId, protocolType, medication);

    let protocolId;

    if (existing) {
      // Extend existing protocol
      protocolId = await extendProtocol(existing, protocolType, serviceName);
      console.log(`Auto-protocol: extended ${protocolType} protocol ${protocolId} for patient ${patientId}`);
    } else {
      // Create new protocol
      const protocolData = buildProtocolData(protocolType, serviceName, patientId, { deliveryMethod, durationDays, medication });
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
