// Pipeline system — single source of truth for pipeline boards, stages, filters.
// Every board, card, API route, and automation reads from this file.
// Range Medical System V2

export const CARD_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  LOST: 'lost',
  PAUSED: 'paused',
  SCHEDULED: 'scheduled',
};

// Pipeline definitions.
// Each stage may declare `owner: [staffIds]` — used as the default assignee
// when a card first enters that stage (overridable).
export const PIPELINES = {
  leads: {
    key: 'leads',
    label: 'Leads',
    description: 'Every new inquiry from any source. Exits when the assessment is done.',
    stages: [
      { key: 'new',               label: 'New' },
      { key: 'reached_out',       label: 'Reached Out' },
      { key: 'connected',         label: 'Connected' },
      { key: 'assessment_booked', label: 'Assessment Booked' },
      { key: 'assessment_done',   label: 'Assessment Completed' },
    ],
    defaultAssignees: ['tara'],
    filters: null,
    cardFields: ['source', 'path', 'urgency'],
  },

  free_sessions: {
    key: 'free_sessions',
    label: 'Free Sessions',
    description: 'Raffle / promo winners redeeming complimentary Red Light or HBOT sessions. Move to Converted when they buy a paid package.',
    stages: [
      { key: 'new',                label: 'New Lead' },
      { key: 'needs_scheduling',   label: 'Needs Scheduling' },
      { key: 'scheduled',          label: 'Scheduled' },
      { key: 'completed',          label: 'Completed' },
      { key: 'options_presented',  label: 'Options Presented' },
      { key: 'converted',          label: 'Converted' },
    ],
    defaultAssignees: ['tara'],
    filters: {
      prize_type: {
        label: 'Prize',
        values: [
          { value: 'red_light', label: 'Red Light' },
          { value: 'hbot',      label: 'HBOT' },
        ],
      },
    },
    cardFields: ['prize_type', 'sessions_used', 'total_sessions', 'raffle_code'],
  },

  energy_workup: {
    key: 'energy_workup',
    label: 'Main Pipeline',
    description: 'Main patient journey — labs draw to consult completed.',
    stages: [
      { key: 'labs_scheduled',       label: 'Labs Scheduled',       owner: ['primex'] },
      { key: 'awaiting_results',     label: 'Awaiting Results',     owner: ['primex'] },
      { key: 'under_review',         label: 'Under Review',         owner: ['damien', 'evan'] },
      { key: 'ready_to_schedule',    label: 'Ready to Schedule',    owner: ['tara'] },
      { key: 'scheduling_attempted', label: 'Scheduling Attempted', owner: ['tara'] },
      { key: 'consult_booked',       label: 'Consult Booked',       owner: ['tara'] },
      { key: 'consult_completed',    label: 'Consult Completed',    owner: ['damien', 'evan'] },
      { key: 'closed',               label: 'Closed',               owner: [] },
    ],
    filters: null,
    cardFields: ['lab_type', 'labs_drawn_at'],
  },

  follow_up_labs: {
    key: 'follow_up_labs',
    label: 'Follow-Up Labs',
    description: 'Follow-up labs for patients already on HRT or weight-loss treatment.',
    stages: [
      { key: 'labs_scheduled',       label: 'Labs Scheduled',       owner: ['primex'] },
      { key: 'awaiting_results',     label: 'Awaiting Results',     owner: ['primex'] },
      { key: 'under_review',         label: 'Under Review',         owner: ['damien', 'evan'] },
      { key: 'ready_to_schedule',    label: 'Ready to Schedule',    owner: ['tara'] },
      { key: 'scheduling_attempted', label: 'Scheduling Attempted', owner: ['tara'] },
      { key: 'consult_booked',       label: 'Consult Booked',       owner: ['tara'] },
      { key: 'consult_completed',    label: 'Consult Completed',    owner: ['damien', 'evan'] },
      { key: 'closed',               label: 'Closed',               owner: [] },
    ],
    filters: null,
    cardFields: ['lab_type', 'labs_drawn_at'],
  },

  injury_workup: {
    key: 'injury_workup',
    label: 'Injury Workup',
    description: 'Assessment to treatment start for injury & recovery.',
    stages: [
      { key: 'assessment_booked', label: 'Assessment Booked' },
      { key: 'assessment_done',   label: 'Assessment Completed' },
      { key: 'treatment_started', label: 'Treatment Started' },
    ],
    filters: null,
    cardFields: [],
  },

  hrt: {
    key: 'hrt',
    label: 'HRT',
    description: 'Hormone optimization lifecycle.',
    stages: [
      { key: 'started',      label: 'Started' },
      { key: 'active',       label: 'Active' },
      { key: 'labs_due',     label: 'Labs Due' },
      { key: 'followup_due', label: 'Follow-up Due' },
      { key: 'at_risk',      label: 'At Risk' },
      { key: 'completed',    label: 'Completed' },
    ],
    filters: {
      administration_mode: {
        label: 'Delivery',
        values: [
          { value: 'take_home', label: 'Take Home' },
          { value: 'in_clinic', label: 'In Clinic' },
        ],
      },
      supply_type: {
        label: 'Supply',
        values: [
          { value: 'prefilled', label: 'Prefilled' },
          { value: 'vial',      label: 'Vial' },
        ],
      },
    },
    cardFields: ['medication', 'dose', 'supply', 'frequency', 'last_dispensed', 'next_due', 'payment'],
  },

  weight_loss: {
    key: 'weight_loss',
    label: 'Weight Loss',
    description: 'GLP-1 titration and maintenance.',
    stages: [
      { key: 'started',     label: 'Started' },
      { key: 'titrating',   label: 'Titrating' },
      { key: 'maintenance', label: 'Maintenance' },
      { key: 'payment_due', label: 'Payment Due' },
      { key: 'at_risk',     label: 'At Risk' },
      { key: 'completed',   label: 'Completed' },
    ],
    filters: {
      administration_mode: {
        label: 'Delivery',
        values: [
          { value: 'take_home', label: 'Take Home' },
          { value: 'in_clinic', label: 'In Clinic' },
        ],
      },
    },
    cardFields: ['medication', 'dose', 'administration_mode', 'last_payment', 'next_payment', 'payment'],
  },

  peptides: {
    key: 'peptides',
    label: 'Peptides',
    description: 'Cycle-based peptide protocols.',
    stages: [
      { key: 'active_cycle', label: 'Active Cycle' },
      { key: 'mid_cycle',    label: 'Mid-Cycle Check' },
      { key: 'renewal_due',  label: 'Renewal Due' },
      { key: 'off_cycle',    label: 'Off-Cycle' },
      { key: 'completed',    label: 'Completed' },
    ],
    filters: null,
    cardFields: ['program', 'medication', 'dose', 'progress', 'last_payment'],
  },

  hbot: {
    key: 'hbot',
    label: 'HBOT',
    description: 'Hyperbaric oxygen chamber sessions.',
    stages: [
      { key: 'new_package',      label: 'New Package' },
      { key: 'in_progress',      label: 'In Progress' },
      { key: 'package_complete', label: 'Package Complete' },
      { key: 'maintenance',      label: 'Maintenance' },
      { key: 'renewal_due',      label: 'Renewal Due' },
    ],
    filters: null,
    cardFields: ['sessions_used', 'total_sessions'],
  },

  rlt: {
    key: 'rlt',
    label: 'Red Light Therapy',
    description: 'Red light photobiomodulation sessions.',
    stages: [
      { key: 'new_package',      label: 'New Package' },
      { key: 'in_progress',      label: 'In Progress' },
      { key: 'package_complete', label: 'Package Complete' },
      { key: 'maintenance',      label: 'Maintenance' },
      { key: 'renewal_due',      label: 'Renewal Due' },
    ],
    filters: null,
    cardFields: ['sessions_used', 'total_sessions'],
  },

  injections: {
    key: 'injections',
    label: 'Injections',
    description: 'NAD+, Range, specialty, PRP, and exosome injection courses.',
    stages: [
      { key: 'scheduled',   label: 'Scheduled' },
      { key: 'treated',     label: 'Treated' },
      { key: 'followup_1w', label: '1-Wk Follow-up' },
      { key: 'followup_4w', label: '4-Wk Follow-up' },
      { key: 'followup_8w', label: '8-Wk Follow-up' },
      { key: 'completed',   label: 'Completed' },
    ],
    filters: {
      injection_type: {
        label: 'Type',
        values: [
          { value: 'range',     label: 'Range' },
          { value: 'nad',       label: 'NAD+' },
          { value: 'specialty', label: 'Specialty' },
          { value: 'prp',       label: 'PRP' },
          { value: 'exosomes',  label: 'Exosomes' },
        ],
      },
    },
    cardFields: ['injection_type', 'program', 'medication', 'administration_mode', 'target'],
  },

  follow_up: {
    key: 'follow_up',
    label: 'Follow-Up',
    description: 'Cross-service renewal conversations and outreach.',
    stages: [
      { key: 'flagged',    label: 'Flagged' },
      { key: 'outreach_1', label: 'Outreach 1' },
      { key: 'outreach_2', label: 'Outreach 2' },
      { key: 'connected',  label: 'Connected' },
      { key: 'resolved',   label: 'Resolved' },
    ],
    filters: null,
    cardFields: ['reason'],
  },
};

