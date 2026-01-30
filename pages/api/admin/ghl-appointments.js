// /pages/api/admin/ghl-appointments.js
// Fetch clinic appointments from database (populated by webhooks from GHL)
// Range Medical

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
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log('Fetching appointments for:', targetDate);

    // Fetch appointments from our database
    const { data: appointments, error } = await supabase
      .from('clinic_appointments')
      .select(`
        *,
        patients (
          id,
          name,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('appointment_date', targetDate)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({ error: 'Failed to fetch appointments', details: error.message });
    }

    // Format appointments for the frontend
    const formattedAppointments = (appointments || []).map(apt => {
      const patient = apt.patients;
      const patientName = patient?.name ||
        (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : null) ||
        'Unknown';

      return {
        id: apt.id,
        ghlAppointmentId: apt.ghl_appointment_id,
        contactId: apt.ghl_contact_id,
        calendarId: apt.calendar_id,
        calendarName: apt.calendar_name || 'Appointment',
        calendarColor: getCalendarColor(apt.calendar_name),
        title: apt.appointment_title,
        startTime: apt.start_time,
        endTime: apt.end_time,
        status: apt.status || 'scheduled',
        notes: apt.notes,
        patient: patient ? {
          id: patient.id,
          name: patientName,
          email: patient.email,
          phone: patient.phone
        } : null,
        patientName: patientName
      };
    });

    // Group by status
    const scheduled = formattedAppointments.filter(a =>
      ['scheduled', 'confirmed', 'new', 'booked'].includes((a.status || '').toLowerCase())
    );
    const showed = formattedAppointments.filter(a =>
      ['showed', 'completed'].includes((a.status || '').toLowerCase())
    );
    const noShow = formattedAppointments.filter(a =>
      ['no_show', 'noshow', 'cancelled', 'canceled', 'no-show'].includes((a.status || '').toLowerCase())
    );

    return res.status(200).json({
      success: true,
      date: targetDate,
      total: formattedAppointments.length,
      appointments: formattedAppointments,
      byStatus: {
        scheduled: scheduled.length,
        showed: showed.length,
        noShow: noShow.length
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}

// Assign colors based on calendar/appointment type
function getCalendarColor(calendarName) {
  if (!calendarName) return '#6b7280';

  const name = calendarName.toLowerCase();

  if (name.includes('hbot') || name.includes('hyperbaric')) return '#3730a3';
  if (name.includes('red light') || name.includes('rlt')) return '#dc2626';
  if (name.includes('iv')) return '#c2410c';
  if (name.includes('injection') || name.includes('range injection')) return '#7c3aed';
  if (name.includes('testosterone')) return '#059669';
  if (name.includes('peptide')) return '#166534';
  if (name.includes('weight') || name.includes('medical')) return '#0891b2';
  if (name.includes('consult')) return '#6366f1';

  return '#6b7280';
}
