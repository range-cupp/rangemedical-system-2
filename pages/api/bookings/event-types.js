// /pages/api/bookings/event-types.js
// Returns Cal.com event types (services available for booking)

import { getEventTypes } from '../../../lib/calcom';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const eventTypes = await getEventTypes();

    if (!eventTypes) {
      return res.status(500).json({ error: 'Failed to fetch event types from Cal.com' });
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
        // Include hosts for provider selection
        // Cal.com sometimes returns empty names — fall back to username
        hosts: (et.hosts || []).map(h => {
          const username = h.username || h.user?.username || '';
          const rawName = h.name || h.user?.name || '';
          // If name is empty, capitalize the username as display name
          const displayName = rawName || (username ? username.charAt(0).toUpperCase() + username.slice(1).replace(/-.*$/, '') : '');
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
