// /pages/api/admin/ghl-appointments.js
// Fetch appointments from GoHighLevel for clinic schedule
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Calendar IDs for in-clinic services
const CLINIC_CALENDARS = {
  'hbot': { id: '68fbb36bde21d1840e5f412e', name: 'HBOT', color: '#3730a3' },
  'rlt': { id: '68fbb3888eb4bc0d9dc758cb', name: 'Red Light Therapy', color: '#dc2626' },
  'iv': { id: '68efcd8ae4e0ed94b9390a06', name: 'IV Therapy', color: '#c2410c' },
  // Add more calendars as needed
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;

    // Use provided date or today
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Set time range for the day (start of day to end of day in local timezone)
    const startTime = new Date(targetDate + 'T00:00:00');
    const endTime = new Date(targetDate + 'T23:59:59');

    console.log('Fetching GHL appointments for:', targetDate);

    // Fetch appointments from GHL
    const allAppointments = [];

    for (const [type, calendar] of Object.entries(CLINIC_CALENDARS)) {
      try {
        const response = await fetch(
          `https://services.leadconnectorhq.com/calendars/${calendar.id}/appointments?` +
          new URLSearchParams({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
          }),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Accept': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const appointments = data.appointments || data.events || [];

          appointments.forEach(apt => {
            allAppointments.push({
              id: apt.id,
              contactId: apt.contactId || apt.contact_id,
              calendarId: calendar.id,
              calendarType: type,
              calendarName: calendar.name,
              calendarColor: calendar.color,
              title: apt.title || calendar.name,
              startTime: apt.startTime || apt.start_time,
              endTime: apt.endTime || apt.end_time,
              status: apt.status || apt.appointmentStatus || 'scheduled',
              contactName: apt.contact?.name || apt.contactName || 'Unknown'
            });
          });
        } else {
          console.log(`Failed to fetch ${type} appointments:`, response.status);
        }
      } catch (calError) {
        console.error(`Error fetching ${type} calendar:`, calError);
      }
    }

    // Also try fetching all appointments for the location
    try {
      const allResponse = await fetch(
        `https://services.leadconnectorhq.com/calendars/events?` +
        new URLSearchParams({
          locationId: GHL_LOCATION_ID,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        }),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        }
      );

      if (allResponse.ok) {
        const allData = await allResponse.json();
        const events = allData.events || allData.appointments || [];

        // Add events not already in our list
        const existingIds = new Set(allAppointments.map(a => a.id));
        events.forEach(apt => {
          if (!existingIds.has(apt.id)) {
            allAppointments.push({
              id: apt.id,
              contactId: apt.contactId || apt.contact_id,
              calendarId: apt.calendarId || apt.calendar_id,
              calendarType: 'other',
              calendarName: apt.calendarName || apt.calendar?.name || 'Appointment',
              calendarColor: '#6b7280',
              title: apt.title || 'Appointment',
              startTime: apt.startTime || apt.start_time,
              endTime: apt.endTime || apt.end_time,
              status: apt.status || apt.appointmentStatus || 'scheduled',
              contactName: apt.contact?.name || apt.contactName || 'Unknown'
            });
          }
        });
      }
    } catch (err) {
      console.log('Could not fetch all events:', err.message);
    }

    // Match appointments to patients in our system
    const contactIds = [...new Set(allAppointments.map(a => a.contactId).filter(Boolean))];

    let patientsByGhl = {};
    if (contactIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, ghl_contact_id, email, phone')
        .in('ghl_contact_id', contactIds);

      (patients || []).forEach(p => {
        if (p.ghl_contact_id) {
          patientsByGhl[p.ghl_contact_id] = p;
        }
      });
    }

    // Enhance appointments with patient info
    const enhancedAppointments = allAppointments.map(apt => {
      const patient = patientsByGhl[apt.contactId];
      return {
        ...apt,
        patient: patient ? {
          id: patient.id,
          name: patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          email: patient.email,
          phone: patient.phone
        } : null,
        patientName: patient?.name || patient?.first_name ?
          `${patient.first_name || ''} ${patient.last_name || ''}`.trim() :
          apt.contactName
      };
    });

    // Sort by start time
    enhancedAppointments.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Group by status
    const scheduled = enhancedAppointments.filter(a =>
      ['scheduled', 'confirmed', 'new'].includes((a.status || '').toLowerCase())
    );
    const showed = enhancedAppointments.filter(a =>
      ['showed', 'completed'].includes((a.status || '').toLowerCase())
    );
    const noShow = enhancedAppointments.filter(a =>
      ['no_show', 'noshow', 'cancelled', 'canceled'].includes((a.status || '').toLowerCase())
    );

    return res.status(200).json({
      success: true,
      date: targetDate,
      total: enhancedAppointments.length,
      appointments: enhancedAppointments,
      byStatus: {
        scheduled: scheduled.length,
        showed: showed.length,
        noShow: noShow.length
      },
      grouped: {
        scheduled,
        showed,
        noShow
      }
    });

  } catch (error) {
    console.error('Error fetching GHL appointments:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
