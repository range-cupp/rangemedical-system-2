// /lib/protocol-tracking.js
// Shared Protocol Tracking Logic - Single source of truth
// Range Medical - 2026-02-04

/**
 * Calculate protocol tracking status based on protocol type and data
 * Returns: days_remaining, sessions_remaining, status_text, urgency, category, delivery
 */
export function getProtocolTracking(protocol) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const programType = (protocol.program_type || '').toLowerCase();
  const programName = (protocol.program_name || '').toLowerCase();
  const medication = (protocol.medication || '').toLowerCase();
  const deliveryMethod = (protocol.delivery_method || '').toLowerCase();
  const supplyType = (protocol.supply_type || '').toLowerCase();
  const lastRefill = protocol.last_refill_date;
  const selectedDose = (protocol.selected_dose || '').toLowerCase();

  const isTakeHome = deliveryMethod === 'take_home' || deliveryMethod.includes('take') || deliveryMethod === 'at_home';
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

      // Parse dose per injection
      let dosePerInjection = 0.4; // default for male HRT
      const doseField = protocol.dose_per_injection || protocol.frequency || '';

      let doseMatch = doseField.toString().match(/^(\d+\.?\d*)\s*ml/i) ||
        doseField.toString().match(/(\d+\.?\d*)\s*ml/i);

      if (!doseMatch && !selectedDose.includes('vial')) {
        doseMatch = selectedDose.match(/^(\d+\.?\d*)\s*ml/i);
      }

      if (!doseMatch) {
        const mgMatch = (doseField || selectedDose).match(/(\d+)\s*mg/i);
        if (mgMatch && !selectedDose.includes('@')) {
          dosePerInjection = parseInt(mgMatch[1]) / 200;
        }
      } else {
        dosePerInjection = parseFloat(doseMatch[1]);
      }

      if (dosePerInjection < 0.1 || dosePerInjection > 1) {
        dosePerInjection = 0.4;
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
      category: programType || 'other',
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

/**
 * Get category badge styling
 */
export function getCategoryBadge(category) {
  const badges = {
    peptide: { emoji: '🧬', color: '#ddd6fe', text: 'Peptide' },
    weight_loss: { emoji: '💉', color: '#bbf7d0', text: 'Weight Loss' },
    hrt: { emoji: '💊', color: '#fed7aa', text: 'HRT' },
    iv: { emoji: '💧', color: '#bfdbfe', text: 'IV' },
    hbot: { emoji: '🫁', color: '#fecaca', text: 'HBOT' },
    rlt: { emoji: '🔴', color: '#fecdd3', text: 'RLT' },
    injection: { emoji: '💉', color: '#e9d5ff', text: 'Injection' },
    other: { emoji: '📁', color: '#e5e7eb', text: 'Other' }
  };
  return badges[category] || badges.other;
}

/**
 * Format date for display (Pacific Time)
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = dateStr.length === 10 ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles'
  });
}

/**
 * Get protocol duration display text
 */
export function getProtocolDuration(protocol) {
  if (protocol.total_sessions && ['iv', 'hbot', 'rlt', 'injection'].includes(protocol.category)) {
    return `${protocol.sessions_used || 0}/${protocol.total_sessions} sessions`;
  }
  if (protocol.category === 'peptide') {
    const programName = (protocol.program_name || '').toLowerCase();
    const durationMatch = programName.match(/(\d+)\s*day/i);
    if (durationMatch) return `${durationMatch[1]} Day Program`;
    if (programName.includes('vial')) return 'Vial Protocol';
    if (protocol.total_days) return `${protocol.total_days} Day Program`;
    if (protocol.program_name) return protocol.program_name;
  }
  if (protocol.category === 'hrt') {
    if (protocol.weeks_remaining) return `~${protocol.weeks_remaining} weeks left`;
    return protocol.supply_type || 'Ongoing';
  }
  if (protocol.category === 'weight_loss') {
    if (protocol.total_sessions) return `${protocol.sessions_used || 0}/${protocol.total_sessions} injections`;
    return protocol.program_name || 'Weight Loss';
  }
  if (protocol.program_name) return protocol.program_name;
  return '-';
}
