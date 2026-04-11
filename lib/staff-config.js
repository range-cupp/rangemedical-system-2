// /lib/staff-config.js
// Single source of truth for all staff display names, aliases, and permissions
// Range Medical
//
// UPDATE THIS FILE when adding/removing staff or changing display names.
// All other files import from here — no hardcoded staff mappings elsewhere.

const STAFF = {
  'burgess@range-medical.com': {
    displayName: 'Dr. Damien Burgess',
    aliases: ['Dr. Burgess', 'Damien Burgess'],
    title: 'Provider',
    role: 'provider',       // NP — clinical/provider tone
    isAdmin: false,
    isNoteAuthor: true,
  },
  'lily@range-medical.com': {
    displayName: 'Lily Diaz RN',
    aliases: ['Lily', 'Lily Diaz'],
    title: 'RN',
    role: 'clinical',       // RN — clinical but not provider
    isAdmin: false,
    isNoteAuthor: true,
  },
  'evan@range-medical.com': {
    displayName: 'Evan Riederich',
    aliases: ['Evan'],
    title: 'Staff',
    role: 'admin',          // non-clinical staff
    isAdmin: false,
    isNoteAuthor: true,
  },
  'chris@range-medical.com': {
    displayName: 'Chris Cupp',
    aliases: ['Chris'],
    title: 'Partner/Owner',
    role: 'admin',          // owner — operational tone
    isAdmin: true,
    isNoteAuthor: true,
  },
  'cupp@range-medical.com': {
    // Alias email for Chris
    displayName: 'Chris Cupp',
    aliases: ['Chris'],
    title: 'Partner/Owner',
    role: 'admin',          // owner — operational tone
    isAdmin: true,
    isNoteAuthor: true,
  },
  'damon@range-medical.com': {
    displayName: 'Damon Durante',
    aliases: ['Damon'],
    title: 'Front Desk Manager',
    role: 'admin',          // front desk — non-clinical
    isAdmin: false,
    isNoteAuthor: false,
  },
  'tara@range-medical.com': {
    displayName: 'Tara Ventimiglia',
    aliases: ['Tara'],
    title: 'Staff',
    role: 'admin',          // non-clinical staff
    isAdmin: false,
    isNoteAuthor: false,
  },
};

// --- Derived exports (computed once) ---

// Email → display name mapping
export const STAFF_DISPLAY_NAMES = Object.fromEntries(
  Object.entries(STAFF).map(([email, s]) => [email, s.displayName])
);

// Get display name from email (case-insensitive, fallback to input)
export function getStaffDisplayName(val) {
  if (!val) return '';
  const lower = val.toLowerCase();
  return STAFF_DISPLAY_NAMES[lower] || val;
}

// Email → all known aliases (for matching notes to authors)
export const AUTHOR_ALIASES = Object.fromEntries(
  Object.entries(STAFF).map(([email, s]) => [
    email,
    [email, s.displayName, ...s.aliases].map(a => a.toLowerCase()),
  ])
);

// Check if a given created_by value matches a user's email (handles alias mismatches)
export function isNoteAuthor(noteCreatedBy, currentUserEmail) {
  if (!noteCreatedBy || !currentUserEmail) return false;
  if (noteCreatedBy.toLowerCase() === currentUserEmail.toLowerCase()) return true;
  const aliases = AUTHOR_ALIASES[currentUserEmail.toLowerCase()] || [];
  return aliases.some(alias => alias === noteCreatedBy.toLowerCase());
}

// Get staff role for AI tone adjustment ('provider', 'clinical', or 'admin')
export function getStaffRole(email) {
  if (!email) return 'admin';
  const staff = STAFF[email.toLowerCase()];
  return staff?.role || 'admin';
}

// Check if email is admin
export function isAdmin(email) {
  if (!email) return false;
  const staff = STAFF[email.toLowerCase()];
  return staff?.isAdmin || false;
}

// List of emails that can author notes
export const NOTE_AUTHORS = Object.entries(STAFF)
  .filter(([, s]) => s.isNoteAuthor)
  .map(([email]) => email);

// Admin emails
export const ADMIN_EMAILS = Object.entries(STAFF)
  .filter(([, s]) => s.isAdmin)
  .map(([email]) => email);

// --- Clinical Permissions ---

// Staff authorized to dispense controlled substances (testosterone)
// Requires dual verification — two of these staff must confirm
export const CONTROLLED_DISPENSE_STAFF = [
  'burgess@range-medical.com',   // Dr. Damien Burgess
  'lily@range-medical.com',       // Lily Diaz RN
  'evan@range-medical.com',       // Evan Riederich
  'chris@range-medical.com',      // Chris Cupp (owner)
  'cupp@range-medical.com',       // Chris Cupp (alias)
];

// Check if email is authorized for controlled substance dispensing
export function canDispenseControlled(email) {
  if (!email) return false;
  return CONTROLLED_DISPENSE_STAFF.includes(email.toLowerCase());
}

// Staff authorized to approve dose changes (HRT / weight loss)
// Only Dr. Burgess can approve dose increases
export const DOSE_APPROVAL_STAFF = [
  'burgess@range-medical.com',   // Dr. Damien Burgess
];

// Check if email can approve dose changes
export function canApproveDoseChange(email) {
  if (!email) return false;
  return DOSE_APPROVAL_STAFF.includes(email.toLowerCase());
}

export default STAFF;
