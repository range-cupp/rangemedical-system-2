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

  energy_workup: {
    key: 'energy_workup',
    label: 'Energy Workup',
    description: 'Labs journey — draw to consult.',
    stages: [
      { key: 'labs_scheduled',       label: 'Labs Scheduled',       owner: ['primex'] },
      { key: 'awaiting_results',     label: 'Awaiting Results',     owner: ['primex'] },
      { key: 'under_review',         label: 'Under Review',         owner: ['damien', 'evan'] },
      { key: 'ready_to_schedule',    label: 'Ready to Schedule',    owner: ['tara'] },
      { key: 'scheduling_attempted', label: 'Scheduling Attempted', owner: ['tara'] },
      { key: 'consult_booked',       label: 'Consult Booked',       owner: ['tara'] },
      { key: 'consult_completed',    label: 'Consult Completed',    owner: ['damien', 'evan'] },
    ],
    filters: null,
    cardFields: ['lab_type'],
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
    },
    cardFields: ['medication', 'dose', 'administration_mode'],
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
    cardFields: ['medication', 'dose', 'administration_mode'],
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
    cardFields: ['program', 'medication', 'dose', 'progress'],
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
    description: 'PRP and exosome injection courses.',
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
          { value: 'prp',      label: 'PRP' },
          { value: 'exosomes', label: 'Exosomes' },
        ],
      },
    },
    cardFields: ['injection_type', 'target'],
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
  'energy_workup',
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
  hrt:         'hrt',
  weight_loss: 'weight_loss',
  peptide:     'peptides',
  peptides:    'peptides',
  hbot:        'hbot',
  rlt:         'rlt',
  injection:   'injections',
  injections:  'injections',
};
