// GET /api/appointments/events
// Query appointment events by type, date range

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_type, start_date, end_date, limit } = req.query;

    let query = supabase
      .from('appointment_events')
      .select('*, appointments(patient_name, service_name)')
      .order('created_at', { ascending: false });

    if (event_type) {
      query = query.eq('event_type', event_type);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    query = query.limit(parseInt(limit) || 100);

    const { data: events, error } = await query;

    if (error) {
      console.error('List appointment events error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ events });
  } catch (error) {
    console.error('List appointment events error:', error);
    return res.status(500).json({ error: error.message });
  }
}
