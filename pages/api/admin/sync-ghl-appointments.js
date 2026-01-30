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

  const { date, page = 1 } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const pageNum = parseInt(page) || 1;
  const contactsPerPage = 300; // Process 300 contacts per API call

  console.log('=== SYNC GHL APPOINTMENTS ===');
  console.log('Target Date:', targetDate);
  console.log('Location ID:', GHL_LOCATION_ID);

  try {
    const results = {
      date: targetDate,
      page: pageNum,
      contactsPerPage,
      contactsFetched: 0,
      contactsChecked: 0,
      appointmentsFound: 0,
      synced: 0,
      errors: [],
      debug: {
        hasApiKey: !!GHL_API_KEY,
        hasLocationId: !!GHL_LOCATION_ID,
        locationId: GHL_LOCATION_ID
      }
    };

    // Step 1: Get ALL contacts from GHL first
    let allContacts = [];
    let hasMore = true;
    let startAfter = null;
    let startAfterId = null;
    const limit = 100;
    let pageCount = 0;
    const maxPages = 15; // Fetch up to 1500 contacts

    while (hasMore && pageCount < maxPages) {
      try {
        let contactsUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=${limit}`;
        // GHL requires both startAfter AND startAfterId for pagination
        if (startAfter && startAfterId) {
          contactsUrl += `&startAfter=${startAfter}&startAfterId=${startAfterId}`;
        }
        console.log(`Fetching contacts: page=${pageCount}`);

        const contactsResponse = await fetch(contactsUrl, {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        });

        if (!contactsResponse.ok) {
          const errorText = await contactsResponse.text();
          results.debug.contactsError = { status: contactsResponse.status, body: errorText.substring(0, 500) };
          break;
        }

        const contactsText = await contactsResponse.text();
        let contactsData;
        try {
          contactsData = JSON.parse(contactsText);
        } catch (e) {
          results.debug.parseError = { error: e.message, raw: contactsText.substring(0, 500) };
          break;
        }

        if (pageCount === 0) {
          results.debug.firstResponse = {
            contactCount: contactsData.contacts?.length || 0,
            keys: Object.keys(contactsData),
            meta: contactsData.meta
          };
        }

        const contacts = contactsData.contacts || [];

        if (contacts.length === 0) {
          hasMore = false;
        } else {
          allContacts.push(...contacts);
          pageCount++;
          // Use pagination values from meta response
          startAfter = contactsData.meta?.startAfter;
          startAfterId = contactsData.meta?.startAfterId;
          if (contacts.length < limit || !contactsData.meta?.nextPage) {
            hasMore = false;
          }
        }
      } catch (e) {
        console.error('Error fetching contacts:', e);
        results.errors.push({ step: 'fetch_contacts', error: e.message });
        hasMore = false;
      }
    }

    // Deduplicate contacts
    const uniqueContacts = [];
    const seenIds = new Set();
    for (const contact of allContacts) {
      if (!seenIds.has(contact.id)) {
        seenIds.add(contact.id);
        uniqueContacts.push(contact);
      }
    }

    results.contactsFetched = allContacts.length;
    results.debug.uniqueContacts = uniqueContacts.length;
    results.debug.duplicatesRemoved = allContacts.length - uniqueContacts.length;
    console.log(`Contacts fetched: ${allContacts.length}, unique: ${uniqueContacts.length}`);

    // Slice to just this page's contacts
    const startIdx = (pageNum - 1) * contactsPerPage;
    const endIdx = startIdx + contactsPerPage;
    const pageContacts = uniqueContacts.slice(startIdx, endIdx);

    results.debug.totalUniqueContacts = uniqueContacts.length;
    results.debug.processingRange = `${startIdx}-${endIdx}`;
    results.debug.contactsToProcess = pageContacts.length;

    // Check if Kelly's contact ID is in this page
    const kellyId = 'wvWLq6kjnyvzhw9Q3mZ7';
    const kellyContact = pageContacts.find(c => c.id === kellyId);
    results.debug.kellyInThisPage = !!kellyContact;

    // Calculate if there are more pages
    results.hasMorePages = endIdx < uniqueContacts.length;
    results.nextPage = results.hasMorePages ? pageNum + 1 : null;
    results.totalPages = Math.ceil(uniqueContacts.length / contactsPerPage);

    // Use page contacts for appointment fetching
    allContacts = pageContacts;

    // Step 2: Fetch appointments for all contacts in parallel batches
    const allAppointments = [];
    const batchSize = 30; // Process 30 contacts at a time for speed

    for (let i = 0; i < allContacts.length; i += batchSize) {
      const batch = allContacts.slice(i, i + batchSize);

      // Debug: Track specific contacts
      const debugContactIds = ['wvWLq6kjnyvzhw9Q3mZ7']; // Kelly Ripley

      const batchResults = await Promise.all(
        batch.map(async (contact) => {
          const isDebugContact = debugContactIds.includes(contact.id);

          try {
            const appointmentsUrl = `https://services.leadconnectorhq.com/contacts/${contact.id}/appointments`;
            const aptsResponse = await fetch(appointmentsUrl, {
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28'
              }
            });

            if (aptsResponse.ok) {
              const aptsData = await aptsResponse.json();
              const appointments = aptsData.events || aptsData.appointments || [];

              if (isDebugContact) {
                results.debug.kellyCheck = {
                  contactId: contact.id,
                  totalAppointments: appointments.length,
                  appointmentDates: appointments.map(a => (a.startTime || '').split(/[T ]/)[0])
                };
              }

              // Filter appointments to target date
              return appointments
                .filter(apt => {
                  const aptStartTime = apt.startTime || apt.start_time || apt.selectedTimeslot?.startTime || '';
                  const aptDate = aptStartTime.split(/[T ]/)[0];
                  return aptDate === targetDate;
                })
                .map(apt => ({
                  ...apt,
                  contactId: contact.id,
                  contactName: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
                  contactEmail: contact.email,
                  contactPhone: contact.phone
                }));
            }
            return [];
          } catch (e) {
            if (isDebugContact) {
              results.debug.kellyError = e.message;
            }
            return [];
          }
        })
      );

      // Flatten batch results
      for (const appointments of batchResults) {
        allAppointments.push(...appointments);
      }

      results.contactsChecked += batch.length;
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
