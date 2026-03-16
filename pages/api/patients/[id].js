// pages/api/patients/[id].js
// Patient Profile API - Range Medical
// Unified patient data endpoint: demographics, protocols, labs, intakes, sessions, purchases

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calculate days/sessions remaining based on protocol type
function calculateRemaining(protocol) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const programType = (protocol.program_type || '').toLowerCase();
  const deliveryMethod = (protocol.delivery_method || '').toLowerCase();
  const isWeightLoss = programType.includes('weight') || programType.includes('wl') || programType.includes('glp');
  const isHRT = programType.includes('hrt') || programType.includes('testosterone') || programType.includes('hormone');
  const isPeptide = programType.includes('peptide') || programType.includes('bpc') || programType.includes('recovery') || programType.includes('month_program') || programType.includes('jumpstart') || programType.includes('maintenance_4week') || programType.includes('gh_peptide');
  const isTakeHome = deliveryMethod.includes('take') || deliveryMethod.includes('home');
  const isInClinic = deliveryMethod.includes('clinic');

  // ===== WEIGHT LOSS =====
  if (isWeightLoss) {
    // If next_expected_date is set (from dispense system), use it directly
    if (protocol.next_expected_date) {
      const nextDate = new Date(protocol.next_expected_date + 'T00:00:00');
      const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

      const statusText = daysUntil <= 0 ? 'Refill overdue' :
                         daysUntil <= 3 ? `${daysUntil}d — Refill soon` :
                         `${daysUntil} days until refill`;

      return { days_remaining: daysUntil, status_text: statusText };
    }

    if (isTakeHome) {
      const totalInjections = protocol.total_sessions || 4;
      const supplyDays = totalInjections * 7;
      const trackingDate = protocol.last_refill_date || protocol.start_date;

      if (trackingDate) {
        const startDate = new Date(trackingDate + 'T00:00:00');
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + supplyDays);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        let statusText = daysRemaining <= 0 ? 'Supply exhausted' :
                         daysRemaining <= 3 ? `${daysRemaining}d - Refill soon` :
                         daysRemaining <= 14 ? `${daysRemaining} days left` :
                         `~${Math.floor(daysRemaining / 7)} weeks left`;

        return { days_remaining: daysRemaining, total_days: supplyDays, status_text: statusText };
      }
    } else {
      if (protocol.total_sessions && protocol.total_sessions > 0) {
        const sessionsUsed = protocol.sessions_used || 0;
        const sessionsRemaining = protocol.total_sessions - sessionsUsed;
        const statusText = sessionsRemaining <= 0 ? `${sessionsUsed} of ${protocol.total_sessions} — add more` :
                           `${sessionsUsed} of ${protocol.total_sessions} injections`;
        return { sessions_remaining: sessionsRemaining, total_sessions: protocol.total_sessions, status_text: statusText };
      }
    }
  }

  // ===== HRT =====
  if (isHRT) {
    // If next_expected_date is set (from dispense system), use it directly
    if (protocol.next_expected_date) {
      const nextDate = new Date(protocol.next_expected_date + 'T00:00:00');
      const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

      const statusText = daysUntil <= 0 ? 'Refill overdue' :
                         daysUntil <= 3 ? `${daysUntil}d — Refill soon` :
                         daysUntil <= 14 ? `${daysUntil} days until refill` :
                         `~${Math.floor(daysUntil / 7)} weeks until refill`;

      return { days_remaining: daysUntil, status_text: statusText };
    }

    const supplyType = (protocol.supply_type || '').toLowerCase();
    const selectedDose = (protocol.selected_dose || protocol.current_dose || '').toLowerCase();
    const lastRefillDate = protocol.last_refill_date || protocol.start_date;

    if (lastRefillDate) {
      const refillDate = new Date(lastRefillDate + 'T00:00:00');
      const daysSinceRefill = Math.ceil((today - refillDate) / (1000 * 60 * 60 * 24));

      if (supplyType.includes('vial') || selectedDose.includes('vial')) {
        // Determine vial size
        const is10ml = supplyType.includes('10') || selectedDose.includes('10ml');
        const vialMl = is10ml ? 10 : 5;

        // Parse dose per injection - but NOT from vial descriptions
        let dosePerInjection = 0.4; // default for male HRT
        const doseField = protocol.dose_per_injection || protocol.frequency || '';

        // Try to find dose from dose_per_injection or frequency field first
        let doseMatch = (doseField || '').toString().match(/^(\d+\.?\d*)\s*ml/i) ||
                        (doseField || '').toString().match(/(\d+\.?\d*)\s*ml/i);

        // If not found there, try selected_dose but ONLY if it doesn't describe a vial
        if (!doseMatch && !selectedDose.includes('vial')) {
          doseMatch = selectedDose.match(/^(\d+\.?\d*)\s*ml/i);
        }

        // Also try to parse mg and convert (at 200mg/ml concentration)
        if (!doseMatch) {
          const mgMatch = (doseField || selectedDose).match(/(\d+)\s*mg/i);
          if (mgMatch && !selectedDose.includes('@')) {
            // Convert mg to ml assuming 200mg/ml concentration
            dosePerInjection = parseInt(mgMatch[1]) / 200;
          }
        } else {
          dosePerInjection = parseFloat(doseMatch[1]);
        }

        // Sanity check - dose should be between 0.1ml and 1ml for HRT
        if (dosePerInjection < 0.1 || dosePerInjection > 1) {
          dosePerInjection = 0.4; // fall back to default
        }

        const injectionsPerWeek = protocol.injections_per_week || 2;
        const weeksSupply = Math.floor(vialMl / (dosePerInjection * injectionsPerWeek));
        const vialDays = weeksSupply * 7;
        const daysRemaining = vialDays - daysSinceRefill;

        const statusText = daysRemaining <= 0 ? 'Refill overdue' :
                           daysRemaining <= 14 ? `${daysRemaining}d - Refill soon` :
                           `~${Math.floor(daysRemaining / 7)} weeks left`;

        return { days_remaining: daysRemaining, total_days: vialDays, status_text: statusText };
      } else {
        const is4Week = supplyType.includes('4') || supplyType.includes('four') || supplyType.includes('month');
        // HRT subscriptions are 30-day cycles; only use 14 if explicitly prefilled_2week
        const supplyDays = is4Week ? 28 : (supplyType.includes('2') || supplyType.includes('two') ? 14 : 30);
        const daysRemaining = supplyDays - daysSinceRefill;

        const statusText = daysRemaining <= 0 ? 'Refill overdue' :
                           daysRemaining <= 3 ? `${daysRemaining}d - Refill soon` :
                           `${daysRemaining} days left`;

        return { days_remaining: daysRemaining, total_days: supplyDays, status_text: statusText };
      }
    }
  }

  // ===== PEPTIDE — always use date-based tracking (calendar days, not injection count) =====
  if (isPeptide && protocol.end_date) {
    const endDate = new Date(protocol.end_date + 'T23:59:59');
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    // Calculate total days from start_date → end_date (handles extensions/renewals correctly)
    let totalDays = 30;
    if (protocol.start_date) {
      const startDate = new Date(protocol.start_date + 'T00:00:00');
      const endDateCalc = new Date(protocol.end_date + 'T00:00:00');
      totalDays = Math.max(1, Math.round((endDateCalc - startDate) / (1000 * 60 * 60 * 24)));
    } else {
      const programName = (protocol.program_name || '').toLowerCase();
      const dayMatch = programName.match(/(\d+)[\s-]*day/i);
      if (dayMatch) totalDays = parseInt(dayMatch[1]);
    }

    const statusText = daysRemaining <= 0 ? 'Renewal due' :
                       daysRemaining <= 3 ? `${daysRemaining}d left!` :
                       `${daysRemaining} days left`;

    return { days_remaining: daysRemaining, total_days: totalDays, status_text: statusText };
  }

  // ===== SESSION-BASED (IV, HBOT, RLT, Combos, Injections) =====
  // Check BEFORE date-based — protocols with total_sessions should always show session progress
  if (protocol.total_sessions && protocol.total_sessions > 0) {
    const sessionsUsed = protocol.sessions_used || 0;
    const sessionsRemaining = protocol.total_sessions - sessionsUsed;
    const statusText = sessionsRemaining <= 0 ? 'All sessions used' :
                       `${sessionsUsed} of ${protocol.total_sessions} sessions`;
    return { sessions_remaining: sessionsRemaining, total_sessions: protocol.total_sessions, status_text: statusText };
  }

  // ===== DATE-BASED FALLBACK =====
  if (protocol.end_date) {
    const endDate = new Date(protocol.end_date + 'T23:59:59');
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    let totalDays = 30;
    const programName = (protocol.program_name || '').toLowerCase();
    if (programName.includes('7')) totalDays = 7;
    else if (programName.includes('10')) totalDays = 10;
    else if (programName.includes('14')) totalDays = 14;
    else if (programName.includes('20')) totalDays = 20;
    else if (programName.includes('30')) totalDays = 30;

    const statusText = daysRemaining <= 0 ? 'Protocol ended' :
                       daysRemaining <= 3 ? `${daysRemaining}d left!` :
                       `${daysRemaining} days left`;

    return { days_remaining: daysRemaining, total_days: totalDays, status_text: statusText };
  }

  return { days_remaining: null, status_text: 'Active' };
}

