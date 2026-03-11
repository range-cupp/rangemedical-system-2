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
  const now = new Date();
  const opts = { month: 'short', day: 'numeric' };
  if (monday.getFullYear() !== now.getFullYear()) {
    opts.year = 'numeric';
  }
  return 'Week of ' + monday.toLocaleDateString('en-US', opts);
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
 * Default schedule (firstFollowupWeeks = 8):
 * - Initial Labs: at start_date (baseline)
 * - 8-Week Labs: start_date + 56 days
 * - 20-Week Labs: start_date + 140 days (8 + 12 weeks)
 * - 32-Week Labs: start_date + 224 days (20 + 12 weeks)
 * - 44-Week Labs: start_date + 308 days (32 + 12 weeks)
 *
 * Alternate schedule (firstFollowupWeeks = 12):
 * - Initial Labs: at start_date (baseline)
 * - 12-Week Labs: start_date + 84 days
 * - 24-Week Labs: start_date + 168 days (12 + 12 weeks)
 * - 36-Week Labs: start_date + 252 days (24 + 12 weeks)
 * - 48-Week Labs: start_date + 336 days (36 + 12 weeks)
 *
 * Stops generating if the draw date > start_date + 400 days.
 *
 * @param {string} startDate - The protocol start date (YYYY-MM-DD)
 * @param {number} firstFollowupWeeks - Weeks until first follow-up (default: 8, can be 12)
 * @returns {Array} Array of { label, weekOf, weekLabel, targetDate }
 */
export function getHRTLabSchedule(startDate, firstFollowupWeeks = 8) {
  if (!startDate) return [];

  const start = new Date(startDate + 'T00:00:00');
  const maxDate = new Date(start);
  maxDate.setDate(maxDate.getDate() + 400);

  const firstDays = firstFollowupWeeks * 7; // 56 or 84
  const interval = 12 * 7; // 84 days (12 weeks) for subsequent draws

  const drawOffsets = [
    { days: 0, label: 'Initial Labs' },
    { days: firstDays, label: `${firstFollowupWeeks}-Week Labs` },
    { days: firstDays + interval, label: `${firstFollowupWeeks + 12}-Week Labs` },
    { days: firstDays + interval * 2, label: `${firstFollowupWeeks + 24}-Week Labs` },
    { days: firstDays + interval * 3, label: `${firstFollowupWeeks + 36}-Week Labs` },
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
 * A draw is "completed" if a blood_draw log or lab result falls within ±35 days of the target date.
 *
 * @param {Array} schedule - Output of getHRTLabSchedule()
 * @param {Array} bloodDrawLogs - Array of { log_date } from protocol_logs (log_type='blood_draw')
 * @param {Array} labs - Array of { lab_date, collection_date, completed_date } from labs table
 * @param {Array} labProtocols - Array of auto-scheduled lab protocols (program_type='labs') to check status
 * @returns {Array} Schedule entries with status and completedDate added
 */
export function matchDrawsToLogs(schedule, bloodDrawLogs = [], labs = [], labProtocols = []) {
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
    const labDate = lab.collection_date || lab.test_date || lab.lab_date || lab.completed_date;
    if (labDate) {
      allDrawDates.push({ date: new Date(labDate + 'T00:00:00'), logId: null, notes: '' });
    }
  }

  return schedule.map(draw => {
    const target = new Date(draw.targetDate + 'T00:00:00');
    const windowMs = 35 * 24 * 60 * 60 * 1000; // ±35 days

    // Priority 1: Match by label (notes field stores the draw label when logged from UI)
    // Also match equivalent labels (e.g. "8-Week Labs" matches if schedule was changed to 12-week)
    let matchedDate = null;
    let matchedLogId = null;

    for (const entry of allDrawDates) {
      if (entry.notes === draw.label || entry.notes === draw.label) {
        matchedDate = entry.date;
        matchedLogId = entry.logId;
        break;
      }
    }

    // Also check: if label changed (e.g. "8-Week Labs" logged but now showing "12-Week Labs"),
    // match "Initial Labs" exactly, and for numbered labs match any X-Week Labs note by position
    if (!matchedDate && draw.label !== 'Initial Labs') {
      for (const entry of allDrawDates) {
        if (entry.notes && entry.notes.endsWith('-Week Labs') && entry.notes !== 'Initial Labs') {
          // Check if this log date is close to the target date
          const diff = Math.abs(entry.date - target);
          if (diff <= windowMs) {
            matchedDate = entry.date;
            matchedLogId = entry.logId;
            break;
          }
        }
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

    // Priority 3: Check auto-scheduled lab protocol statuses
    // If a lab protocol with matching start_date is at blood_draw_complete or later, it's completed
    const completedLabStatuses = ['blood_draw_complete', 'results_received', 'provider_reviewed', 'consult_scheduled', 'consult_complete'];
    if (!matchedDate && labProtocols.length > 0) {
      for (const lp of labProtocols) {
        if (!lp.start_date || !completedLabStatuses.includes(lp.status)) continue;
        const lpDate = new Date(lp.start_date + 'T00:00:00');
        const diff = Math.abs(lpDate - target);
        if (diff <= windowMs) {
          matchedDate = lpDate;
          matchedLogId = null;
          break;
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
