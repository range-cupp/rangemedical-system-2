// Auto-Create or Extend Protocol After POS Charge
// Maps POS service categories to protocol types and creates/extends protocols automatically
// Range Medical - 2026-02-24

import { createClient } from '@supabase/supabase-js';
import { findPeptideInfo, WEIGHT_LOSS_DOSAGES, findPeptideProduct, parseDurationFromName, parseDeliveryFromName, parsePhaseFromName, isGHPeptide, isRecoveryPeptide, getCycleConfig, calculatePeptideDurationDays, calculateProtocolDurationDays } from './protocol-config';
import { getHRTMedication } from './protocol-types';
import { createProtocol } from './create-protocol';
import { todayPacific } from './date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ================================================================
// NEXT EXPECTED DATE CALCULATION
// Single source of truth — reused by assign.js, extend-wl.js, and buildProtocolData/extendProtocol below
// ================================================================
export function calculateNextExpectedDate({ protocolType, startDate, supplyType, pickupFrequency, dosePerInjection, injectionsPerWeek }) {
  if (!startDate || protocolType === 'labs') return null;
  const start = new Date(startDate + 'T12:00:00');

  if ((protocolType || '').includes('weight_loss')) {
    const days = pickupFrequency || 28;
    start.setDate(start.getDate() + days);
    return start.toISOString().split('T')[0];
  }
  if ((protocolType || '').includes('hrt')) {
    // For vial supply types, calculate from actual dose math if available
    const dpi = parseFloat(dosePerInjection);
    const ipw = parseInt(injectionsPerWeek);
    let supplyDays;
    if ((supplyType === 'vial_10ml' || supplyType === 'vial') && dpi > 0 && ipw > 0) {
      supplyDays = Math.round(10.0 / (dpi * ipw) * 7);
    } else if (supplyType === 'vial_5ml' && dpi > 0 && ipw > 0) {
      supplyDays = Math.round(5.0 / (dpi * ipw) * 7);
    } else {
      const defaults = { prefilled_1week: 7, prefilled_2week: 14, prefilled_4week: 28, vial_5ml: 70, vial_10ml: 140 };
      supplyDays = defaults[supplyType] || 30;
    }
    start.setDate(start.getDate() + supplyDays);
    return start.toISOString().split('T')[0];
  }
  if (protocolType === 'nad_injection') {
    // NAD+ injection protocol — MWF schedule (Mon/Wed/Fri)
    // Find the next MWF date from the start date
    const dayOfWeek = start.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // MWF = days 1, 3, 5
    const mwf = [1, 3, 5];
    // Find next MWF day
    for (let offset = 1; offset <= 7; offset++) {
      const nextDay = (dayOfWeek + offset) % 7;
      if (mwf.includes(nextDay)) {
        start.setDate(start.getDate() + offset);
        return start.toISOString().split('T')[0];
      }
    }
    // Fallback: next day
    start.setDate(start.getDate() + 1);
    return start.toISOString().split('T')[0];
  }
  if (protocolType === 'peptide') {
    // Use pickupFrequency as duration if provided, otherwise default 30
    const peptideDays = pickupFrequency || 30;
    start.setDate(start.getDate() + peptideDays);
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
  injection: 'injection',
  injections: 'injection',
  injection_pack: 'injection',
  injection_standard: 'injection',
  injection_premium: 'injection',
  nad_injection: 'nad_injection',
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
// Parse WL frequency from service name: "10-day" → 10, "monthly" → 7
function parseWlFrequency(serviceName, explicitFrequency) {
  if (explicitFrequency) return explicitFrequency;
  const lower = (serviceName || '').toLowerCase();
  if (lower.includes('10-day') || lower.includes('10 day') || lower.includes('every 10')) return 10;
  return 7; // default weekly
}

function buildProtocolData(protocolType, serviceName, patientId, opts = {}, fulfillmentOpts = {}) {
  const today = new Date().toISOString().split('T')[0];
  const sessions = parseSessionCount(serviceName);

  const base = {
    patient_id: patientId,
    patient_name: opts.patientName || null,
    program_type: protocolType,
    status: 'active',
    start_date: today,
    created_at: new Date().toISOString(),
  };

  switch (protocolType) {
    case 'weight_loss': {
      const cfg = opts.wlConfig;

      // Medication: wlConfig is authoritative, then opts.medication, then parse from service name
      let wlMedication = cfg?.medication || opts.medication || serviceName;
      if (!cfg?.medication && !opts.medication) {
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

      // Injection count: wlConfig totalInjections, then parse from service name
      let injections;
      if (cfg?.totalInjections) {
        injections = cfg.totalInjections;
      } else {
        const qtyMatch = (serviceName || '').match(/x(\d+)/i);
        const isMonthlyProgram = (serviceName || '').toLowerCase().includes('monthly');
        injections = qtyMatch ? parseInt(qtyMatch[1]) : (isMonthlyProgram ? 4 : (opts.quantity || 1));
      }

      // Frequency: wlConfig, then explicit param, then parse from name
      const frequencyDays = cfg?.frequency || parseWlFrequency(serviceName, opts.wlFrequencyDays);
      const durationDays = injections * frequencyDays;

      // Dose: use the highest dose from wlConfig groups (latest in titration sequence),
      // then parse from service name, then fall back to starting dose
      let parsedDose = null;
      if (cfg?.groups?.length) {
        // Last group represents the latest/highest dose in a titration
        const lastGroup = cfg.groups[cfg.groups.length - 1];
        parsedDose = lastGroup.dose || null;
      }
      if (!parsedDose) {
        const doseMatch = (serviceName || '').match(/(\d+(?:\.\d+)?)\s*mg/i);
        if (doseMatch) parsedDose = `${doseMatch[1]}mg`;
      }
      if (!parsedDose) {
        const doses = WEIGHT_LOSS_DOSAGES[wlMedication];
        parsedDose = doses ? doses[0] : null;
      }

      // Fulfillment: wlConfig groups can have mixed fulfillment
      // If ALL groups are in_clinic → in_clinic, otherwise take_home (mixed counts as take_home)
      const isInClinicInjections = cfg?.groups?.length
        ? cfg.groups.every(g => g.fulfillment === 'in_clinic')
        : fulfillmentOpts.fulfillmentMethod === 'in_clinic_injections';

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      return {
        ...base,
        program_name: 'Weight Loss Protocol',
        medication: wlMedication,
        selected_dose: parsedDose,
        starting_dose: parsedDose,
        frequency: frequencyDays === 10 ? 'Every 10 Days' : 'Weekly',
        delivery_method: isInClinicInjections ? 'in_clinic' : 'take_home',
        total_sessions: injections,
        sessions_used: 0,
        last_refill_date: isInClinicInjections ? null : today,
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: isInClinicInjections
          ? calculateNextExpectedDate({ protocolType: 'hbot', startDate: today })
          : calculateNextExpectedDate({ protocolType: 'weight_loss', startDate: today, pickupFrequency: durationDays }),
        // _wlConfig is NOT stored in DB — used only for downstream service log creation
        _wlConfig: cfg || null,
      };
    }

    case 'hrt': {
      // Default to male HRT — gender is set properly during protocol assignment
      // end_date = subscription billing cycle (30 days from purchase)
      // next_expected_date is NOT set here — it's set when medication is actually
      // dispensed via the Dispense button, which knows the supply type + dose
      const hrtEnd = new Date();
      hrtEnd.setDate(hrtEnd.getDate() + 30);
      return {
        ...base,
        program_name: 'HRT Protocol',
        medication: getHRTMedication('male'),
        hrt_type: 'male',
        frequency: '2x per week',
        delivery_method: 'take_home',
        end_date: hrtEnd.toISOString().split('T')[0],
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

    case 'nad_injection': {
      // NAD+ injection protocol — frequency is supplied by the checkout UI;
      // defaults to MWF (3x/week) when not provided.
      const nadDoseMatch = (serviceName || '').match(/(\d+)\s*mg/i);
      const nadDose = nadDoseMatch ? `${nadDoseMatch[1]}mg` : null;
      const nadPackMatch = (serviceName || '').match(/(\d+)[- ]?Pack/i);
      const nadSessions = nadPackMatch ? parseInt(nadPackMatch[1], 10) : (opts.quantity || 1);
      const nadFrequency = opts.injectionFrequency || '3x per week';
      const nadDays = calculateProtocolDurationDays(nadSessions, nadFrequency) || Math.ceil(nadSessions / 3) * 7;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + nadDays);
      return {
        ...base,
        program_name: `NAD+ ${nadDose || ''} Protocol — ${nadSessions} Injections`.trim(),
        medication: 'NAD+ Injection',
        selected_dose: nadDose,
        frequency: nadFrequency,
        total_sessions: nadSessions,
        sessions_used: 0,
        delivery_method: 'in_clinic',
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'nad_injection', startDate: today }),
      };
    }

    case 'injection': {
      // Sessions from "X-Pack" in name, else fall back to purchase quantity
      // (POS products like "B12 Injection x6" set qty=6 but don't match pack regex).
      const injFrequency = opts.injectionFrequency || null;
      const injSessions = sessions > 1 ? sessions : (opts.quantity || 1);
      const injDays = calculateProtocolDurationDays(injSessions, injFrequency) || injSessions * 7;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + injDays);
      return {
        ...base,
        program_name: serviceName,
        medication: serviceName,
        frequency: injFrequency,
        total_sessions: injSessions,
        sessions_used: 0,
        delivery_method: 'in_clinic',
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'injection', startDate: today }),
      };
    }

    case 'peptide': {
      // Detect if this is a vial purchase: "Tesamorelin / Ipamorelin Vial" or "GLOW Vial"
      // Also detect from category='vials' passed from Stripe metadata
      const isVialPurchase = (serviceName || '').toLowerCase().includes('vial') || opts.serviceCategory === 'vials';

      // Peptide builder config (from checkout.js Peptide Builder) is authoritative.
      // Shape: { medication, durationDays, phase, totalInjections, inClinicCount, takeHomeCount, hasInClinic, hasTakeHome }
      const pepCfg = opts.peptideConfig;

      // Try to match from the product catalog: prefer builder-provided medication, else parse from name
      const catalogMatch = pepCfg?.medication
        ? findPeptideProduct(pepCfg.medication) || findPeptideProduct(serviceName)
        : findPeptideProduct(serviceName);
      const parsedDuration = parseDurationFromName(serviceName);
      const parsedDelivery = parseDeliveryFromName(serviceName);
      const parsedPhase = parsePhaseFromName(serviceName);

      // Resolve medication name: builder config first, then catalog, then parse
      let peptideMed = pepCfg?.medication || serviceName;
      if (!pepCfg?.medication) {
        if (catalogMatch) {
          peptideMed = catalogMatch.medication;
        } else if (isVialPurchase) {
          peptideMed = (serviceName || '').replace(/\s*Vial\s*/i, '').replace(/\s*x\d+.*$/i, '').trim();
        } else {
          // Legacy format: "Peptide Protocol — 10 Day — BPC-157 (500mcg)" → "BPC-157"
          const parts = (serviceName || '').split('—').map(s => s.trim());
          if (parts.length >= 3) {
            const peptidePart = parts.slice(2).join(' — ');
            const parenMatch = peptidePart.match(/^(.+?)\s*\((.+)\)$/);
            peptideMed = parenMatch ? parenMatch[1].trim() : peptidePart;
          }
        }
      }

      const peptideInfo = findPeptideInfo(peptideMed);
      // Delivery method: builder config wins, then fulfillment flag, then name parse
      // - All in-clinic (hasInClinic && !hasTakeHome) → 'in_clinic'
      // - Mixed or take-home → 'take_home' (the take-home portion is the ongoing protocol)
      const isAllInClinicFromCfg = pepCfg && pepCfg.hasInClinic && !pepCfg.hasTakeHome;
      const isInClinicInjections = fulfillmentOpts.fulfillmentMethod === 'in_clinic_injections';
      const method = pepCfg
        ? (isAllInClinicFromCfg ? 'in_clinic' : 'take_home')
        : (isInClinicInjections ? 'in_clinic' : (parsedDelivery || opts.deliveryMethod || 'take_home'));

      if (isVialPurchase) {
        return {
          ...base,
          program_name: 'Peptide Protocol',
          medication: peptideMed,
          selected_dose: peptideInfo?.startingDose || null,
          frequency: peptideInfo?.frequency || null,
          delivery_method: 'take_home',
          num_vials: opts.quantity || 1,
          doses_per_vial: null,
          total_sessions: null,
          sessions_used: 0,
          end_date: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
          next_expected_date: calculateNextExpectedDate({ protocolType: 'peptide', startDate: today, pickupFrequency: 30 }),
          peptide_reminders_enabled: true,
        };
      }

      // Use builder config if available, else catalog, else parsing
      const duration = pepCfg?.durationDays || parsedDuration || opts.durationDays || 30;
      const phase = pepCfg?.phase || parsedPhase;
      let dose = null;
      let frequency = null;
      let programName = 'Peptide Protocol';
      let totalInjections = pepCfg?.totalInjections || (method === 'in_clinic' ? duration : null);

      if (catalogMatch) {
        // Get dose from catalog
        if (catalogMatch.phases && phase) {
          const phaseData = catalogMatch.phases.find(p => p.phase === phase);
          dose = phaseData?.dose || phaseData?.doses?.[duration] || catalogMatch.dose;
          frequency = phaseData?.frequencies?.[duration] || catalogMatch.defaultFrequency;
          totalInjections = pepCfg?.totalInjections || phaseData?.injections?.[duration] || catalogMatch.totalInjections || duration;
        } else if (catalogMatch.phases) {
          // Default to phase 1
          const phase1 = catalogMatch.phases[0];
          // For multi-month protocols (90 day), use 30-day data as base and multiply
          const baseDuration = Math.min(duration, 30);
          dose = phase1?.dose || phase1?.doses?.[baseDuration] || catalogMatch.dose;
          frequency = phase1?.frequencies?.[baseDuration] || catalogMatch.defaultFrequency;
          const baseInjections = phase1?.injections?.[baseDuration] || catalogMatch.totalInjections || baseDuration;
          // Scale session count for multi-month protocols
          totalInjections = duration > 30 ? Math.round(baseInjections * (duration / 30)) : baseInjections;
        } else {
          dose = catalogMatch.dose;
          frequency = catalogMatch.defaultFrequency;
          const baseSessions = catalogMatch.totalInjections || 30;
          // Scale session count for multi-month protocols (90-day upfront)
          totalInjections = duration > 30 ? Math.round(baseSessions * (duration / 30)) : (catalogMatch.totalInjections || duration);
        }

        // program_name stays as "Peptide Protocol" — medication shown separately
      } else {
        dose = peptideInfo?.startingDose || null;
        frequency = peptideInfo?.frequency || null;
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      return {
        ...base,
        program_name: programName,
        medication: peptideMed,
        selected_dose: dose,
        frequency: frequency,
        delivery_method: method,
        total_sessions: totalInjections,
        sessions_used: 0,
        end_date: endDate.toISOString().split('T')[0],
        next_expected_date: calculateNextExpectedDate({ protocolType: 'peptide', startDate: today, pickupFrequency: duration }),
        peptide_reminders_enabled: method === 'take_home',
        // _peptideConfig is NOT stored in DB — used downstream for service_log creation (mixed fulfillment)
        _peptideConfig: pepCfg || null,
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
        lab_stage: 'awaiting_results',
        delivery_method: 'in_clinic',
      };
    }

    default:
      return null;
  }
}

