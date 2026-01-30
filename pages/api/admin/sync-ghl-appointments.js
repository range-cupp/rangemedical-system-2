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
  console.log('Target Date:', targetDate);
  console.log('Location ID:', GHL_LOCATION_ID);

  try {
    const results = {
      date: targetDate,
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

    // Step 1: Get ALL contacts from GHL (paginated)
    let allContacts = [];
    let hasMore = true;
    let skip = 0;
    const limit = 100;

    while (hasMore && skip < 1000) { // Cap at 1000 contacts to avoid timeout
      try {
        const contactsUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=${limit}&skip=${skip}`;
        console.log(`Fetching contacts: skip=${skip}`);

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

        if (skip === 0) {
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
          skip += limit;
          if (contacts.length < limit) {
            hasMore = false;
          }
        }
      } catch (e) {
        console.error('Error fetching contacts:', e);
        results.errors.push({ step: 'fetch_contacts', error: e.message });
        hasMore = false;
      }
    }

    results.contactsFetched = allContacts.length;
    console.log(`Total contacts fetched: ${allContacts.length}`);

    // Step 2: For each contact, fetch their appointments and filter by date
    const allAppointments = [];

    for (const contact of allContacts) {
      try {
        const appointmentsUrl = `https://services.leadconnectorhq.com/contacts/${contact.id}/appointments`;

        const aptsResponse = await fetch(appointmentsUrl, {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        });

        results.contactsChecked++;

        if (aptsResponse.ok) {
          const aptsData = await aptsResponse.json();
          const appointments = aptsData.events || aptsData.appointments || [];

          // Filter appointments to target date
          for (const apt of appointments) {
            const aptStartTime = apt.startTime || apt.start_time || apt.selectedTimeslot?.startTime || '';
            // Handle both "2026-01-30T08:30:00" and "2026-01-30 08:30:00" formats
            const aptDate = aptStartTime.split(/[T ]/)[0];

            if (aptDate === targetDate) {
              allAppointments.push({
                ...apt,
                contactId: contact.id,
                contactName: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
                contactEmail: contact.email,
                contactPhone: contact.phone
              });
            }
          }
        }

        // Small delay to avoid rate limiting (every 10 contacts)
        if (results.contactsChecked % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (e) {
        // Skip individual contact errors silently
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
        // Convert "2026-01-30 08:30:00" to ISO format if needed
        let startTimeVal = apt.startTime || apt.start_time || apt.selectedTimeslot?.startTime || '';
        let endTimeVal = apt.endTime || apt.end_time || apt.selectedTimeslot?.endTime || '';
        // Handle space-separated date format
        if (startTimeVal && !startTimeVal.includes('T')) {
          startTimeVal = startTimeVal.replace(' ', 'T');
        }
        if (endTimeVal && !endTimeVal.includes('T')) {
          endTimeVal = endTimeVal.replace(' ', 'T');
        }
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

    return res.status(200).json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Sync failed', details: error.message });
  }
}
