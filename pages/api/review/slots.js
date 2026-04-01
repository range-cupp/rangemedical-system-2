// /pages/api/review/slots.js
// Returns available injection slots for review gift bookings
// Same logic as birthday/slots.js

import { getAvailableSlots } from '../../../lib/calcom';

const INJECTION_EVENT_TYPES = {
  'range-injections': { slug: 'range-injections', duration: 15 },
  'nad-injection': { slug: 'nad-injection', duration: 15 },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, date, eventTypeId } = req.query;

  if (!type || !date || !eventTypeId) {
    return res.status(400).json({ error: 'type, date, and eventTypeId are required' });
  }

  if (!INJECTION_EVENT_TYPES[type]) {
    return res.status(400).json({ error: 'Invalid injection type' });
  }

  try {
    const startTime = `${date}T00:00:00`;
    const endTime = `${date}T23:59:59`;

    const slots = await getAvailableSlots(
      parseInt(eventTypeId),
      startTime,
      endTime,
      'America/Los_Angeles'
    );

    if (!slots) {
      return res.status(500).json({ error: 'Failed to fetch slots' });
    }

    // Apply 2-hour buffer for same-day bookings
    const now = new Date();
    const todayPST = now.toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).split('/');
    const todayStr = `${todayPST[2]}-${todayPST[0]}-${todayPST[1]}`;

    let filteredSlots = slots;

    if (date === todayStr) {
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      filteredSlots = {};
      for (const [dateKey, dateSlots] of Object.entries(slots)) {
        const filtered = (dateSlots || []).filter((slot) => {
          const slotTime = new Date(slot.start || slot.time);
          return slotTime >= twoHoursFromNow;
        });
        if (filtered.length > 0) {
          filteredSlots[dateKey] = filtered;
        }
      }
    }

    return res.status(200).json({ success: true, date, slots: filteredSlots });
  } catch (error) {
    console.error('Review slots error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
