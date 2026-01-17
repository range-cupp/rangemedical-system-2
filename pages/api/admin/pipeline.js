// /pages/api/admin/pipeline.js
// Unified Pipeline API - Returns all protocols with correct tracking logic
// Range Medical - Updated 2026-01-16

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calculate tracking based on protocol type
function calculateTracking(protocol) {
  const now = new Date();
  const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  today.setHours(0, 0, 0, 0);
  
  const programName = (protocol.program_name || '').toLowerCase();
  const programType = (protocol.program_type || '').toLowerCase();
  const medication = (protocol.medication || '').toLowerCase();
  const deliveryMethod = (protocol.delivery_method || '').toLowerCase();
  
  // Detect protocol category
  const isWeightLoss = programType.includes('weight') || programName.includes('weight') || 
                       medication.includes('semaglutide') || medication.includes('tirzepatide') || 
                       medication.includes('retatrutide');
  const isHRT = programType.includes('hrt') || programName.includes('hrt') || 
                medication.includes('testosterone') || medication.includes('male hrt') || 
                medication.includes('female hrt');
  const isPeptide = programType.includes('peptide') || programName.includes('peptide') ||
                    medication.includes('bpc') || medication.includes('tb500') || 
                    medication.includes('wolverine') || medication.includes('mots');
  const isSessionBased = programType.includes('iv') || programType.includes('hbot') || 
                         programType.includes('rlt') || programType.includes('injection') ||
                         programName.includes('iv therapy') || programName.includes('injection therapy');
  
  const isTakeHome = deliveryMethod.includes('take') || deliveryMethod.includes('home');
  const isInClinic = deliveryMethod.includes('clinic');

  // ===== WEIGHT LOSS =====
  if (isWeightLoss) {
    if (isTakeHome) {
      // Take-home: total_injections × 7 days from start_date
      const totalInjections = protocol.total_sessions || protocol.total_injections || 4;
      const supplyDays = totalInjections * 7;
      const startDate = protocol.last_refill_date || protocol.start_date;
      
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        const endDate = new Date(start);
        endDate.setDate(endDate.getDate() + supplyDays);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          days_remaining: daysRemaining,
          total_days: supplyDays,
          status_text: daysRemaining <= 0 ? 'Supply exhausted' : `${daysRemaining} days left`,
          tracking_type: 'time_based',
          urgency: daysRemaining <= 0 ? 'overdue' : daysRemaining <= 3 ? 'ending_soon' : daysRemaining <= 14 ? 'active' : 'just_started',
          category: 'weight_loss',
          delivery: 'take_home'
        };
      }
    } else {
      // In-clinic: track sessions
      const sessionsUsed = protocol.sessions_used || protocol.injections_used || 0;
      const totalSessions = protocol.total_sessions || protocol.total_injections || 4;
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
  }
  
  // ===== HRT =====
  if (isHRT) {
    const supplyType = (protocol.supply_type || '').toLowerCase();
    const selectedDose = protocol.selected_dose || '';
    const dose = protocol.dose || '';
    const startingDose = protocol.starting_dose || '';
    const lastRefill = protocol.last_refill_date;
    
    if (supplyType.includes('vial') || supplyType.includes('10ml')) {
      // Vial-based: calculate weeks based on dose
      // Male: 200mg/ml, Female: 100mg/ml
      const isMale = medication.includes('male') || !medication.includes('female');
      const concentration = isMale ? 200 : 100; // mg per ml
      const vialMl = 10;
      const totalMg = vialMl * concentration;
      
      // Parse dose from multiple possible fields
      // Look for pattern like "0.4ml/80mg" or "80mg" but NOT "200mg/ml" (concentration)
      let weeklyMg = isMale ? 160 : 40; // default: male 80mg×2, female 20mg×2
      
      // Try to find the actual dose from various fields
      const doseFields = [dose, selectedDose, startingDose];
      for (const field of doseFields) {
        if (!field) continue;
        
        // Skip if this looks like concentration info (e.g., "200mg/ml")
        if (field.includes('mg/ml')) continue;
        
        // Look for dose pattern like "0.4ml/80mg" or just "80mg"
        const match = field.match(/(\d+)mg(?!\/ml)/);
        if (match) {
          const mgPerInjection = parseInt(match[1]);
          // Sanity check: male doses are 60-100mg, female 10-50mg
          if (isMale && mgPerInjection >= 50 && mgPerInjection <= 120) {
            weeklyMg = mgPerInjection * 2; // 2x per week
            break;
          } else if (!isMale && mgPerInjection >= 5 && mgPerInjection <= 60) {
            weeklyMg = mgPerInjection * 2;
            break;
          }
        }
      }
      
      const weeksSupply = Math.floor(totalMg / weeklyMg);
      
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
          weekly_mg: weeklyMg,
          status_text: daysRemaining <= 0 ? 'Refill needed' : `~${weeksRemaining} weeks left`,
          tracking_type: 'vial_based',
          urgency: daysRemaining <= 0 ? 'overdue' : daysRemaining <= 14 ? 'ending_soon' : daysRemaining <= 28 ? 'active' : 'just_started',
          category: 'hrt',
          delivery: 'take_home'
        };
      }
    } else if (supplyType.includes('prefill') || supplyType.includes('2_week') || supplyType.includes('4_week') || selectedDose.includes('prefilled')) {
      // Prefilled syringes: 2-week or 4-week supply
      // Check supply_type first, then fall back to parsing selected_dose
      let supplyDays = 14; // default to 2 weeks
      
      if (supplyType.includes('4week') || supplyType.includes('4_week')) {
        supplyDays = 28;
      } else if (supplyType.includes('2week') || supplyType.includes('2_week')) {
        supplyDays = 14;
      } else if (selectedDose) {
        // Parse quantity from selected_dose (e.g., "4 prefilled @ 0.4ml" or "8 prefilled @ 0.3ml")
        const qtyMatch = selectedDose.match(/(\d+)\s*prefilled/i);
        if (qtyMatch) {
          const qty = parseInt(qtyMatch[1]);
          // 4 syringes = 2 weeks (2x/week), 8 syringes = 4 weeks
          supplyDays = qty <= 4 ? 14 : 28;
        }
      }
      
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
    
    // HRT with sessions (in-clinic)
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
    
    // Fallback for HRT without tracking data
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
    // Uses end_date - today
    if (protocol.end_date) {
      const endDate = new Date(protocol.end_date + 'T00:00:00');
      const startDate = protocol.start_date ? new Date(protocol.start_date + 'T00:00:00') : null;
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      const totalDays = startDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : null;
      
      // Extract duration from program_name (e.g., "10 Day", "30 Day")
      let duration = totalDays;
      const durationMatch = programName.match(/(\d+)\s*day/i);
      if (durationMatch) {
        duration = parseInt(durationMatch[1]);
      }
      
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
    
    // Peptide with sessions
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
  
  // ===== SESSION-BASED (IV, HBOT, RLT, Injection Therapy) =====
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
    status_text: 'No tracking data',
    tracking_type: 'unknown',
    urgency: 'active',
    category: 'other',
    delivery: 'unknown'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query params for purchases date filter
    const { purchases_since } = req.query;
    const purchasesSinceDate = purchases_since || '2026-01-13'; // Default to this past Monday

    // Fetch recent purchases (payments from GHL)
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .gte('purchase_date', purchasesSinceDate)
      .order('purchase_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
    }

    // Categories that need protocols
    const protocolCategories = ['peptide', 'hrt', 'weight_loss', 'weight loss', 'iv', 'iv_therapy', 'hbot', 'rlt', 'red_light'];
    
    // Process purchases to determine which need protocols
    const processedPurchases = (purchases || []).map(p => {
      const category = (p.category || '').toLowerCase();
      const needsProtocol = protocolCategories.some(c => category.includes(c));
      
      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: p.patient_name,
        ghl_contact_id: p.ghl_contact_id,
        item_name: p.item_name || p.product_name,
        amount: p.amount || p.amount_paid || 0,
        purchase_date: p.purchase_date,
        category: p.category,
        protocol_created: p.protocol_created || false,
        protocol_id: p.protocol_id,
        needs_protocol: needsProtocol && !p.protocol_created,
        invoice_number: p.invoice_number
      };
    });

    // Separate into needs protocol vs already handled
    const purchasesNeedingProtocol = processedPurchases.filter(p => p.needs_protocol);
    const purchasesWithProtocol = processedPurchases.filter(p => p.protocol_created);
    const otherPurchases = processedPurchases.filter(p => !p.needs_protocol && !p.protocol_created);

    // Fetch all protocols with patient info
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          email,
          phone,
          ghl_contact_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get all patients for GHL ID lookup (fallback for unlinked protocols)
    const { data: allPatients } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email, phone, ghl_contact_id');
    
    // Create lookup map by ghl_contact_id
    const patientsByGHL = {};
    (allPatients || []).forEach(p => {
      if (p.ghl_contact_id) {
        patientsByGHL[p.ghl_contact_id] = p;
      }
    });

    // Process each protocol with tracking calculations
    const processed = (protocols || []).map(protocol => {
      const tracking = calculateTracking(protocol);
      
      // Try to get patient from relationship first, then fallback to GHL lookup
      let patient = protocol.patients;
      if (!patient && protocol.ghl_contact_id) {
        patient = patientsByGHL[protocol.ghl_contact_id];
      }
      
      // Build patient name with fallbacks
      let patientName = 'Unknown';
      if (patient) {
        const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
        if (fullName) {
          patientName = fullName;
        } else if (patient.email) {
          // Use email prefix as fallback
          patientName = patient.email.split('@')[0];
        } else if (patient.phone) {
          // Use last 4 digits of phone as fallback
          const cleanPhone = (patient.phone || '').replace(/\D/g, '');
          patientName = `Patient ...${cleanPhone.slice(-4)}`;
        }
      }

      return {
        id: protocol.id,
        patient_id: patient?.id || protocol.patient_id,
        patient_name: patientName,
        patient_email: patient?.email || null,
        patient_phone: patient?.phone || null,
        ghl_contact_id: patient?.ghl_contact_id || protocol.ghl_contact_id,
        
        program_name: protocol.program_name,
        program_type: protocol.program_type,
        medication: protocol.medication,
        dose: protocol.dose || protocol.selected_dose,
        frequency: protocol.frequency,
        delivery_method: protocol.delivery_method,
        
        start_date: protocol.start_date,
        end_date: protocol.end_date,
        last_refill_date: protocol.last_refill_date,
        supply_type: protocol.supply_type,
        
        sessions_used: protocol.sessions_used,
        total_sessions: protocol.total_sessions,
        
        status: protocol.status,
        notes: protocol.notes,
        
        // Tracking data
        ...tracking
      };
    });

    // Separate by status
    const active = processed.filter(p => p.status === 'active');
    const completed = processed.filter(p => p.status === 'completed');
    const needsProtocol = processed.filter(p => p.status === 'needs_protocol' || p.status === 'pending');
    
    // Group active by urgency
    const endingSoon = active.filter(p => p.urgency === 'ending_soon' || p.urgency === 'overdue');
    const activeProper = active.filter(p => p.urgency === 'active');
    const justStarted = active.filter(p => p.urgency === 'just_started');
    const needsFollowUp = active.filter(p => {
      // Take-home peptides 7+ days in with no check-in
      if (p.category === 'peptide' && p.delivery === 'take_home' && p.total_days && p.days_remaining) {
        const daysIn = p.total_days - p.days_remaining;
        return daysIn >= 7;
      }
      return false;
    });

    // Sort each group by urgency (days remaining ascending)
    const sortByUrgency = (a, b) => {
      const aDays = a.days_remaining ?? (a.sessions_remaining ? a.sessions_remaining * 7 : 999);
      const bDays = b.days_remaining ?? (b.sessions_remaining ? b.sessions_remaining * 7 : 999);
      return aDays - bDays;
    };
    
    endingSoon.sort(sortByUrgency);
    activeProper.sort(sortByUrgency);
    justStarted.sort(sortByUrgency);

    res.status(200).json({
      success: true,
      counts: {
        ending_soon: endingSoon.length,
        active: activeProper.length,
        just_started: justStarted.length,
        needs_follow_up: needsFollowUp.length,
        completed: completed.length,
        needs_protocol: needsProtocol.length,
        total: processed.length,
        purchases_needing_protocol: purchasesNeedingProtocol.length,
        purchases_total: processedPurchases.length
      },
      protocols: {
        ending_soon: endingSoon,
        active: activeProper,
        just_started: justStarted,
        needs_follow_up: needsFollowUp,
        completed: completed,
        needs_protocol: needsProtocol
      },
      purchases: {
        needs_protocol: purchasesNeedingProtocol,
        with_protocol: purchasesWithProtocol,
        other: otherPurchases,
        since_date: purchasesSinceDate
      }
    });

  } catch (error) {
    console.error('Pipeline API error:', error);
    res.status(500).json({ error: error.message });
  }
}
