// /pages/api/book/slots.js
// Returns available injection slots for the patient self-booking link.
// Cal.com is no longer in the loop.

import { createClient } from '@supabase/supabase-js';
import { getAvailableSlots } from '../../../lib/scheduling';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, eventTypeId, serviceSlug: rawSlug } = req.query;
  if (!date) return res.status(400).json({ error: 'date is required' });
  if (!eventTypeId && !rawSlug) {
    return res.status(400).json({ error: 'eventTypeId or serviceSlug is required' });
  }

  try {
    let serviceSlug = rawSlug;
    if (!serviceSlug) {
      const { data: svc } = await supabase
        .from('services')
        .select('slug')
        .eq('legacy_calcom_event_type_id', parseInt(eventTypeId, 10))
        .maybeSingle();
      if (!svc) {
        return res.status(404).json({ error: `No service found for eventTypeId=${eventTypeId}` });
      }
      serviceSlug = svc.slug;
    }

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
    console.error('Book slots error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
