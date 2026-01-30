// /pages/api/admin/pipeline.js
// Pipeline API - Returns protocols with patient names AND tracking status
// Range Medical - FIXED 2026-01-28
// Issue: Previous fix got names right but lost tracking calculations

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ================================================================
// PROTOCOL TRACKING CALCULATOR
// Returns days_remaining, status_text, urgency, category, delivery
// ================================================================
function getProtocolTracking(protocol) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const programType = (protocol.program_type || '').toLowerCase();
  const programName = (protocol.program_name || '').toLowerCase();
  const medication = (protocol.medication || '').toLowerCase();
  const deliveryMethod = (protocol.delivery_method || '').toLowerCase();
  const supplyType = (protocol.supply_type || '').toLowerCase();
  const lastRefill = protocol.last_refill_date;
  const selectedDose = (protocol.selected_dose || '').toLowerCase();
  
  const isTakeHome = deliveryMethod === 'take_home' || deliveryMethod.includes('take');
  const isWeightLoss = programType === 'weight_loss' || programName.includes('weight') || 
    medication.includes('semaglutide') || medication.includes('tirzepatide') || medication.includes('retatrutide');
  const isHRT = programType === 'hrt' || programName.includes('hrt') || 
    medication.includes('testosterone') || medication.includes('nandrolone');
  const isPeptide = programType === 'peptide' || programName.includes('peptide');
  const isSessionBased = ['iv', 'hbot', 'rlt', 'injection'].includes(programType);

  // ===== WEIGHT LOSS =====
  if (isWeightLoss) {
    if (isTakeHome && protocol.total_sessions > 0) {
      const totalInjections = protocol.total_sessions;
      const sessionsUsed = protocol.sessions_used || 0;
      const refillDate = lastRefill ? new Date(lastRefill + 'T00:00:00') : 
                         protocol.start_date ? new Date(protocol.start_date + 'T00:00:00') : null;
      
      if (refillDate) {
        const totalDays = totalInjections * 7;
        const endDate = new Date(refillDate);
        endDate.setDate(endDate.getDate() + totalDays);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          days_remaining: daysRemaining,
          total_days: totalDays,
          sessions_used: sessionsUsed,
          total_sessions: totalInjections,
          status_text: daysRemaining <= 0 ? 'Refill needed' : `${daysRemaining} days left`,
          tracking_type: 'time_based',
          urgency: daysRemaining <= 0 ? 'overdue' : daysRemaining <= 3 ? 'ending_soon' : daysRemaining <= 14 ? 'active' : 'just_started',
          category: 'weight_loss',
          delivery: 'take_home'
        };
      }
    }
    
    if (!isTakeHome && protocol.total_sessions > 0) {
      const sessionsUsed = protocol.sessions_used || 0;
      const totalSessions = protocol.total_sessions;
      const sessionsRemaining = totalSessions - sessionsUsed;
      
      return {
        sessions_used: sessionsUsed,
        total_sessions: totalSessions,
        sessions_remaining: sessionsRemaining,
        status_text: `${sessionsUsed}/${totalSessions} injections`,
        tracking_type: 'session_based',
        urgency: sessionsRemaining <= 0 ? 'completed' : sessionsRemaining <= 1 ? 'ending_soon' : 'active',
        category: 'weight_loss',
        delivery: 'in_clinic'
      };
    }
    
    return {
      status_text: 'No tracking data',
      tracking_type: 'unknown',
      urgency: 'active',
      category: 'weight_loss',
      delivery: isTakeHome ? 'take_home' : 'in_clinic'
    };
  }

  // ===== HRT =====
  if (isHRT) {
    if (supplyType.includes('vial') || selectedDose.includes('vial')) {
      const is10ml = supplyType.includes('10') || selectedDose.includes('10');
      const vialMl = is10ml ? 10 : 5;

      // Parse dose per injection - but NOT from vial descriptions
      // Look for pattern like "0.4ml" at start of string, or in a separate dose_per_injection field
      let dosePerInjection = 0.4; // default for male HRT
      const doseField = protocol.dose_per_injection || protocol.frequency || '';

      // Try to find dose from dose_per_injection or frequency field first
      let doseMatch = doseField.toString().match(/^(\d+\.?\d*)\s*ml/i) ||
                      doseField.toString().match(/(\d+\.?\d*)\s*ml/i);

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
      
      if (lastRefill) {
        const refillDate = new Date(lastRefill + 'T00:00:00');
        const endDate = new Date(refillDate);
        endDate.setDate(endDate.getDate() + (weeksSupply * 7));
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        const weeksRemaining = Math.ceil(daysRemaining / 7);
        
        return {
          days_remaining: daysRemaining,
          weeks_remaining: weeksRemaining,
          total_weeks: weeksSupply,
          status_text: daysRemaining <= 0 ? 'Refill needed' : `~${weeksRemaining} weeks left`,
          tracking_type: 'vial_based',
          urgency: daysRemaining <= 0 ? 'overdue' : daysRemaining <= 14 ? 'ending_soon' : daysRemaining <= 28 ? 'active' : 'just_started',
          category: 'hrt',
          delivery: 'take_home'
        };
      }
    } else if (supplyType.includes('prefill') || supplyType.includes('1week') || supplyType.includes('2week') || supplyType.includes('4week') || selectedDose.includes('prefill')) {
      let numPrefilled = 4;
      const prefilledMatch = selectedDose.match(/(\d+)\s*prefill/i);
      if (prefilledMatch) numPrefilled = parseInt(prefilledMatch[1]);
      
      // Check for specific week supply types
      if (supplyType.includes('1week') || supplyType.includes('1_week')) numPrefilled = 2;
      else if (supplyType.includes('2week') || supplyType.includes('2_week')) numPrefilled = 4;
      else if (supplyType.includes('4week') || supplyType.includes('4_week')) numPrefilled = 8;
      
      const supplyDays = Math.ceil(numPrefilled / 2) * 7;
      
      if (lastRefill) {
        const refillDate = new Date(lastRefill + 'T00:00:00');
        const endDate = new Date(refillDate);
        endDate.setDate(endDate.getDate() + supplyDays);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          days_remaining: daysRemaining,
          total_days: supplyDays,
          status_text: daysRemaining <= 0 ? 'Refill needed' : `${daysRemaining} days left`,
          tracking_type: 'prefilled',
          urgency: daysRemaining <= 0 ? 'overdue' : daysRemaining <= 3 ? 'ending_soon' : daysRemaining <= 7 ? 'active' : 'just_started',
          category: 'hrt',
          delivery: 'take_home'
        };
      }
    }
    
    if (protocol.total_sessions > 0) {
      const sessionsUsed = protocol.sessions_used || 0;
      const totalSessions = protocol.total_sessions;
      
      return {
        sessions_used: sessionsUsed,
        total_sessions: totalSessions,
        status_text: `${sessionsUsed}/${totalSessions} sessions`,
        tracking_type: 'session_based',
        urgency: sessionsUsed >= totalSessions ? 'completed' : 'active',
        category: 'hrt',
        delivery: 'in_clinic'
      };
    }
    
    return {
      status_text: 'No tracking data',
      tracking_type: 'unknown',
      urgency: 'active',
      category: 'hrt',
      delivery: isTakeHome ? 'take_home' : 'in_clinic'
    };
  }

  // ===== PEPTIDE =====
  if (isPeptide) {
    if (protocol.end_date) {
      const endDate = new Date(protocol.end_date + 'T00:00:00');
      const startDate = protocol.start_date ? new Date(protocol.start_date + 'T00:00:00') : null;
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      const totalDays = startDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : null;
      
      let duration = totalDays;
      const durationMatch = programName.match(/(\d+)\s*day/i);
      if (durationMatch) duration = parseInt(durationMatch[1]);
      
      return {
        days_remaining: daysRemaining,
        total_days: duration || totalDays,
        status_text: daysRemaining <= 0 ? 'Completed' : `${daysRemaining} days left`,
        tracking_type: 'time_based',
        urgency: daysRemaining <= 0 ? 'completed' : daysRemaining <= 3 ? 'ending_soon' : daysRemaining <= 14 ? 'active' : 'just_started',
        category: 'peptide',
        delivery: isTakeHome ? 'take_home' : 'in_clinic'
      };
    }
    
    if (protocol.total_sessions > 0) {
      const sessionsUsed = protocol.sessions_used || 0;
      const totalSessions = protocol.total_sessions;
      
      return {
        sessions_used: sessionsUsed,
        total_sessions: totalSessions,
        status_text: `${sessionsUsed}/${totalSessions} sessions`,
        tracking_type: 'session_based',
        urgency: sessionsUsed >= totalSessions ? 'completed' : 'active',
        category: 'peptide',
        delivery: isTakeHome ? 'take_home' : 'in_clinic'
      };
    }
  }

  // ===== SESSION-BASED (IV, HBOT, RLT, Injection) =====
  if (isSessionBased || protocol.total_sessions > 0) {
    const sessionsUsed = protocol.sessions_used || 0;
    const totalSessions = protocol.total_sessions || 0;
    const sessionsRemaining = totalSessions - sessionsUsed;
    
    return {
      sessions_used: sessionsUsed,
      total_sessions: totalSessions,
      sessions_remaining: sessionsRemaining,
      status_text: totalSessions > 0 ? `${sessionsUsed}/${totalSessions} sessions` : 'No sessions',
      tracking_type: 'session_based',
      urgency: sessionsRemaining <= 0 ? 'completed' : sessionsRemaining <= 1 ? 'ending_soon' : 'active',
      category: programType.includes('iv') ? 'iv' : programType.includes('hbot') ? 'hbot' : programType.includes('rlt') ? 'rlt' : 'injection',
      delivery: isTakeHome ? 'take_home' : 'in_clinic'
    };
  }

  // ===== FALLBACK =====
  if (protocol.end_date) {
    const endDate = new Date(protocol.end_date + 'T00:00:00');
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    return {
      days_remaining: daysRemaining,
      status_text: daysRemaining <= 0 ? 'Completed' : `${daysRemaining} days left`,
      tracking_type: 'time_based',
      urgency: daysRemaining <= 0 ? 'completed' : daysRemaining <= 3 ? 'ending_soon' : 'active',
      category: 'other',
      delivery: isTakeHome ? 'take_home' : 'in_clinic'
    };
  }
  
  return {
    status_text: 'No tracking',
    tracking_type: 'unknown',
    urgency: 'active',
    category: programType || 'other',
    delivery: isTakeHome ? 'take_home' : 'in_clinic'
  };
}

