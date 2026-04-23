// /pages/api/bookings/event-types.js
// Returns Cal.com event types (services available for booking)

import { createClient } from '@supabase/supabase-js';
import { getEventTypes } from '../../../lib/calcom';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const eventTypes = await getEventTypes();

    if (!eventTypes) {
      return res.status(500).json({ error: 'Failed to fetch event types from Cal.com' });
    }

    // Cal.com sometimes returns null names for managed users (API can't set name on
    // existing users). Fall back to the employees table keyed by calcom_user_id.
    const { data: employees } = await supabase
      .from('employees')
      .select('name, calcom_user_id')
      .eq('is_active', true)
      .not('calcom_user_id', 'is', null);
    const empNameByCalcomId = {};
    for (const emp of employees || []) {
      if (emp.calcom_user_id) empNameByCalcomId[emp.calcom_user_id] = emp.name;
    }

    // Return simplified event type data, filtering out hidden ones
    const simplified = eventTypes
      .filter(et => !et.hidden)
      .map(et => ({
        id: et.id,
        title: et.title,
        slug: et.slug,
        length: et.lengthInMinutes || et.length,
        description: et.description,
        hosts: (et.hosts || []).map(h => {
          const username = h.username || h.user?.username || '';
          const rawName = h.name || h.user?.name || '';
          const empName = empNameByCalcomId[h.userId];
          const displayName =
            rawName ||
            empName ||
            (username ? username.charAt(0).toUpperCase() + username.slice(1).replace(/-.*$/, '') : '');
          return {
            userId: h.userId,
            name: displayName,
            username,
          };
        }).filter(h => h.userId)
      }));

    return res.status(200).json({ success: true, eventTypes: simplified });
  } catch (error) {
    console.error('Event types API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
