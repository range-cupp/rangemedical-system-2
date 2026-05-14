// /pages/api/provider-schedules/index.js
// GET: List active providers and their schedules (one schedule per
// employee + location pair). Cal.com is no longer in the loop — this
// reads from the local `provider_schedules` + `provider_schedule_overrides`
// tables and shapes the response to match what the existing
// /admin/provider-schedule page expects.
//
// Response shape (preserved):
//   { providers: [{ userId, name, username, email, role, title, schedules: [
//       { id, name, isDefault, availability: [{ days, startTime, endTime }],
//         overrides: [{ date, startTime, endTime }], timeZone }
//   ] }] }
//
// schedule.id uses a synthetic format `local::<employee_uuid>::<location_id>`
// so the PATCH handler can route updates back to the right rows.

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DAY_NAME_BY_NUM = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

function locationDisplayName(locationId) {
  if (locationId === 'newport') return 'Newport Beach';
  return locationId;
}

// Group provider_schedules rows into Cal.com-style availability blocks
// (one block per unique start/end time-of-day, listing the days that share it).
function groupAvailability(rows) {
  const groups = {};
  for (const r of rows) {
    const key = `${r.start_time}-${r.end_time}`;
    if (!groups[key]) {
      groups[key] = {
        days: [],
        startTime: String(r.start_time).slice(0, 5),
        endTime: String(r.end_time).slice(0, 5),
      };
    }
    const dayName = DAY_NAME_BY_NUM[r.day_of_week];
    if (dayName && !groups[key].days.includes(dayName)) {
      groups[key].days.push(dayName);
    }
  }
  return Object.values(groups);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const employee = await requireAuth(req, res);
  if (!employee) return;

  try {
    // 1. All active employees. The calcom_user_id IS NOT NULL filter was
    //    a relic of the Cal.com era — without it, new employees added via
    //    /admin/employees show up immediately for schedule editing.
    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select('id, name, email, title, calcom_user_id, username')
      .eq('is_active', true)
      .order('name');
    if (empErr) throw empErr;

    const empIds = (employees || []).map(e => e.id);
    if (empIds.length === 0) {
      return res.status(200).json({ success: true, providers: [] });
    }

    // 2. All weekly schedules for those employees.
    const { data: schedules, error: schedErr } = await supabase
      .from('provider_schedules')
      .select('employee_id, location_id, day_of_week, start_time, end_time, effective_from, effective_until, is_active')
      .in('employee_id', empIds)
      .eq('is_active', true);
    if (schedErr) throw schedErr;

    // 3. Future overrides only (so the page's "Upcoming overrides" list stays clean).
    const today = new Date().toISOString().slice(0, 10);
    const { data: overrides, error: ovErr } = await supabase
      .from('provider_schedule_overrides')
      .select('employee_id, location_id, override_date, type, start_time, end_time, reason')
      .in('employee_id', empIds)
      .gte('override_date', today);
    if (ovErr) throw ovErr;

    // 4. Bucket schedules by (employee, location); same for overrides.
    const schedKey = (empId, locId) => `${empId}::${locId}`;
    const schedRowsByKey = {};
    for (const r of (schedules || [])) {
      const k = schedKey(r.employee_id, r.location_id);
      if (!schedRowsByKey[k]) schedRowsByKey[k] = [];
      schedRowsByKey[k].push(r);
    }
    const overrideRowsByKey = {};
    for (const r of (overrides || [])) {
      // Override location may be null (= applies to all locations); attach
      // to every location the provider has a schedule at, so the page can
      // show it under the right schedule card.
      const targetLocs = r.location_id ? [r.location_id] : Object.keys(
        Object.fromEntries(
          (schedules || []).filter(s => s.employee_id === r.employee_id).map(s => [s.location_id, true]),
        ),
      );
      for (const loc of targetLocs) {
        const k = schedKey(r.employee_id, loc);
        if (!overrideRowsByKey[k]) overrideRowsByKey[k] = [];
        overrideRowsByKey[k].push(r);
      }
    }

    // 5. Build the response: one schedule per (employee, location).
    const providers = (employees || []).map(emp => {
      const empSchedules = (schedules || []).filter(s => s.employee_id === emp.id);
      // Unique locations the provider has a schedule at (Placentia retired).
      const locationIds = [...new Set(empSchedules.map(s => s.location_id))].filter(id => id !== 'placentia');
      // Default location: 'newport' if present, else first.
      const defaultLoc = locationIds.includes('newport') ? 'newport' : locationIds[0];

      const built = locationIds.map(locId => {
        const k = schedKey(emp.id, locId);
        const rows = schedRowsByKey[k] || [];
        const ovs = (overrideRowsByKey[k] || []).map(o => ({
          // Cal.com-shape: a 'blocked' override is { date, startTime: null, endTime: null }
          // (the existing UI treats missing times as full-day unavailable).
          date: o.override_date,
          startTime: o.type === 'custom_hours' ? String(o.start_time || '').slice(0, 5) : null,
          endTime: o.type === 'custom_hours' ? String(o.end_time || '').slice(0, 5) : null,
          reason: o.reason || null,
        }));
        return {
          id: `local::${emp.id}::${locId}`,
          name: locationDisplayName(locId),
          isDefault: locId === defaultLoc,
          timeZone: 'America/Los_Angeles',
          availability: groupAvailability(rows),
          overrides: ovs,
        };
      }).sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));

      return {
        // Use employee.id as the React key / API param so new employees
        // (no calcom_user_id) work too. The PATCH endpoint accepts both
        // — it primarily routes by the schedule.id sentinel anyway.
        userId: emp.calcom_user_id || emp.id,
        employeeId: emp.id,
        name: emp.name,
        username: emp.username || '',
        email: emp.email,
        role: 'OWNER',
        title: emp.title || '',
        schedules: built,
      };
    });

    return res.status(200).json({ success: true, providers });
  } catch (error) {
    console.error('Provider schedules list error:', error);
    return res.status(500).json({ error: error.message });
  }
}
