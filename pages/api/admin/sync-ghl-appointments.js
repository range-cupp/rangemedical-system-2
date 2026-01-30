// /pages/api/admin/sync-ghl-appointments.js
// Sync appointments from GHL to local database
// Uses Calendar Events API to get all appointments for a date directly
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
  console.log('Target Date:', targetDate);
  console.log('Location ID:', GHL_LOCATION_ID);

  try {
    const results = {
      date: targetDate,
      appointmentsFound: 0,
      synced: 0,
      errors: [],
      debug: {
        hasApiKey: !!GHL_API_KEY,
        hasLocationId: !!GHL_LOCATION_ID,
        locationId: GHL_LOCATION_ID
      }
    };

    // Step 1: Get all calendars for this location
    const calendarsUrl = `https://services.leadconnectorhq.com/calendars/?locationId=${GHL_LOCATION_ID}`;
    console.log('Fetching calendars from:', calendarsUrl);

    const calendarsResponse = await fetch(calendarsUrl, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28'
      }
    });

    let allAppointments = [];

    if (calendarsResponse.ok) {
      const calendarsData = await calendarsResponse.json();
      const calendars = calendarsData.calendars || [];
      results.debug.calendarsFound = calendars.length;
      results.debug.calendarNames = calendars.map(c => c.name);

      // Build date range for the target date (Pacific Time)
      const startTime = `${targetDate}T00:00:00-08:00`;
      const endTime = `${targetDate}T23:59:59-08:00`;
      const startTimeMs = new Date(startTime).getTime();
      const endTimeMs = new Date(endTime).getTime();

      // Step 2: Fetch events for each calendar
      for (const calendar of calendars) {
        try {
          const eventsUrl = `https://services.leadconnectorhq.com/calendars/events?locationId=${GHL_LOCATION_ID}&calendarId=${calendar.id}&startTime=${startTimeMs}&endTime=${endTimeMs}`;

          const eventsResponse = await fetch(eventsUrl, {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28'
            }
          });

          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            const events = eventsData.events || [];
            console.log(`Calendar "${calendar.name}" returned ${events.length} events`);

            // Add calendar info to each event
            for (const event of events) {
              allAppointments.push({
                ...event,
                calendarId: calendar.id,
                calendarName: calendar.name
              });
            }
          } else {
            const errorText = await eventsResponse.text();
            console.log(`Calendar "${calendar.name}" error: ${errorText.substring(0, 200)}`);
          }
        } catch (e) {
          console.error(`Error fetching calendar ${calendar.name}:`, e.message);
        }
      }

      console.log(`Total appointments from calendars: ${allAppointments.length}`);
    } else {
      // If Calendars API fails, fall back to contacts-based approach
      const errorText = await calendarsResponse.text();
      results.debug.calendarsApiError = errorText.substring(0, 500);
      console.log('Calendars API failed, falling back to contacts approach');

      // Fallback: Get all contacts and check their appointments
      let contacts = [];
      let hasMore = true;
      let startAfter = null;
      let startAfterId = null;
      const limit = 100;
      let pageCount = 0;
      const maxPages = 20;

      while (hasMore && pageCount < maxPages) {
        let contactsUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=${limit}`;
        if (startAfter && startAfterId) {
          contactsUrl += `&startAfter=${startAfter}&startAfterId=${startAfterId}`;
        }

        const contactsResponse = await fetch(contactsUrl, {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        });

        if (!contactsResponse.ok) break;

        const contactsData = await contactsResponse.json();
        const batch = contactsData.contacts || [];

        if (batch.length === 0) {
          hasMore = false;
        } else {
          contacts.push(...batch);
          pageCount++;
          startAfter = contactsData.meta?.startAfter;
          startAfterId = contactsData.meta?.startAfterId;
          if (batch.length < limit || !contactsData.meta?.nextPage) {
            hasMore = false;
          }
        }
      }

      // Deduplicate contacts
      const uniqueContacts = [];
      const seenIds = new Set();
      for (const contact of contacts) {
        if (!seenIds.has(contact.id)) {
          seenIds.add(contact.id);
          uniqueContacts.push(contact);
        }
      }

      results.debug.contactsFetched = uniqueContacts.length;

      // Fetch appointments for each contact in batches
      const batchSize = 30;
      for (let i = 0; i < uniqueContacts.length; i += batchSize) {
        const batch = uniqueContacts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (contact) => {
            try {
              const aptsUrl = `https://services.leadconnectorhq.com/contacts/${contact.id}/appointments`;
              const aptsResponse = await fetch(aptsUrl, {
                headers: {
                  'Authorization': `Bearer ${GHL_API_KEY}`,
                  'Version': '2021-07-28'
                }
              });

              if (aptsResponse.ok) {
                const aptsData = await aptsResponse.json();
                const appointments = aptsData.events || aptsData.appointments || [];
                return appointments
                  .filter(apt => {
                    const aptStartTime = apt.startTime || apt.start_time || '';
                    const aptDate = aptStartTime.split(/[T ]/)[0];
                    return aptDate === targetDate;
                  })
                  .map(apt => ({
                    ...apt,
                    contactId: contact.id,
                    contactName: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                  }));
              }
              return [];
            } catch {
              return [];
            }
          })
        );

        for (const appointments of batchResults) {
          allAppointments.push(...appointments);
        }
      }
    }

    results.appointmentsFound = allAppointments.length;
    console.log(`Appointments found for ${targetDate}: ${allAppointments.length}`);

    // Step 3: Store appointments in database
    for (const apt of allAppointments) {
      try {
        const appointmentId = apt.id || apt.appointmentId;
        const calendarId = apt.calendarId || apt.calendar_id || '';
        // Extract calendar name from title (e.g., "Kristen Collins - Red Light Therapy" -> "Red Light Therapy")
        const titleParts = (apt.title || '').split(' - ');
        const calendarName = titleParts.length > 1 ? titleParts.slice(1).join(' - ') : (apt.calendar?.name || apt.calendarName || apt.title || 'Appointment');
        const title = apt.title || apt.name || calendarName;
        const status = (apt.status || apt.appointmentStatus || 'scheduled').toLowerCase();
        // Convert "2026-01-30 08:30:00" to ISO format with Pacific timezone
        // GHL times are in the clinic's local timezone (Pacific Time)
        let startTimeVal = apt.startTime || apt.start_time || apt.selectedTimeslot?.startTime || '';
        let endTimeVal = apt.endTime || apt.end_time || apt.selectedTimeslot?.endTime || '';

        // Helper to add Pacific timezone offset
        const addPacificTimezone = (timeStr) => {
          if (!timeStr) return timeStr;
          // Replace space with T if needed
          let isoTime = timeStr.includes('T') ? timeStr : timeStr.replace(' ', 'T');
          // If no timezone specified, add Pacific Time offset
          // Check if already has timezone (ends with Z or +/-HH:MM)
          if (!isoTime.match(/[Z]$/) && !isoTime.match(/[+-]\d{2}:\d{2}$/)) {
            // Determine PST (-08:00) vs PDT (-07:00) based on date
            // For simplicity, use PST for Nov-Mar, PDT for Mar-Nov
            const month = parseInt(isoTime.substring(5, 7));
            const offset = (month >= 3 && month <= 10) ? '-07:00' : '-08:00';
            isoTime += offset;
          }
          return isoTime;
        };

        startTimeVal = addPacificTimezone(startTimeVal);
        endTimeVal = addPacificTimezone(endTimeVal);
        const notes = apt.notes || '';

        // Find patient by GHL contact ID
        let patientId = null;
        if (apt.contactId) {
          const { data: patient } = await supabase
            .from('patients')
            .select('id')
            .eq('ghl_contact_id', apt.contactId)
            .single();
          if (patient) {
            patientId = patient.id;
          }
        }

        const appointmentData = {
          ghl_appointment_id: appointmentId,
          ghl_contact_id: apt.contactId,
          patient_id: patientId,
          calendar_id: calendarId,
          calendar_name: calendarName,
          appointment_title: title,
          appointment_date: targetDate,
          start_time: startTimeVal,
          end_time: endTimeVal,
          status: status,
          notes: notes,
          updated_at: new Date().toISOString()
        };

        // Debug: Log first appointment's stored time
        if (results.synced === 0 && !results.debug.firstStoredTime) {
          results.debug.firstStoredTime = {
            raw: apt.startTime,
            processed: startTimeVal
          };
        }

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

    console.log('Sync complete:', results.synced, 'appointments synced');

    // Include appointment summaries in response for debugging
    results.appointmentSummaries = allAppointments.slice(0, 3).map(apt => ({
      id: apt.id,
      title: apt.title,
      rawStartTime: apt.startTime,
      contactName: apt.contactName
    }));

    return res.status(200).json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Sync failed', details: error.message });
  }
}
