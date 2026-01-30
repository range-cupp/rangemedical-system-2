// /pages/api/admin/sync-ghl-appointments.js
// Sync appointments from GHL to local database
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  console.log('=== SYNC GHL APPOINTMENTS ===');
  console.log('Date:', targetDate);
  console.log('Location ID:', GHL_LOCATION_ID);

  try {
    // Build date range for the target date (full day in UTC)
    const startTime = `${targetDate}T00:00:00Z`;
    const endTime = `${targetDate}T23:59:59Z`;

    const results = {
      date: targetDate,
      endpoints_tried: [],
      appointments: [],
      synced: 0,
      errors: []
    };

    // Try multiple GHL API endpoints to find appointments

    // Endpoint 1: /calendars/events (all calendars)
    try {
      const url = `https://services.leadconnectorhq.com/calendars/events?locationId=${GHL_LOCATION_ID}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
      console.log('Trying:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      });

      const data = await response.json();
      results.endpoints_tried.push({
        endpoint: '/calendars/events',
        status: response.status,
        count: data.events?.length || 0
      });

      if (data.events && data.events.length > 0) {
        results.appointments.push(...data.events.map(e => ({ ...e, source: 'calendars/events' })));
      }
    } catch (e) {
      results.errors.push({ endpoint: '/calendars/events', error: e.message });
    }

    // Endpoint 2: /calendars/{calendarId}/appointments for each calendar
    // First get all calendars
    try {
      const calendarsUrl = `https://services.leadconnectorhq.com/calendars/?locationId=${GHL_LOCATION_ID}`;
      const calendarsResponse = await fetch(calendarsUrl, {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      });
      const calendarsData = await calendarsResponse.json();
      const calendars = calendarsData.calendars || [];

      results.calendars_found = calendars.map(c => ({ id: c.id, name: c.name }));

      // Fetch appointments from each calendar
      for (const calendar of calendars) {
        try {
          const aptsUrl = `https://services.leadconnectorhq.com/calendars/${calendar.id}/appointments?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
          const aptsResponse = await fetch(aptsUrl, {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28'
            }
          });
          const aptsData = await aptsResponse.json();

          if (aptsData.appointments && aptsData.appointments.length > 0) {
            results.appointments.push(...aptsData.appointments.map(a => ({
              ...a,
              calendarName: calendar.name,
              calendarId: calendar.id,
              source: `calendars/${calendar.id}/appointments`
            })));
          }
        } catch (e) {
          // Skip individual calendar errors
        }
      }
    } catch (e) {
      results.errors.push({ endpoint: '/calendars/', error: e.message });
    }

    // Endpoint 3: Try /appointments/ endpoint
    try {
      const url = `https://services.leadconnectorhq.com/appointments/?locationId=${GHL_LOCATION_ID}&startDate=${encodeURIComponent(startTime)}&endDate=${encodeURIComponent(endTime)}`;
      console.log('Trying:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      });

      const data = await response.json();
      results.endpoints_tried.push({
        endpoint: '/appointments/',
        status: response.status,
        count: data.appointments?.length || 0
      });

      if (data.appointments && data.appointments.length > 0) {
        results.appointments.push(...data.appointments.map(a => ({ ...a, source: 'appointments/' })));
      }
    } catch (e) {
      results.errors.push({ endpoint: '/appointments/', error: e.message });
    }

    // Deduplicate appointments by ID
    const uniqueAppointments = [];
    const seenIds = new Set();
    for (const apt of results.appointments) {
      const id = apt.id || apt.appointmentId;
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        uniqueAppointments.push(apt);
      }
    }
    results.unique_count = uniqueAppointments.length;

    // Store appointments in database
    for (const apt of uniqueAppointments) {
      try {
        const appointmentId = apt.id || apt.appointmentId;
        const contactId = apt.contactId || apt.contact_id;
        const calendarId = apt.calendarId || apt.calendar_id;
        const calendarName = apt.calendarName || apt.calendar?.name || apt.title || 'Appointment';
        const title = apt.title || apt.name || calendarName;
        const status = (apt.status || apt.appointmentStatus || 'scheduled').toLowerCase();
        const startTimeVal = apt.startTime || apt.start_time;
        const endTimeVal = apt.endTime || apt.end_time;
        const appointmentDate = startTimeVal ? startTimeVal.split('T')[0] : targetDate;
        const notes = apt.notes || '';

        // Get contact name
        const contactName = apt.contact?.name ||
          apt.contactName ||
          `${apt.contact?.firstName || ''} ${apt.contact?.lastName || ''}`.trim() ||
          apt.title ||
          'Unknown';

        // Find patient by GHL contact ID
        let patientId = null;
        if (contactId) {
          const { data: patient } = await supabase
            .from('patients')
            .select('id')
            .eq('ghl_contact_id', contactId)
            .single();
          if (patient) {
            patientId = patient.id;
          }
        }

        const appointmentData = {
          ghl_appointment_id: appointmentId,
          ghl_contact_id: contactId,
          patient_id: patientId,
          calendar_id: calendarId,
          calendar_name: calendarName,
          appointment_title: title,
          appointment_date: appointmentDate,
          start_time: startTimeVal,
          end_time: endTimeVal,
          status: status,
          notes: notes,
          updated_at: new Date().toISOString()
        };

        // Upsert appointment
        const { error } = await supabase
          .from('clinic_appointments')
          .upsert(appointmentData, { onConflict: 'ghl_appointment_id' });

        if (!error) {
          results.synced++;
        } else {
          results.errors.push({ appointmentId, error: error.message });
        }
      } catch (e) {
        results.errors.push({ appointment: apt.id, error: e.message });
      }
    }

    console.log('Sync complete:', results.synced, 'appointments');

    return res.status(200).json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Sync failed', details: error.message });
  }
}
