// /pages/api/bookings/slots-v2.js
// Range Medical — slot availability from the native scheduling engine.
// Drop-in replacement for /api/bookings/slots that reads from the new
// scheduling tables instead of calling Cal.com.
//
// Accepts the same query params as v1 plus a few new ones:
//   eventTypeId  — for backward compatibility (looked up via
//                  services.legacy_calcom_event_type_id)
//   serviceSlug  — preferred; takes precedence if both supplied
//   date         — YYYY-MM-DD (Pacific)
//   locationId   — 'newport' (default) or 'placentia'
//   providerId   — UUID, optional, restricts to one provider
//
// Returns the same shape as v1 so callers don't have to change:
//   { success: true, date, slots: { [date]: [{ start, end }] }, byProvider }

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
    // Resolve slug — prefer explicit slug, otherwise look up by legacy ID
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
          hint: 'Pass serviceSlug instead, or add the service via /admin/services',
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
      service: result.service,
      reason: result.reason || null,
    });
  } catch (e) {
    console.error('slots-v2 error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
