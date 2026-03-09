// lib/appointment-services.js
// Service catalog for the native appointment calendar
// Each service maps to a Cal.com event type slug for real-time availability
// Range Medical

// Clinic locations
export const LOCATIONS = [
  { id: 'newport', label: 'Range Medical — Newport Beach', short: 'Newport Beach', address: '1901 Westcliff Dr Suite 9 & 10, Newport Beach, CA 92660' },
  { id: 'placentia', label: 'TLAB Wellness — Placentia', short: 'Placentia', address: '1025 Ortega Way B, Placentia, CA 92870' },
];

export const DEFAULT_LOCATION = LOCATIONS[0];

// Service categories that support location selection
export const LOCATION_ENABLED_CATEGORIES = ['iv'];

export const APPOINTMENT_SERVICES = {
  'Lab / Blood Draw': [
    { name: 'New Patient Blood Draw', duration: 15, category: 'labs', calcomSlug: 'new-patient-blood-draw' },
    { name: 'Follow-Up Blood Draw', duration: 15, category: 'labs', calcomSlug: 'follow-up-blood-draw' },
  ],
  'Injections': [
    { name: 'Range Injections', duration: 15, category: 'injection', calcomSlug: 'range-injections' },
    { name: 'NAD+ Injection', duration: 15, category: 'injection', calcomSlug: 'nad-injection' },
    { name: 'Testosterone Injection', duration: 15, category: 'hrt', calcomSlug: 'injection-testosterone' },
    { name: 'Weight Loss Injection', duration: 15, category: 'weight_loss', calcomSlug: 'injection-weight-loss' },
    { name: 'Peptide Injection', duration: 15, category: 'peptide', calcomSlug: 'injection-peptide' },
  ],
  'Therapies': [
    { name: 'HBOT Session', duration: 60, category: 'hbot', calcomSlug: 'hbot' },
    { name: 'Red Light Therapy', duration: 20, category: 'rlt', calcomSlug: 'red-light-therapy' },
  ],
  'IV Therapy': [
    { name: 'Range IV', duration: 60, category: 'iv', calcomSlug: 'range-iv' },
    { name: 'NAD+ IV 250mg', duration: 120, category: 'iv', calcomSlug: 'nad-iv-250' },
    { name: 'NAD+ IV 500mg', duration: 180, category: 'iv', calcomSlug: 'nad-iv-500' },
    { name: 'Specialty IV', duration: 60, category: 'iv', calcomSlug: 'specialty-iv' },
  ],
  'Consultations': [
    { name: 'Initial Conversation — In Clinic', duration: 30, category: 'initial_conversation', calcomSlug: null },
    { name: 'Initial Conversation — Phone Call', duration: 30, category: 'initial_conversation', calcomSlug: null },
    { name: 'Initial Consultation', duration: 45, category: 'other', calcomSlug: 'initial-consultation' },
    { name: 'Follow-Up Consultation', duration: 45, category: 'other', calcomSlug: 'follow-up-consultation' },
    { name: 'Initial Lab Review', duration: 45, category: 'other', calcomSlug: 'initial-lab-review' },
    { name: 'Follow-Up Lab Review', duration: 45, category: 'other', calcomSlug: 'follow-up-lab-review' },
    { name: 'Telemedicine Consultation', duration: 45, category: 'other', calcomSlug: null },
    { name: 'Phone Consultation', duration: 45, category: 'other', calcomSlug: null },
  ],
};

// Flat list of all services for search
export function getAllServices() {
  const services = [];
  for (const [group, items] of Object.entries(APPOINTMENT_SERVICES)) {
    for (const item of items) {
      services.push({ ...item, group });
    }
  }
  return services;
}

// Get category from service name
export function getCategoryForService(serviceName) {
  for (const items of Object.values(APPOINTMENT_SERVICES)) {
    const found = items.find(s => s.name === serviceName);
    if (found) return found.category;
  }
  return 'other';
}

// Provider assignments per service category
// Matches cal.com team event host assignments from setup-calcom-team-events.js
// calcomUsername used to filter available slots by provider
export const PROVIDERS = {
  hbot: [
    { name: 'Chris', label: 'Chris', calcomUsername: 'chris' },
    { name: 'Damon', label: 'Damon', calcomUsername: 'damon' },
  ],
  rlt: [
    { name: 'Chris', label: 'Chris', calcomUsername: 'chris' },
    { name: 'Damon', label: 'Damon', calcomUsername: 'damon' },
  ],
  labs: [
    { name: 'Lily', label: 'Lily', calcomUsername: 'lily' },
    { name: 'Evan', label: 'Evan', calcomUsername: 'evan' },
    { name: 'Damien', label: 'Damien', calcomUsername: 'damien' },
  ],
  injection: [
    { name: 'Lily', label: 'Lily', calcomUsername: 'lily' },
    { name: 'Evan', label: 'Evan', calcomUsername: 'evan' },
    { name: 'Damien', label: 'Damien', calcomUsername: 'damien' },
  ],
  hrt: [
    { name: 'Lily', label: 'Lily', calcomUsername: 'lily' },
    { name: 'Evan', label: 'Evan', calcomUsername: 'evan' },
    { name: 'Damien', label: 'Damien', calcomUsername: 'damien' },
  ],
  weight_loss: [
    { name: 'Lily', label: 'Lily', calcomUsername: 'lily' },
    { name: 'Evan', label: 'Evan', calcomUsername: 'evan' },
    { name: 'Damien', label: 'Damien', calcomUsername: 'damien' },
  ],
  peptide: [
    { name: 'Lily', label: 'Lily', calcomUsername: 'lily' },
    { name: 'Evan', label: 'Evan', calcomUsername: 'evan' },
    { name: 'Damien', label: 'Damien', calcomUsername: 'damien' },
  ],
  iv: [
    { name: 'Lily', label: 'Lily', calcomUsername: 'lily' },
    { name: 'Damien', label: 'Damien', calcomUsername: 'damien' },
  ],
  initial_conversation: [
    { name: 'Chris Cupp', label: 'Chris Cupp', calcomUsername: 'chris' },
  ],
  other: [
    { name: 'Damien', label: 'Dr. Burgess', calcomUsername: 'damien' },
  ],
};

// Required forms per service category (form IDs match lib/form-bundles.js)
export const REQUIRED_FORMS = {
  labs:        ['intake', 'hipaa', 'blood-draw'],
  injection:   ['intake', 'hipaa', 'iv'],
  hrt:         ['intake', 'hipaa', 'hrt', 'blood-draw'],
  weight_loss: ['intake', 'hipaa', 'weight-loss'],
  peptide:     ['intake', 'hipaa', 'peptide'],
  iv:          ['intake', 'hipaa', 'iv'],
  hbot:        ['intake', 'hipaa', 'hbot'],
  rlt:         ['intake', 'hipaa', 'red-light'],
  other:       ['intake', 'hipaa'],
};

// Get providers for a service category
export function getProvidersForCategory(category) {
  return PROVIDERS[category] || PROVIDERS['other'] || [];
}
