// /pages/api/bookings/list.js
// Returns bookings from Supabase for a given date or date range

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, range = 'day' } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
  }

  try {
    let startDate = date;
    let endDate = date;

    if (range === 'week') {
      // Get the end of the week (7 days from start)
      const start = new Date(date + 'T00:00:00');
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      endDate = end.toISOString().split('T')[0];
    }

    const { data: bookings, error } = await supabase
      .from('calcom_bookings')
      .select('*')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    return res.status(200).json({ success: true, bookings: bookings || [] });
  } catch (error) {
    console.error('List bookings API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
