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

// Service calendar IDs from GHL (these are different from personal calendars)
const SERVICE_CALENDARS = [
  { id: '68f01d9a238b376bfa9a758c', name: 'Range Injections' },
  { id: '6946d1509a25681dba593fcd', name: 'Injection - Medical' },
  { id: '68fbe09a4866ec6b798932b6', name: 'Injection - Testosterone' },
  { id: '6900eedaf5009e264f9ded8e', name: 'Injection - Peptide' },
  { id: '69363659022462924d66805c', name: 'New Patient Blood Draw' },
  { id: '68fbc3300d41ec836e706680', name: 'Follow-up Blood Draw' },
  { id: '68fbc3cc4cbe5615edb2016d', name: 'Initial Lab Review' }
];

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

    // Endpoint 3: Try service calendars directly
    for (const calendar of SERVICE_CALENDARS) {
      try {
        // Try /calendars/{id}/appointments
        const aptsUrl = `https://services.leadconnectorhq.com/calendars/${calendar.id}/appointments?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
        const aptsResponse = await fetch(aptsUrl, {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        });
        const aptsData = await aptsResponse.json();

        results.endpoints_tried.push({
          endpoint: `/calendars/${calendar.id}/appointments`,
          calendarName: calendar.name,
          status: aptsResponse.status,
          count: aptsData.appointments?.length || 0
        });

        if (aptsData.appointments && aptsData.appointments.length > 0) {
          results.appointments.push(...aptsData.appointments.map(a => ({
            ...a,
            calendarName: calendar.name,
            calendarId: calendar.id,
            source: `service-calendar:${calendar.name}`
          })));
        }
      } catch (e) {
        results.errors.push({ calendar: calendar.name, error: e.message });
      }

      // Also try /calendars/events with calendarId filter
      try {
        const eventsUrl = `https://services.leadconnectorhq.com/calendars/events?locationId=${GHL_LOCATION_ID}&calendarId=${calendar.id}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
        const eventsResponse = await fetch(eventsUrl, {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        });
        const eventsData = await eventsResponse.json();

        if (eventsData.events && eventsData.events.length > 0) {
          results.appointments.push(...eventsData.events.map(e => ({
            ...e,
            calendarName: calendar.name,
            calendarId: calendar.id,
            source: `service-events:${calendar.name}`
          })));
        }
      } catch (e) {
        // Skip
      }
    }

    // Endpoint 4: Try /appointments/ endpoint with different params
    const appointmentEndpoints = [
      `/appointments/?locationId=${GHL_LOCATION_ID}&startDate=${encodeURIComponent(startTime)}&endDate=${encodeURIComponent(endTime)}`,
      `/appointments/?locationId=${GHL_LOCATION_ID}&rangeStart=${encodeURIComponent(startTime)}&rangeEnd=${encodeURIComponent(endTime)}`,
      `/appointments?locationId=${GHL_LOCATION_ID}&date=${targetDate}`
    ];

    for (const endpoint of appointmentEndpoints) {
      try {
        const url = `https://services.leadconnectorhq.com${endpoint}`;
        console.log('Trying:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text.substring(0, 500) };
        }

        results.endpoints_tried.push({
          endpoint: endpoint.split('?')[0],
          status: response.status,
          count: data.appointments?.length || 0
        });

        if (data.appointments && data.appointments.length > 0) {
          results.appointments.push(...data.appointments.map(a => ({ ...a, source: 'appointments/' })));
        }
      } catch (e) {
        results.errors.push({ endpoint, error: e.message });
      }
    }

    // Endpoint 5: Get appointments for contacts with upcoming appointments
    try {
      // First get contacts
      const contactsUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=100`;
      const contactsResponse = await fetch(contactsUrl, {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      });
      const contactsData = await contactsResponse.json();
      const contacts = contactsData.contacts || [];

      results.endpoints_tried.push({
        endpoint: '/contacts/',
        status: contactsResponse.status,
        contactsFound: contacts.length
      });

      // For each contact, try to get their appointments
      let appointmentsFound = 0;
      for (const contact of contacts.slice(0, 50)) { // Limit to first 50 to avoid rate limits
        try {
          const contactAptsUrl = `https://services.leadconnectorhq.com/contacts/${contact.id}/appointments`;
          const contactAptsResponse = await fetch(contactAptsUrl, {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28'
            }
          });

          if (contactAptsResponse.ok) {
            const contactAptsData = await contactAptsResponse.json();
            const appts = contactAptsData.appointments || contactAptsData.events || [];

            // Filter to target date
            const todayAppts = appts.filter(a => {
              const aptDate = (a.startTime || a.start_time || '').split('T')[0];
              return aptDate === targetDate;
            });

            if (todayAppts.length > 0) {
              results.appointments.push(...todayAppts.map(a => ({
                ...a,
                contactId: contact.id,
                contactName: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
                source: 'contacts/appointments'
              })));
              appointmentsFound += todayAppts.length;
            }
          }
        } catch (e) {
          // Skip individual contact errors
        }
      }

      results.endpoints_tried.push({
        endpoint: '/contacts/{id}/appointments',
        contactsChecked: Math.min(contacts.length, 50),
        appointmentsFound
      });
    } catch (e) {
      results.errors.push({ endpoint: '/contacts/', error: e.message });
    }

    // Endpoint 6: Try the calendar blocks/slots endpoints
    for (const calendar of SERVICE_CALENDARS.slice(0, 3)) { // Try first 3 to test
      try {
        const slotsUrl = `https://services.leadconnectorhq.com/calendars/${calendar.id}/free-slots?startDate=${targetDate}&endDate=${targetDate}`;
        const slotsResponse = await fetch(slotsUrl, {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        });

        results.endpoints_tried.push({
          endpoint: `/calendars/${calendar.id}/free-slots`,
          calendarName: calendar.name,
          status: slotsResponse.status
        });
      } catch (e) {
        // Skip
      }
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
