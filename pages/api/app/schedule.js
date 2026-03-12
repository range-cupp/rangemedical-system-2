// /pages/api/app/schedule.js
// GET: today's + upcoming appointments from Cal.com + local appointments table
// Range Medical Employee App

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { date, days = '7' } = req.query;
  // Use Pacific time (-07:00 / -08:00). Use a wide window (start of today PT → end of window PT)
  // by querying ±1 day around the requested range to avoid any UTC offset edge cases
  const daysNum = Math.min(30, Math.max(1, Number(days)));
  const now = new Date();
  // Start: beginning of today in PT (UTC-8 worst case = subtract 8 hours then floor to day)
  const startOfTodayPT = new Date(now);
  startOfTodayPT.setUTCHours(8, 0, 0, 0); // 8:00 UTC = midnight PT (UTC-8)
  if (now < startOfTodayPT) startOfTodayPT.setUTCDate(startOfTodayPT.getUTCDate() - 1);
  const endTs = new Date(startOfTodayPT.getTime() + daysNum * 24 * 60 * 60 * 1000);

  // Pull from local appointments table (synced from Cal.com via webhook)
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      title,
      start_time,
      end_time,
      status,
      notes,
      booking_uid,
      event_type_title,
      patient_id,
      provider_id,
      patients(id, first_name, last_name, phone, email)
    `)
    .gte('start_time', startOfTodayPT.toISOString())
    .lte('start_time', endTs.toISOString())
    .in('status', ['scheduled', 'confirmed', 'rescheduled', 'checked_in'])
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[app/schedule] error:', error);
    return res.status(500).json({ error: 'Failed to load schedule' });
  }

  // Group by date
  const grouped = {};
  for (const appt of appointments || []) {
    const day = new Date(appt.start_time).toISOString().split('T')[0];
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(appt);
  }

  return res.status(200).json({
    start_date: startOfTodayPT.toISOString(),
    end_date: endTs.toISOString(),
    appointments: appointments || [],
    grouped,
  });
}
