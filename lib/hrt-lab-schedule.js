// lib/hrt-lab-schedule.js
// HRT Blood Draw Schedule Calculator
// Generates the lab draw schedule from a protocol's start_date

/**
 * Get the Monday of the week containing the given date.
 */
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday → previous Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Format a date as "Week of Mon D" (e.g., "Week of Jan 6")
 */
function formatWeekLabel(date) {
  const monday = getMonday(date);
  return 'Week of ' + monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a date as YYYY-MM-DD
 */
function toDateString(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate the HRT blood draw schedule from a protocol's start_date.
 *
 * Schedule:
 * - Initial Labs: at start_date (baseline)
 * - 8-Week Labs: start_date + 56 days
 * - 20-Week Labs: start_date + 140 days (8 + 12 weeks)
 * - 32-Week Labs: start_date + 224 days (20 + 12 weeks)
 * - 44-Week Labs: start_date + 308 days (32 + 12 weeks)
 *
 * Stops generating if the draw date > start_date + 365 days.
 *
 * @param {string} startDate - The protocol start date (YYYY-MM-DD)
 * @returns {Array} Array of { label, weekOf, weekLabel, targetDate }
 */
export function getHRTLabSchedule(startDate) {
  if (!startDate) return [];

  const start = new Date(startDate + 'T00:00:00');
  const maxDate = new Date(start);
  maxDate.setDate(maxDate.getDate() + 365);

  const drawOffsets = [
    { days: 0, label: 'Initial Labs' },
    { days: 56, label: '8-Week Labs' },
    { days: 140, label: '20-Week Labs' },
    { days: 224, label: '32-Week Labs' },
    { days: 308, label: '44-Week Labs' },
  ];

  const schedule = [];

  for (const { days, label } of drawOffsets) {
    const drawDate = new Date(start);
    drawDate.setDate(drawDate.getDate() + days);

    if (drawDate > maxDate) break;

    const monday = getMonday(drawDate);

    schedule.push({
      label,
      weekOf: toDateString(monday),
      weekLabel: formatWeekLabel(drawDate),
      targetDate: toDateString(drawDate),
    });
  }

  return schedule;
}

/**
 * Match scheduled draws against completed blood draw logs.
 * A draw is "completed" if a blood_draw log falls within ±14 days of the target date.
 *
 * @param {Array} schedule - Output of getHRTLabSchedule()
 * @param {Array} bloodDrawLogs - Array of { log_date } from protocol_logs (log_type='blood_draw')
 * @param {Array} labs - Array of { lab_date, collection_date, completed_date } from labs table
 * @returns {Array} Schedule entries with status and completedDate added
 */
export function matchDrawsToLogs(schedule, bloodDrawLogs = [], labs = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Collect all draw dates from logs and labs
  const allDrawDates = [];

  for (const log of bloodDrawLogs) {
    if (log.log_date) {
      allDrawDates.push({ date: new Date(log.log_date + 'T00:00:00'), logId: log.id, notes: log.notes || '' });
    }
  }

  for (const lab of labs) {
    const labDate = lab.collection_date || lab.lab_date || lab.completed_date;
    if (labDate) {
      allDrawDates.push({ date: new Date(labDate + 'T00:00:00'), logId: null, notes: '' });
    }
  }

  return schedule.map(draw => {
    const target = new Date(draw.targetDate + 'T00:00:00');
    const windowMs = 28 * 24 * 60 * 60 * 1000; // ±28 days

    // Priority 1: Match by label (notes field stores the draw label when logged from UI)
    let matchedDate = null;
    let matchedLogId = null;

    for (const entry of allDrawDates) {
      if (entry.notes === draw.label) {
        matchedDate = entry.date;
        matchedLogId = entry.logId;
        break;
      }
    }

    // Priority 2: Match by date proximity within window
    if (!matchedDate) {
      let closestDiff = Infinity;
      for (const entry of allDrawDates) {
        const diff = Math.abs(entry.date - target);
        if (diff <= windowMs && diff < closestDiff) {
          closestDiff = diff;
          matchedDate = entry.date;
          matchedLogId = entry.logId;
        }
      }
    }

    let status;
    if (matchedDate) {
      status = 'completed';
    } else if (target > today) {
      status = 'upcoming';
    } else {
      status = 'overdue';
    }

    return {
      ...draw,
      status,
      completedDate: matchedDate ? toDateString(matchedDate) : null,
      logId: matchedLogId || null,
    };
  });
}

/**
 * Check if a protocol is an HRT protocol based on program_type.
 *
 * @param {string} programType - The protocol's program_type field
 * @returns {boolean}
 */
export function isHRTProtocol(programType) {
  if (!programType) return false;
  const pt = programType.toLowerCase();
  return pt.includes('hrt');
}
