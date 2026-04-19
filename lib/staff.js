// Seeded staff directory — source of truth for the "Assigned To" dropdown
// on every pipeline card. Any code that assigns a card references these ids.
// Range Medical System V2

export const STAFF = [
  { id: 'damien', name: 'Damien', role: 'Provider',        color: '#0891b2' },
  { id: 'evan',   name: 'Evan',   role: 'Provider',        color: '#7c3aed' },
  { id: 'tara',   name: 'Tara',   role: 'Scheduling',      color: '#f59e0b' },
  { id: 'chris',  name: 'Chris',  role: 'Admin',           color: '#10b981' },
  { id: 'primex', name: 'Primex', role: 'Lab (external)',  color: '#6366f1' },
];

const STAFF_BY_ID = Object.fromEntries(STAFF.map(s => [s.id, s]));

export function getStaff(id) {
  return STAFF_BY_ID[id] || { id, name: id, role: '', color: '#737373' };
}

export function getStaffList(ids = []) {
  return ids.map(getStaff);
}

export function initials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}