// ================================================================
// NORMALIZE MEDICATION NAME FOR MATCHING
// ================================================================
function normalizeMedName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^\d+[x]\s*blend[:\s]*/i, '')  // strip "2X Blend:" prefix
    .replace(/\s*vial\s*/i, '')              // strip "Vial"
    .replace(/\s*\([^)]*\)/g, '')            // strip "(dose)" parenthetical
    .replace(/[^a-z0-9]/g, '')              // strip non-alphanumeric
    .trim();
}

// Check if two medication names refer to the same compound(s)
function medicationsMatch(medA, medB) {
  if (!medA || !medB) return false;

  // Exact match
  if (medA === medB) return true;

  // Normalized match
  const normA = normalizeMedName(medA);
  const normB = normalizeMedName(medB);
  if (normA === normB) return true;

  // Check if one contains the other
  if (normA.includes(normB) || normB.includes(normA)) return true;

  // Extract individual compound names and check overlap
  const extractParts = (name) => {
    const clean = name.toLowerCase().replace(/^\d+[x]\s*blend[:\s]*/i, '').trim();
    return clean.split(/\s*[\/,]\s*/).map(p => p.trim().replace(/[^a-z0-9]/g, '')).filter(Boolean);
  };

  const partsA = extractParts(medA);
  const partsB = extractParts(medB);
  // If any individual compound matches between the two, consider it a match
  for (const a of partsA) {
    for (const b of partsB) {
      if (a === b || a.includes(b) || b.includes(a)) return true;
    }
  }

  return false;
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

  // For weight_loss, still do exact medication match (Semaglutide ≠ Tirzepatide)
  // For peptides, we'll fetch all and match fuzzy (see below)
  if (protocolType === 'weight_loss' && medication) {
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

  query = query.order('created_at', { ascending: false }).limit(10);

  const { data, error } = await query;
  if (error) {
    console.error('Error finding existing protocol:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  // Injection protocols: fuzzy-match medication so B12 ≠ Glutathione ≠ Lipo-C
  if (protocolType === 'injection' && medication) {
    const med = data.find(p => medicationsMatch(p.medication, medication));
    if (med) {
      console.log(`Auto-protocol: fuzzy matched injection "${medication}" → existing protocol "${med.medication}" (${med.id})`);
      return med;
    }
    return null; // No matching medication — create a new injection protocol
  }

  // For non-peptide types, return the most recent match
  if (protocolType !== 'peptide') return data[0];

  // ── PEPTIDE SMART MATCHING ──
  // 1. Try fuzzy medication match first
  if (medication) {
    const fuzzyMatch = data.find(p => medicationsMatch(p.medication, medication));
    if (fuzzyMatch) {
      console.log(`Auto-protocol: fuzzy matched peptide "${medication}" → existing protocol "${fuzzyMatch.medication}" (${fuzzyMatch.id})`);
      return fuzzyMatch;
    }
  }

  // 2. If only one active peptide protocol exists, use it (most patients have one)
  const activeOnly = data.filter(p => p.status === 'active');
  if (activeOnly.length === 1) {
    console.log(`Auto-protocol: single active peptide protocol found — extending "${activeOnly[0].medication}" (${activeOnly[0].id})`);
    return activeOnly[0];
  }

  // 3. If multiple active peptide protocols, return the most recent one
  // (better to extend the wrong one than create a duplicate — staff can fix)
  if (activeOnly.length > 1) {
    console.log(`Auto-protocol: ${activeOnly.length} active peptide protocols found — extending most recent "${activeOnly[0].medication}" (${activeOnly[0].id})`);
    return activeOnly[0];
  }

  // 4. Return most recent from any status
  return data[0];
}

// ================================================================
// EXTEND EXISTING PROTOCOL
// ================================================================
async function extendProtocol(protocol, protocolType, serviceName, { fulfillmentMethod, trackingNumber, quantity, wlFrequencyDays, wlConfig, peptideConfig, injectionFrequency } = {}) {
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
      const cfg = wlConfig;

      // Injection count: wlConfig totalInjections, then parse from service name
      let wlInjections;
      if (cfg?.totalInjections) {
        wlInjections = cfg.totalInjections;
      } else {
        const wlQtyMatch = (serviceName || '').match(/x(\d+)/i);
        const isMonthlyProgram = (serviceName || '').toLowerCase().includes('monthly');
        wlInjections = wlQtyMatch ? parseInt(wlQtyMatch[1]) : (isMonthlyProgram ? 4 : (quantity || 1));
      }

      const wlFreqDays = cfg?.frequency || parseWlFrequency(serviceName, wlFrequencyDays);
      const wlDays = wlInjections * wlFreqDays;

      // Fulfillment: if ALL groups are in_clinic → in_clinic, otherwise take_home
      const wlIsInClinic = cfg?.groups?.length
        ? cfg.groups.every(g => g.fulfillment === 'in_clinic')
        : fulfillmentMethod === 'in_clinic_injections';

      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + wlDays);
      updateData.end_date = newEnd.toISOString().split('T')[0];
      // Floor at sessions_used so total never drops below what's already been dispensed —
      // prior data drift where total_sessions resets to 0 would otherwise make refills
      // produce nonsense values like sessions_used=28, total_sessions=2.
      const projectedTotal = (protocol.total_sessions || 0) + wlInjections;
      updateData.total_sessions = Math.max(projectedTotal, (protocol.sessions_used || 0) + wlInjections);

      if (wlIsInClinic) {
        updateData.delivery_method = 'in_clinic';
        updateData.next_expected_date = calculateNextExpectedDate({ protocolType: 'hbot', startDate: todayStr });
      } else {
        // Take-home or mixed: count take-home injections as dispensed
        const takeHomeCount = cfg?.groups?.length
          ? cfg.groups.filter(g => g.fulfillment !== 'in_clinic').reduce((sum, g) => sum + (g.quantity || 0), 0)
          : wlInjections;
        updateData.last_refill_date = todayStr;
        updateData.sessions_used = (protocol.sessions_used || 0) + takeHomeCount;
        updateData.next_expected_date = calculateNextExpectedDate({ protocolType: 'weight_loss', startDate: todayStr, pickupFrequency: wlDays });
      }

      updateData.frequency = wlFreqDays === 10 ? 'Every 10 Days' : 'Weekly';

      // Update dose: use latest dose from wlConfig groups, or parse from service name
      if (cfg?.groups?.length) {
        const lastGroup = cfg.groups[cfg.groups.length - 1];
        if (lastGroup.dose) updateData.selected_dose = lastGroup.dose;
      } else {
        const wlDoseMatch = (serviceName || '').match(/(\d+(?:\.\d+)?)\s*mg/i);
        if (wlDoseMatch) updateData.selected_dose = `${wlDoseMatch[1]}mg`;
      }

      // Auto-log pickup in service_logs — per group for wlConfig, single entry for legacy
      if (cfg?.groups?.length) {
        for (const group of cfg.groups) {
          if (group.fulfillment === 'in_clinic') continue; // in-clinic logs at appointment
          const { error: slErr } = await supabase.from('service_logs').insert({
            patient_id: protocol.patient_id,
            protocol_id: protocol.id,
            category: 'weight_loss',
            entry_type: 'pickup',
            entry_date: todayStr,
            medication: cfg.medication || protocol.medication || null,
            dosage: group.dose || null,
            quantity: group.quantity || 1,
            fulfillment_method: fulfillmentMethod || 'in_clinic',
            tracking_number: trackingNumber || null,
            notes: `Auto-logged from purchase: ${group.quantity} × ${group.dose} dispensed (${wlFreqDays === 10 ? 'every 10 days' : 'weekly'})`,
          });
          if (slErr) console.error('Auto service_log error:', slErr);
        }
        const takeHomeGroups = cfg.groups.filter(g => g.fulfillment !== 'in_clinic');
        const totalTH = takeHomeGroups.reduce((s, g) => s + (g.quantity || 0), 0);
        if (totalTH > 0) console.log(`Auto-protocol: logged weight_loss pickup for ${protocol.patient_id} (${totalTH} take-home injections)`);
      } else if (!wlIsInClinic) {
        const extDose = updateData.selected_dose || protocol.selected_dose || null;
        const extDosageLabel = wlInjections > 1
          ? `${wlInjections} week supply @ ${extDose || ''}`
          : extDose;
        const { error: wlSlErr } = await supabase.from('service_logs').insert({
          patient_id: protocol.patient_id,
          protocol_id: protocol.id,
          category: 'weight_loss',
          entry_type: 'pickup',
          entry_date: todayStr,
          medication: protocol.medication || null,
          dosage: extDosageLabel,
          quantity: wlInjections,
          fulfillment_method: fulfillmentMethod || 'in_clinic',
          tracking_number: trackingNumber || null,
          notes: `Auto-logged from purchase: ${wlInjections} injection${wlInjections > 1 ? 's' : ''} dispensed`,
        });
        if (wlSlErr) console.error('Auto service_log error:', wlSlErr);
        else console.log(`Auto-protocol: logged weight_loss pickup for ${protocol.patient_id} (${wlInjections} injections)`);
      }

      break;
    }

    case 'hrt': {
      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + 30);
      updateData.end_date = newEnd.toISOString().split('T')[0];
      updateData.last_payment_date = todayStr;
      // DO NOT update next_expected_date — that's managed by service log (pickups/injections)
      // DO NOT auto-log pickup — HRT payment is monthly but dispensing happens on a different schedule
      // Medication dispensing is handled separately via the Dispense button on the Medications page

      break;
    }

    case 'hbot':
    case 'rlt': {
      const newSessions = parseSessionCount(serviceName);
      const newEnd = new Date(startFrom);
      newEnd.setDate(newEnd.getDate() + newSessions * 7);
      updateData.total_sessions = (protocol.total_sessions || 0) + newSessions;
      updateData.end_date = newEnd.toISOString().split('T')[0];
      updateData.next_expected_date = calculateNextExpectedDate({ protocolType, startDate: todayStr });
      break;
    }

    case 'injection':
    case 'nad_injection': {
      // Duration must derive from the total session count + frequency on the
      // protocol record — not from sessions × 7, which treats each shot as a week.
      const parsedSessions = parseSessionCount(serviceName);
      const newSessions = parsedSessions > 1 ? parsedSessions : (quantity || 1);
      const newTotal = (protocol.total_sessions || 0) + newSessions;
      const freq = injectionFrequency || protocol.frequency || (protocolType === 'nad_injection' ? '3x per week' : null);
      const durationDays = calculateProtocolDurationDays(newTotal, freq) || newTotal * 7;
      const protocolStart = protocol.start_date ? new Date(protocol.start_date + 'T12:00:00') : today;
      const newEnd = new Date(protocolStart);
      newEnd.setDate(newEnd.getDate() + durationDays);
      updateData.total_sessions = newTotal;
      updateData.end_date = newEnd.toISOString().split('T')[0];
      if (freq && freq !== protocol.frequency) updateData.frequency = freq;
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
      // Builder config is authoritative when present
      const pepCfg = peptideConfig;
      // Try catalog match for correct duration (prefer builder medication)
      const pepCatalog = pepCfg?.medication
        ? findPeptideProduct(pepCfg.medication) || findPeptideProduct(serviceName)
        : findPeptideProduct(serviceName);
      const pepDuration = pepCfg?.durationDays || parseDurationFromName(serviceName);
      const pepDelivery = parseDeliveryFromName(serviceName);

      // Enforce cycle cap (90 days for recovery, 90 days for GH peptides)
      const cycleConfig = getCycleConfig(protocol.medication);
      if (cycleConfig) {
        const currentDays = protocol.total_sessions || 0;
        const extendBy = pepDuration || 30;
        if (currentDays + extendBy > cycleConfig.maxDays) {
          console.log(`Auto-protocol: BLOCKED extension — ${protocol.medication} at ${currentDays}/${cycleConfig.maxDays} days, extending by ${extendBy} would exceed cycle max`);
          return { action: 'blocked', reason: 'cycle_max', protocol_id: protocol.id, days_used: currentDays, max_days: cycleConfig.maxDays };
        }
      }

      // Vial-based peptide: increment num_vials and recalculate
      if (protocol.doses_per_vial) {
        const newNumVials = (protocol.num_vials || 0) + 1;
        const totalDoses = newNumVials * protocol.doses_per_vial;
        const durationDays = calculatePeptideDurationDays(totalDoses, protocol.frequency) || totalDoses;

        const protocolStart = protocol.start_date ? new Date(protocol.start_date + 'T12:00:00') : today;
        const newEnd = new Date(protocolStart);
        newEnd.setDate(newEnd.getDate() + durationDays);

        updateData.num_vials = newNumVials;
        updateData.total_sessions = totalDoses;
        updateData.end_date = newEnd.toISOString().split('T')[0];
      } else {
        // Non-vial peptide: extend by actual duration (builder, product name, or catalog)
        const extendDays = pepDuration || 30;
        const newEnd = new Date(startFrom);
        newEnd.setDate(newEnd.getDate() + extendDays);
        updateData.end_date = newEnd.toISOString().split('T')[0];
        // Prefer builder totalInjections for session count, else duration-based fallback
        const extendSessions = pepCfg?.totalInjections || extendDays;
        updateData.total_sessions = (protocol.total_sessions || 0) + extendSessions;

        // Delivery: builder config wins — all-in-clinic flips delivery, otherwise take-home
        if (pepCfg) {
          if (pepCfg.hasInClinic && !pepCfg.hasTakeHome) updateData.delivery_method = 'in_clinic';
          else if (pepCfg.hasTakeHome) updateData.delivery_method = 'take_home';
        } else if (pepDelivery) {
          updateData.delivery_method = pepDelivery;
        }

        // Update dose from catalog if available
        if (pepCatalog?.dose) updateData.selected_dose = pepCatalog.dose;
      }
      updateData.next_expected_date = calculateNextExpectedDate({ protocolType: 'peptide', startDate: todayStr, pickupFrequency: pepDuration || 30 });

      // Auto-log for peptide extensions — split by peptideConfig if present
      const effectiveDelivery = updateData.delivery_method || protocol.delivery_method;
      const extendLogRows = [];
      if (pepCfg) {
        if (pepCfg.inClinicCount > 0) {
          extendLogRows.push({
            patient_id: protocol.patient_id,
            protocol_id: protocol.id,
            category: 'peptide',
            entry_type: 'session',
            entry_date: todayStr,
            medication: protocol.medication || null,
            dosage: updateData.selected_dose || protocol.selected_dose || null,
            quantity: pepCfg.inClinicCount,
            fulfillment_method: 'in_clinic_injections',
            tracking_number: null,
            notes: `Auto-logged from purchase: ${pepCfg.inClinicCount} injection${pepCfg.inClinicCount > 1 ? 's' : ''} administered in clinic — "${serviceName}"`,
          });
        }
        if (pepCfg.takeHomeCount > 0) {
          extendLogRows.push({
            patient_id: protocol.patient_id,
            protocol_id: protocol.id,
            category: 'peptide',
            entry_type: 'pickup',
            entry_date: todayStr,
            medication: protocol.medication || null,
            dosage: updateData.selected_dose || protocol.selected_dose || null,
            quantity: pepCfg.takeHomeCount,
            fulfillment_method: fulfillmentMethod === 'overnight' ? 'overnight' : 'in_clinic',
            tracking_number: trackingNumber || null,
            notes: `Auto-logged from purchase: ${pepCfg.takeHomeCount} take-home injection${pepCfg.takeHomeCount > 1 ? 's' : ''} dispensed — "${serviceName}"`,
          });
        }
      } else if (effectiveDelivery === 'take_home') {
        // Legacy path: single bulk pickup sized to duration
        const pepPickupQty = pepDuration || 30;
        extendLogRows.push({
          patient_id: protocol.patient_id,
          protocol_id: protocol.id,
          category: 'peptide',
          entry_type: 'pickup',
          entry_date: todayStr,
          medication: protocol.medication || null,
          dosage: updateData.selected_dose || protocol.selected_dose || null,
          quantity: pepPickupQty,
          fulfillment_method: fulfillmentMethod || 'in_clinic',
          tracking_number: trackingNumber || null,
          notes: `Auto-logged from purchase: take-home medication dispensed — "${serviceName}"`,
        });
      }

      if (extendLogRows.length > 0) {
        const { error: slErr } = await supabase.from('service_logs').insert(extendLogRows);
        if (slErr) console.error('Auto service_log error (peptide extend):', slErr);
        else console.log(`Auto-protocol: logged ${extendLogRows.length} peptide entr${extendLogRows.length > 1 ? 'ies' : 'y'} for extended protocol ${protocol.id}`);
      }

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

  // Auto-resolve any payment-related follow-ups for this patient/protocol
  await resolvePaymentFollowUps(protocol.patient_id, protocol.id);

  // Create renewal log for any take-home protocol type
  if (['weight_loss', 'peptide', 'hrt'].includes(protocolType)) {
    await supabase
      .from('protocol_logs')
      .insert({
        protocol_id: protocol.id,
        patient_id: protocol.patient_id,
        log_type: 'renewal',
        log_date: todayStr,
        notes: `Auto-renewed via POS purchase: "${serviceName}". Previous end date: ${protocol.end_date || 'none'}. New end date: ${updateData.end_date}.${updateData.total_sessions ? ` Sessions: ${protocol.total_sessions || 0} → ${updateData.total_sessions}.` : ''}${updateData.frequency && updateData.frequency !== protocol.frequency ? ` Frequency changed: ${protocol.frequency || 'none'} → ${updateData.frequency}.` : ''}`,
      })
      .then(({ error: logErr }) => {
        if (logErr) console.error('Renewal log error:', logErr);
      });
  }

  return protocol.id;
}

// ================================================================
// AUTO-RESOLVE FOLLOW-UPS ON PAYMENT
// When a payment is recorded for a protocol, resolve any pending
// wl_payment_due or peptide_renewal follow-ups for that patient.
// ================================================================
export async function resolvePaymentFollowUps(patientId, protocolId) {
  try {
    const typesToResolve = ['wl_payment_due', 'peptide_renewal'];
    let query = supabase
      .from('follow_ups')
      .update({
        status: 'completed',
        outcome: 'auto_resolved_payment',
        completed_at: new Date().toISOString(),
      })
      .eq('patient_id', patientId)
      .in('type', typesToResolve)
      .in('status', ['pending', 'in_progress']);

    if (protocolId) {
      query = query.eq('protocol_id', protocolId);
    }

    const { data, error } = await query.select('id');
    if (error) {
      console.error('Error auto-resolving follow-ups:', error);
    } else if (data?.length > 0) {
      console.log(`Auto-resolved ${data.length} follow-up(s) for patient ${patientId} after payment`);
    }
  } catch (err) {
    console.error('Auto-resolve follow-ups error (non-fatal):', err.message);
  }
}

// ================================================================
// WEBHOOK LOG HELPER
// ================================================================
async function logWebhookAction(purchaseId, action, details = {}) {
  try {
    await supabase.from('webhook_logs').insert({
      purchase_id: purchaseId || null,
      action,
      details,
    });
  } catch (err) {
    console.error('Webhook log error (non-fatal):', err.message);
  }
}

// ================================================================
// PEPTIDE SEQUENTIAL PROTOCOL LOGIC
// ================================================================
async function handlePeptideSequentialProtocol({
  patientId, patientName, medication, serviceName,
  purchaseId, durationDays, deliveryMethod, fulfillmentMethod,
  trackingNumber, quantity, serviceCategory,
}) {
  const today = todayPacific();
  const catalogMatch = findPeptideProduct(serviceName);
  const peptideName = catalogMatch?.medication || medication || serviceName;
  const duration = durationDays || parseDurationFromName(serviceName) || catalogMatch?.duration || 30;
  const peptideInfo = catalogMatch ? findPeptideInfo(catalogMatch.medication) : findPeptideInfo(medication);
  const is90DayTracked = isGHPeptide(peptideName) || isRecoveryPeptide(peptideName);
  const isVialPurchase = serviceCategory === 'vials' || /\bvial\b/i.test(serviceName || '');
  const vialQty = Math.max(1, quantity || 1);

  // Helper: mark purchase as protocol_created
  const markPurchase = async () => {
    if (!purchaseId) return;
    await supabase.from('purchases')
      .update({ protocol_created: true })
      .eq('id', purchaseId);
  };

  // Helper: build protocol insert data
  const buildPeptideProtocol = (startDate, endDate, status, continuousDaysStarted) => {
    const method = deliveryMethod || 'take_home';
    const dose = peptideInfo?.startingDose || catalogMatch?.dose || null;
    const frequency = peptideInfo?.frequency || catalogMatch?.defaultFrequency || null;

    // Calculate continuous_days_used
    const start = new Date(continuousDaysStarted + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const continuousDaysUsed = Math.round((end - start) / (1000 * 60 * 60 * 24));

    return {
      patient_id: patientId,
      patient_name: patientName,
      program_name: 'Peptide Protocol',
      program_type: 'peptide',
      medication: peptideName,
      selected_dose: dose,
      frequency,
      delivery_method: method,
      total_sessions: duration,
      sessions_used: 0,
      status,
      start_date: startDate,
      end_date: endDate,
      continuous_days_started: continuousDaysStarted,
      continuous_days_used: continuousDaysUsed,
      next_expected_date: calculateNextExpectedDate({ protocolType: 'peptide', startDate, pickupFrequency: duration }),
      peptide_reminders_enabled: method === 'take_home',
      created_at: new Date().toISOString(),
    };
  };

  // Helper: calculate end date from a start date
  const calcEndDate = (startDate, days) => {
    const d = new Date(startDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  try {
    // STEP 1: Look up existing active/queued protocols for this patient + medication
    const { data: existing, error: lookupErr } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patientId)
      .eq('program_type', 'peptide')
      .in('status', ['active', 'queued'])
      .order('created_at', { ascending: false });

    if (lookupErr) throw new Error(`Protocol lookup failed: ${lookupErr.message}`);

    // Vial purchases are unit-based (num_vials), not duration-based. Only merge
    // into an existing protocol when medication matches AND that protocol is
    // already vial-tracked (num_vials set). Otherwise create a fresh vial
    // protocol — prevents the fuzzy-match extension bug where e.g. a GLOW vial
    // (which has "TB-4" as a component) lands on an unrelated TB4 protocol.
    if (isVialPurchase) {
      const vialMatch = (existing || []).find(p =>
        medicationsMatch(p.medication, peptideName) && p.num_vials != null
      );

      if (vialMatch) {
        const newNumVials = (vialMatch.num_vials || 0) + vialQty;
        const extensionNote = `[+${vialQty} vial${vialQty > 1 ? 's' : ''} ${today}]`;
        const existingNotes = vialMatch.notes || '';
        const updatedNotes = existingNotes ? `${existingNotes}\n${extensionNote}` : extensionNote;

        const { error: extendErr } = await supabase
          .from('protocols')
          .update({
            num_vials: newNumVials,
            notes: updatedNotes,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', vialMatch.id);

        if (extendErr) throw new Error(`Vial extend failed: ${extendErr.message}`);

        if (purchaseId) {
          await supabase.from('purchases')
            .update({ protocol_id: vialMatch.id, protocol_created: true })
            .eq('id', purchaseId);
        }

        await logWebhookAction(purchaseId, 'peptide_vial_added', {
          protocol_id: vialMatch.id, medication: peptideName, added_vials: vialQty, total_vials: newNumVials,
        });
        console.log(`Auto-protocol: added ${vialQty} vial(s) to ${peptideName} protocol ${vialMatch.id} (total: ${newNumVials})`);
        return { action: 'VIAL_ADDED', medication: peptideName };
      }

      // No vial-tracked match — create a new vial protocol.
      const endDate = (() => { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })();
      const method = deliveryMethod || 'take_home';

      const vialProtocolData = {
        patient_id: patientId,
        patient_name: patientName,
        program_name: 'Peptide Protocol',
        program_type: 'peptide',
        medication: peptideName,
        selected_dose: peptideInfo?.startingDose || catalogMatch?.dose || null,
        frequency: peptideInfo?.frequency || catalogMatch?.defaultFrequency || null,
        delivery_method: method,
        num_vials: vialQty,
        doses_per_vial: null,
        total_sessions: null,
        sessions_used: 0,
        status: 'active',
        start_date: today,
        end_date: endDate,
        next_expected_date: calculateNextExpectedDate({ protocolType: 'peptide', startDate: today, pickupFrequency: 30 }),
        peptide_reminders_enabled: method === 'take_home',
      };

      const createResult = await createProtocol(vialProtocolData, {
        source: 'auto-protocol',
        purchaseId,
        skipDuplicateCheck: true,
      });

      if (!createResult.success) throw new Error(`Vial protocol create failed: ${createResult.error}`);

      await logWebhookAction(purchaseId, 'peptide_vial_protocol_created', {
        protocol_id: createResult.protocol.id, medication: peptideName, num_vials: vialQty,
      });
      console.log(`Auto-protocol: created vial protocol ${createResult.protocol.id} (${peptideName}, ${vialQty} vial${vialQty > 1 ? 's' : ''})`);
      return { action: 'VIAL_CREATED', medication: peptideName };
    }

    // Filter to matching medication using fuzzy match
    const matched = (existing || []).filter(p => medicationsMatch(p.medication, peptideName));
    const activeProtocol = matched.find(p => p.status === 'active');
    const queuedProtocol = matched.find(p => p.status === 'queued');

    let action = '';

    // SCENARIO A: No active or queued protocol
    if (!activeProtocol && !queuedProtocol) {
      const endDate = calcEndDate(today, duration);
      const protocolData = buildPeptideProtocol(today, endDate, 'active', today);

      const createResult = await createProtocol({
        ...protocolData,
        program_type: 'peptide',
      }, {
        source: 'auto-protocol',
        purchaseId,
        skipDuplicateCheck: true, // already checked above
      });

      if (!createResult.success) throw new Error(`Protocol create failed: ${createResult.error}`);
      const newProto = createResult.protocol;

      action = 'CREATED';

      // Set journey stage
      try {
        const { data: template } = await supabase
          .from('journey_templates')
          .select('id, stages')
          .eq('protocol_type', 'peptide')
          .eq('is_default', true)
          .maybeSingle();

        if (template?.stages?.length) {
          const dispensedStage = template.stages.find(s => s.key === 'dispensed');
          const initialStage = dispensedStage ? 'dispensed' : template.stages[0].key;
          await supabase.from('protocols').update({
            journey_template_id: template.id,
            current_journey_stage: initialStage,
          }).eq('id', newProto.id);
        }
      } catch (journeyErr) {
        console.error('Peptide journey stage error (non-fatal):', journeyErr);
      }

      await logWebhookAction(purchaseId, 'peptide_protocol_created', {
        protocol_id: newProto.id, medication: peptideName, start_date: today, end_date: endDate,
      });
    }

    // SCENARIO B: Active (or legacy queued) protocol exists — extend it in place
    // rather than creating a new protocol record. If a queued protocol is present
    // from legacy data, extend that one since it has the later end_date.
    else {
      const protocolToExtend = queuedProtocol || activeProtocol;
      const currentEndDate = protocolToExtend.end_date || today;
      const newEndDate = calcEndDate(currentEndDate, duration);
      const currentTotalSessions = protocolToExtend.total_sessions || 0;
      const newTotalSessions = currentTotalSessions + duration;
      const continuousDaysStarted = protocolToExtend.continuous_days_started || protocolToExtend.start_date || today;

      const startD = new Date(continuousDaysStarted + 'T12:00:00');
      const endD = new Date(newEndDate + 'T12:00:00');
      const continuousDaysUsed = Math.round((endD - startD) / (1000 * 60 * 60 * 24));

      const extensionNote = `[Extended ${today}]: +${duration} days (${currentEndDate} \u2192 ${newEndDate})`;
      const existingNotes = protocolToExtend.notes || '';
      const updatedNotes = existingNotes ? `${existingNotes}\n${extensionNote}` : extensionNote;

      const { error: extendErr } = await supabase
        .from('protocols')
        .update({
          end_date: newEndDate,
          total_sessions: newTotalSessions,
          continuous_days_used: continuousDaysUsed,
          notes: updatedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', protocolToExtend.id);

      if (extendErr) throw new Error(`Protocol extend failed: ${extendErr.message}`);

      if (purchaseId) {
        await supabase.from('purchases')
          .update({ protocol_id: protocolToExtend.id, protocol_created: true })
          .eq('id', purchaseId);
      }

      action = 'EXTENDED';

      await logWebhookAction(purchaseId, 'peptide_protocol_extended', {
        protocol_id: protocolToExtend.id,
        medication: peptideName,
        previous_end_date: currentEndDate,
        new_end_date: newEndDate,
        previous_total_sessions: currentTotalSessions,
        new_total_sessions: newTotalSessions,
        added_days: duration,
      });
    }

    await markPurchase();

    return { action, medication: peptideName };

  } catch (err) {
    console.error('Peptide sequential protocol error:', err.message);

    await logWebhookAction(purchaseId, 'peptide_protocol_error', {
      error: err.message, medication: peptideName || medication,
    });

    return { action: 'ERROR', error: err.message };
  }
}

// ================================================================
// MAIN: AUTO CREATE OR EXTEND PROTOCOL
// ================================================================
export async function autoCreateOrExtendProtocol({ patientId, serviceCategory, serviceName, purchaseId, deliveryMethod, durationDays, quantity, fulfillmentMethod, trackingNumber, stripePaymentIntentId, wlFrequencyDays, wlConfig, peptideConfig, injectionFrequency }) {
  try {
    // Normalize category to lowercase — legacy rows used "Injection", "IV Therapy", etc.
    const normalizedCategory = (serviceCategory || '').toLowerCase();
    if (!normalizedCategory || SKIP_CATEGORIES.includes(normalizedCategory)) return;
    serviceCategory = normalizedCategory;

    // Look up patient name for the protocol record (needed for non-GHL patients)
    let patientName = null;
    if (patientId) {
      const { data: pt } = await supabase
        .from('patients')
        .select('name, full_name')
        .eq('id', patientId)
        .single();
      patientName = pt?.full_name || pt?.name || null;
    }

    // Resolve protocol type
    let protocolType = CATEGORY_TO_PROTOCOL[serviceCategory];

    // Handle regenerative category by parsing service name
    if (!protocolType && serviceCategory === 'regenerative') {
      protocolType = resolveRegenerativeType(serviceName);
    }

    // Legacy data: generic "injection" category + NAD+ in the name → nad_injection.
    // Historical purchases stored everything under "Injection" before the catalog split.
    if (protocolType === 'injection' && /nad\+?/i.test(serviceName || '')) {
      protocolType = 'nad_injection';
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

    // NAD+ injections always create/extend a protocol — single shots merge into
    // the active NAD+ protocol so the clinic can track cumulative dosing.

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

      // Create HBOT protocol via centralized function
      const hbotResult = await createProtocol({
        patient_id: patientId,
        patient_name: patientName,
        program_name: `Combo Membership — HBOT`,
        program_type: 'hbot',
        total_sessions: hbotSessions,
        sessions_used: 0,
        delivery_method: 'in_clinic',
        start_date: today,
        end_date: endDateStr,
        next_expected_date: calculateNextExpectedDate({ protocolType: 'hbot', startDate: today }),
      }, {
        source: 'auto-protocol',
        purchaseId, // links to HBOT protocol
        skipDuplicateCheck: true,
      });

      if (!hbotResult.success) console.error('Auto-protocol: combo HBOT create error:', hbotResult.error);

      // Create RLT protocol via centralized function
      const rltResult = await createProtocol({
        patient_id: patientId,
        patient_name: patientName,
        program_name: `Combo Membership — RLT`,
        program_type: 'rlt',
        total_sessions: rltSessions,
        sessions_used: 0,
        delivery_method: 'in_clinic',
        start_date: today,
        end_date: endDateStr,
        next_expected_date: calculateNextExpectedDate({ protocolType: 'rlt', startDate: today }),
      }, {
        source: 'auto-protocol',
        skipDuplicateCheck: true,
      });

      console.log(`Auto-protocol: created combo membership protocols (HBOT: ${hbotResult.protocol?.id}, RLT: ${rltResult.protocol?.id}) for patient ${patientId}`);
      return;
    }

    // Determine medication for matching
    // HRT matches by type only (not medication) — product name like "HRT Monthly Membership"
    // doesn't match actual medication like "Testosterone Cypionate"
    // Injections match by medication so B12 ≠ Glutathione ≠ Lipo-C each get their own protocol.
    let medication = ['weight_loss', 'peptide', 'injection'].includes(protocolType) ? serviceName : null;

    // For weight loss, parse actual medication name from product name
    // wlConfig (from Injection Builder) is authoritative — skip name parsing
    if (protocolType === 'weight_loss' && wlConfig?.medication) {
      medication = wlConfig.medication;
    } else if (protocolType === 'weight_loss' && serviceName) {
      // Legacy POS products: "Retatrutide — Monthly (One-Time) — 4 mg/week x2" → "Retatrutide"
      const parts = serviceName.split('—').map(s => s.trim());
      if (parts.length >= 2) {
        medication = parts[0].trim();
      } else {
        const lower = serviceName.toLowerCase();
        if (lower.includes('semaglutide')) medication = 'Semaglutide';
        else if (lower.includes('tirzepatide')) medication = 'Tirzepatide';
        else if (lower.includes('retatrutide')) medication = 'Retatrutide';
      }
    }

    // For peptides, resolve medication name:
    // 1. Try catalog match first (authoritative) — handles all clean product names
    // 2. Fall back to parsing for legacy/old-format names
    if (protocolType === 'peptide' && serviceName) {
      const catalogMatch = findPeptideProduct(serviceName);
      if (catalogMatch) {
        // Use the canonical medication name from the catalog
        medication = catalogMatch.medication;
      } else {
        // Legacy format: "Peptide Protocol — 10 Day — BPC-157 (500mcg)" → "BPC-157"
        const parts = serviceName.split('—').map(s => s.trim());
        if (parts.length >= 3) {
          const peptidePart = parts.slice(2).join(' — ');
          const parenMatch = peptidePart.match(/^(.+?)\s*\((.+)\)$/);
          medication = parenMatch ? parenMatch[1].trim() : peptidePart;
        } else {
          // No em-dash format — clean up the service name directly
          medication = serviceName
            .replace(/^\d+[Xx]\s*Blend[:\s]*/i, '')  // strip "2X Blend:" prefix
            .replace(/\s*Vial\s*/i, '')               // strip "Vial"
            .replace(/\s*\([^)]*\)$/g, '')            // strip trailing "(dose)"
            .trim();
        }
      }
    }

    // ── WEIGHT LOSS: Auto-extend on purchase ──
    // When a WL purchase comes in, extend the existing protocol (add sessions,
    // update end date, auto-log pickup). No manual staff step required.
    // If no existing protocol, falls through to create one below.

    // ── PEPTIDE: Smart Sequential Protocol Logic ──
    // Auto-creates, queues, or flags protocols based on existing state.
    if (protocolType === 'peptide') {
      const result = await handlePeptideSequentialProtocol({
        patientId,
        patientName,
        medication,
        serviceName,
        purchaseId,
        durationDays,
        deliveryMethod,
        fulfillmentMethod,
        trackingNumber,
        quantity,
        serviceCategory,
      });
      console.log(`Auto-protocol: peptide sequential — ${result.action} for ${patientName || patientId}`);
      return;
    }

    // Check for existing active protocol
    const existing = await findExistingProtocol(patientId, protocolType, medication);

    let protocolId;

    if (existing) {
      // Extend existing protocol (adds sessions, updates dates, logs pickup for WL)
      protocolId = await extendProtocol(existing, protocolType, serviceName, { fulfillmentMethod, trackingNumber, quantity, wlFrequencyDays, wlConfig, peptideConfig, injectionFrequency });
      console.log(`Auto-protocol: extended ${protocolType} protocol ${protocolId} for patient ${patientId}`);
    } else {
      // Create new protocol
      const protocolData = buildProtocolData(protocolType, serviceName, patientId, { deliveryMethod, durationDays, medication, patientName, serviceCategory, quantity, wlFrequencyDays, wlConfig, peptideConfig, injectionFrequency }, { fulfillmentMethod });
      if (!protocolData) return;

      // Strip _wlConfig / _peptideConfig before DB insert — used for service log creation only
      const { _wlConfig: _wlCfgLocal, _peptideConfig: _pepCfgLocal, ...dbProtocolData } = protocolData;

      const createResult = await createProtocol({
        ...dbProtocolData,
        program_type: protocolType,
      }, {
        source: 'auto-protocol',
        purchaseId,
        skipDuplicateCheck: true, // already handled by findExistingProtocol above
      });

      if (!createResult.success) {
        console.error('Auto-protocol create error:', createResult.error);
        return;
      }
      protocolId = createResult.protocol.id;
      console.log(`Auto-protocol: created ${protocolType} protocol ${protocolId} for patient ${patientId}`);

      // Set journey stage to 'dispensed' for POS-created protocols (patient already consulted + paid)
      try {
        const { data: template } = await supabase
          .from('journey_templates')
          .select('id, stages')
          .eq('protocol_type', protocolType)
          .eq('is_default', true)
          .maybeSingle();

        if (template && template.stages && template.stages.length > 0) {
          const dispensedStage = template.stages.find(s => s.key === 'dispensed');
          const initialStage = dispensedStage ? 'dispensed' : template.stages[0].key;

          await supabase
            .from('protocols')
            .update({
              journey_template_id: template.id,
              current_journey_stage: initialStage
            })
            .eq('id', protocolId);

          await supabase.from('journey_events').insert({
            patient_id: patientId,
            protocol_id: protocolId,
            current_stage: initialStage,
            previous_stage: null,
            event_type: 'stage_change',
            notes: 'Auto-created from POS purchase',
          });
          console.log(`Auto-protocol: set journey stage to '${initialStage}' for protocol ${protocolId}`);
        }
      } catch (journeyErr) {
        console.error('Auto-protocol: journey stage error (non-fatal):', journeyErr);
      }

      // Auto-log for new weight loss protocols
      if (protocolType === 'weight_loss') {
        const newWlCfg = protocolData._wlConfig;
        const todayStr = new Date().toISOString().split('T')[0];
        const newWlFreqDays = newWlCfg?.frequency || parseWlFrequency(serviceName, wlFrequencyDays);

        if (newWlCfg?.groups?.length) {
          // WL Builder: log per-group (skip in-clinic groups — those log at appointment)
          for (const group of newWlCfg.groups) {
            if (group.fulfillment === 'in_clinic') continue;
            const { error: slErr } = await supabase.from('service_logs').insert({
              patient_id: patientId,
              protocol_id: protocolId,
              category: 'weight_loss',
              entry_type: 'pickup',
              entry_date: todayStr,
              medication: protocolData.medication || null,
              dosage: group.dose || null,
              quantity: group.quantity || 1,
              fulfillment_method: fulfillmentMethod || 'in_clinic',
              tracking_number: trackingNumber || null,
              notes: `Auto-logged from purchase: ${group.quantity} × ${group.dose} dispensed (${newWlFreqDays === 10 ? 'every 10 days' : 'weekly'})`,
            });
            if (slErr) console.error('Auto service_log error:', slErr);
          }
          const thGroups = newWlCfg.groups.filter(g => g.fulfillment !== 'in_clinic');
          const thTotal = thGroups.reduce((s, g) => s + (g.quantity || 0), 0);
          if (thTotal > 0) console.log(`Auto-protocol: logged weight_loss pickup for new protocol ${protocolId} (${thTotal} take-home injections)`);
        } else if (fulfillmentMethod !== 'in_clinic_injections') {
          // Legacy POS: single service log entry
          const injCount = protocolData.total_sessions || quantity || 1;
          const wlDoseMatch = (serviceName || '').match(/(\d+(?:\.\d+)?)\s*mg/i);
          const supplyLabel = newWlFreqDays === 10
            ? `${injCount * newWlFreqDays} day supply (every 10 days)`
            : `${injCount} week supply`;
          const dosageLabel = injCount > 1
            ? `${supplyLabel} @ ${wlDoseMatch ? wlDoseMatch[1] + 'mg' : (protocolData.selected_dose || '')}`
            : (protocolData.selected_dose || null);
          const { error: wlNewSlErr } = await supabase.from('service_logs').insert({
            patient_id: patientId,
            protocol_id: protocolId,
            category: 'weight_loss',
            entry_type: 'pickup',
            entry_date: todayStr,
            medication: protocolData.medication || null,
            dosage: dosageLabel,
            quantity: injCount,
            fulfillment_method: fulfillmentMethod || 'in_clinic',
            tracking_number: trackingNumber || null,
            notes: `Auto-logged from purchase: ${injCount} injection${injCount > 1 ? 's' : ''} dispensed (${newWlFreqDays === 10 ? 'every 10 days' : 'weekly'})`,
          });
          if (wlNewSlErr) console.error('Auto service_log error:', wlNewSlErr);
          else console.log(`Auto-protocol: logged weight_loss pickup for new protocol ${protocolId} (${injCount} injections)`);
        }
      }

      // Auto-log for new peptide protocols — split by peptideConfig if present
      if (protocolType === 'peptide') {
        const todayStr = new Date().toISOString().split('T')[0];
        const pepCfg = protocolData._peptideConfig;
        const peptideLogRows = [];

        if (pepCfg) {
          // Builder-driven: respect the in-clinic / take-home split
          if (pepCfg.inClinicCount > 0) {
            peptideLogRows.push({
              patient_id: patientId,
              protocol_id: protocolId,
              category: 'peptide',
              entry_type: 'session',
              entry_date: todayStr,
              medication: protocolData.medication || null,
              dosage: protocolData.selected_dose || null,
              quantity: pepCfg.inClinicCount,
              fulfillment_method: 'in_clinic_injections',
              tracking_number: null,
              notes: `Auto-logged from purchase: ${pepCfg.inClinicCount} injection${pepCfg.inClinicCount > 1 ? 's' : ''} administered in clinic — "${serviceName}"`,
            });
          }
          if (pepCfg.takeHomeCount > 0) {
            peptideLogRows.push({
              patient_id: patientId,
              protocol_id: protocolId,
              category: 'peptide',
              entry_type: 'pickup',
              entry_date: todayStr,
              medication: protocolData.medication || null,
              dosage: protocolData.selected_dose || null,
              quantity: pepCfg.takeHomeCount,
              fulfillment_method: fulfillmentMethod === 'overnight' ? 'overnight' : 'in_clinic',
              tracking_number: trackingNumber || null,
              notes: `Auto-logged from purchase: ${pepCfg.takeHomeCount} take-home injection${pepCfg.takeHomeCount > 1 ? 's' : ''} dispensed — "${serviceName}"`,
            });
          }
        } else if (protocolData.delivery_method === 'take_home') {
          // Legacy path (no builder config): single bulk take-home pickup
          const pepDuration = protocolData.total_sessions || parseDurationFromName(serviceName) || 30;
          peptideLogRows.push({
            patient_id: patientId,
            protocol_id: protocolId,
            category: 'peptide',
            entry_type: 'pickup',
            entry_date: todayStr,
            medication: protocolData.medication || null,
            dosage: protocolData.selected_dose || null,
            quantity: pepDuration,
            fulfillment_method: fulfillmentMethod || 'in_clinic',
            tracking_number: trackingNumber || null,
            notes: `Auto-logged from purchase: take-home medication dispensed — "${serviceName}"`,
          });
        }

        if (peptideLogRows.length > 0) {
          const { error: pepSlErr } = await supabase.from('service_logs').insert(peptideLogRows);
          if (pepSlErr) console.error('Auto service_log error (peptide):', pepSlErr);
          else console.log(`Auto-protocol: logged ${peptideLogRows.length} peptide entr${peptideLogRows.length > 1 ? 'ies' : 'y'} for new protocol ${protocolId}`);
        }
      }

      // HRT: DO NOT auto-log pickup — payment is monthly but dispensing is on a separate schedule
      // Medication dispensing is handled via the Dispense button on the Medications page
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
