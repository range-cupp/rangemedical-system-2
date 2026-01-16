// /pages/api/admin/pipeline.js
// Pipeline API - Returns purchases needing protocols, active, and completed
// Range Medical
// Updated with correct tracking logic for each protocol type

import { createClient } from '@supabase/supabase-js';

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
  const isPeptide = programType.includes('peptide') || programType.includes('bpc') || programType.includes('recovery');
  const isTakeHome = deliveryMethod.includes('take') || deliveryMethod.includes('home');
  const isInClinic = deliveryMethod.includes('clinic') || deliveryMethod.includes('in-clinic') || deliveryMethod.includes('in_clinic');

  // ===== WEIGHT LOSS =====
  if (isWeightLoss) {
    if (isTakeHome) {
      // Take-home weight loss: total_injections × 7 days from start_date
      // 2 injections = 2 weeks, 4 injections = 4 weeks
      const totalInjections = protocol.total_sessions || 4;
      const supplyDays = totalInjections * 7;
      
      if (protocol.start_date) {
        const startDate = new Date(protocol.start_date + 'T00:00:00');
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + supplyDays);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          days_remaining: daysRemaining,
          total_days: supplyDays,
          tracking_type: 'time_based',
          status_text: daysRemaining <= 0 ? 'Supply exhausted' : 
                       daysRemaining <= 3 ? `${daysRemaining}d - Refill soon` :
                       `${daysRemaining} days left`
        };
      }
    } else {
      // In-clinic weight loss: Track weekly visits
      // Should come in once per week
      if (protocol.total_sessions && protocol.sessions_used !== undefined) {
        const sessionsRemaining = protocol.total_sessions - (protocol.sessions_used || 0);
        return {
          sessions_remaining: sessionsRemaining,
          total_sessions: protocol.total_sessions,
          sessions_used: protocol.sessions_used || 0,
          tracking_type: 'session_based',
          status_text: sessionsRemaining <= 0 ? 'Complete' : `${sessionsRemaining} injections left`
        };
      }
    }
  }

  // ===== HRT =====
  if (isHRT) {
    const supplyType = (protocol.supply_type || '').toLowerCase();
    const dose = protocol.selected_dose || protocol.current_dose || '';
    const lastRefillDate = protocol.last_refill_date || protocol.start_date;
    
    if (!lastRefillDate) {
      return { days_remaining: null, tracking_type: 'unknown', status_text: 'No refill date' };
    }

    const refillDate = new Date(lastRefillDate + 'T00:00:00');
    const daysSinceRefill = Math.ceil((today - refillDate) / (1000 * 60 * 60 * 24));

    if (supplyType.includes('vial')) {
      // Vial: Calculate based on dose (200mg/ml × 10ml = 2000mg for male)
      // Female is 100mg/ml × 10ml = 1000mg (or 5ml = 500mg)
      const isFemale = dose.includes('10mg') || dose.includes('15mg') || dose.includes('20mg') || 
                       dose.includes('25mg') || dose.includes('30mg') || dose.includes('40mg') || 
                       dose.includes('50mg') || programType.includes('female');
      
      let weeklyMg = 120; // default male: 60mg × 2/week
      let totalMg = 2000; // male vial
      
      if (isFemale) {
        totalMg = 1000; // female: 100mg/ml × 10ml
        if (dose.includes('50mg')) weeklyMg = 100;
        else if (dose.includes('40mg')) weeklyMg = 80;
        else if (dose.includes('30mg')) weeklyMg = 60;
        else if (dose.includes('25mg')) weeklyMg = 50;
        else if (dose.includes('20mg')) weeklyMg = 40;
        else if (dose.includes('15mg')) weeklyMg = 30;
        else if (dose.includes('10mg')) weeklyMg = 20;
        else weeklyMg = 40; // default female
      } else {
        // Male doses
        if (dose.includes('100mg') || dose.includes('0.5ml')) weeklyMg = 200;
        else if (dose.includes('80mg') || dose.includes('0.4ml')) weeklyMg = 160;
        else if (dose.includes('70mg') || dose.includes('0.35ml')) weeklyMg = 140;
        else if (dose.includes('60mg') || dose.includes('0.3ml')) weeklyMg = 120;
      }
      
      const vialWeeks = Math.floor(totalMg / weeklyMg);
      const vialDays = vialWeeks * 7;
      const daysRemaining = vialDays - daysSinceRefill;
      
      return {
        days_remaining: daysRemaining,
        total_days: vialDays,
        tracking_type: 'vial_supply',
        status_text: daysRemaining <= 0 ? 'Refill overdue' :
                     daysRemaining <= 14 ? `${daysRemaining}d - Refill soon` :
                     `~${Math.floor(daysRemaining / 7)} weeks left`
      };
    } else {
      // Prefilled: 2-week (4 injections) or 4-week (8 injections)
      const is4Week = supplyType.includes('4') || supplyType.includes('four') || supplyType.includes('month');
      const supplyDays = is4Week ? 28 : 14;
      const daysRemaining = supplyDays - daysSinceRefill;
      
      return {
        days_remaining: daysRemaining,
        total_days: supplyDays,
        tracking_type: 'prefilled_supply',
        status_text: daysRemaining <= 0 ? 'Refill overdue' :
                     daysRemaining <= 3 ? `${daysRemaining}d - Refill soon` :
                     `${daysRemaining} days left`
      };
    }
  }

  // ===== PEPTIDE =====
  if (isPeptide) {
    // Peptide: Track by end_date - today (days remaining in protocol)
    if (protocol.end_date) {
      const endDate = new Date(protocol.end_date + 'T23:59:59');
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      // Calculate total duration from program_name or start/end dates
      let totalDays = 30;
      const programName = (protocol.program_name || '').toLowerCase();
      if (programName.includes('7') || programName.includes('week')) totalDays = 7;
      else if (programName.includes('10')) totalDays = 10;
      else if (programName.includes('14')) totalDays = 14;
      else if (programName.includes('20')) totalDays = 20;
      else if (programName.includes('30') || programName.includes('month')) totalDays = 30;
      else if (protocol.start_date) {
        const start = new Date(protocol.start_date);
        totalDays = Math.ceil((endDate - start) / (1000 * 60 * 60 * 24));
      }
      
      return {
        days_remaining: daysRemaining,
        total_days: totalDays,
        tracking_type: 'day_based',
        status_text: daysRemaining <= 0 ? 'Protocol ended' :
                     daysRemaining <= 3 ? `${daysRemaining}d left!` :
                     `${daysRemaining} days left`
      };
    }
  }

  // ===== SESSION-BASED (IV, HBOT, RLT, Injection Packs) =====
  if (protocol.total_sessions && protocol.total_sessions > 0) {
    const sessionsUsed = protocol.sessions_used || 0;
    const sessionsRemaining = protocol.total_sessions - sessionsUsed;
    
    return {
      sessions_remaining: sessionsRemaining,
      total_sessions: protocol.total_sessions,
      sessions_used: sessionsUsed,
      tracking_type: 'session_based',
      status_text: sessionsRemaining <= 0 ? 'All sessions used' :
                   `${sessionsRemaining}/${protocol.total_sessions} sessions`
    };
  }

  // ===== FALLBACK: Use end_date if available =====
  if (protocol.end_date) {
    const endDate = new Date(protocol.end_date + 'T23:59:59');
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    return {
      days_remaining: daysRemaining,
      tracking_type: 'end_date',
      status_text: daysRemaining <= 0 ? 'Ended' : `${daysRemaining} days left`
    };
  }

  // No tracking available
  return {
    days_remaining: null,
    tracking_type: 'none',
    status_text: 'Ongoing'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Get purchases that need protocols
    const { data: needsProtocol } = await supabase
      .from('purchases')
      .select(`
        *,
        patients (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('protocol_created', false)
      .eq('dismissed', false)
      .order('purchase_date', { ascending: false });

    // Get all patients for GHL lookup
    const { data: allPatients } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id');
    
    const patientsByGhl = {};
    const patientsById = {};
    (allPatients || []).forEach(p => {
      if (p.ghl_contact_id) {
        patientsByGhl[p.ghl_contact_id] = p;
      }
      patientsById[p.id] = p;
    });

    // Get all protocols with ALL fields needed for tracking
    const { data: protocols } = await supabase
      .from('protocols')
      .select(`
        *,
        patients (
          id,
          name,
          email,
          phone,
          ghl_contact_id
        )
      `)
      .order('start_date', { ascending: false });

    // Format protocol with tracking info
    const formatProtocol = (p) => {
      // Get patient name from join or fallback
      let patientName = 'Unknown Patient';
      let patientId = p.patient_id;
      let ghlContactId = null;
      
      if (p.patients && p.patients.name) {
        patientName = p.patients.name;
        ghlContactId = p.patients.ghl_contact_id;
      } else if (p.patient_id && patientsById[p.patient_id]) {
        const patient = patientsById[p.patient_id];
        patientName = patient.name || 'Unknown Patient';
        ghlContactId = patient.ghl_contact_id;
      }

      // Calculate tracking info based on protocol type
      const tracking = calculateRemaining(p);

      return {
        id: p.id,
        patient_id: patientId,
        patient_name: patientName,
        ghl_contact_id: ghlContactId,
        program_type: p.program_type,
        program_name: p.program_name,
        medication: p.medication || p.primary_peptide,
        selected_dose: p.selected_dose || p.current_dose || p.dose_amount,
        frequency: p.frequency || p.dose_frequency,
        delivery_method: p.delivery_method,
        supply_type: p.supply_type,
        start_date: p.start_date,
        end_date: p.end_date,
        last_refill_date: p.last_refill_date,
        total_sessions: p.total_sessions,
        sessions_used: p.sessions_used,
        status: p.status,
        notes: p.notes,
        created_at: p.created_at,
        // Tracking fields
        days_remaining: tracking.days_remaining,
        sessions_remaining: tracking.sessions_remaining,
        total_days: tracking.total_days,
        tracking_type: tracking.tracking_type,
        status_text: tracking.status_text
      };
    };

    // Split into active and completed
    const activeProtocols = [];
    const completedProtocols = [];

    (protocols || []).forEach(p => {
      const formatted = formatProtocol(p);
      
      // Determine if completed
      const isCompleted = 
        p.status === 'completed' ||
        (formatted.days_remaining !== null && formatted.days_remaining <= -7) || // Ended over a week ago
        (formatted.sessions_remaining !== undefined && formatted.sessions_remaining <= 0 && formatted.total_sessions > 0);

      if (isCompleted) {
        completedProtocols.push(formatted);
      } else if (p.status !== 'cancelled') {
        activeProtocols.push(formatted);
      }
    });

    // Sort active protocols by urgency (days/sessions remaining)
    activeProtocols.sort((a, b) => {
      const aVal = a.days_remaining ?? a.sessions_remaining ?? 9999;
      const bVal = b.days_remaining ?? b.sessions_remaining ?? 9999;
      return aVal - bVal; // Most urgent first
    });

    // Format purchases
    const formatPurchase = (p) => {
      let patientName = p.patients?.name;
      let patientId = p.patient_id;
      
      if (!patientName && p.ghl_contact_id && patientsByGhl[p.ghl_contact_id]) {
        patientName = patientsByGhl[p.ghl_contact_id].name;
        patientId = patientsByGhl[p.ghl_contact_id].id;
      }

      return {
        id: p.id,
        product_name: p.item_name || p.product_name,
        item_name: p.item_name,
        amount_paid: p.amount || p.amount_paid,
        amount: p.amount,
        purchase_date: p.purchase_date,
        patient_id: patientId,
        ghl_contact_id: p.ghl_contact_id,
        patient_name: patientName || 'Unknown'
      };
    };

    const filteredPurchases = (needsProtocol || []).filter(p => 
      p.protocol_created !== true && p.dismissed !== true
    );

    return res.status(200).json({
      needsProtocol: filteredPurchases.map(formatPurchase),
      activeProtocols,
      completedProtocols
    });

  } catch (error) {
    console.error('Pipeline error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
