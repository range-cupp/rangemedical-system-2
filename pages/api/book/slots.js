// /pages/api/book/slots.js
// Returns available injection slots with a 2-hour buffer for same-day bookings

import { getAvailableSlots } from '../../../lib/calcom';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, eventTypeId } = req.query;

  if (!date || !eventTypeId) {
    return res.status(400).json({ error: 'date and eventTypeId are required' });
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
    console.error('Book slots error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
