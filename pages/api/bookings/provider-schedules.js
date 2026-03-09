// /pages/api/bookings/provider-schedules.js
// Returns all provider schedules from Cal.com for client-side slot filtering
// Caches per request — CalendarView fetches once on mount

import { getTeamMembers, getUserSchedules } from '../../../lib/calcom';

// Cal.com userIds → calcomUsername mapping
const PROVIDER_USERS = [
  { userId: 2189658, username: 'chris' },
  { userId: 2197563, username: 'damien' },
  { userId: 2197567, username: 'lily' },
  { userId: 2197566, username: 'evan' },
  { userId: 2197565, username: 'damon' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const schedulesByUsername = {};

    // Fetch schedules for all providers in parallel
    const results = await Promise.all(
      PROVIDER_USERS.map(async ({ userId, username }) => {
        const schedules = await getUserSchedules(userId);
        return { username, schedules: schedules || [] };
      })
    );

    for (const { username, schedules } of results) {
      // Build a per-day availability map for each schedule
      // Default schedule → Newport Beach hours
      // Non-default named schedules → location-specific hours (e.g., Placentia)
      const defaultSchedule = schedules.find(s => s.isDefault) || schedules[0];
      const locationSchedules = schedules.filter(s => !s.isDefault);

      // Newport Beach hours (from default schedule)
      const newport = {};
      if (defaultSchedule?.availability) {
        for (const block of defaultSchedule.availability) {
          for (const day of (block.days || [])) {
            const dayLower = day.toLowerCase();
            if (!newport[dayLower]) newport[dayLower] = [];
            newport[dayLower].push({
              start: block.startTime,
              end: block.endTime,
            });
          }
        }
      }

      // Location-specific schedules (Placentia, etc.)
      const locations = {};
      for (const sched of locationSchedules) {
        // Detect location from schedule name (e.g., "Placentia - Monday Mornings")
        const name = (sched.name || '').toLowerCase();
        let locationId = null;
        if (name.includes('placentia') || name.includes('tlab')) {
          locationId = 'placentia';
        }
        if (!locationId) continue;

        if (!locations[locationId]) locations[locationId] = {};
        if (sched.availability) {
          for (const block of sched.availability) {
            for (const day of (block.days || [])) {
              const dayLower = day.toLowerCase();
              if (!locations[locationId][dayLower]) locations[locationId][dayLower] = [];
              locations[locationId][dayLower].push({
                start: block.startTime,
                end: block.endTime,
              });
            }
          }
        }
      }

      schedulesByUsername[username] = { newport, locations };
    }

    return res.status(200).json({ success: true, schedules: schedulesByUsername });
  } catch (error) {
    console.error('Provider schedules API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
