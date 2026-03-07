// lib/appointment-services.js
// Service catalog for the native appointment calendar
// Mirrors BookingTab's SERVICE_CATEGORIES but without Cal.com slug dependencies

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
    { name: 'New Patient Blood Draw', duration: 30, category: 'labs' },
    { name: 'Follow-Up Blood Draw', duration: 15, category: 'labs' },
    { name: 'Initial Lab Review', duration: 30, category: 'labs' },
    { name: 'Follow-Up Lab Review', duration: 20, category: 'labs' },
  ],
  'Injections': [
    { name: 'Range Injections', duration: 15, category: 'injection' },
    { name: 'NAD+ Injection', duration: 15, category: 'injection' },
    { name: 'Testosterone Injection', duration: 15, category: 'hrt' },
    { name: 'Weight Loss Injection', duration: 15, category: 'weight_loss' },
    { name: 'Peptide Injection', duration: 15, category: 'peptide' },
  ],
  'Therapies': [
    { name: 'HBOT Session', duration: 60, category: 'hbot' },
    { name: 'Red Light Therapy', duration: 20, category: 'rlt' },
  ],
  'IV Therapy': [
    { name: 'Range IV', duration: 45, category: 'iv' },
    { name: 'NAD+ IV 250mg', duration: 120, category: 'iv' },
    { name: 'NAD+ IV 500mg', duration: 180, category: 'iv' },
    { name: 'Specialty IV', duration: 60, category: 'iv' },
  ],
  'Consultations': [
    { name: 'Initial Consultation', duration: 45, category: 'other' },
    { name: 'Follow-Up Consultation', duration: 30, category: 'other' },
    { name: 'Telemedicine Consultation', duration: 30, category: 'other' },
    { name: 'Phone Consultation', duration: 15, category: 'other' },
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
export const PROVIDERS = {
  hbot: [
    { name: 'Chris', label: 'Chris' },
    { name: 'Damon', label: 'Damon' },
  ],
  rlt: [
    { name: 'Chris', label: 'Chris' },
    { name: 'Damon', label: 'Damon' },
  ],
  labs: [
    { name: 'Lily', label: 'Lily' },
    { name: 'Evan', label: 'Evan' },
    { name: 'Damien', label: 'Damien' },
  ],
  injection: [
    { name: 'Lily', label: 'Lily' },
    { name: 'Evan', label: 'Evan' },
    { name: 'Damien', label: 'Damien' },
  ],
  hrt: [
    { name: 'Lily', label: 'Lily' },
    { name: 'Evan', label: 'Evan' },
    { name: 'Damien', label: 'Damien' },
  ],
  weight_loss: [
    { name: 'Lily', label: 'Lily' },
    { name: 'Evan', label: 'Evan' },
    { name: 'Damien', label: 'Damien' },
  ],
  peptide: [
    { name: 'Lily', label: 'Lily' },
    { name: 'Evan', label: 'Evan' },
    { name: 'Damien', label: 'Damien' },
  ],
  iv: [
    { name: 'Lily', label: 'Lily' },
    { name: 'Damien', label: 'Damien' },
  ],
  other: [
    { name: 'Damien', label: 'Dr. Burgess' },
  ],
};

// Get providers for a service category
export function getProvidersForCategory(category) {
  return PROVIDERS[category] || PROVIDERS['other'] || [];
}
