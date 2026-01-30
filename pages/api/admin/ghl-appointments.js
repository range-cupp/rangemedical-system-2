// /pages/api/admin/ghl-appointments.js
// Fetch appointments from GoHighLevel for clinic schedule
// Range Medical
// Strategy: Fetch from all calendars since service calendars may not be directly accessible

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Set time range for the day
    const startTime = new Date(targetDate + 'T00:00:00');
    const endTime = new Date(targetDate + 'T23:59:59');

    console.log('Fetching GHL appointments for:', targetDate);

    // Step 1: Get all calendars for this location
    const calendarsResponse = await fetch(
      `https://services.leadconnectorhq.com/calendars/?locationId=${GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );

    if (!calendarsResponse.ok) {
      console.error('Failed to fetch calendars:', calendarsResponse.status);
      return res.status(500).json({ error: 'Failed to fetch calendars from GHL' });
    }

    const calendarsData = await calendarsResponse.json();
    const calendars = calendarsData.calendars || [];

    console.log(`Found ${calendars.length} calendars`);

    // Step 2: Fetch events from each calendar
    const allAppointments = [];

    for (const calendar of calendars) {
      try {
        const eventsResponse = await fetch(
          `https://services.leadconnectorhq.com/calendars/events?` +
          new URLSearchParams({
            locationId: GHL_LOCATION_ID,
            calendarId: calendar.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
          }),
          {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28'
            }
          }
        );

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          const events = eventsData.events || [];

          console.log(`Calendar "${calendar.name}": ${events.length} events`);

          events.forEach(evt => {
            allAppointments.push({
              id: evt.id,
              contactId: evt.contactId || evt.contact?.id,
              calendarId: calendar.id,
              calendarName: calendar.name,
              calendarColor: calendar.eventColor || '#6b7280',
              title: evt.title || evt.name || calendar.name,
              startTime: evt.startTime || evt.selectedTimezone?.startTime,
              endTime: evt.endTime || evt.selectedTimezone?.endTime,
              status: evt.status || evt.appointmentStatus || 'scheduled',
              contactName: evt.contact?.name || evt.title || 'Unknown',
              notes: evt.notes || ''
            });
          });
        }
      } catch (err) {
        console.error(`Error fetching calendar ${calendar.name}:`, err.message);
      }
    }

    // Step 3: Match appointments to patients
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
      calendarsChecked: calendars.length,
      appointments: enhancedAppointments,
      byStatus: {
        scheduled: scheduled.length,
        showed: showed.length,
        noShow: noShow.length
      }
    });

  } catch (error) {
    console.error('Error fetching GHL appointments:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
