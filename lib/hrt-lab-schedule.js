// lib/hrt-lab-schedule.js
// HRT Blood Draw Schedule Calculator
// Adaptive schedule: calculates next draw from the ACTUAL lab date, not fixed targets.

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
 * (Legacy fixed-schedule version — kept for backward compatibility)
 */
export function getHRTLabSchedule(startDate, firstFollowupWeeks = 8) {
  if (!startDate) return [];

  const start = new Date(startDate + 'T00:00:00');
  const maxDate = new Date(start);
  maxDate.setDate(maxDate.getDate() + 400);

  const firstDays = firstFollowupWeeks * 7;
  const interval = 12 * 7;

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
 * Legacy match function — kept for backward compatibility.
 */
export function matchDrawsToLogs(schedule, bloodDrawLogs = [], labs = [], labProtocols = []) {
  // Delegate to the adaptive builder for consistent behavior
  return schedule.map(draw => ({ ...draw, status: 'upcoming', completedDate: null, logId: null }));
}

/**
 * Build an ADAPTIVE HRT lab schedule.
 *
 * Instead of a fixed schedule from protocol start_date, this calculates each
 * subsequent draw target from the ACTUAL date the previous draw was completed.
 * If someone gets labs late, the next draw shifts forward accordingly.
 *
 * Flow:
 *   1. Initial Labs target = protocol start_date
 *   2. Match against actual labs (±49 days window)
 *   3. Next target = actual_completion_date + firstFollowupWeeks (for draw 1)
 *   4. Each subsequent: actual_completion_date + 12 weeks
 *   5. If no match found (overdue), still use planned date for future targets
 *   6. Always generates all 5 draws (Initial + 4 follow-ups) so the full program is visible
 *
 * Labels use the original naming convention (8-Week, 20-Week, etc.) for consistency,
 * but target dates shift based on when labs actually occurred.
 *
 * @param {string} startDate - Protocol start date (YYYY-MM-DD)
 * @param {number} firstFollowupWeeks - 8 or 12
 * @param {Array} bloodDrawLogs - Protocol logs with log_type='blood_draw'
 * @param {Array} labs - Lab records from the labs table
 * @param {Array} labProtocols - Auto-scheduled lab protocols
 * @returns {Array} Schedule with { label, weekOf, weekLabel, targetDate, status, completedDate, logId }
 */
export function buildAdaptiveHRTSchedule(startDate, firstFollowupWeeks = 8, bloodDrawLogs = [], labs = [], labProtocols = []) {
  if (!startDate) return [];

  const start = new Date(startDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const INTERVAL_DAYS = 12 * 7; // 84 days (12 weeks)
  const WINDOW_MS = 49 * 24 * 60 * 60 * 1000; // ±49 days (7 weeks) matching window
  const MAX_DRAWS = 5; // initial + 4 follow-ups (standard HRT program)

  // Collect all available lab dates from all sources
  const allDrawDates = [];

  for (const log of bloodDrawLogs) {
    if (log.log_date) {
      allDrawDates.push({
        date: new Date(log.log_date + 'T00:00:00'),
        logId: log.id,
        notes: log.notes || '',
        consumed: false,
      });
    }
  }

  for (const lab of labs) {
    const labDate = lab.test_date || lab.completed_date;
    if (labDate) {
      allDrawDates.push({
        date: new Date(labDate + 'T00:00:00'),
        logId: null,
        notes: '',
        consumed: false,
      });
    }
  }

  // Lab protocols with completed statuses
  const completedLabStatuses = ['blood_draw_complete', 'results_received', 'provider_reviewed', 'consult_scheduled', 'consult_complete'];
  for (const lp of labProtocols) {
    if (lp.start_date && completedLabStatuses.includes(lp.status)) {
      allDrawDates.push({
        date: new Date(lp.start_date + 'T00:00:00'),
        logId: null,
        notes: '',
        consumed: false,
      });
    }
  }

  // Sort available dates chronologically
  allDrawDates.sort((a, b) => a.date - b.date);

  // Label pattern: Initial, then firstFollowupWeeks, +12, +24, +36, ...
  const labelWeeks = [0];
  for (let i = 0; i < MAX_DRAWS - 1; i++) {
    labelWeeks.push(firstFollowupWeeks + (i * 12));
  }

  const schedule = [];
  let lastAnchorDate = start; // Date we calculate the next target from

  for (let drawIndex = 0; drawIndex < MAX_DRAWS; drawIndex++) {
    let targetDate;

    if (drawIndex === 0) {
      // Initial Labs: at protocol start_date
      targetDate = new Date(start);
    } else if (drawIndex === 1) {
      // First follow-up: firstFollowupWeeks from PROTOCOL START DATE, not from when
      // initial labs were done. Labs may have been drawn months before HRT started —
      // the follow-up timing should reflect time on the protocol, not time since labs.
      targetDate = new Date(start);
      targetDate.setDate(targetDate.getDate() + firstFollowupWeeks * 7);
    } else {
      // Subsequent: 12 weeks from last anchor (actual previous labs date)
      targetDate = new Date(lastAnchorDate);
      targetDate.setDate(targetDate.getDate() + INTERVAL_DAYS);
    }

    // Label for this draw
    const label = drawIndex === 0 ? 'Initial Labs' : `${labelWeeks[drawIndex]}-Week Labs`;

    // === Try to match this draw to an actual lab ===
    let matchedDate = null;
    let matchedLogId = null;
    let matchedIdx = -1;

    // Priority 1: Exact label match in blood draw logs (manually marked via UI)
    for (let i = 0; i < allDrawDates.length; i++) {
      const entry = allDrawDates[i];
      if (entry.consumed) continue;
      if (entry.notes === label) {
        matchedDate = entry.date;
        matchedLogId = entry.logId;
        matchedIdx = i;
        break;
      }
    }

    // Priority 2: Any X-Week Labs log within window (handles label changes)
    if (!matchedDate && label !== 'Initial Labs') {
      for (let i = 0; i < allDrawDates.length; i++) {
        const entry = allDrawDates[i];
        if (entry.consumed) continue;
        if (entry.notes && entry.notes.endsWith('-Week Labs') && entry.notes !== 'Initial Labs') {
          const diff = Math.abs(entry.date - targetDate);
          if (diff <= WINDOW_MS) {
            matchedDate = entry.date;
            matchedLogId = entry.logId;
            matchedIdx = i;
            break;
          }
        }
      }
    }

    // Priority 3: Closest unconsumed lab date within ±49 day window
    if (!matchedDate) {
      let closestDiff = Infinity;
      for (let i = 0; i < allDrawDates.length; i++) {
        const entry = allDrawDates[i];
        if (entry.consumed) continue;
        const diff = Math.abs(entry.date - targetDate);
        if (diff <= WINDOW_MS && diff < closestDiff) {
          closestDiff = diff;
          matchedDate = entry.date;
          matchedLogId = entry.logId;
          matchedIdx = i;
        }
      }
    }

    // Mark consumed so this lab date doesn't match another draw
    if (matchedIdx >= 0) {
      allDrawDates[matchedIdx].consumed = true;
    }

    // Determine status
    let status;
    if (matchedDate) {
      status = 'completed';
      // ADAPTIVE: anchor next target from the ACTUAL lab date
      lastAnchorDate = matchedDate;
    } else if (targetDate > today) {
      status = 'upcoming';
      // Use planned date as anchor for any future draws
      lastAnchorDate = targetDate;
    } else {
      status = 'overdue';
      // For overdue, keep target as anchor (don't shift forward without actual labs)
      lastAnchorDate = targetDate;
    }

    const monday = getMonday(targetDate);
    schedule.push({
      label,
      weekOf: toDateString(monday),
      weekLabel: formatWeekLabel(targetDate),
      targetDate: toDateString(targetDate),
      status,
      completedDate: matchedDate ? toDateString(matchedDate) : null,
      logId: matchedLogId || null,
    });

  }

  // === Post-process: mark old missed draws as "skipped" ===
  // If a later draw is completed, earlier missed draws are no longer actionable.
  // Find the index of the LAST completed draw.
  let lastCompletedIdx = -1;
  for (let i = schedule.length - 1; i >= 0; i--) {
    if (schedule[i].status === 'completed') {
      lastCompletedIdx = i;
      break;
    }
  }
  // Any "overdue" draw BEFORE the last completed draw becomes "skipped"
  if (lastCompletedIdx > 0) {
    for (let i = 0; i < lastCompletedIdx; i++) {
      if (schedule[i].status === 'overdue') {
        schedule[i].status = 'skipped';
      }
    }
  }

  return schedule;
}

/**
 * Get the current lab status summary from a computed schedule.
 * Returns { status, nextDraw, completedCount, totalCount }
 *   status: 'current' | 'overdue' | 'complete'
 *   nextDraw: the next upcoming or overdue draw (if any)
 */
export function getLabStatusSummary(schedule) {
  if (!schedule || schedule.length === 0) {
    return { status: 'current', nextDraw: null, completedCount: 0, totalCount: 0 };
  }
  const completedCount = schedule.filter(d => d.status === 'completed').length;
  const totalCount = schedule.length;
  // Find the next actionable draw (overdue or upcoming — skip "skipped" draws)
  const nextDraw = schedule.find(d => d.status === 'overdue' || d.status === 'upcoming');
  let status = 'current';
  if (completedCount === totalCount) {
    status = 'complete';
  } else if (nextDraw?.status === 'overdue') {
    status = 'overdue';
  }
  return { status, nextDraw, completedCount, totalCount };
}

/**
 * Check if a protocol is an HRT protocol based on program_type.
 */
export function isHRTProtocol(programType) {
  if (!programType) return false;
  const pt = programType.toLowerCase();
  return pt.includes('hrt');
}
