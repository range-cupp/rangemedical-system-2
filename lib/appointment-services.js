// lib/appointment-services.js
// Service catalog for the native appointment calendar
// Each service maps to a Cal.com event type slug for real-time availability
// Range Medical

// Blood work must be on file within this many days for prereq-gated services
export const BLOOD_WORK_VALIDITY_DAYS = 90;

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
  'Range Assessment': [
    { name: 'Range Assessment — Injury & Recovery', duration: 30, category: 'assessment', calcomSlug: 'range-assessment-injury' },
    { name: 'Range Assessment — Energy & Optimization', duration: 30, category: 'assessment', calcomSlug: 'range-assessment-energy' },
    { name: 'Range Assessment — Both', duration: 45, category: 'assessment', calcomSlug: 'range-assessment-both' },
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
  assessment: [
    { name: 'Chris Cupp', label: 'Chris', calcomUsername: 'chris' },
    { name: 'Damon', label: 'Damon', calcomUsername: 'damon' },
    { name: 'Damien', label: 'Dr. Burgess', calcomUsername: 'damien' },
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
  assessment:  ['intake', 'hipaa'],
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

// Pre-visit instruction templates by Cal.com slug
// Blood draws use gender-specific logic in appointment-emails.js (not duplicated here)
// Returns { sms: string, subject: string } or null if no instructions
export const PREP_INSTRUCTIONS = {
  // IV Therapy — general
  'range-iv': {
    sms: 'To prepare for your IV session: drink at least 32oz of water the morning of your appointment, eat a light meal 1-2 hours before, and avoid heavy exercise the day of.',
    subject: 'IV Therapy Prep',
  },
  // NAD+ IVs — extra warning about intensity
  'nad-iv-225': {
    sms: 'To prepare for your NAD+ IV: drink at least 32oz of water the morning of, eat a light meal 1-2 hours before, and avoid heavy exercise day of. NAD+ sessions can feel intense — mild nausea, chest tightness, and flushing are normal and managed by slowing the drip rate.',
    subject: 'NAD+ IV Prep',
  },
  'nad-iv-500': {
    sms: 'To prepare for your NAD+ IV: drink at least 32oz of water the morning of, eat a light meal 1-2 hours before, and avoid heavy exercise day of. NAD+ sessions can feel intense — mild nausea, chest tightness, and flushing are normal and managed by slowing the drip rate.',
    subject: 'NAD+ IV Prep',
  },
  'nad-iv-750': {
    sms: 'To prepare for your NAD+ IV: drink at least 32oz of water the morning of, eat a light meal 1-2 hours before, and avoid heavy exercise day of. NAD+ sessions can feel intense — mild nausea, chest tightness, and flushing are normal and managed by slowing the drip rate.',
    subject: 'NAD+ IV Prep',
  },
  'nad-iv-1000': {
    sms: 'To prepare for your NAD+ IV: drink at least 32oz of water the morning of, eat a light meal 1-2 hours before, and avoid heavy exercise day of. NAD+ sessions can feel intense — mild nausea, chest tightness, and flushing are normal and managed by slowing the drip rate.',
    subject: 'NAD+ IV Prep',
  },
  // Specialty IVs that require blood work — same hydration prep as general IV
  'vitamin-c-iv-25g': {
    sms: 'Pre-Infusion Reminder for your High-Dose Vitamin C IV:\n\n• Eat a light meal or snack 1\u20132 hrs before your appointment\n• Drink 16\u201324 oz of water before you arrive (stay well-hydrated)\n• Avoid alcohol for 24 hrs before infusion\n• Continue your regular prescriptions unless told otherwise\n• Do not take glutathione, NAC, or other high-dose antioxidants 4\u20136 hrs before infusion\n• Reschedule if you\u2019re feeling sick (fever, vomiting, etc.)\n• Wear loose sleeves and bring anything you want for comfort (water, blanket, headphones)\n\nPost-Infusion Care:\n• Stay hydrated \u2013 drink plenty of water for the next 24 hrs\n• You may feel energized or a little tired \u2013 both are normal\n• Eat a balanced meal today to support metabolism\n• Avoid alcohol and excessive caffeine for the rest of the day\n• If you take oral antioxidants (glutathione, NAC, ALA), wait 4\u20136 hrs before taking them\n• Mild headache or fatigue can happen \u2013 hydration usually helps',
    subject: 'Vitamin C IV Prep',
  },
  'vitamin-c-iv-50g': {
    sms: 'Pre-Infusion Reminder for your High-Dose Vitamin C IV:\n\n• Eat a light meal or snack 1\u20132 hrs before your appointment\n• Drink 16\u201324 oz of water before you arrive (stay well-hydrated)\n• Avoid alcohol for 24 hrs before infusion\n• Continue your regular prescriptions unless told otherwise\n• Do not take glutathione, NAC, or other high-dose antioxidants 4\u20136 hrs before infusion\n• Reschedule if you\u2019re feeling sick (fever, vomiting, etc.)\n• Wear loose sleeves and bring anything you want for comfort (water, blanket, headphones)\n\nPost-Infusion Care:\n• Stay hydrated \u2013 drink plenty of water for the next 24 hrs\n• You may feel energized or a little tired \u2013 both are normal\n• Eat a balanced meal today to support metabolism\n• Avoid alcohol and excessive caffeine for the rest of the day\n• If you take oral antioxidants (glutathione, NAC, ALA), wait 4\u20136 hrs before taking them\n• Mild headache or fatigue can happen \u2013 hydration usually helps',
    subject: 'Vitamin C IV Prep',
  },
  'vitamin-c-iv-75g': {
    sms: 'Pre-Infusion Reminder for your High-Dose Vitamin C IV:\n\n• Eat a light meal or snack 1\u20132 hrs before your appointment\n• Drink 16\u201324 oz of water before you arrive (stay well-hydrated)\n• Avoid alcohol for 24 hrs before infusion\n• Continue your regular prescriptions unless told otherwise\n• Do not take glutathione, NAC, or other high-dose antioxidants 4\u20136 hrs before infusion\n• Reschedule if you\u2019re feeling sick (fever, vomiting, etc.)\n• Wear loose sleeves and bring anything you want for comfort (water, blanket, headphones)\n\nPost-Infusion Care:\n• Stay hydrated \u2013 drink plenty of water for the next 24 hrs\n• You may feel energized or a little tired \u2013 both are normal\n• Eat a balanced meal today to support metabolism\n• Avoid alcohol and excessive caffeine for the rest of the day\n• If you take oral antioxidants (glutathione, NAC, ALA), wait 4\u20136 hrs before taking them\n• Mild headache or fatigue can happen \u2013 hydration usually helps',
    subject: 'Vitamin C IV Prep',
  },
  'methylene-blue-iv': {
    sms: 'To prepare for your Methylene Blue IV: drink at least 32oz of water the morning of your appointment, eat a light meal 1-2 hours before, and avoid heavy exercise the day of.',
    subject: 'Methylene Blue IV Prep',
  },
  'mb-combo-iv': {
    sms: 'To prepare for your MB + Vit C + Mag Combo IV: drink at least 32oz of water the morning of your appointment, eat a light meal 1-2 hours before, and avoid heavy exercise the day of.',
    subject: 'Combo IV Prep',
  },
  'glutathione-iv-1g': {
    sms: 'To prepare for your Glutathione IV: drink at least 32oz of water the morning of your appointment, eat a light meal 1-2 hours before, and avoid heavy exercise the day of.',
    subject: 'Glutathione IV Prep',
  },
  'glutathione-iv-2g': {
    sms: 'To prepare for your Glutathione IV: drink at least 32oz of water the morning of your appointment, eat a light meal 1-2 hours before, and avoid heavy exercise the day of.',
    subject: 'Glutathione IV Prep',
  },
  'glutathione-iv-3g': {
    sms: 'To prepare for your Glutathione IV: drink at least 32oz of water the morning of your appointment, eat a light meal 1-2 hours before, and avoid heavy exercise the day of.',
    subject: 'Glutathione IV Prep',
  },
  // Catch-all slugs (Cal.com generic event types + deriveSlugFromTitle fallbacks)
  'specialty-iv': {
    sms: 'To prepare for your IV session: drink at least 32oz of water the morning of your appointment, eat a light meal 1-2 hours before, and avoid heavy exercise the day of.',
    subject: 'Specialty IV Prep',
  },
  'vitamin-c-iv': {
    sms: 'Pre-Infusion Reminder for your High-Dose Vitamin C IV:\n\n• Eat a light meal or snack 1\u20132 hrs before your appointment\n• Drink 16\u201324 oz of water before you arrive (stay well-hydrated)\n• Avoid alcohol for 24 hrs before infusion\n• Continue your regular prescriptions unless told otherwise\n• Do not take glutathione, NAC, or other high-dose antioxidants 4\u20136 hrs before infusion\n• Reschedule if you\u2019re feeling sick (fever, vomiting, etc.)\n• Wear loose sleeves and bring anything you want for comfort (water, blanket, headphones)\n\nPost-Infusion Care:\n• Stay hydrated \u2013 drink plenty of water for the next 24 hrs\n• You may feel energized or a little tired \u2013 both are normal\n• Eat a balanced meal today to support metabolism\n• Avoid alcohol and excessive caffeine for the rest of the day\n• If you take oral antioxidants (glutathione, NAC, ALA), wait 4\u20136 hrs before taking them\n• Mild headache or fatigue can happen \u2013 hydration usually helps',
    subject: 'Vitamin C IV Prep',
  },
  'glutathione-iv': {
    sms: 'To prepare for your Glutathione IV: drink at least 32oz of water the morning of your appointment, eat a light meal 1-2 hours before, and avoid heavy exercise the day of.',
    subject: 'Glutathione IV Prep',
  },
  // HBOT
  'hbot': {
    sms: 'To prepare for your HBOT session: no alcohol 24 hours prior, no perfume/cologne/petroleum-based products, wear cotton clothing, remove all jewelry, and arrive 10 minutes early.',
    subject: 'HBOT Session Prep',
  },
  // Red Light Therapy
  'red-light-therapy': {
    sms: 'To prepare for your Red Light Therapy session: no sunscreen or lotions on the skin being treated — clean skin is best. Eye protection will be provided in clinic.',
    subject: 'Red Light Therapy Prep',
  },
  // Therapeutic Phlebotomy
  'therapeutic-phlebotomy': {
    sms: 'To prepare for your Therapeutic Phlebotomy: hydrate well, eat a full meal beforehand, and bring a valid photo ID.',
    subject: 'Therapeutic Phlebotomy Prep',
  },
  // Injections — all types
  'range-injections': {
    sms: 'For your injection appointment: no specific prep needed unless your provider has instructed otherwise. Please confirm your current medications with your provider at the visit.',
    subject: 'Injection Appointment',
  },
  'nad-injection': {
    sms: 'For your NAD+ injection appointment: no specific prep needed unless your provider has instructed otherwise. Please confirm your current medications with your provider at the visit.',
    subject: 'NAD+ Injection Appointment',
  },
  'injection-testosterone': {
    sms: 'For your testosterone injection appointment: no specific prep needed unless your provider has instructed otherwise. Please confirm your current medications with your provider at the visit.',
    subject: 'Injection Appointment',
  },
  'injection-weight-loss': {
    sms: 'For your weight loss injection appointment: no specific prep needed unless your provider has instructed otherwise. Please confirm your current medications with your provider at the visit.',
    subject: 'Injection Appointment',
  },
  'injection-peptide': {
    sms: 'For your peptide injection appointment: no specific prep needed unless your provider has instructed otherwise. Please confirm your current medications with your provider at the visit.',
    subject: 'Injection Appointment',
  },
  // DEXA Scan
  'dexa-scan': {
    sms: 'To prepare for your DEXA Scan: no calcium supplements 24 hours prior, wear comfortable loose clothing with no metal (zippers, belt buckles, etc.), and no recent barium contrast or nuclear medicine scans.',
    subject: 'DEXA Scan Prep',
  },
  // Consultations — in-clinic
  'initial-consultation': {
    sms: 'For your consultation at Range Medical: bring a list of your current medications and supplements, and plan to arrive 5 minutes early.',
    subject: 'Consultation Prep',
  },
  'follow-up-consultation': {
    sms: 'For your follow-up consultation at Range Medical: bring a list of your current medications and supplements, and plan to arrive 5 minutes early.',
    subject: 'Consultation Prep',
  },
  // Consultations — telemedicine
  'follow-up-consultation-telemedicine': {
    sms: 'For your telemedicine consultation: test your video and audio before the appointment, use the link in your confirmation email, and find a private quiet space.',
    subject: 'Telemedicine Consultation Prep',
  },
  // Consultations — phone
  'follow-up-consultation-phone': {
    sms: 'For your phone consultation: please be available at the booked time on the phone number we have on file. Have your current medications list handy.',
    subject: 'Phone Consultation Prep',
  },
  // Lab reviews (in-clinic, telemedicine, phone)
  'initial-lab-review': {
    sms: 'For your lab review at Range Medical: bring a list of your current medications and supplements, and plan to arrive 5 minutes early.',
    subject: 'Lab Review Prep',
  },
  'follow-up-lab-review': {
    sms: 'For your lab review at Range Medical: bring a list of your current medications and supplements, and plan to arrive 5 minutes early.',
    subject: 'Lab Review Prep',
  },
  // Medication Pickup
  'medication-pickup': {
    sms: 'For your medication pickup at Range Medical: bring a valid photo ID. Pickup is available during business hours only.',
    subject: 'Medication Pickup',
  },
  // Range Assessment
  'range-assessment-injury': {
    sms: 'For your Range Assessment: bring any imaging (MRI, X-ray) or medical records related to your injury. If you have recent lab results, bring those too. Plan to arrive 5 minutes early.',
    subject: 'Range Assessment Prep',
  },
  'range-assessment-energy': {
    sms: 'For your Range Assessment: bring a list of your current medications and supplements, and any recent lab results if you have them. Plan to arrive 5 minutes early.',
    subject: 'Range Assessment Prep',
  },
  'range-assessment-both': {
    sms: 'For your Range Assessment: bring any imaging (MRI, X-ray) or medical records, a list of your current medications and supplements, and any recent lab results. Plan to arrive 5 minutes early.',
    subject: 'Range Assessment Prep',
  },
};

// Telemedicine video link appended to instructions when modality = telemedicine
export const TELEMEDICINE_LINK_APPEND = '\n\nJoin your video appointment here: https://app.range-medical.com/video';

// Get prep instructions for a Cal.com slug
export function getPrepInstructions(slug) {
  if (!slug) return null;
  return PREP_INSTRUCTIONS[slug] || null;
}

// Check if a Cal.com event slug requires blood work
export function slugRequiresBloodWork(slug) {
  if (!slug) return false;
  for (const items of Object.values(APPOINTMENT_SERVICES)) {
    const found = items.find(s => s.calcomSlug === slug);
    if (found) return !!found.requiresBloodWork;
  }
  return false;
}

// Get providers for a service category
export function getProvidersForCategory(category) {
  return PROVIDERS[category] || PROVIDERS['other'] || [];
}
