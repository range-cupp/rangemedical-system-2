// /pages/api/bookings/provider-schedules.js
// Returns each provider's recurring weekly hours per location, used by
// CalendarView to render the per-provider day-view columns. Cal.com is
// no longer in the loop — reads from the local provider_schedules table.
// Response shape preserved: { schedules: { [friendlyUsername]: { newport, locations } } }.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DAY_NAME_BY_NUM = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all active bookable employees (the username is the slug used to
    // key the response so the existing client code matches).
    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select('id, name, username')
      .eq('is_active', true)
      .not('username', 'is', null);
    if (empErr) throw empErr;

    const empById = {};
    for (const emp of (employees || [])) empById[emp.id] = emp;

    const { data: schedules, error: schedErr } = await supabase
      .from('provider_schedules')
      .select('employee_id, location_id, day_of_week, start_time, end_time, effective_from, effective_until')
      .eq('is_active', true);
    if (schedErr) throw schedErr;

    const today = new Date().toISOString().slice(0, 10);
    const validSchedules = (schedules || []).filter(s =>
      (!s.effective_from || s.effective_from <= today) &&
      (!s.effective_until || s.effective_until >= today),
    );

    const schedulesByUsername = {};
    for (const emp of (employees || [])) {
      if (!emp.username) continue;
      schedulesByUsername[emp.username] = { newport: {}, locations: {} };
    }

    for (const s of validSchedules) {
      const emp = empById[s.employee_id];
      if (!emp || !emp.username) continue;
      const friendly = emp.username;
      const dayName = DAY_NAME_BY_NUM[s.day_of_week];
      if (!dayName) continue;

      const block = {
        // Truncate seconds to match Cal.com's HH:MM format used by the client.
        start: String(s.start_time).slice(0, 5),
        end: String(s.end_time).slice(0, 5),
      };

      if (s.location_id === 'newport') {
        if (!schedulesByUsername[friendly].newport[dayName]) {
          schedulesByUsername[friendly].newport[dayName] = [];
        }
        schedulesByUsername[friendly].newport[dayName].push(block);
      } else {
        if (!schedulesByUsername[friendly].locations[s.location_id]) {
          schedulesByUsername[friendly].locations[s.location_id] = {};
        }
        if (!schedulesByUsername[friendly].locations[s.location_id][dayName]) {
          schedulesByUsername[friendly].locations[s.location_id][dayName] = [];
        }
        schedulesByUsername[friendly].locations[s.location_id][dayName].push(block);
      }
    }

    return res.status(200).json({ success: true, schedules: schedulesByUsername });
  } catch (e) {
    console.error('Provider schedules API error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
