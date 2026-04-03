// /pages/api/admin/ghl-appointments.js
// Fetch clinic appointments from database (clinic_appointments + calcom appointments)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';

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
    const targetDate = date || todayPacific();

    // Build date range for the target day in Pacific Time
    const dayStart = `${targetDate}T00:00:00-07:00`;
    const dayEnd = `${targetDate}T23:59:59-07:00`;

    // Fetch from both tables in parallel
    const [clinicResult, nativeResult] = await Promise.all([
      supabase
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
        .order('start_time', { ascending: true }),

      supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          patient_name,
          patient_phone,
          service_name,
          service_category,
          provider,
          location,
          start_time,
          end_time,
          duration_minutes,
          status,
          notes,
          source,
          cal_com_booking_id,
          ghl_appointment_id,
          created_at,
          patients (
            id,
            name,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .not('status', 'eq', 'cancelled')
        .order('start_time', { ascending: true })
    ]);

    if (clinicResult.error) {
      console.error('Error fetching clinic_appointments:', clinicResult.error);
    }
    if (nativeResult.error) {
      console.error('Error fetching appointments:', nativeResult.error);
    }

    // Format clinic_appointments (GHL source)
    const clinicAppointments = (clinicResult.data || []).map(apt => {
      const patient = apt.patients;
      let patientName = patient?.name ||
        (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : null);

      if (!patientName && apt.appointment_title) {
        const titleParts = apt.appointment_title.split(' - ');
        if (titleParts.length >= 2) {
          patientName = titleParts[0].trim();
        }
      }
      patientName = patientName || 'Unknown';

      return {
        id: apt.id,
        ghlAppointmentId: apt.ghl_appointment_id,
        calendarName: apt.calendar_name || 'Appointment',
        calendarColor: getCalendarColor(apt.calendar_name),
        title: apt.appointment_title,
        startTime: apt.start_time,
        endTime: apt.end_time,
        status: apt.status || 'scheduled',
        notes: apt.notes,
        source: 'ghl',
        patient: patient ? {
          id: patient.id,
          name: patientName,
          email: patient.email,
          phone: patient.phone
        } : null,
        patientName,
        _dedup: apt.ghl_appointment_id || `${apt.start_time}-${patientName}`
      };
    });

    // Format native appointments (Cal.com + manual source)
    const nativeAppointments = (nativeResult.data || []).map(apt => {
      const patient = apt.patients;
      let patientName = patient?.name ||
        (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : null) ||
        apt.patient_name || 'Unknown';

      return {
        id: apt.id,
        calendarName: apt.service_name || 'Appointment',
        calendarColor: getCalendarColor(apt.service_name),
        title: apt.service_category || apt.service_name,
        startTime: apt.start_time,
        endTime: apt.end_time,
        status: apt.status || 'scheduled',
        notes: apt.notes,
        source: apt.source || 'cal_com',
        provider: apt.provider,
        patient: patient ? {
          id: patient.id,
          name: patientName,
          email: patient.email,
          phone: patient.phone
        } : (apt.patient_id ? { id: apt.patient_id, name: patientName, phone: apt.patient_phone } : null),
        patientName,
        _dedup: apt.ghl_appointment_id || `${apt.start_time}-${patientName}`
      };
    });

    // Merge and deduplicate (clinic_appointments first, native fills gaps)
    const seen = new Set();
    const merged = [];
    for (const apt of [...clinicAppointments, ...nativeAppointments]) {
      if (!seen.has(apt._dedup)) {
        seen.add(apt._dedup);
        merged.push(apt);
      }
    }
    merged.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Clean up internal field
    const formattedAppointments = merged.map(({ _dedup, ...rest }) => rest);

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
  if (name.includes('blood') || name.includes('lab') || name.includes('draw')) return '#b45309';
  if (name.includes('birthday') || name.includes('review') || name.includes('gift')) return '#e11d48';

  return '#6b7280';
}
