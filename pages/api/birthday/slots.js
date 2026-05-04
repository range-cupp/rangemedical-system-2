// /pages/api/birthday/slots.js
// Returns available injection slots for a birthday-gift booking.
// Cal.com is no longer in the loop — slots come from the native engine.
// 2-hour buffer for same-day bookings is preserved.

import { getAvailableSlots } from '../../../lib/scheduling';

const SLUG_BY_TYPE = {
  'range-injections': 'range-injections',
  'nad-injection': 'nad-injection',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, date } = req.query;
  if (!type || !date) {
    return res.status(400).json({ error: 'type and date are required' });
  }
  const serviceSlug = SLUG_BY_TYPE[type];
  if (!serviceSlug) {
    return res.status(400).json({ error: 'Invalid injection type' });
  }

  try {
    const result = await getAvailableSlots({ serviceSlug, date });

    // 2-hour buffer for same-day bookings
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    let filtered = result.slots;
    if (date === todayStr) {
      const cutoff = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      filtered = {};
      for (const [k, slots] of Object.entries(result.slots)) {
        const kept = (slots || []).filter(s => new Date(s.start) >= cutoff);
        if (kept.length) filtered[k] = kept;
      }
    }

    return res.status(200).json({ success: true, date, slots: filtered });
  } catch (e) {
    console.error('Birthday slots error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