export const PIPELINE_ORDER = [
  'leads',
  'free_sessions',
  'energy_workup',
  'follow_up_labs',
  'injury_workup',
  'hrt',
  'weight_loss',
  'peptides',
  'hbot',
  'rlt',
  'injections',
  'follow_up',
];

export function getPipeline(key) {
  return PIPELINES[key] || null;
}

export function getStage(pipelineKey, stageKey) {
  const p = PIPELINES[pipelineKey];
  if (!p) return null;
  return p.stages.find(s => s.key === stageKey) || null;
}

export function firstStage(pipelineKey) {
  return PIPELINES[pipelineKey]?.stages?.[0] || null;
}

export function isValidStage(pipelineKey, stageKey) {
  return !!getStage(pipelineKey, stageKey);
}

// Treatment pipelines — used to map a program_type to a pipeline when a protocol is created
export const PROGRAM_TYPE_TO_PIPELINE = {
  hrt:           'hrt',
  weight_loss:   'weight_loss',
  peptide:       'peptides',
  peptides:      'peptides',
  hbot:          'hbot',
  rlt:           'rlt',
  injection:     'injections',
  injections:    'injections',
  injection_pack:'injections',
  nad_injection: 'injections',
};

// Categorize an injection protocol into a type bucket — used for card.meta.injection_type
// and for filtering the Injections board. Highest-priority match wins.
export function categorizeInjection({ medication, program_name } = {}) {
  const hay = `${medication || ''} ${program_name || ''}`.toLowerCase();
  if (/\bprp\b|platelet/.test(hay))                                 return 'prp';
  if (/exosome/.test(hay))                                          return 'exosomes';
  if (/nad\+|\bnad\b/.test(hay))                                    return 'nad';
  if (/b-?12|glutathione|biotin|mic\b|lipo-?c|tri[\s-]?immune|vitamin|mineral/.test(hay)) return 'specialty';
  if (/standard|premium|range\s+injection|injection\s+pack|injection\s+\d+-?pack/.test(hay)) return 'range';
  return 'specialty';
}
