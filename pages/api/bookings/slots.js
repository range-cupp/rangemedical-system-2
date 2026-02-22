// /pages/api/bookings/slots.js
// Returns available time slots for a Cal.com event type on a given date

import { getAvailableSlots } from '../../../lib/calcom';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventTypeId, date } = req.query;

  if (!eventTypeId || !date) {
    return res.status(400).json({ error: 'eventTypeId and date are required' });
  }

  try {
    // Fetch slots for the full day in Pacific Time
    const startTime = `${date}T00:00:00`;
    const endTime = `${date}T23:59:59`;

    const slots = await getAvailableSlots(
      parseInt(eventTypeId),
      startTime,
      endTime,
      'America/Los_Angeles'
    );

    if (!slots) {
      return res.status(500).json({ error: 'Failed to fetch slots from Cal.com' });
    }

    return res.status(200).json({ success: true, date, slots });
  } catch (error) {
    console.error('Slots API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
