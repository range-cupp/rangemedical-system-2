// Recovery Offer System — Constants & Helpers
// Range Medical — 2026-04-14
//
// Single source of truth for the recovery offer ladder:
// Test Drive -> Sprint -> Membership -> Power Pack
// Three modality flavors: COMBINED, RLT_ONLY, HBOT_ONLY

// ── Offer Definitions ────────────────────────────────────────────────────────

export const OFFER_TYPES = {
  TEST_DRIVE: 'TEST_DRIVE',
  SPRINT: 'SPRINT',
  MEMBERSHIP: 'MEMBERSHIP',
  ADD_ON: 'ADD_ON',
  SINGLE_SESSION: 'SINGLE_SESSION',
};

export const RECOVERY_OFFERS = {
  TEST_DRIVE: {
    name: 'Recovery Session Test Drive',
    type: 'TEST_DRIVE',
    priceCents: 14900,
    rackRateCents: 27000,
    sessions: 2,             // 1 HBOT + 1 RLT (counted as 2 service entries)
    durationDays: 7,
    isMembership: false,
    description: '1 HBOT session + 1 red light session. Same day or within 7 days.',
    limitPerPatient: 1,
  },
  SPRINT: {
    name: '14-Day Recovery & Energy Sprint',
    type: 'SPRINT',
    priceCents: 99700,
    rackRateCents: 216000,
    sessions: 8,             // 8 Recovery Sessions
    durationDays: 14,
    isMembership: false,
    description: '8 Recovery Sessions over 14 days with baseline + Day-14 symptom scoring.',
    guarantee: 'If your recovery or energy hasn\'t improved by 2+ points on our 0-10 scale by day 14, we\'ll add 2 extra weeks (6 red light sessions) at no charge.',
  },
  MEMBERSHIP: {
    name: 'Recovery Membership',
    type: 'MEMBERSHIP',
    priceCents: 79900,
    rackRateCents: 216000,
    sessions: 8,             // 8 Recovery Sessions per 28-day cycle
    billingCycleDays: 28,
    isMembership: true,
    description: 'Up to 8 Recovery Sessions per 28-day cycle. Priority scheduling. Sprint included as new-member bonus.',
    perks: ['Priority scheduling', 'Member pricing on extra sessions and Power Packs'],
  },
  ADD_ON: {
    name: 'Recovery Power Pack',
    type: 'ADD_ON',
    priceCents: 39900,
    rackRateCents: null,
    sessions: 8,             // +8 extra Recovery Sessions in current cycle
    isMembership: false,
    membersOnly: true,
    description: '+8 extra Recovery Sessions inside the current 28-day cycle. No rollover.',
  },
  SINGLE_SESSION: {
    name: 'Single Recovery Session',
    type: 'SINGLE_SESSION',
    priceCents: 0,           // varies: HBOT $185 or RLT $85
    sessions: 1,
    isMembership: false,
    description: 'Single session fallback. HBOT $185, RLT $85.',
  },
};

// Single session pricing (fallback only)
export const SINGLE_SESSION_PRICES = {
  hbot: 18500,
  rlt: 8500,
};

// ── Modality Options ─────────────────────────────────────────────────────────

export const MODALITY_OPTIONS = {
  COMBINED: {
    value: 'COMBINED',
    label: 'HBOT + Red Light',
    shortLabel: 'Combined',
    description: 'Chamber + red light in the same visit (best results)',
    serviceTypes: ['hbot', 'red_light'],
  },
  RLT_ONLY: {
    value: 'RLT_ONLY',
    label: 'Red Light Only',
    shortLabel: 'RLT Only',
    description: 'Red light sessions only (no chamber)',
    serviceTypes: ['red_light'],
  },
  HBOT_ONLY: {
    value: 'HBOT_ONLY',
    label: 'HBOT Only',
    shortLabel: 'HBOT Only',
    description: 'Chamber sessions only (no red light)',
    serviceTypes: ['hbot'],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getSessionLabel(modality) {
  return MODALITY_OPTIONS[modality]?.label || 'Recovery Session';
}

export function getServiceTypesForModality(modality) {
  return MODALITY_OPTIONS[modality]?.serviceTypes || ['hbot', 'red_light'];
}

export function formatPrice(cents) {
  if (!cents && cents !== 0) return '';
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function getOfferByType(type) {
  return RECOVERY_OFFERS[type] || null;
}

// Status badge colors
export const ENROLLMENT_STATUS_COLORS = {
  active: { bg: '#E8F5E9', text: '#2E7D32' },
  completed: { bg: '#E3F2FD', text: '#1565C0' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
  paused: { bg: '#FFF3E0', text: '#E65100' },
};

// Calculate cycle dates for membership
export function calculateCycleDates(startDate) {
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 28);
  return {
    cycleStart: start.toISOString().split('T')[0],
    cycleEnd: end.toISOString().split('T')[0],
  };
}

// Calculate end date for Sprint
export function calculateSprintEndDate(startDate) {
  const start = new Date(startDate + 'T12:00:00');
  start.setDate(start.getDate() + 14);
  return start.toISOString().split('T')[0];
}

// Calculate end date for Test Drive
export function calculateTestDriveEndDate(startDate) {
  const start = new Date(startDate + 'T12:00:00');
  start.setDate(start.getDate() + 7);
  return start.toISOString().split('T')[0];
}
