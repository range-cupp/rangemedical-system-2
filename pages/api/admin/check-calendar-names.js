// /pages/api/admin/check-calendar-names.js
// Check what calendar names exist in our appointment data
// Range Medical - 2026-02-05

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    // Get distinct calendar names from clinic_appointments
    const { data: appointments, error } = await supabase
      .from('clinic_appointments')
      .select('calendar_name, appointment_title, ghl_contact_id, appointment_date, status')
      .order('appointment_date', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Group by calendar name
    const calendarCounts = {};
    const samples = {};

    for (const apt of appointments || []) {
      const name = apt.calendar_name || apt.appointment_title || 'Unknown';
      calendarCounts[name] = (calendarCounts[name] || 0) + 1;
      if (!samples[name]) {
        samples[name] = apt;
      }
    }

    // Also check appointment_logs table
    const { data: logs, error: logsError } = await supabase
      .from('appointment_logs')
      .select('appointment_type, appointment_title, appointment_date')
      .order('appointment_date', { ascending: false })
      .limit(50);

    const logTypes = {};
    for (const log of logs || []) {
      const type = log.appointment_type || log.appointment_title || 'Unknown';
      logTypes[type] = (logTypes[type] || 0) + 1;
    }

    return res.status(200).json({
      clinic_appointments: {
        total: appointments?.length || 0,
        calendar_names: calendarCounts,
        samples
      },
      appointment_logs: {
        total: logs?.length || 0,
        types: logTypes
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
