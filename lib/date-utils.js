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
 * Get current datetime as an ISO string with the correct Pacific offset.
 * Use this instead of new Date().toISOString() when the date component matters
 * (e.g. note_date). Produces strings like "2026-04-15T17:30:00-07:00".
 */
export function nowPacificISO() {
  const now = new Date();
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: PT,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(
    f.formatToParts(now).map(({ type, value }) => [type, value])
  );
  const iso = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  const fakeUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const offsetMin = Math.round((fakeUtc - now.getTime()) / 60000);
  const sign = offsetMin <= 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${iso}${sign}${hh}:${mm}`;
}

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

/**
 * Given a Pacific date string like '2026-05-05', return the [start, end) UTC
 * bounds that cover that Pacific day. DST-aware. Useful for querying
 * appointments.start_time (TIMESTAMPTZ) for "all appointments whose Pacific
 * date is X" — the natural replacement for the legacy
 * calcom_bookings.booking_date column.
 *
 * @param {string} pacificDateStr - 'YYYY-MM-DD' interpreted as Pacific
 * @returns {{ startUTC: Date, endUTC: Date }}
 */
export function pacificDayUTCBounds(pacificDateStr) {
  if (!pacificDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(pacificDateStr)) {
    throw new Error(`pacificDayUTCBounds: invalid date "${pacificDateStr}"`);
  }
  // Treat the wall-clock midnight as UTC, then offset by Pacific's actual
  // UTC offset for that moment (handles PST/PDT correctly).
  const startNaive = new Date(`${pacificDateStr}T00:00:00Z`);
  const ptStr = startNaive.toLocaleString('sv-SE', { timeZone: PT });
  const ptAsUtc = new Date(ptStr.replace(' ', 'T') + 'Z').getTime();
  const offsetMin = Math.round((ptAsUtc - startNaive.getTime()) / 60_000); // -420 PDT, -480 PST
  const startUTC = new Date(startNaive.getTime() - offsetMin * 60_000);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);
  return { startUTC, endUTC };
}
