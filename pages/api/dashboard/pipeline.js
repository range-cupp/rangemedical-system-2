// /pages/api/dashboard/pipeline.js
// Protocol Pipeline API - Shows ONLY protocols (not labs)
// Range Medical - Updated 2026-02-04
// Columns: Pending/New, Ending Soon, Active

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Calculate days remaining based on protocol type
function getProtocolTracking(protocol) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const programType = (protocol.program_type || '').toLowerCase();
  const programName = (protocol.program_name || '').toLowerCase();
  const medication = (protocol.medication || '').toLowerCase();
  const deliveryMethod = (protocol.delivery_method || '').toLowerCase();
  const supplyType = (protocol.supply_type || '').toLowerCase();
  const lastRefill = protocol.last_refill_date;

  const isTakeHome = deliveryMethod === 'take_home' || deliveryMethod.includes('take');
  const isWeightLoss = programType === 'weight_loss' || medication.includes('semaglutide') || medication.includes('tirzepatide');
  const isHRT = programType === 'hrt' || medication.includes('testosterone');
  const isPeptide = programType === 'peptide';

  // Weight Loss - time-based tracking
  if (isWeightLoss && isTakeHome && protocol.total_sessions > 0) {
    const refillDate = lastRefill ? new Date(lastRefill + 'T00:00:00') :
                       protocol.start_date ? new Date(protocol.start_date + 'T00:00:00') : null;
    if (refillDate) {
      const totalDays = protocol.total_sessions * 7;
      const endDate = new Date(refillDate);
      endDate.setDate(endDate.getDate() + totalDays);
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return { days_remaining: daysRemaining, category: 'weight_loss' };
    }
  }

  // HRT - vial or prefilled tracking
  if (isHRT) {
    if (supplyType.includes('vial')) {
      const is10ml = supplyType.includes('10');
      const vialMl = is10ml ? 10 : 5;
      const dosePerInjection = 0.4;
      const injectionsPerWeek = 2;
      const weeksSupply = Math.floor(vialMl / (dosePerInjection * injectionsPerWeek));

      if (lastRefill) {
        const refillDate = new Date(lastRefill + 'T00:00:00');
        const endDate = new Date(refillDate);
        endDate.setDate(endDate.getDate() + (weeksSupply * 7));
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return { days_remaining: daysRemaining, category: 'hrt' };
      }
    } else if (supplyType.includes('prefill')) {
      let numPrefilled = 4;
      if (supplyType.includes('1week')) numPrefilled = 2;
      else if (supplyType.includes('4week')) numPrefilled = 8;
      const supplyDays = Math.ceil(numPrefilled / 2) * 7;

      if (lastRefill) {
        const refillDate = new Date(lastRefill + 'T00:00:00');
        const endDate = new Date(refillDate);
        endDate.setDate(endDate.getDate() + supplyDays);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return { days_remaining: daysRemaining, category: 'hrt' };
      }
    }
    return { days_remaining: null, category: 'hrt' };
  }

  // Peptide - end_date based
  if (isPeptide && protocol.end_date) {
    const endDate = new Date(protocol.end_date + 'T00:00:00');
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return { days_remaining: daysRemaining, category: 'peptide' };
  }

  // Session-based (IV, HBOT, RLT, Injection)
  if (protocol.total_sessions > 0) {
    const sessionsRemaining = protocol.total_sessions - (protocol.sessions_used || 0);
    return {
      sessions_remaining: sessionsRemaining,
      category: programType || 'therapy'
    };
  }

  // Fallback - use end_date if available
  if (protocol.end_date) {
    const endDate = new Date(protocol.end_date + 'T00:00:00');
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return { days_remaining: daysRemaining, category: programType || 'other' };
  }

  return { days_remaining: null, category: programType || 'other' };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all active protocols with patient info
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
        total_sessions,
        sessions_used,
        created_at,
        patients (
          id,
          first_name,
          last_name,
          name,
          ghl_contact_id
        )
      `)
      .in('status', ['active', 'pending', null])
      .order('created_at', { ascending: false });

    if (protocolsError) {
      console.error('Error fetching protocols:', protocolsError);
      return res.status(500).json({ error: protocolsError.message });
    }

    // Process and categorize protocols
    const pending = [];
    const endingSoon = [];
    const active = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    (protocols || []).forEach(p => {
      // Skip completed protocols
      if (p.status === 'completed' || p.status === 'cancelled') return;

      // Get patient name
      const patientName = p.patients?.name ||
        `${p.patients?.first_name || ''} ${p.patients?.last_name || ''}`.trim() ||
        'Unknown';

      // Get tracking info
      const tracking = getProtocolTracking(p);

      // Build protocol object
      const formatted = {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: patientName,
        ghl_contact_id: p.patients?.ghl_contact_id,
        program_type: p.program_type,
        program_name: p.program_name,
        medication: p.medication,
        dose: p.selected_dose,
        frequency: p.frequency,
        delivery_method: p.delivery_method,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status,
        total_sessions: p.total_sessions,
        sessions_used: p.sessions_used,
        days_remaining: tracking.days_remaining,
        sessions_remaining: tracking.sessions_remaining,
        category: tracking.category,
        created_at: p.created_at
      };

      // Determine the protocol display name
      formatted.protocol_name = p.medication || p.program_name || p.program_type || 'Protocol';

      // Categorize
      const startDate = p.start_date ? new Date(p.start_date + 'T00:00:00') : null;
      const isNew = startDate && startDate >= sevenDaysAgo;
      const isPending = p.status === 'pending' || !p.start_date;

      if (isPending || isNew) {
        // New or pending protocols
        pending.push(formatted);
      } else if (tracking.days_remaining !== null && tracking.days_remaining <= 3) {
        // Ending within 3 days
        endingSoon.push(formatted);
      } else if (tracking.sessions_remaining !== null && tracking.sessions_remaining <= 1) {
        // Session-based ending soon
        endingSoon.push(formatted);
      } else {
        // Active protocols
        active.push(formatted);
      }
    });

    // Sort each bucket
    pending.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    endingSoon.sort((a, b) => (a.days_remaining || 999) - (b.days_remaining || 999));
    active.sort((a, b) => new Date(b.start_date || b.created_at) - new Date(a.start_date || a.created_at));

    // Stats
    const stats = {
      pending: pending.length,
      endingSoon: endingSoon.length,
      activeProtocols: active.length
    };

    return res.status(200).json({
      pending,
      endingSoon,
      active,
      stats
    });

  } catch (error) {
    console.error('Pipeline API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
