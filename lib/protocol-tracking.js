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
  const isWeightLoss = programType.includes('weight_loss') || programName.includes('weight') ||
    medication.includes('semaglutide') || medication.includes('tirzepatide') || medication.includes('retatrutide');
  const isHRT = programType.includes('hrt') || programName.includes('hrt') ||
    medication.includes('testosterone') || medication.includes('nandrolone');
  const isPeptide = programType === 'peptide' || programName.includes('peptide');
  const isSessionBased = ['iv', 'hbot', 'rlt', 'injection'].includes(programType);

  // ===== WEIGHT LOSS =====
  // WL is a recurring monthly program. The only question: "when is the next refill due?"
  // Tracking is date-based, not session-based. Sessions are informational only.
  //
  // Priority: next_expected_date > last_refill_date + 28d > start_date + 28d
  // Sessions (sessions_used/total_sessions) are passed through for display but
  // never drive renewal or status logic.
  if (isWeightLoss) {
    const sessionsUsed = protocol.sessions_used || 0;
    const totalSessions = protocol.total_sessions || 0;
    const delivery = isTakeHome ? 'take_home' : 'in_clinic';

    // Best source: next_expected_date (set by dispense/extend system)
    if (protocol.next_expected_date) {
      const nextDate = new Date(protocol.next_expected_date + 'T00:00:00');
      const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

      return {
        days_remaining: daysUntil,
        sessions_used: sessionsUsed,
        total_sessions: totalSessions,
        status_text: daysUntil <= 0 ? 'Refill overdue' :
                     daysUntil <= 3 ? `${daysUntil}d — Refill soon` :
                     `${daysUntil} days until refill`,
        tracking_type: 'time_based',
        urgency: daysUntil <= 0 ? 'overdue' : daysUntil <= 3 ? 'ending_soon' : daysUntil <= 14 ? 'active' : 'just_started',
        category: 'weight_loss',
        delivery
      };
    }

    // Fallback: last_refill_date or start_date + 28 days (standard monthly cycle)
    const refillDate = lastRefill ? new Date(lastRefill + 'T00:00:00') :
      protocol.start_date ? new Date(protocol.start_date + 'T00:00:00') : null;

    if (refillDate) {
      const cycleDays = 28; // standard monthly WL cycle
      const endDate = new Date(refillDate);
      endDate.setDate(endDate.getDate() + cycleDays);
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      return {
        days_remaining: daysRemaining,
        sessions_used: sessionsUsed,
        total_sessions: totalSessions,
        status_text: daysRemaining <= 0 ? 'Refill overdue' :
                     daysRemaining <= 3 ? `${daysRemaining}d — Refill soon` :
                     `${daysRemaining} days until refill`,
        tracking_type: 'time_based',
        urgency: daysRemaining <= 0 ? 'overdue' : daysRemaining <= 3 ? 'ending_soon' : daysRemaining <= 14 ? 'active' : 'just_started',
        category: 'weight_loss',
        delivery
      };
    }

    return {
      sessions_used: sessionsUsed,
      total_sessions: totalSessions,
      status_text: 'No refill date',
      tracking_type: 'unknown',
      urgency: 'active',
      category: 'weight_loss',
      delivery
    };
  }

  // ===== HRT =====
  if (isHRT) {
    // Oral HRT (Testosterone Booster) — uses end_date for tracking
    if (supplyType.includes('oral') || medication.includes('booster') || medication.includes('oral')) {
      if (protocol.end_date) {
        const endDate = new Date(protocol.end_date + 'T00:00:00');
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return {
          days_remaining: daysRemaining,
          total_days: 30,
          status_text: daysRemaining <= 0 ? 'Refill overdue' : `${daysRemaining} days left`,
          tracking_type: 'oral_supply',
          urgency: daysRemaining <= 0 ? 'overdue' : daysRemaining <= 5 ? 'ending_soon' : daysRemaining <= 14 ? 'active' : 'just_started',
          category: 'hrt',
          delivery: 'take_home'
        };
      }
      return {
        status_text: 'Active — Oral',
        tracking_type: 'oral_supply',
        urgency: 'active',
        category: 'hrt',
        delivery: 'take_home'
      };
    }

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
        status_text: daysRemaining <= 0 ? 'Renewal due' : `${daysRemaining} days left`,
        tracking_type: 'time_based',
        urgency: daysRemaining <= 0 ? 'overdue' : daysRemaining <= 3 ? 'ending_soon' : daysRemaining <= 14 ? 'active' : 'just_started',
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
 * Determine renewal status for an active protocol.
 * Returns: { renewal_status, renewal_label, renewal_urgency_color }
 *   renewal_status: 'none' | 'renewal_soon' | 'renewal_due'
 *   renewal_label: null | 'Renewal Soon' | 'Renewal Due'
 *   renewal_urgency_color: { bg, text } for badge styling
 *
 * Triggers:
 *   Session-based: ≤2 remaining → renewal_soon, 0 remaining → renewal_due
 *   Time-based: ≤3 days remaining → renewal_soon, ≤0 days → renewal_due
 */
export function getRenewalStatus(protocol) {
  if (protocol.status !== 'active') {
    return { renewal_status: 'none', renewal_label: null, renewal_urgency_color: null };
  }

  const tracking = getProtocolTracking(protocol);

  const COLORS = {
    soon: { bg: '#fef3c7', text: '#92400e' },  // amber
    due: { bg: '#fee2e2', text: '#dc2626' },    // red
  };

  // Helper: check if protocol end_date is still in the future
  // When sessions are dispensed in advance (e.g., take-home pickup), sessions_used may
  // equal total_sessions but the protocol timeline still extends into the future.
  const getEndDateDaysRemaining = () => {
    if (!protocol.end_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(protocol.end_date + 'T00:00:00');
    return Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  };

  // Session-based protocols (non-WL)
  if (tracking.sessions_remaining !== undefined && tracking.sessions_remaining !== null) {
    if (tracking.sessions_remaining <= 0) {
      // If end_date is still in the future, sessions were dispensed but not all administered yet
      const endDays = getEndDateDaysRemaining();
      if (endDays !== null && endDays > 3) {
        return { renewal_status: 'none', renewal_label: null, renewal_urgency_color: null };
      }
      if (endDays !== null && endDays > 0) {
        return { renewal_status: 'renewal_soon', renewal_label: 'Renewal Soon', renewal_urgency_color: COLORS.soon };
      }
      return { renewal_status: 'renewal_due', renewal_label: 'Renewal Due', renewal_urgency_color: COLORS.due };
    }
    if (tracking.sessions_remaining <= 2) {
      // If end_date is well into the future, suppress renewal_soon
      const endDays = getEndDateDaysRemaining();
      if (endDays !== null && endDays > 7) {
        return { renewal_status: 'none', renewal_label: null, renewal_urgency_color: null };
      }
      return { renewal_status: 'renewal_soon', renewal_label: 'Renewal Soon', renewal_urgency_color: COLORS.soon };
    }
  }

  // Time-based protocols
  if (tracking.days_remaining !== undefined && tracking.days_remaining !== null) {
    if (tracking.days_remaining <= 0) {
      return { renewal_status: 'renewal_due', renewal_label: 'Renewal Due', renewal_urgency_color: COLORS.due };
    }
    if (tracking.days_remaining <= 3) {
      return { renewal_status: 'renewal_soon', renewal_label: 'Renewal Soon', renewal_urgency_color: COLORS.soon };
    }
  }

  return { renewal_status: 'none', renewal_label: null, renewal_urgency_color: null };
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
    injection: { emoji: '💉', color: '#e9d5ff', text: 'Range Injection' },
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
  if ((protocol.category || '').includes('hrt')) {
    if (protocol.weeks_remaining) return `~${protocol.weeks_remaining} weeks left`;
    return protocol.supply_type || 'Ongoing';
  }
  if ((protocol.category || '').includes('weight_loss')) {
    if (protocol.total_sessions) return `${protocol.sessions_used || 0}/${protocol.total_sessions} injections`;
    return protocol.program_name || 'Weight Loss';
  }
  if (protocol.program_name) return protocol.program_name;
  return '-';
}

/**
 * Weight loss pipeline status — single source of truth
 * Used by /admin/protocols WL tab and anywhere else that needs WL status
 *
 * @param {Object} protocol - Protocol object with optional enrichment fields:
 *   days_since_last_checkin, days_since_last_injection, next_expected_date,
 *   delivery_method, status, sessions_used, total_sessions
 * @returns {'overdue'|'due_soon'|'on_track'|'new'|'complete'}
 */
export function getWLStatus(protocol) {
  if (protocol.status === 'completed') return 'complete';

  const sessionsUsed = protocol.sessions_used || 0;
  const totalSessions = protocol.total_sessions || 0;
  const sessionsExhausted = totalSessions > 0 && sessionsUsed >= totalSessions;

  // Priority 1: next_expected_date (most authoritative — set by dispense/extend)
  // If next refill date is in the future, patient is supplied regardless of session count
  if (protocol.next_expected_date) {
    const now = new Date();
    const supplyEnd = new Date(protocol.next_expected_date + 'T00:00:00');
    const daysUntilRefill = Math.ceil((supplyEnd - now) / (1000 * 60 * 60 * 24));
    if (daysUntilRefill > 7) return 'on_track';
    if (daysUntilRefill > 0) return 'due_soon';
    return 'overdue';
  }

  // Priority 2: sessions exhausted (no next_expected_date means no recent dispense)
  if (sessionsExhausted) return 'overdue';

  // Fallback: activity-based (days since last checkin or injection)
  const days = getWLDaysSinceActivity(protocol);
  if (days === null) return 'new';
  if (days > 10) return 'overdue';
  if (days >= 7) return 'due_soon';
  return 'on_track';
}

/**
 * Get days since last WL activity (min of checkin and injection)
 */
export function getWLDaysSinceActivity(protocol) {
  const c = protocol.days_since_last_checkin;
  const i = protocol.days_since_last_injection;
  if (c !== null && c !== undefined && i !== null && i !== undefined) return Math.min(c, i);
  return c ?? i ?? null;
}

/**
 * WL status badge config
 */
export const WL_STATUS_CONFIG = {
  overdue:  { label: 'OVERDUE',  bg: '#fee2e2', color: '#991b1b' },
  due_soon: { label: 'DUE SOON', bg: '#fef3c7', color: '#92400e' },
  on_track: { label: 'On Track', bg: '#dcfce7', color: '#166534' },
  new:      { label: 'New',      bg: '#dbeafe', color: '#1e40af' },
  complete: { label: 'Complete', bg: '#e5e5e5', color: '#666' },
};
