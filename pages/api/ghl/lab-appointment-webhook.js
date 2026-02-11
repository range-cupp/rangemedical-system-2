// /pages/api/ghl/lab-appointment-webhook.js
// Webhook for GHL Appointment Events - Lab Journey Tracking
// Triggers on: New Patient Blood Draw, Follow-up Blood Draw, Initial Lab Review
// Range Medical
// CREATED: 2026-01-26

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calendar IDs for lab-related appointments
const CALENDAR_IDS = {
  NEW_PATIENT_BLOOD_DRAW: '69363659022462924d66805c',  // Confirmed from GHL
  FOLLOW_UP_BLOOD_DRAW: '68fbc3300d41ec836e706680',
  INITIAL_LAB_REVIEW: '68fbc3cc4cbe5615edb2016d'
};

// Helper: Add business days to a date
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

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Lab Appointment Webhook Active',
      calendars: CALENDAR_IDS,
      version: '1.0.0'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    console.log('=== LAB APPOINTMENT WEBHOOK ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Extract appointment data
    // GHL sends different formats - handle various structures
    const appointment = payload.appointment || payload.data || payload;
    const calendarId = appointment.calendarId || appointment.calendar_id || appointment.serviceId;
    const appointmentId = appointment.id || appointment.appointmentId;
    const contactId = appointment.contactId || appointment.contact_id;
    const status = appointment.status || appointment.appointmentStatus;
    const startTime = appointment.startTime || appointment.start_time || appointment.selectedTimeslot?.startTime;
    
    // Contact info
    const contactName = appointment.contact?.name || appointment.contactName || 
                        `${appointment.contact?.firstName || ''} ${appointment.contact?.lastName || ''}`.trim();
    const contactPhone = appointment.contact?.phone || appointment.contactPhone;
    const contactEmail = appointment.contact?.email || appointment.contactEmail;

    console.log('Calendar ID:', calendarId);
    console.log('Appointment ID:', appointmentId);
    console.log('Contact ID:', contactId);
    console.log('Status:', status);
    console.log('Contact:', contactName);

    // ==========================================
    // STORE ALL APPOINTMENTS FOR CLINIC SCHEDULE
    // ==========================================
    if (appointmentId) {
      const calendarName = appointment.calendar?.name || appointment.calendarName || 'Appointment';
      const title = appointment.title || appointment.name || calendarName;
      const endTime = appointment.endTime || appointment.end_time || appointment.selectedTimeslot?.endTime;
      const notes = appointment.notes || '';
      const appointmentDate = startTime ? startTime.split('T')[0] : new Date().toISOString().split('T')[0];

      // Find patient by GHL contact ID
      let clinicPatientId = null;
      if (contactId) {
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('ghl_contact_id', contactId)
          .single();
        if (patient) {
          clinicPatientId = patient.id;
        }
      }

      // Check if appointment exists
      const { data: existingApt } = await supabase
        .from('clinic_appointments')
        .select('id')
        .eq('ghl_appointment_id', appointmentId)
        .single();

      const appointmentData = {
        ghl_appointment_id: appointmentId,
        ghl_contact_id: contactId,
        patient_id: clinicPatientId,
        calendar_id: calendarId,
        calendar_name: calendarName,
        appointment_title: title,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        status: status?.toLowerCase() || 'scheduled',
        notes: notes,
        updated_at: new Date().toISOString()
      };

      if (existingApt) {
        await supabase
          .from('clinic_appointments')
          .update(appointmentData)
          .eq('ghl_appointment_id', appointmentId);
        console.log('📅 Updated clinic appointment:', appointmentId);
      } else {
        await supabase
          .from('clinic_appointments')
          .insert(appointmentData);
        console.log('📅 Created clinic appointment:', appointmentId);
      }
    }

    // Determine which calendar this is for
    let calendarType = null;
    if (calendarId === CALENDAR_IDS.NEW_PATIENT_BLOOD_DRAW) {
      calendarType = 'new_patient_blood_draw';
    } else if (calendarId === CALENDAR_IDS.FOLLOW_UP_BLOOD_DRAW) {
      calendarType = 'follow_up_blood_draw';
    } else if (calendarId === CALENDAR_IDS.INITIAL_LAB_REVIEW) {
      calendarType = 'initial_lab_review';
    } else {
      console.log('Calendar not tracked for lab journeys:', calendarId);
      // Still return success since appointment was stored for clinic schedule
      return res.status(200).json({
        status: 'success',
        calendarType: 'clinic_only',
        appointmentId,
        contactId,
        patientId,
        message: 'Stored for clinic schedule (not a lab journey calendar)'
      });
    }

    console.log('Calendar Type:', calendarType);

    // Find or create patient in Supabase
    let patientId = null;
    if (contactId) {
      // Check if patient exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', contactId)
        .single();
      
      if (existingPatient) {
        patientId = existingPatient.id;
      } else if (contactName) {
        // Create patient
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            name: contactName,
            phone: contactPhone,
            email: contactEmail,
            ghl_contact_id: contactId
          })
          .select('id')
          .single();
        
        if (!patientError && newPatient) {
          patientId = newPatient.id;
          console.log('Created new patient:', patientId);
        }
      }
    }

    // Handle based on calendar type and status
    if (calendarType === 'new_patient_blood_draw') {
      await handleNewPatientBloodDraw(appointmentId, calendarId, contactId, patientId, contactName, contactPhone, contactEmail, status, startTime);
    } else if (calendarType === 'follow_up_blood_draw') {
      await handleFollowUpBloodDraw(appointmentId, calendarId, contactId, patientId, contactName, status, startTime);
    } else if (calendarType === 'initial_lab_review') {
      await handleInitialLabReview(appointmentId, contactId, patientId, status, startTime);
    }

    return res.status(200).json({ 
      status: 'success',
      calendarType,
      appointmentId,
      contactId,
      patientId
    });

  } catch (error) {
    console.error('Lab Appointment Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// =========================
// NEW PATIENT BLOOD DRAW
// =========================
async function handleNewPatientBloodDraw(appointmentId, calendarId, contactId, patientId, contactName, contactPhone, contactEmail, status, startTime) {
  console.log('Processing New Patient Blood Draw:', status);
  
  const appointmentDate = startTime ? new Date(startTime) : new Date();
  
  // Check if journey already exists for this appointment
  const { data: existingJourney } = await supabase
    .from('lab_journeys')
    .select('id, stage')
    .eq('blood_draw_appointment_id', appointmentId)
    .single();

  if (status === 'confirmed' || status === 'new' || status === 'booked') {
    // New appointment scheduled
    if (!existingJourney) {
      const { data: journey, error } = await supabase
        .from('lab_journeys')
        .insert({
          patient_id: patientId,
          ghl_contact_id: contactId,
          patient_name: contactName,
          patient_phone: contactPhone,
          patient_email: contactEmail,
          journey_type: 'new_patient',
          stage: 'draw_scheduled',
          blood_draw_appointment_id: appointmentId,
          blood_draw_calendar_id: calendarId,
          blood_draw_scheduled_date: appointmentDate.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lab journey:', error);
      } else {
        console.log('Created lab journey:', journey.id);
      }
    }
  } else if (status === 'showed' || status === 'completed') {
    // Patient showed up for blood draw
    const completedDate = new Date();

    if (existingJourney) {
      await supabase
        .from('lab_journeys')
        .update({
          stage: 'draw_complete',
          blood_draw_completed_date: completedDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingJourney.id);

      console.log('Updated journey to draw_complete:', existingJourney.id);
    } else {
      // Create journey in draw_complete stage (appointment wasn't tracked initially)
      await supabase
        .from('lab_journeys')
        .insert({
          patient_id: patientId,
          ghl_contact_id: contactId,
          patient_name: contactName,
          patient_phone: contactPhone,
          patient_email: contactEmail,
          journey_type: 'new_patient',
          stage: 'draw_complete',
          blood_draw_appointment_id: appointmentId,
          blood_draw_calendar_id: calendarId,
          blood_draw_scheduled_date: appointmentDate.toISOString(),
          blood_draw_completed_date: completedDate.toISOString()
        });

      console.log('Created journey in draw_complete stage');
    }
  } else if (status === 'cancelled' || status === 'no_show' || status === 'noshow') {
    // Appointment cancelled or no-show
    if (existingJourney) {
      await supabase
        .from('lab_journeys')
        .update({
          stage: status === 'cancelled' ? 'cancelled' : 'no_show',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingJourney.id);
      
      console.log('Updated journey to:', status);
    }
  }
}

// =========================
// FOLLOW-UP BLOOD DRAW
// =========================
async function handleFollowUpBloodDraw(appointmentId, calendarId, contactId, patientId, contactName, status, startTime) {
  console.log('Processing Follow-up Blood Draw:', status);
  
  const appointmentDate = startTime ? new Date(startTime) : new Date();
  
  // Check if there's a pending follow-up lab record for this patient
  const { data: existingFollowUp } = await supabase
    .from('protocol_follow_up_labs')
    .select('id, status')
    .or(`ghl_contact_id.eq.${contactId},patient_id.eq.${patientId}`)
    .in('status', ['due', 'scheduled'])
    .order('due_date', { ascending: true })
    .limit(1)
    .single();

  if (status === 'confirmed' || status === 'new' || status === 'booked') {
    if (existingFollowUp) {
      // Update existing follow-up record
      await supabase
        .from('protocol_follow_up_labs')
        .update({
          status: 'scheduled',
          scheduled_date: appointmentDate.toISOString(),
          appointment_id: appointmentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFollowUp.id);
      
      console.log('Updated follow-up to scheduled:', existingFollowUp.id);
    } else {
      // Create a new follow-up record (might be manually scheduled)
      await supabase
        .from('protocol_follow_up_labs')
        .insert({
          patient_id: patientId,
          ghl_contact_id: contactId,
          patient_name: contactName,
          follow_up_type: 'quarterly',
          status: 'scheduled',
          scheduled_date: appointmentDate.toISOString(),
          appointment_id: appointmentId
        });
      
      console.log('Created new follow-up record');
    }
  } else if (status === 'showed' || status === 'completed') {
    // Find the scheduled follow-up
    const { data: scheduledFollowUp } = await supabase
      .from('protocol_follow_up_labs')
      .select('id, protocol_id')
      .eq('appointment_id', appointmentId)
      .single();

    if (scheduledFollowUp) {
      await supabase
        .from('protocol_follow_up_labs')
        .update({
          status: 'results_pending',
          drawn_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduledFollowUp.id);
      
      console.log('Updated follow-up to results_pending');
      
      // Create next quarterly follow-up (12 weeks out)
      if (scheduledFollowUp.protocol_id) {
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 84); // 12 weeks
        
        // Get follow-up number
        const { data: followUpCount } = await supabase
          .from('protocol_follow_up_labs')
          .select('id')
          .eq('protocol_id', scheduledFollowUp.protocol_id);
        
        await supabase
          .from('protocol_follow_up_labs')
          .insert({
            protocol_id: scheduledFollowUp.protocol_id,
            patient_id: patientId,
            ghl_contact_id: contactId,
            patient_name: contactName,
            follow_up_type: 'quarterly',
            follow_up_number: (followUpCount?.length || 0) + 1,
            status: 'due',
            due_date: formatDate(nextDueDate)
          });
        
        console.log('Created next quarterly follow-up');
      }
    }
  }
}

// =========================
// INITIAL LAB REVIEW
// =========================
async function handleInitialLabReview(appointmentId, contactId, patientId, status, startTime) {
  console.log('Processing Initial Lab Review:', status);
  
  const appointmentDate = startTime ? new Date(startTime) : new Date();
  
  // Find the journey for this patient that's awaiting consultation
  const { data: journey } = await supabase
    .from('lab_journeys')
    .select('id, stage')
    .or(`ghl_contact_id.eq.${contactId},patient_id.eq.${patientId}`)
    .in('stage', ['draw_complete', 'provider_reviewed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (status === 'confirmed' || status === 'new' || status === 'booked') {
    if (journey) {
      await supabase
        .from('lab_journeys')
        .update({
          stage: 'consult_scheduled',
          lab_review_appointment_id: appointmentId,
          consultation_scheduled_date: appointmentDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', journey.id);

      console.log('Updated journey to consult_scheduled');
    }
  } else if (status === 'showed' || status === 'completed') {
    // Find journey with this review appointment
    const { data: reviewJourney } = await supabase
      .from('lab_journeys')
      .select('id')
      .eq('lab_review_appointment_id', appointmentId)
      .single();

    if (reviewJourney) {
      await supabase
        .from('lab_journeys')
        .update({
          stage: 'treatment_started',
          treatment_started_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewJourney.id);

      console.log('Updated journey to treatment_started');
    }
  }
}
