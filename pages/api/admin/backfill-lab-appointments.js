// /pages/api/admin/backfill-lab-appointments.js
// Pull historical lab appointments from GHL and populate lab_journeys table
// Range Medical
// CREATED: 2026-01-26

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API config
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

// Calendar IDs
const CALENDAR_IDS = {
  NEW_PATIENT_BLOOD_DRAW: '68f01aea7ed18b27a8b12e64',
  FOLLOW_UP_BLOOD_DRAW: '68fbc3300d41ec836e706680',
  INITIAL_LAB_REVIEW: '68fbc3cc4cbe5615edb2016d'
};

// Helper: Add business days
function addBusinessDays(date, days) {
  let result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

// Helper: Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Fetch appointments from GHL
async function fetchGHLAppointments(calendarId, startDate, endDate) {
  const url = `https://services.leadconnectorhq.com/calendars/${calendarId}/appointments?locationId=${GHL_LOCATION_ID}&startTime=${startDate}&endTime=${endDate}`;
  
  console.log('Fetching from:', url);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Version': '2021-04-15',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('GHL API Error:', response.status, errorText);
    throw new Error(`GHL API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.appointments || [];
}

// Get contact details from GHL
async function getContactDetails(contactId) {
  if (!contactId) return null;
  
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.contact;
  } catch (err) {
    console.error('Error fetching contact:', err);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Show info about what this endpoint does
    return res.status(200).json({
      endpoint: 'Backfill Lab Appointments',
      description: 'Pulls historical lab appointments from GHL and populates lab_journeys table',
      calendars: CALENDAR_IDS,
      usage: 'POST with { startDate: "2025-01-01", endDate: "2026-01-26", dryRun: true/false }',
      note: 'Set dryRun: true to preview without inserting'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startDate, endDate, dryRun = true } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate required',
        example: { startDate: '2025-01-01', endDate: '2026-01-26', dryRun: false }
      });
    }

    console.log(`\n=== BACKFILLING LAB APPOINTMENTS ===`);
    console.log(`Date range: ${startDate} to ${endDate}`);
    console.log(`Dry run: ${dryRun}`);

    const results = {
      newPatientBloodDraw: [],
      followUpBloodDraw: [],
      labReview: [],
      journeysCreated: 0,
      followUpsCreated: 0,
      errors: []
    };

    // 1. Fetch New Patient Blood Draw appointments
    console.log('\n--- Fetching New Patient Blood Draw appointments ---');
    try {
      const newPatientAppts = await fetchGHLAppointments(
        CALENDAR_IDS.NEW_PATIENT_BLOOD_DRAW,
        startDate,
        endDate
      );
      console.log(`Found ${newPatientAppts.length} appointments`);

      for (const appt of newPatientAppts) {
        const contactId = appt.contactId;
        const contact = await getContactDetails(contactId);
        const contactName = contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() : appt.title || 'Unknown';
        const contactPhone = contact?.phone || null;
        const contactEmail = contact?.email || null;

        const appointmentDate = new Date(appt.startTime || appt.selectedTimeslot?.startTime);
        const status = appt.appointmentStatus || appt.status;
        const isCompleted = ['showed', 'completed'].includes(status?.toLowerCase());
        
        // Determine stage based on status
        let stage = 'scheduled';
        let bloodDrawCompletedDate = null;
        let outreachDueDate = null;

        if (isCompleted) {
          stage = 'outreach_due';
          bloodDrawCompletedDate = appointmentDate.toISOString();
          outreachDueDate = formatDate(addBusinessDays(appointmentDate, 2));
        } else if (['cancelled', 'no_show', 'noshow'].includes(status?.toLowerCase())) {
          stage = status.toLowerCase().includes('cancel') ? 'cancelled' : 'no_show';
        }

        // Find patient in Supabase
        let patientId = null;
        if (contactId) {
          const { data: patient } = await supabase
            .from('patients')
            .select('id')
            .eq('ghl_contact_id', contactId)
            .single();
          patientId = patient?.id;
        }

        const journeyData = {
          patient_id: patientId,
          ghl_contact_id: contactId,
          patient_name: contactName,
          patient_phone: contactPhone,
          patient_email: contactEmail,
          journey_type: 'new_patient',
          stage,
          blood_draw_appointment_id: appt.id,
          blood_draw_calendar_id: CALENDAR_IDS.NEW_PATIENT_BLOOD_DRAW,
          blood_draw_scheduled_date: appointmentDate.toISOString(),
          blood_draw_completed_date: bloodDrawCompletedDate,
          outreach_due_date: outreachDueDate || formatDate(addBusinessDays(appointmentDate, 2))
        };

        results.newPatientBloodDraw.push({
          appointment_id: appt.id,
          contact_name: contactName,
          date: appointmentDate.toISOString(),
          status,
          stage,
          patient_id: patientId
        });

        if (!dryRun) {
          // Check if already exists
          const { data: existing } = await supabase
            .from('lab_journeys')
            .select('id')
            .eq('blood_draw_appointment_id', appt.id)
            .single();

          if (!existing) {
            const { error } = await supabase
              .from('lab_journeys')
              .insert(journeyData);
            
            if (error) {
              results.errors.push({ type: 'new_patient', appt_id: appt.id, error: error.message });
            } else {
              results.journeysCreated++;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching new patient appointments:', err);
      results.errors.push({ type: 'fetch_new_patient', error: err.message });
    }

    // 2. Fetch Follow-up Blood Draw appointments
    console.log('\n--- Fetching Follow-up Blood Draw appointments ---');
    try {
      const followUpAppts = await fetchGHLAppointments(
        CALENDAR_IDS.FOLLOW_UP_BLOOD_DRAW,
        startDate,
        endDate
      );
      console.log(`Found ${followUpAppts.length} appointments`);

      for (const appt of followUpAppts) {
        const contactId = appt.contactId;
        const contact = await getContactDetails(contactId);
        const contactName = contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() : appt.title || 'Unknown';

        const appointmentDate = new Date(appt.startTime || appt.selectedTimeslot?.startTime);
        const status = appt.appointmentStatus || appt.status;
        const isCompleted = ['showed', 'completed'].includes(status?.toLowerCase());

        // Find patient and their active protocol
        let patientId = null;
        let protocolId = null;
        if (contactId) {
          const { data: patient } = await supabase
            .from('patients')
            .select('id')
            .eq('ghl_contact_id', contactId)
            .single();
          patientId = patient?.id;

          if (patientId) {
            // Find active HRT or Weight Loss protocol
            const { data: protocol } = await supabase
              .from('protocols')
              .select('id, program_type')
              .eq('patient_id', patientId)
              .in('program_type', ['hrt', 'weight_loss'])
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            protocolId = protocol?.id;
          }
        }

        let followUpStatus = 'scheduled';
        let drawnDate = null;
        if (isCompleted) {
          followUpStatus = 'results_pending';
          drawnDate = appointmentDate.toISOString();
        }

        results.followUpBloodDraw.push({
          appointment_id: appt.id,
          contact_name: contactName,
          date: appointmentDate.toISOString(),
          status,
          follow_up_status: followUpStatus,
          patient_id: patientId,
          protocol_id: protocolId
        });

        if (!dryRun && patientId) {
          // Check if already exists
          const { data: existing } = await supabase
            .from('protocol_follow_up_labs')
            .select('id')
            .eq('appointment_id', appt.id)
            .single();

          if (!existing) {
            const { error } = await supabase
              .from('protocol_follow_up_labs')
              .insert({
                protocol_id: protocolId,
                patient_id: patientId,
                ghl_contact_id: contactId,
                patient_name: contactName,
                follow_up_type: 'quarterly',
                status: followUpStatus,
                scheduled_date: appointmentDate.toISOString(),
                drawn_date: drawnDate,
                appointment_id: appt.id
              });

            if (error) {
              results.errors.push({ type: 'follow_up', appt_id: appt.id, error: error.message });
            } else {
              results.followUpsCreated++;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching follow-up appointments:', err);
      results.errors.push({ type: 'fetch_follow_up', error: err.message });
    }

    // 3. Fetch Lab Review appointments and update existing journeys
    console.log('\n--- Fetching Lab Review appointments ---');
    try {
      const reviewAppts = await fetchGHLAppointments(
        CALENDAR_IDS.INITIAL_LAB_REVIEW,
        startDate,
        endDate
      );
      console.log(`Found ${reviewAppts.length} appointments`);

      for (const appt of reviewAppts) {
        const contactId = appt.contactId;
        const contact = await getContactDetails(contactId);
        const contactName = contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() : appt.title || 'Unknown';

        const appointmentDate = new Date(appt.startTime || appt.selectedTimeslot?.startTime);
        const status = appt.appointmentStatus || appt.status;
        const isCompleted = ['showed', 'completed'].includes(status?.toLowerCase());

        results.labReview.push({
          appointment_id: appt.id,
          contact_name: contactName,
          date: appointmentDate.toISOString(),
          status,
          completed: isCompleted
        });

        if (!dryRun && contactId) {
          // Find matching journey and update it
          const { data: journey } = await supabase
            .from('lab_journeys')
            .select('id, stage')
            .eq('ghl_contact_id', contactId)
            .in('stage', ['outreach_due', 'outreach_complete', 'review_scheduled'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (journey) {
            const updates = {
              lab_review_appointment_id: appt.id,
              lab_review_scheduled_date: appointmentDate.toISOString(),
              updated_at: new Date().toISOString()
            };

            if (isCompleted) {
              updates.stage = 'review_complete';
              updates.lab_review_completed_date = appointmentDate.toISOString();
            } else if (journey.stage !== 'review_scheduled') {
              updates.stage = 'review_scheduled';
            }

            await supabase
              .from('lab_journeys')
              .update(updates)
              .eq('id', journey.id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching lab review appointments:', err);
      results.errors.push({ type: 'fetch_lab_review', error: err.message });
    }

    // Summary
    const summary = {
      dryRun,
      dateRange: { startDate, endDate },
      counts: {
        newPatientBloodDraw: results.newPatientBloodDraw.length,
        followUpBloodDraw: results.followUpBloodDraw.length,
        labReview: results.labReview.length
      },
      created: {
        journeys: results.journeysCreated,
        followUps: results.followUpsCreated
      },
      errors: results.errors
    };

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));

    return res.status(200).json({
      success: true,
      summary,
      details: dryRun ? results : undefined,
      message: dryRun 
        ? 'Dry run complete - no data was inserted. Set dryRun: false to insert.' 
        : `Created ${results.journeysCreated} journeys and ${results.followUpsCreated} follow-ups`
    });

  } catch (error) {
    console.error('Backfill Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
