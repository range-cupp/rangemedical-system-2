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

    // Search for contacts who have appointments using multiple strategies
    let allAppointments = [];

    // Build a set of contact IDs to check
    const contactIdsToCheck = new Set();
    const contactNameMap = new Map(); // contactId -> name

    // Strategy 1: Get patients from our database who have ghl_contact_id
    const { data: linkedPatients } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, ghl_contact_id')
      .not('ghl_contact_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (linkedPatients) {
      for (const patient of linkedPatients) {
        if (patient.ghl_contact_id) {
          contactIdsToCheck.add(patient.ghl_contact_id);
          contactNameMap.set(patient.ghl_contact_id, patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim());
        }
      }
    }
    results.debug.linkedPatients = contactIdsToCheck.size;

    // Strategy 2: Search GHL for unlinked patients to find their contact IDs
    const { data: unlinkedPatients } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name')
      .is('ghl_contact_id', null)
      .order('created_at', { ascending: false })
      .limit(200);

    let patientsLinked = 0;
    if (unlinkedPatients) {
      // Search for each unlinked patient in GHL by name
      const searchBatch = unlinkedPatients.slice(0, 50); // Limit searches to avoid rate limits
      for (const patient of searchBatch) {
        const searchName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
        if (!searchName || searchName.length < 3) continue;

        try {
          const searchUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(searchName)}&limit=5`;
          const searchResponse = await fetch(searchUrl, {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28'
            }
          });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const contacts = searchData.contacts || [];
            // Find exact name match
            const match = contacts.find(c => {
              const ghlName = (c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()).toLowerCase();
              return ghlName === searchName.toLowerCase();
            });

            if (match) {
              contactIdsToCheck.add(match.id);
              contactNameMap.set(match.id, searchName);
              patientsLinked++;

              // Update patient record with ghl_contact_id
              await supabase
                .from('patients')
                .update({ ghl_contact_id: match.id })
                .eq('id', patient.id);
            }
          }
        } catch {
          // Continue on search errors
        }
      }
    }
    results.debug.newlyLinkedPatients = patientsLinked;

    // Also get contacts from GHL pagination (as backup)
    let contacts = [];
    let hasMore = true;
    let startAfter = null;
    let startAfterId = null;
    const limit = 100;
    let pageCount = 0;
    const maxPages = 25; // Increase to get more contacts

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
        for (const c of batch) {
          contactIdsToCheck.add(c.id);
          if (!contactNameMap.has(c.id)) {
            contactNameMap.set(c.id, c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim());
          }
        }
        pageCount++;
        startAfter = contactsData.meta?.startAfter;
        startAfterId = contactsData.meta?.startAfterId;
        if (batch.length < limit || !contactsData.meta?.nextPage) {
          hasMore = false;
        }
      }
    }

    results.debug.contactsFromGhl = contacts.length;
    results.debug.totalUniqueContactIds = contactIdsToCheck.size;

    // Convert to array for processing
    const allContactIds = Array.from(contactIdsToCheck);

    // Fetch appointments for each contact in parallel batches
    const batchSize = 40; // Process more in parallel for speed
    for (let i = 0; i < allContactIds.length; i += batchSize) {
      const batch = allContactIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (contactId) => {
          try {
            const aptsUrl = `https://services.leadconnectorhq.com/contacts/${contactId}/appointments`;
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
                  contactId: contactId,
                  contactName: contactNameMap.get(contactId) || ''
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

    results.debug.contactsChecked = allContactIds.length;

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

        // Check if this appointment already exists with a "final" status
        // Don't overwrite "showed" or "completed" with a less-final status like "scheduled"
        let finalStatus = status;
        const finalStatuses = ['showed', 'completed', 'no_show', 'cancelled'];

        if (!finalStatuses.includes(status)) {
          // Check existing status
          const { data: existingApt } = await supabase
            .from('clinic_appointments')
            .select('status')
            .eq('ghl_appointment_id', appointmentId)
            .single();

          if (existingApt && finalStatuses.includes(existingApt.status)) {
            // Preserve the existing final status
            finalStatus = existingApt.status;
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
          status: finalStatus,
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