// Get category for protocol (for color coding)
function getProtocolCategory(protocol) {
  const programType = (protocol.program_type || protocol.program_name || '').toLowerCase();

  if (programType.includes('hrt') || programType.includes('testosterone') || programType.includes('hormone')) {
    return 'hrt';
  }
  if (programType.includes('weight') || programType.includes('glp') || programType.includes('tirzepatide') || programType.includes('semaglutide')) {
    return 'weight_loss';
  }
  if (programType.includes('peptide') || programType.includes('bpc') || programType.includes('tb-500') || programType.includes('recovery') || programType.includes('month_program') || programType.includes('jumpstart') || programType.includes('maintenance_4week') || programType.includes('gh_peptide')) {
    return 'peptide';
  }
  if (programType.includes('iv') || programType.includes('infusion')) {
    return 'iv';
  }
  if (programType.includes('hbot') || programType.includes('hyperbaric')) {
    return 'hbot';
  }
  if (programType.includes('rlt') || programType.includes('red_light') || programType.includes('red light')) {
    return 'rlt';
  }
  if (programType.includes('injection') || programType.includes('b12') || programType.includes('vitamin') || programType.includes('nad')) {
    return 'injection';
  }
  if (programType.includes('lab')) {
    return 'labs';
  }
  // Fall back to checking medication name when program_type is generic
  const med = (protocol.medication || '').toLowerCase();
  if (med.includes('nad')) return 'injection';
  if (med.includes('b12') || med.includes('lipo') || med.includes('taurine') || med.includes('toradol') || med.includes('glutathione')) return 'injection';
  if (med.includes('semaglutide') || med.includes('tirzepatide') || med.includes('retatrutide')) return 'weight_loss';
  if (med.includes('testosterone') || med.includes('estradiol') || med.includes('progesterone')) return 'hrt';
  if (med.includes('bpc') || med.includes('tb-500') || med.includes('recovery') || med.includes('glow') || med.includes('ghk')) return 'peptide';
  return 'other';
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  if (req.method === 'GET') {
    try {
      // Get patient details
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError || !patient) {
        console.error('Patient not found:', patientError);
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Get ALL protocols for this patient
      const { data: allProtocols, error: protocolsError } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      if (protocolsError) {
        console.error('Error fetching protocols:', protocolsError);
      }

      // Split and format protocols
      const activeProtocols = [];
      const completedProtocols = [];

      (allProtocols || []).forEach(protocol => {
        const tracking = calculateRemaining(protocol);
        const category = getProtocolCategory(protocol);

        const formatted = {
          ...protocol,
          days_remaining: tracking.days_remaining,
          total_days: tracking.total_days,
          sessions_remaining: tracking.sessions_remaining,
          status_text: tracking.status_text,
          category
        };

        // Ongoing protocols — never auto-complete (need manual follow-up for renewals)
        const isWeightLoss = (protocol.program_type || '').toLowerCase().includes('weight');
        const isPeptideProto = (protocol.program_type || '').toLowerCase() === 'peptide';
        const isHRT = (protocol.program_type || '').toLowerCase() === 'hrt';
        const neverAutoComplete = isWeightLoss || isPeptideProto || isHRT;
        const isCompleted =
          protocol.status === 'completed' ||
          (!neverAutoComplete && tracking.days_remaining !== null && tracking.days_remaining <= -7) ||
          (!neverAutoComplete && tracking.sessions_remaining !== undefined && tracking.sessions_remaining <= 0 && protocol.total_sessions > 0);

        // Skip labs — they live in the Labs pipeline, not in Active Protocols
        if (protocol.program_type === 'labs') return;

        if (isCompleted || protocol.status === 'merged') {
          completedProtocols.push(formatted);
        } else if (protocol.status !== 'cancelled') {
          activeProtocols.push(formatted);
        }
      });

      // Extract lab pipeline protocols (program_type = 'labs', not cancelled)
      const labProtocols = (allProtocols || [])
        .filter(p => p.program_type === 'labs' && p.status !== 'cancelled')
        .map(p => ({
          id: p.id,
          program_name: p.program_name,
          medication: p.medication,
          status: p.status,
          start_date: p.start_date,
          notes: p.notes,
          delivery_method: p.delivery_method,
          updated_at: p.updated_at,
          created_at: p.created_at,
        }));

      // Get pending lab orders
      const { data: pendingLabOrders } = await supabase
        .from('lab_orders')
        .select('*')
        .eq('patient_id', id)
        .eq('status', 'pending')
        .order('order_date', { ascending: false });

      // Get lab results (from main labs table — used for HRT schedule matching)
      const { data: labs } = await supabase
        .from('labs')
        .select('id, patient_id, test_date, lab_type, panel_type, lab_provider, status, completed_date, results_received_date')
        .eq('patient_id', id)
        .order('test_date', { ascending: false });

      // Get pending purchases — a purchase is pending if no protocol has been linked
      // Check BOTH protocol_created flag AND protocol_id (belt and suspenders)
      let pendingNotifications = [];

      const { data: purchasesByPatientId } = await supabase
        .from('purchases')
        .select('*')
        .eq('patient_id', id)
        .eq('protocol_created', false)
        .is('protocol_id', null)
        .eq('dismissed', false)
        .order('purchase_date', { ascending: false });

      if (purchasesByPatientId && purchasesByPatientId.length > 0) {
        pendingNotifications = purchasesByPatientId;
      } else if (patient.ghl_contact_id) {
        const { data: purchasesByGhl } = await supabase
          .from('purchases')
          .select('*')
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .eq('protocol_created', false)
          .is('protocol_id', null)
          .eq('dismissed', false)
          .order('purchase_date', { ascending: false });

        pendingNotifications = purchasesByGhl || [];
      }

      // ===== NEW: Get intake forms =====
      let intakes = [];
      const intakeFields = 'id, first_name, last_name, email, phone, date_of_birth, gender, preferred_name, submitted_at, pdf_url, symptoms, symptom_followups, symptom_duration, photo_id_url, signature_url, patient_id, ghl_contact_id, how_heard, how_heard_other, street_address, city, state, postal_code, country, allergies, allergy_reactions, has_allergies, on_medications, current_medications, medication_notes, medical_conditions, on_hrt, hrt_details, additional_notes, is_minor, guardian_name, guardian_relationship, has_pcp, pcp_name, recent_hospitalization, hospitalization_reason';

      // Try by patient_id first
      const { data: intakesByPatientId } = await supabase
        .from('intakes')
        .select(intakeFields)
        .eq('patient_id', id)
        .order('submitted_at', { ascending: false });

      if (intakesByPatientId && intakesByPatientId.length > 0) {
        intakes = intakesByPatientId;
      }

      // Also try ghl_contact_id if we haven't found any yet
      if (intakes.length === 0 && patient.ghl_contact_id) {
        const { data: intakesByGhl } = await supabase
          .from('intakes')
          .select(intakeFields)
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .order('submitted_at', { ascending: false });

        if (intakesByGhl && intakesByGhl.length > 0) {
          intakes = intakesByGhl;
        }
      }

      // Also try email if we still haven't found any
      if (intakes.length === 0 && patient.email) {
        const { data: intakesByEmail } = await supabase
          .from('intakes')
          .select(intakeFields)
          .ilike('email', patient.email)  // Case-insensitive match
          .order('submitted_at', { ascending: false });

        if (intakesByEmail && intakesByEmail.length > 0) {
          intakes = intakesByEmail;
        }
      }

      // ===== NEW: Get sessions/visits =====
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*, protocols(program_name, program_type)')
        .eq('patient_id', id)
        .order('session_date', { ascending: false })
        .limit(50);

      // ===== NEW: Get symptoms questionnaires (legacy) =====
      const { data: symptomResponses } = await supabase
        .from('symptoms')
        .select('*')
        .eq('patient_id', id)
        .order('symptom_date', { ascending: false })
        .limit(10);

      // ===== Get questionnaire responses (19-question symptom questionnaire) =====
      const { data: questionnaireResponses } = await supabase
        .from('symptom_responses')
        .select('*')
        .eq('patient_id', id)
        .eq('response_type', 'baseline')
        .order('submitted_at', { ascending: false })
        .limit(20);

      // ===== NEW: Get consent forms =====
      let consents = [];
      const consentFields = 'id, consent_type, first_name, last_name, email, phone, consent_date, consent_given, signature_url, pdf_url, submitted_at, patient_id, ghl_contact_id';

      // Try by patient_id first
      const { data: consentsByPatientId } = await supabase
        .from('consents')
        .select(consentFields)
        .eq('patient_id', id)
        .order('submitted_at', { ascending: false });

      if (consentsByPatientId && consentsByPatientId.length > 0) {
        consents = consentsByPatientId;
      }

      // Also try ghl_contact_id if we haven't found any yet
      if (consents.length === 0 && patient.ghl_contact_id) {
        const { data: consentsByGhl } = await supabase
          .from('consents')
          .select(consentFields)
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .order('submitted_at', { ascending: false });

        if (consentsByGhl && consentsByGhl.length > 0) {
          consents = consentsByGhl;
        }
      }

      // Try email if we haven't found any consents yet
      if (consents.length === 0 && patient.email) {
        const { data: consentsByEmail } = await supabase
          .from('consents')
          .select(consentFields)
          .ilike('email', patient.email)
          .order('submitted_at', { ascending: false });

        if (consentsByEmail && consentsByEmail.length > 0) {
          consents = consentsByEmail;
        }
      }

      // Try phone (normalized last 10 digits) if we still haven't found any
      if (consents.length === 0 && patient.phone) {
        const normalizedPhone = patient.phone.replace(/\D/g, '').slice(-10);
        if (normalizedPhone.length === 10) {
          const { data: consentsByPhone } = await supabase
            .from('consents')
            .select(consentFields)
            .or(`phone.ilike.%${normalizedPhone}%`)
            .order('submitted_at', { ascending: false });

          if (consentsByPhone && consentsByPhone.length > 0) {
            consents = consentsByPhone;
          }
        }
      }

      // Backfill patient_id on consents found via fallback (ghl, email, phone)
      if (consents.length > 0) {
        const unlinkedIds = consents
          .filter(c => c.patient_id !== id)
          .map(c => c.id);
        if (unlinkedIds.length > 0) {
          await supabase.from('consents')
            .update({ patient_id: id })
            .in('id', unlinkedIds);
        }
      }

      // V2: Backfill patient_id on intakes found via fallback (same logic as consents)
      if (intakes.length > 0) {
        const unlinkedIntakeIds = intakes
          .filter(i => i.patient_id !== id)
          .map(i => i.id);
        if (unlinkedIntakeIds.length > 0) {
          await supabase.from('intakes')
            .update({ patient_id: id })
            .in('id', unlinkedIntakeIds);
        }
      }

      // ===== NEW: Get medical documents =====
      const { data: medicalDocuments } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('patient_id', id)
        .order('uploaded_at', { ascending: false });

      // ===== Get assessment leads (by email match) =====
      let assessments = [];
      if (patient.email) {
        const { data: assessmentData } = await supabase
          .from('assessment_leads')
          .select('id, first_name, last_name, email, phone, assessment_path, injury_type, injury_location, injury_duration, in_physical_therapy, recovery_goal, primary_symptom, symptom_duration, has_recent_labs, tried_hormone_therapy, energy_goal, additional_info, medical_history, pdf_url, created_at')
          .eq('email', patient.email.toLowerCase().trim())
          .order('created_at', { ascending: false });
        assessments = assessmentData || [];
      }

      // ===== Get tasks linked to this patient =====
      let patientTasks = [];
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      if (tasksData && tasksData.length > 0) {
        // Enrich with employee names
        const empIds = [...new Set([
          ...tasksData.map(t => t.assigned_to),
          ...tasksData.map(t => t.assigned_by),
        ])];
        const { data: empNames } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', empIds);
        const empMap = {};
        (empNames || []).forEach(e => { empMap[e.id] = e.name; });
        patientTasks = tasksData.map(t => ({
          ...t,
          assigned_to_name: empMap[t.assigned_to] || 'Unknown',
          assigned_by_name: empMap[t.assigned_by] || 'Unknown',
        }));
      }

      // ===== Weight loss service logs (for progress chart) =====
      const { data: weightLossLogs } = await supabase
        .from('service_logs')
        .select('id, protocol_id, entry_date, medication, dosage, weight, quantity, notes, fulfillment_method, tracking_number')
        .eq('patient_id', id)
        .eq('category', 'weight_loss')
        .order('entry_date', { ascending: true });

      // ===== Protocol logs (for inline trackers — injection calendars, session grids) =====
      const protocolIds = (allProtocols || []).map(p => p.id).filter(Boolean);
      let protocolLogs = [];
      if (protocolIds.length > 0) {
        const { data: pLogs } = await supabase
          .from('protocol_logs')
          .select('id, protocol_id, log_type, log_date, weight, dose, notes, created_at')
          .in('protocol_id', protocolIds)
          .order('log_date', { ascending: true });
        protocolLogs = pLogs || [];
      }

      // ===== V2: All service logs (for timeline + visits tab) =====
      const { data: serviceLogs } = await supabase
        .from('service_logs')
        .select('id, category, entry_type, entry_date, medication, dosage, quantity, administered_by, notes, created_at, protocol_id, fulfillment_method, tracking_number')
        .eq('patient_id', id)
        .order('entry_date', { ascending: false })
        .limit(200);

      // ===== V2: Communications log =====
      const { data: commsLog } = await supabase
        .from('comms_log')
        .select('id, channel, message_type, message, status, recipient, subject, direction, source, created_at')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })
        .limit(200);

      // ===== V2: All purchases (not just pending) =====
      // Single query: match by patient_id OR ghl_contact_id
      const purchaseFilter = patient.ghl_contact_id
        ? `patient_id.eq.${id},ghl_contact_id.eq.${patient.ghl_contact_id}`
        : `patient_id.eq.${id}`;
      const { data: allPurchases } = await supabase
        .from('purchases')
        .select('*')
        .or(purchaseFilter)
        .order('purchase_date', { ascending: false });

      // ===== V2: Invoices =====
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      // ===== Subscriptions (with lazy Stripe sync) =====
      let { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('patient_id', id)
        .order('started_at', { ascending: false });

      // Lazy sync: if patient has a Stripe customer, backfill missing + update stale subscriptions
      if (patient.stripe_customer_id) {
        try {
          const stripeSubs = await stripe.subscriptions.list({
            customer: patient.stripe_customer_id,
            limit: 100,
            expand: ['data.latest_invoice'],
          });

          const existingStripeIds = new Set(
            (subscriptions || []).map(s => s.stripe_subscription_id).filter(Boolean)
          );

          let needsRefresh = false;

          for (const sub of stripeSubs.data) {
            const item = sub.items.data[0];
            const price = item?.price;
            // Use latest invoice amount_paid to reflect discounts/coupons; fall back to base price
            const invoice = sub.latest_invoice && typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null;
            const actualAmount = invoice?.amount_paid != null ? invoice.amount_paid : (price?.unit_amount || 0);
            const record = {
              status: sub.status,
              amount_cents: actualAmount,
              currency: price?.currency || 'usd',
              interval: price?.recurring?.interval || 'month',
              interval_count: price?.recurring?.interval_count || 1,
              current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
              current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
              cancel_at_period_end: sub.cancel_at_period_end,
              canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            };

            if (existingStripeIds.has(sub.id)) {
              // Update existing — keep status/amount/dates fresh
              await supabase.from('subscriptions').update(record).eq('stripe_subscription_id', sub.id);
              needsRefresh = true;
            } else {
              // Insert missing subscription
              await supabase.from('subscriptions').insert({
                ...record,
                patient_id: id,
                stripe_subscription_id: sub.id,
                stripe_customer_id: patient.stripe_customer_id,
                description: sub.metadata?.description || price?.nickname || 'Subscription',
                service_category: sub.metadata?.service_category || null,
                started_at: sub.start_date ? new Date(sub.start_date * 1000).toISOString() : null,
              });
              needsRefresh = true;
            }
          }

          if (needsRefresh) {
            const { data: refreshed } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('patient_id', id)
              .order('started_at', { ascending: false });
            subscriptions = refreshed || subscriptions;
          }
        } catch (stripeErr) {
          console.error('Stripe subscription lazy sync error (non-blocking):', stripeErr.message);
        }
      }

      // ===== Medications (PF import + manual) =====
      const { data: medications } = await supabase
        .from('patient_medications')
        .select('*')
        .eq('patient_id', id)
        .order('is_active', { ascending: false })
        .order('medication_name', { ascending: true });

      // ===== Prescriptions =====
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      // ===== Get patient notes =====
      let patientNotes = null;
      const { data: notesData, error: notesErr } = await supabase
        .from('patient_notes')
        .select('id, body, raw_input, note_date, source, created_by, created_at, pinned, protocol_id, protocol_name, appointment_id, encounter_service, signed_by, signed_at, status, parent_note_id, note_category')
        .eq('patient_id', id)
        .order('note_date', { ascending: false });
      if (notesErr) {
        // Fallback if new columns don't exist yet (migration not run)
        const { data: notesFallback } = await supabase
          .from('patient_notes')
          .select('id, body, note_date, source, created_at')
          .eq('patient_id', id)
          .order('note_date', { ascending: false });
        patientNotes = notesFallback;
      } else {
        patientNotes = notesData;
      }

      // Build encounter note counts per appointment
      const encounterNoteCounts = {};
      (patientNotes || []).forEach(n => {
        if (n.appointment_id) {
          encounterNoteCounts[n.appointment_id] = (encounterNoteCounts[n.appointment_id] || 0) + 1;
        }
      });

      // ===== NEW: Get clinic appointments =====
      let appointments = [];

      // Try by patient_id first
      const { data: appointmentsByPatientId } = await supabase
        .from('clinic_appointments')
        .select('*')
        .eq('patient_id', id)
        .order('start_time', { ascending: false })
        .limit(50);

      if (appointmentsByPatientId && appointmentsByPatientId.length > 0) {
        appointments = appointmentsByPatientId;
      }

      // Also try ghl_contact_id if we haven't found any yet
      if (appointments.length === 0 && patient.ghl_contact_id) {
        const { data: appointmentsByGhl } = await supabase
          .from('clinic_appointments')
          .select('*')
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .order('start_time', { ascending: false })
          .limit(50);

        if (appointmentsByGhl && appointmentsByGhl.length > 0) {
          appointments = appointmentsByGhl;
        }
      }

      // ===== Also fetch from native appointments table (includes GHL CSV imports) =====
      const { data: nativeAppointments } = await supabase
        .from('appointments')
        .select('id, patient_id, patient_name, service_name, service_category, provider, start_time, end_time, duration_minutes, status, notes, source, ghl_appointment_id, created_at')
        .eq('patient_id', id)
        .order('start_time', { ascending: false })
        .limit(200);

      // Normalize native appointments to match clinic_appointments shape
      const normalizedNative = (nativeAppointments || []).map(a => ({
        id: a.id,
        calendar_name: a.service_name,
        appointment_title: a.service_category,
        start_time: a.start_time,
        end_time: a.end_time,
        status: a.status,
        notes: a.notes,
        source: a.source || 'native',
        provider: a.provider,
        duration_minutes: a.duration_minutes,
        ghl_appointment_id: a.ghl_appointment_id,
        _table: 'appointments'
      }));

      // Tag clinic_appointments with their source
      const taggedClinic = appointments.map(a => ({ ...a, _table: 'clinic_appointments' }));

      // Merge + deduplicate by ghl_appointment_id or start_time+calendar_name
      const seen = new Set();
      const merged = [];
      for (const apt of [...taggedClinic, ...normalizedNative]) {
        const key = apt.ghl_appointment_id || `${apt.start_time}-${apt.calendar_name}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(apt);
        }
      }
      merged.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      appointments = merged.map(a => ({
        ...a,
        encounter_note_count: encounterNoteCounts[a.id] || 0,
      }));

      // Extract demographics from intake if patient record is missing them
      let intakeDemographics = null;
      const firstIntake = intakes?.[0];
      if (firstIntake) {
        const hasMissingDemographics = !patient.date_of_birth || !patient.gender || !patient.first_name || !patient.last_name || !patient.preferred_name || !patient.address;
        if (hasMissingDemographics || firstIntake.how_heard) {
          intakeDemographics = {
            date_of_birth: firstIntake.date_of_birth,
            gender: firstIntake.gender,
            first_name: firstIntake.first_name,
            last_name: firstIntake.last_name,
            phone: firstIntake.phone,
            email: firstIntake.email,
            preferred_name: firstIntake.preferred_name || null,
            how_heard: firstIntake.how_heard || null,
            street_address: firstIntake.street_address || null,
            city: firstIntake.city || null,
            state: firstIntake.state || null,
            postal_code: firstIntake.postal_code || null,
          };
        }
      }

      // Calculate stats
      const upcomingAppointments = appointments.filter(apt => new Date(apt.start_time) >= new Date());
      const stats = {
        activeCount: activeProtocols.length,
        completedCount: completedProtocols.length,
        pendingLabsCount: pendingLabOrders?.length || 0,
        totalProtocols: allProtocols?.length || 0,
        intakeCount: intakes?.length || 0,
        consentCount: consents?.length || 0,
        documentCount: medicalDocuments?.length || 0,
        sessionCount: sessions?.length || 0,
        appointmentCount: appointments?.length || 0,
        upcomingAppointments: upcomingAppointments?.length || 0
      };

      console.log(`Patient ${patient.name}: ${activeProtocols.length} active, ${completedProtocols.length} completed, ${intakes?.length || 0} intakes, ${consents?.length || 0} consents`);

      return res.status(200).json({
        patient,
        intakeDemographics,
        activeProtocols,
        completedProtocols,
        pendingNotifications: pendingNotifications || [],
        labProtocols,
        pendingLabOrders: pendingLabOrders || [],
        labs: labs || [],
        intakes: intakes || [],
        consents: consents || [],
        medicalDocuments: medicalDocuments || [],
        assessments: assessments || [],
        patientTasks: patientTasks || [],
        sessions: sessions || [],
        symptomResponses: symptomResponses || [],
        questionnaireResponses: questionnaireResponses || [],
        appointments: appointments || [],
        notes: patientNotes || [],
        weightLossLogs: weightLossLogs || [],
        protocolLogs: protocolLogs || [],
        // V2 additions
        serviceLogs: serviceLogs || [],
        commsLog: commsLog || [],
        allPurchases: allPurchases || [],
        invoices: invoices || [],
        subscriptions: subscriptions || [],
        medications: medications || [],
        prescriptions: prescriptions || [],
        stats
      });

    } catch (error) {
      console.error('Patient API error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const body = req.body;

      // Only allow fields that exist in the patients table
      const allowedFields = [
        'first_name', 'last_name', 'name', 'preferred_name', 'email', 'phone',
        'date_of_birth', 'gender', 'ghl_contact_id',
        'address', 'city', 'state', 'zip_code',
        'notes', 'tags', 'status'
      ];

      // Date fields that need empty-string → null conversion
      const dateFields = ['date_of_birth'];

      const updates = {};
      for (const [key, value] of Object.entries(body)) {
        if (allowedFields.includes(key)) {
          // Convert empty strings to null for date fields
          if (dateFields.includes(key) && (value === '' || value === null)) {
            updates[key] = null;
          } else {
            updates[key] = value;
          }
        }
      }

      // Auto-sync the full name field
      if (updates.first_name !== undefined || updates.last_name !== undefined) {
        const firstName = updates.first_name ?? body.first_name ?? '';
        const lastName = updates.last_name ?? body.last_name ?? '';
        updates.name = `${firstName} ${lastName}`.trim() || null;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // Try update — if columns don't exist, retry without them
      let { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      // If a column doesn't exist, strip unknown columns and retry
      if (error && error.message && error.message.includes('column')) {
        const maybeNewColumns = ['address', 'city', 'state', 'zip_code', 'preferred_name'];
        const retryUpdates = { ...updates };
        maybeNewColumns.forEach(col => delete retryUpdates[col]);

        if (Object.keys(retryUpdates).length > 0) {
          console.log('Retrying patient update without address columns');
          const retry = await supabase
            .from('patients')
            .update(retryUpdates)
            .eq('id', id)
            .select()
            .single();
          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        console.error('Patient update error:', error);
        return res.status(500).json({ error: error.message || 'Failed to update patient' });
      }

      return res.status(200).json({ patient: data });
    } catch (error) {
      console.error('Patient PATCH error:', error);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
