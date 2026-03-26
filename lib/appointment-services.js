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
    { name: 'Therapeutic Phlebotomy', duration: 60, category: 'phlebotomy', calcomSlug: 'therapeutic-phlebotomy' },
  ],
  'Pickups': [
    { name: 'Medication Pickup', duration: 15, category: 'medication_pickup', calcomSlug: 'medication-pickup' },
  ],
  'IV Therapy': [
    { name: 'Range IV', duration: 60, category: 'iv', calcomSlug: 'range-iv', subtype: 'range' },
  ],
  'Specialty IVs': [
    { name: 'NAD+ IV 225mg', duration: 60, category: 'iv', calcomSlug: 'nad-iv-225' },
    { name: 'NAD+ IV 500mg', duration: 90, category: 'iv', calcomSlug: 'nad-iv-500' },
    { name: 'NAD+ IV 750mg', duration: 120, category: 'iv', calcomSlug: 'nad-iv-750' },
    { name: 'NAD+ IV 1000mg', duration: 180, category: 'iv', calcomSlug: 'nad-iv-1000' },
    { name: 'Vitamin C 25g', duration: 90, category: 'iv', calcomSlug: 'vitamin-c-iv-25g', requiresBloodWork: true },
    { name: 'Vitamin C 50g', duration: 90, category: 'iv', calcomSlug: 'vitamin-c-iv-50g', requiresBloodWork: true },
    { name: 'Vitamin C 75g', duration: 120, category: 'iv', calcomSlug: 'vitamin-c-iv-75g', requiresBloodWork: true },
    { name: 'Methylene Blue IV', duration: 60, category: 'iv', calcomSlug: 'methylene-blue-iv', requiresBloodWork: true },
    { name: 'MB + Vit C + Mag Combo', duration: 120, category: 'iv', calcomSlug: 'mb-combo-iv', requiresBloodWork: true },
    { name: 'Glutathione 1g', duration: 60, category: 'iv', calcomSlug: 'glutathione-iv-1g' },
    { name: 'Glutathione 2g', duration: 60, category: 'iv', calcomSlug: 'glutathione-iv-2g' },
    { name: 'Glutathione 3g', duration: 60, category: 'iv', calcomSlug: 'glutathione-iv-3g' },
  ],
  'Diagnostics': [
    { name: 'DEXA Scan', duration: 45, category: 'dexa', calcomSlug: 'dexa-scan' },
  ],
  'Consultations': [
    { name: 'Initial Conversation — In Clinic', duration: 30, category: 'initial_conversation', calcomSlug: null },
    { name: 'Initial Conversation — Phone Call', duration: 30, category: 'initial_conversation', calcomSlug: null },
    { name: 'Initial Consultation', duration: 45, category: 'other', calcomSlug: 'initial-consultation' },
    { name: 'Follow-Up Consultation', duration: 20, category: 'follow_up_consultation', calcomSlug: 'follow-up-consultation' },
    { name: 'Follow-Up Consultation — Telemedicine', duration: 20, category: 'follow_up_consultation', calcomSlug: 'follow-up-consultation-telemedicine' },
    { name: 'Follow-Up Consultation — Phone', duration: 20, category: 'follow_up_consultation', calcomSlug: 'follow-up-consultation-phone' },
    { name: 'Initial Lab Review', duration: 45, category: 'other', calcomSlug: 'initial-lab-review' },
    { name: 'Follow-Up Lab Review', duration: 45, category: 'other', calcomSlug: 'follow-up-lab-review' },
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
  phlebotomy: [
    { name: 'Lily', label: 'Lily', calcomUsername: 'lily' },
    { name: 'Evan', label: 'Evan', calcomUsername: 'evan' },
    { name: 'Damien', label: 'Damien', calcomUsername: 'damien' },
  ],
  dexa: [
    { name: 'Damien', label: 'Dr. Burgess', calcomUsername: 'damien' },
  ],
  medication_pickup: [
    { name: 'Damon', label: 'Damon', calcomUsername: 'damon' },
    { name: 'Tara', label: 'Tara', calcomUsername: 'tara' },
    { name: 'Chris', label: 'Chris', calcomUsername: 'chris' },
  ],
  initial_conversation: [
    { name: 'Chris Cupp', label: 'Chris Cupp', calcomUsername: 'chris' },
  ],
  follow_up_consultation: [
    { name: 'Damien', label: 'Dr. Burgess', calcomUsername: 'damien' },
    { name: 'Chris Cupp', label: 'Chris', calcomUsername: 'chris' },
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
  phlebotomy:       ['intake', 'hipaa', 'blood-draw'],
  medication_pickup: ['intake', 'hipaa'],
  dexa:         ['intake', 'hipaa'],
  follow_up_consultation: ['intake', 'hipaa'],
  other:       ['intake', 'hipaa'],
};

// Get providers for a service category
export function getProvidersForCategory(category) {
  return PROVIDERS[category] || PROVIDERS['other'] || [];
}
