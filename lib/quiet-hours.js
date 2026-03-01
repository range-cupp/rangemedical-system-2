// /lib/quiet-hours.js
// Quiet hours utility — reusable across all notification systems
// Quiet hours: 7 PM - 7 AM Pacific (messages only sent 7am-7pm)
// Range Medical

/**
 * Check if current time is in quiet hours (outside 7am-7pm Pacific)
 * @returns {boolean} true if in quiet hours (should NOT send now)
 */
export function isInQuietHours() {
  const now = new Date();
  const pacificHour = parseInt(
    now.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      hour12: false,
    })
  );
  // Quiet hours: before 7 AM or at/after 7 PM
  return pacificHour < 7 || pacificHour >= 19;
}

/**
 * Get the next eligible send time (7:00 AM Pacific)
 * If currently before 7 AM today → returns today 7 AM Pacific
 * If currently at/after 7 AM → returns tomorrow 7 AM Pacific
 * @returns {string} ISO 8601 timestamp
 */
export function getNextSendTime() {
  const now = new Date();

  // Get current date parts in Pacific timezone
  const pacificDateStr = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [month, day, year] = pacificDateStr.split('/');

  // Get current Pacific hour
  const pacificHour = parseInt(
    now.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      hour12: false,
    })
  );

  // Determine UTC offset for Pacific timezone (PST=-8, PDT=-7)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(now);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  const offsetMatch = tzPart?.value?.match(/GMT([+-]\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1]) : -8;

  // 7 AM Pacific in UTC: 7 - offsetHours (offset is negative)
  const utcHour = 7 - offsetHours; // e.g., 7 - (-8) = 15

  const targetDate = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    utcHour,
    0,
    0
  ));

  // If already past 7 AM Pacific today, target tomorrow
  if (pacificHour >= 7) {
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
  }

  return targetDate.toISOString();
}
