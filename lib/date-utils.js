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
