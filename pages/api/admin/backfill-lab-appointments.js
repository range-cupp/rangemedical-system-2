// /pages/api/admin/backfill-lab-appointments.js
// Pull historical lab appointments from GHL via contact appointments
// Range Medical
// CREATED: 2026-01-26 - FIXED VERSION

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API config
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

// Calendar IDs to match against
const CALENDAR_IDS = {
  NEW_PATIENT_BLOOD_DRAW: '69363659022462924d66805c',  // Confirmed from GHL
  FOLLOW_UP_BLOOD_DRAW: '68fbc3300d41ec836e706680',
  INITIAL_LAB_REVIEW: '68fbc3cc4cbe5615edb2016d'
};

// Also match by title keywords in case calendar IDs differ
const TITLE_MATCHERS = {
  NEW_PATIENT_BLOOD_DRAW: ['new patient blood draw', 'blood draw - essential', 'blood draw - elite'],
  FOLLOW_UP_BLOOD_DRAW: ['follow-up blood draw', 'follow up blood draw', 'followup blood'],
  INITIAL_LAB_REVIEW: ['lab review', 'initial lab review', 'labs review']
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

// Determine appointment type by calendarId or title
function getAppointmentType(appointment) {
  const calendarId = appointment.calendarId;
  const title = (appointment.title || '').toLowerCase();
  
  // Check by calendar ID first
  if (calendarId === CALENDAR_IDS.NEW_PATIENT_BLOOD_DRAW) return 'NEW_PATIENT_BLOOD_DRAW';
  if (calendarId === CALENDAR_IDS.FOLLOW_UP_BLOOD_DRAW) return 'FOLLOW_UP_BLOOD_DRAW';
  if (calendarId === CALENDAR_IDS.INITIAL_LAB_REVIEW) return 'INITIAL_LAB_REVIEW';
  
  // Fall back to title matching
  for (const [type, keywords] of Object.entries(TITLE_MATCHERS)) {
    if (keywords.some(kw => title.includes(kw))) {
      return type;
    }
  }
  
  return null;
}

// Fetch appointments for a single contact
async function fetchContactAppointments(contactId) {
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/appointments`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.events || data.appointments || [];
  } catch (err) {
    console.error(`Error fetching appointments for ${contactId}:`, err.message);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      endpoint: 'Backfill Lab Appointments',
      description: 'Pulls lab appointments from GHL contacts and populates lab_journeys table',
      calendars: CALENDAR_IDS,
      titleMatchers: TITLE_MATCHERS,
      usage: 'POST with { startDate: "2025-01-01", endDate: "2026-01-26", dryRun: true/false }',
      note: 'Fetches appointments from all patients with GHL contact IDs',
      debug: {
        hasApiKey: !!GHL_API_KEY,
        apiKeyPrefix: GHL_API_KEY ? GHL_API_KEY.substring(0, 15) + '...' : 'NOT SET',
        locationId: GHL_LOCATION_ID
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startDate, endDate, dryRun = true, limit = 500 } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate required',
        example: { startDate: '2025-01-01', endDate: '2026-01-26', dryRun: false }
      });
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate + 'T23:59:59');

    console.log(`\n=== BACKFILLING LAB APPOINTMENTS ===`);
    console.log(`Date range: ${startDate} to ${endDate}`);
    console.log(`Dry run: ${dryRun}`);

    // Get all patients with GHL contact IDs
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id, phone, email')
      .not('ghl_contact_id', 'is', null)
      .limit(limit);

    if (patientsError) {
      return res.status(500).json({ error: 'Failed to fetch patients: ' + patientsError.message });
    }

    console.log(`Found ${patients.length} patients with GHL IDs`);

    const results = {
      newPatientBloodDraw: [],
      followUpBloodDraw: [],
      labReview: [],
      journeysCreated: 0,
      followUpsCreated: 0,
      reviewsUpdated: 0,
      errors: [],
      patientsProcessed: 0,
      appointmentsFound: 0
    };

    // Process each patient
    for (const patient of patients) {
      results.patientsProcessed++;
      
      const appointments = await fetchContactAppointments(patient.ghl_contact_id);
      
      for (const appt of appointments) {
        const apptDate = new Date(appt.startTime);
        
        // Filter by date range
        if (apptDate < startDateTime || apptDate > endDateTime) continue;
        
        const apptType = getAppointmentType(appt);
        if (!apptType) continue;
        
        results.appointmentsFound++;
        
        const status = appt.appointmentStatus || appt.status || '';
        const isCompleted = ['showed', 'completed'].includes(status.toLowerCase());
        const isCancelled = ['cancelled', 'no_show', 'noshow'].includes(status.toLowerCase());

        // Handle NEW PATIENT BLOOD DRAW
        if (apptType === 'NEW_PATIENT_BLOOD_DRAW') {
          let stage = 'scheduled';
          let bloodDrawCompletedDate = null;
          let outreachDueDate = formatDate(addBusinessDays(apptDate, 2));

          if (isCompleted) {
            stage = 'outreach_due';
            bloodDrawCompletedDate = apptDate.toISOString();
          } else if (isCancelled) {
            stage = status.toLowerCase().includes('cancel') ? 'cancelled' : 'no_show';
          }

          const journeyData = {
            patient_id: patient.id,
            ghl_contact_id: patient.ghl_contact_id,
            patient_name: patient.name,
            patient_phone: patient.phone,
            patient_email: patient.email,
            journey_type: 'new_patient',
            stage,
            blood_draw_appointment_id: appt.id,
            blood_draw_calendar_id: appt.calendarId,
            blood_draw_scheduled_date: apptDate.toISOString(),
            blood_draw_completed_date: bloodDrawCompletedDate,
            outreach_due_date: outreachDueDate
          };

          results.newPatientBloodDraw.push({
            appointment_id: appt.id,
            patient_name: patient.name,
            date: apptDate.toISOString(),
            status,
            stage,
            title: appt.title
          });

          if (!dryRun) {
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
                results.errors.push({ type: 'new_patient', patient: patient.name, error: error.message });
              } else {
                results.journeysCreated++;
              }
            }
          }
        }

        // Handle FOLLOW-UP BLOOD DRAW
        if (apptType === 'FOLLOW_UP_BLOOD_DRAW') {
          // Find active HRT or Weight Loss protocol
          const { data: protocol } = await supabase
            .from('protocols')
            .select('id, program_type')
            .eq('patient_id', patient.id)
            .in('program_type', ['hrt', 'weight_loss'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          let followUpStatus = 'scheduled';
          let drawnDate = null;
          if (isCompleted) {
            followUpStatus = 'results_pending';
            drawnDate = apptDate.toISOString();
          }

          results.followUpBloodDraw.push({
            appointment_id: appt.id,
            patient_name: patient.name,
            date: apptDate.toISOString(),
            status,
            follow_up_status: followUpStatus,
            protocol_id: protocol?.id,
            title: appt.title
          });

          if (!dryRun) {
            const { data: existing } = await supabase
              .from('protocol_follow_up_labs')
              .select('id')
              .eq('appointment_id', appt.id)
              .single();

            if (!existing) {
              const { error } = await supabase
                .from('protocol_follow_up_labs')
                .insert({
                  protocol_id: protocol?.id,
                  patient_id: patient.id,
                  ghl_contact_id: patient.ghl_contact_id,
                  patient_name: patient.name,
                  protocol_type: protocol?.program_type || 'Unknown',
                  follow_up_type: 'quarterly',
                  status: followUpStatus,
                  scheduled_date: apptDate.toISOString(),
                  drawn_date: drawnDate,
                  appointment_id: appt.id
                });

              if (error) {
                results.errors.push({ type: 'follow_up', patient: patient.name, error: error.message });
              } else {
                results.followUpsCreated++;
              }
            }
          }
        }

        // Handle LAB REVIEW
        if (apptType === 'INITIAL_LAB_REVIEW') {
          results.labReview.push({
            appointment_id: appt.id,
            patient_name: patient.name,
            date: apptDate.toISOString(),
            status,
            completed: isCompleted,
            title: appt.title
          });

          if (!dryRun) {
            // Find the patient's journey and update it
            const { data: journey } = await supabase
              .from('lab_journeys')
              .select('id, stage')
              .eq('patient_id', patient.id)
              .in('stage', ['outreach_due', 'outreach_complete', 'review_scheduled'])
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (journey) {
              const updates = {
                lab_review_appointment_id: appt.id,
                lab_review_scheduled_date: apptDate.toISOString(),
                updated_at: new Date().toISOString()
              };

              if (isCompleted) {
                updates.stage = 'review_complete';
                updates.lab_review_completed_date = apptDate.toISOString();
              } else if (journey.stage !== 'review_scheduled') {
                updates.stage = 'review_scheduled';
              }

              const { error } = await supabase
                .from('lab_journeys')
                .update(updates)
                .eq('id', journey.id);

              if (!error) {
                results.reviewsUpdated++;
              }
            }
          }
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const summary = {
      dryRun,
      dateRange: { startDate, endDate },
      patientsProcessed: results.patientsProcessed,
      appointmentsFound: results.appointmentsFound,
      counts: {
        newPatientBloodDraw: results.newPatientBloodDraw.length,
        followUpBloodDraw: results.followUpBloodDraw.length,
        labReview: results.labReview.length
      },
      created: {
        journeys: results.journeysCreated,
        followUps: results.followUpsCreated,
        reviewsUpdated: results.reviewsUpdated
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
        ? `Dry run complete - found ${results.appointmentsFound} lab appointments across ${results.patientsProcessed} patients` 
        : `Created ${results.journeysCreated} journeys, ${results.followUpsCreated} follow-ups, updated ${results.reviewsUpdated} reviews`
    });

  } catch (error) {
    console.error('Backfill Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
