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

  const { date, days = '3' } = req.query;
  const startDate = date || new Date().toISOString().split('T')[0];
  const endDate = new Date(new Date(startDate).getTime() + Number(days) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

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
    .gte('start_time', `${startDate}T00:00:00.000Z`)
    .lte('start_time', `${endDate}T23:59:59.999Z`)
    .in('status', ['accepted', 'pending'])
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
    start_date: startDate,
    end_date: endDate,
    appointments: appointments || [],
    grouped,
  });
}
