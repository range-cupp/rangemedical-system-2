// /lib/date-utils.js
// Date utilities — all dates in Pacific Time (Range Medical is in Newport Beach, CA)

/**
 * Get today's date in Pacific Time as YYYY-MM-DD string.
 * Use this instead of new Date().toISOString().split('T')[0]
 * which gives UTC and causes dates to be off after 5 PM Pacific.
 */
export function todayPacific() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

/**
 * Get current datetime in Pacific Time as ISO string.
 */
export function nowPacific() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).replace(' ', 'T');
}

/**
 * Convert any date/datetime to Pacific date string (YYYY-MM-DD).
 */
export function toPacificDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

const PT = 'America/Los_Angeles';

/**
 * Format a date/datetime in Pacific Time. Pass any options accepted by
 * toLocaleDateString; timeZone is forced to America/Los_Angeles.
 * Returns '—' for null/undefined.
 */
export function formatPacificDate(input, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { ...options, timeZone: PT });
}

/**
 * Format a datetime (date + time) in Pacific Time.
 */
export function formatPacificDateTime(input, options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { ...options, timeZone: PT });
}

/**
 * Format a time-only value in Pacific Time.
 */
export function formatPacificTime(input, options = { hour: 'numeric', minute: '2-digit' }) {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { ...options, timeZone: PT });
}

/**
 * Format a date-only value (e.g. DOB stored as 'YYYY-MM-DD') without any
 * timezone shifting. Parses the components into a UTC date and renders in UTC,
 * which means the displayed date matches what's stored — independent of the
 * server's local timezone (Vercel runs UTC).
 */
export function formatDateOnly(input, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!input) return '—';
  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return formatPacificDate(input, options);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
}
