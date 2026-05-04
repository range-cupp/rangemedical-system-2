// /pages/api/bookings/list.js
// Returns appointments in the calcom_bookings-shaped output that BookingTab
// expects. Cal.com is no longer in the loop — reads from appointments and
// reshapes the rows so the existing client doesn't have to change.

import { createClient } from '@supabase/supabase-js';
import { pacificDayUTCBounds, toPacificDate } from '../../../lib/date-utils';

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
      const start = new Date(date + 'T00:00:00');
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      endDate = end.toISOString().split('T')[0];
    }

    const { startUTC } = pacificDayUTCBounds(startDate);
    const { endUTC } = pacificDayUTCBounds(endDate);

    const { data: appts, error } = await supabase
      .from('appointments')
      .select('id, patient_id, patient_name, patient_phone, service_name, service_category, provider, location, start_time, end_time, duration_minutes, status, notes, source, cal_com_booking_id')
      .gte('start_time', startUTC.toISOString())
      .lt('start_time', endUTC.toISOString())
      .neq('status', 'cancelled')
      .neq('status', 'rescheduled')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('bookings/list query error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    // Reshape into the calcom_bookings-style fields BookingTab expects so
    // that file doesn't need touching.
    const bookings = (appts || []).map(a => ({
      id: a.id,
      calcom_booking_id: a.cal_com_booking_id ? parseInt(a.cal_com_booking_id, 10) : null,
      calcom_uid: `local-${a.id}`,
      patient_id: a.patient_id,
      patient_name: a.patient_name,
      patient_phone: a.patient_phone,
      service_name: a.service_name,
      service_slug: null,
      start_time: a.start_time,
      end_time: a.end_time,
      booking_date: toPacificDate(a.start_time),
      duration_minutes: a.duration_minutes,
      status: a.status,
      location: a.location,
      notes: a.notes,
      booked_by: a.source === 'patient' || a.source === 'patient_bot' ? 'patient' : 'staff',
    }));

    return res.status(200).json({ success: true, bookings });
  } catch (e) {
    console.error('List bookings API error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}
