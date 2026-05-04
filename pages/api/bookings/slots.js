// /pages/api/bookings/slots.js
// Returns available time slots for the given service+date.
//
// As of step 2 of the Cal.com cutover this endpoint no longer calls
// Cal.com — it delegates to the native scheduling engine in
// lib/scheduling.js. The legacy contract (eventTypeId + date) is
// preserved so existing callers (FreeSessionScheduler, ConversationView,
// BookingTab, patient assessment + start pages) work unchanged.

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

  const { eventTypeId, serviceSlug: rawSlug, date, locationId, providerId } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }
  if (!eventTypeId && !rawSlug) {
    return res.status(400).json({ error: 'eventTypeId or serviceSlug is required' });
  }

  try {
    let serviceSlug = rawSlug;
    if (!serviceSlug && eventTypeId) {
      const { data: svc } = await supabase
        .from('services')
        .select('slug')
        .eq('legacy_calcom_event_type_id', parseInt(eventTypeId, 10))
        .maybeSingle();
      if (!svc) {
        return res.status(404).json({
          error: `No service found for eventTypeId=${eventTypeId}`,
        });
      }
      serviceSlug = svc.slug;
    }

    const result = await getAvailableSlots({
      serviceSlug,
      date,
      locationId: locationId || 'newport',
      providerId: providerId || null,
    });

    return res.status(200).json({
      success: true,
      date,
      slots: result.slots,
      byProvider: result.byProvider,
    });
  } catch (e) {
    console.error('slots error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
