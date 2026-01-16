// pages/api/patients/[id].js
// Patient Profile API - Range Medical
// Fetches patient details, protocols, labs, and purchases
// With correct tracking logic per protocol type

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
  const isInClinic = deliveryMethod.includes('clinic');

  // ===== WEIGHT LOSS =====
  if (isWeightLoss) {
    if (isTakeHome) {
      // Take-home: track by time (total_sessions × 7 days from last_refill_date or start_date)
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
      // In-clinic: track by sessions
      if (protocol.total_sessions && protocol.total_sessions > 0) {
        const sessionsUsed = protocol.sessions_used || 0;
        const sessionsRemaining = protocol.total_sessions - sessionsUsed;
        const statusText = sessionsRemaining <= 0 ? 'All sessions used' :
                           `${sessionsRemaining}/${protocol.total_sessions} injections`;
        return { sessions_remaining: sessionsRemaining, total_sessions: protocol.total_sessions, status_text: statusText };
      }
    }
  }

  // ===== HRT =====
  if (isHRT) {
    const supplyType = (protocol.supply_type || '').toLowerCase();
    const dose = protocol.selected_dose || protocol.current_dose || '';
    const lastRefillDate = protocol.last_refill_date || protocol.start_date;
    
    if (lastRefillDate) {
      const refillDate = new Date(lastRefillDate + 'T00:00:00');
      const daysSinceRefill = Math.ceil((today - refillDate) / (1000 * 60 * 60 * 24));

      if (supplyType.includes('vial')) {
        const isFemale = dose.includes('10mg') || dose.includes('15mg') || dose.includes('20mg') || 
                         dose.includes('25mg') || dose.includes('30mg') || dose.includes('40mg') || 
                         dose.includes('50mg') || programType.includes('female');
        
        let weeklyMg = 120;
        let totalMg = isFemale ? 1000 : 2000;
        
        if (isFemale) {
          if (dose.includes('50mg')) weeklyMg = 100;
          else if (dose.includes('40mg')) weeklyMg = 80;
          else if (dose.includes('30mg')) weeklyMg = 60;
          else weeklyMg = 40;
        } else {
          if (dose.includes('100mg') || dose.includes('0.5ml')) weeklyMg = 200;
          else if (dose.includes('80mg') || dose.includes('0.4ml')) weeklyMg = 160;
          else if (dose.includes('70mg') || dose.includes('0.35ml')) weeklyMg = 140;
          else weeklyMg = 120;
        }
        
        const vialWeeks = Math.floor(totalMg / weeklyMg);
        const vialDays = vialWeeks * 7;
        const daysRemaining = vialDays - daysSinceRefill;
        
        const statusText = daysRemaining <= 0 ? 'Refill overdue' :
                           daysRemaining <= 14 ? `${daysRemaining}d - Refill soon` :
                           `~${Math.floor(daysRemaining / 7)} weeks left`;
        
        return { days_remaining: daysRemaining, total_days: vialDays, status_text: statusText };
      } else {
        // Prefilled
        const is4Week = supplyType.includes('4') || supplyType.includes('four') || supplyType.includes('month');
        const supplyDays = is4Week ? 28 : 14;
        const daysRemaining = supplyDays - daysSinceRefill;
        
        const statusText = daysRemaining <= 0 ? 'Refill overdue' :
                           daysRemaining <= 3 ? `${daysRemaining}d - Refill soon` :
                           `${daysRemaining} days left`;
        
        return { days_remaining: daysRemaining, total_days: supplyDays, status_text: statusText };
      }
    }
  }

  // ===== PEPTIDE =====
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

  // ===== SESSION-BASED (IV, HBOT, RLT) =====
  if (protocol.total_sessions && protocol.total_sessions > 0) {
    const sessionsUsed = protocol.sessions_used || 0;
    const sessionsRemaining = protocol.total_sessions - sessionsUsed;
    const statusText = sessionsRemaining <= 0 ? 'All sessions used' :
                       `${sessionsRemaining}/${protocol.total_sessions} sessions`;
    return { sessions_remaining: sessionsRemaining, total_sessions: protocol.total_sessions, status_text: statusText };
  }

  return { days_remaining: null, status_text: 'Active' };
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
        .order('start_date', { ascending: false });

      if (protocolsError) {
        console.error('Error fetching protocols:', protocolsError);
      }

      // Split and format protocols
      const activeProtocols = [];
      const completedProtocols = [];
      const today = new Date().toISOString().split('T')[0];

      (allProtocols || []).forEach(protocol => {
        const tracking = calculateRemaining(protocol);
        
        const formatted = {
          ...protocol,
          days_remaining: tracking.days_remaining,
          total_days: tracking.total_days,
          sessions_remaining: tracking.sessions_remaining,
          status_text: tracking.status_text
        };

        // Determine if completed
        const isCompleted = 
          protocol.status === 'completed' ||
          (tracking.days_remaining !== null && tracking.days_remaining <= -7) ||
          (tracking.sessions_remaining !== undefined && tracking.sessions_remaining <= 0 && protocol.total_sessions > 0);

        if (isCompleted) {
          completedProtocols.push(formatted);
        } else if (protocol.status !== 'cancelled') {
          activeProtocols.push(formatted);
        }
      });

      // Get pending lab orders
      const { data: pendingLabOrders } = await supabase
        .from('lab_orders')
        .select('*')
        .eq('patient_id', id)
        .eq('status', 'pending')
        .order('order_date', { ascending: false });

      // Get lab results
      const { data: labs } = await supabase
        .from('patient_labs')
        .select('*')
        .eq('patient_id', id)
        .order('collection_date', { ascending: false });

      // Get pending purchases
      let pendingNotifications = [];
      
      const { data: purchasesByPatientId } = await supabase
        .from('purchases')
        .select('*')
        .eq('patient_id', id)
        .eq('protocol_created', false)
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
          .eq('dismissed', false)
          .order('purchase_date', { ascending: false });
        
        pendingNotifications = purchasesByGhl || [];
      }

      // Calculate stats
      const stats = {
        activeCount: activeProtocols.length,
        completedCount: completedProtocols.length,
        pendingLabsCount: pendingLabOrders?.length || 0,
        totalProtocols: allProtocols?.length || 0
      };

      console.log(`Patient ${patient.name}: ${activeProtocols.length} active, ${completedProtocols.length} completed`);

      return res.status(200).json({
        patient,
        activeProtocols,
        completedProtocols,
        pendingNotifications: pendingNotifications || [],
        pendingLabOrders: pendingLabOrders || [],
        labs: labs || [],
        stats
      });

    } catch (error) {
      console.error('Patient API error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;
      
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update patient' });
      }

      return res.status(200).json({ patient: data });
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