// ================================================================
// MAIN API HANDLER
// ================================================================
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ============================================
    // FETCH ALL PATIENTS FOR GHL LOOKUP
    // ============================================
    const { data: allPatients } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id')
      .not('ghl_contact_id', 'is', null);
    
    const patientsByGhl = {};
    (allPatients || []).forEach(p => {
      if (p.ghl_contact_id) {
        patientsByGhl[p.ghl_contact_id] = p;
      }
    });

    // ============================================
    // FETCH PROTOCOLS WITH PATIENT JOIN
    // ============================================
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_type,
        program_name,
        medication,
        selected_dose,
        frequency,
        delivery_method,
        supply_type,
        start_date,
        end_date,
        last_refill_date,
        status,
        notes,
        total_sessions,
        sessions_used,
        starting_weight,
        created_at,
        updated_at,
        visit_frequency,
        scheduled_days,
        last_visit_date,
        next_expected_date,
        patients (
          id,
          name,
          email,
          phone,
          ghl_contact_id
        )
      `)
      .order('start_date', { ascending: false });

    if (protocolsError) {
      console.error('Error fetching protocols:', protocolsError);
      return res.status(500).json({ error: protocolsError.message });
    }

    // ============================================
    // FETCH LATEST WEIGHT FOR EACH PATIENT
    // ============================================
    const { data: latestWeights } = await supabase
      .from('injection_logs')
      .select('patient_id, weight, entry_date')
      .not('weight', 'is', null)
      .order('entry_date', { ascending: false });

    const weightByPatient = {};
    (latestWeights || []).forEach(w => {
      if (w.patient_id && !weightByPatient[w.patient_id]) {
        weightByPatient[w.patient_id] = w.weight;
      }
    });

    // ============================================
    // PROCESS PROTOCOLS
    // ============================================
    const endingSoon = [];
    const active = [];
    const justStarted = [];
    const needsFollowUp = [];
    const completedProtocols = [];

    (protocols || []).forEach(p => {
      // Get patient name - try JOIN first, then GHL lookup
      let patientName = p.patients?.name;
      let patientId = p.patient_id;
      let ghlContactId = p.patients?.ghl_contact_id;
      
      if (!patientName && ghlContactId && patientsByGhl[ghlContactId]) {
        patientName = patientsByGhl[ghlContactId].name;
        patientId = patientsByGhl[ghlContactId].id;
      }

      // Get tracking info
      const tracking = getProtocolTracking(p);

      // Build formatted protocol
      const formatted = {
        id: p.id,
        patient_id: patientId,
        patient_name: patientName || 'Unknown Patient',
        ghl_contact_id: ghlContactId,
        program_type: p.program_type,
        program_name: p.program_name,
        medication: p.medication,
        dose: p.selected_dose,
        selected_dose: p.selected_dose,
        frequency: p.frequency,
        delivery_method: p.delivery_method,
        supply_type: p.supply_type,
        start_date: p.start_date,
        end_date: p.end_date,
        last_refill_date: p.last_refill_date,
        status: p.status,
        notes: p.notes,
        total_sessions: p.total_sessions,
        sessions_used: p.sessions_used,
        starting_weight: p.starting_weight,
        current_weight: weightByPatient[patientId] || null,
        weight_lost: p.starting_weight && weightByPatient[patientId] 
          ? Math.round((p.starting_weight - weightByPatient[patientId]) * 10) / 10 
          : null,
        // TRACKING FIELDS - These were missing!
        ...tracking,
        delivery: tracking.delivery,
        category: tracking.category
      };

      // Sort into buckets
      if (p.status === 'completed' || tracking.urgency === 'completed') {
        completedProtocols.push(formatted);
      } else if (tracking.urgency === 'overdue' || tracking.urgency === 'ending_soon') {
        endingSoon.push(formatted);
      } else if (tracking.urgency === 'just_started') {
        justStarted.push(formatted);
      } else {
        active.push(formatted);
      }
    });

    // ============================================
    // FETCH PURCHASES NEEDING PROTOCOLS
    // ============================================
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: purchases } = await supabase
      .from('purchases')
      .select(`
        id,
        item_name,
        amount,
        purchase_date,
        patient_id,
        ghl_contact_id,
        protocol_created,
        dismissed,
        category
      `)
      .gte('purchase_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('purchase_date', { ascending: false });

    const needsProtocol = (purchases || [])
      .filter(p => !p.protocol_created && !p.dismissed)
      .filter(p => {
        const productName = (p.item_name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return ['peptide', 'hrt', 'weight_loss', 'weight loss', 'iv', 'hbot', 'rlt'].some(c => cat.includes(c)) ||
               productName.includes('peptide') ||
               productName.includes('protocol') ||
               productName.includes('weight loss') ||
               productName.includes('hrt') ||
               productName.includes('membership');
      })
      .map(p => ({
        id: p.id,
        item_name: p.item_name,
        amount: p.amount,
        purchase_date: p.purchase_date,
        patient_id: p.patient_id,
        ghl_contact_id: p.ghl_contact_id,
        category: p.category,
        patient_name: patientsByGhl[p.ghl_contact_id]?.name || 'Unknown'
      }));

    // ============================================
    // COUNT OVERDUE CLINIC VISITS
    // ============================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const overdueVisits = (protocols || []).filter(p => {
      if (p.status !== 'active') return false;
      if (p.delivery_method !== 'in_clinic') return false;
      if (!p.next_expected_date) return false;
      // Check if overdue (expected date is before today) and not visited today
      return p.next_expected_date < todayStr && p.last_visit_date !== todayStr;
    });

    // ============================================
    // RETURN RESPONSE
    // ============================================
    return res.status(200).json({
      success: true,
      counts: {
        ending_soon: endingSoon.length,
        active: active.length,
        just_started: justStarted.length,
        needs_followup: needsFollowUp.length,
        completed: completedProtocols.length,
        needs_protocol: needsProtocol.length,
        overdue_visits: overdueVisits.length
      },
      protocols: {
        ending_soon: endingSoon,
        active: active,
        just_started: justStarted,
        needs_follow_up: needsFollowUp,
        completed: completedProtocols.slice(0, 100)
      },
      purchases: {
        needs_protocol: needsProtocol,
        since_date: thirtyDaysAgo.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Pipeline API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
