// /pages/api/webhooks/calcom.js
// Range Medical - Cal.com Webhook Handler
// Receives booking events from Cal.com and syncs to calcom_bookings table
// Executes appointment actions (decrement, track_visit, log, lab_journey)
// CREATED: 2026-02-22
// UPDATED: 2026-02-24 - Added CALCOM_APPOINTMENT_ACTIONS mapping

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// APPOINTMENT ACTION MAPPING (by Cal.com event type slug)
// =====================================================
const CALCOM_APPOINTMENT_ACTIONS = {
  // Session decrement — find active package and subtract 1
  'hbot': 'decrement',
  'red-light-therapy': 'decrement',
  'range-iv': 'decrement',
  'nad-iv-250': 'decrement',
  'nad-iv-500': 'decrement',
  'nad-iv-750': 'decrement',
  'nad-iv-1000': 'decrement',
  'vitamin-c-iv': 'decrement',
  'specialty-iv': 'decrement',
  'range-injections': 'decrement',
  'nad-injection': 'decrement',

  // Protocol visit tracking — log visit date on active protocol
  'injection-testosterone': 'track_visit',
  'injection-weight-loss': 'track_visit',
  'injection-peptide': 'track_visit',

  // Log only — record appointment, no package/protocol action
  'initial-consultation': 'log',
  'initial-consultation-peptide': 'log',
  'follow-up-consultation': 'log',
  'injection-medical': 'log',

  // Lab journey — update lab pipeline stage
  'new-patient-blood-draw': 'lab_journey',
  'follow-up-blood-draw': 'lab_journey',
  'initial-lab-review': 'lab_journey',
  'follow-up-lab-review': 'lab_journey',
  'initial-lab-review-telemedicine': 'lab_journey',
  'follow-up-lab-review-telemedicine': 'lab_journey',
  'follow-up-lab-review-phone': 'lab_journey',
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    const triggerEvent = payload.triggerEvent;

    console.log('Cal.com webhook received:', triggerEvent);

    if (!triggerEvent) {
      return res.status(200).json({ success: true, message: 'No trigger event, skipping' });
    }

    const bookingData = payload.payload;
    if (!bookingData) {
      return res.status(200).json({ success: true, message: 'No payload data, skipping' });
    }

    // Extract booking info
    const calcomBookingId = bookingData.bookingId || bookingData.id;
    const calcomUid = bookingData.uid;
    const attendee = bookingData.attendees?.[0] || {};
    const startTime = bookingData.startTime;
    const endTime = bookingData.endTime;
    const eventTitle = bookingData.title || bookingData.eventTitle;
    const eventTypeId = bookingData.eventTypeId;
    const eventTypeSlug = bookingData.eventType?.slug || bookingData.slug;

    // Extract host/staff info
    const host = bookingData.organizer || bookingData.user || {};
    const staffName = host.name || null;
    const staffEmail = host.email || null;

    // Extract booking field responses (injection tier, dose, IV type, etc.)
    const responses = bookingData.responses || bookingData.bookingFieldsResponses || {};
    const serviceDetails = {};
    if (responses.injectionTier) serviceDetails.injectionTier = responses.injectionTier;
    if (responses.injectionType) serviceDetails.injectionType = responses.injectionType;
    if (responses.nadDose) serviceDetails.nadDose = responses.nadDose;
    if (responses.ivType) serviceDetails.ivType = responses.ivType;
    if (responses.notes) serviceDetails.notes = responses.notes;
    // Also check for generic custom field responses
    for (const [key, val] of Object.entries(responses)) {
      if (!serviceDetails[key] && val && typeof val === 'string') {
        serviceDetails[key] = val;
      }
    }

    // Calculate duration and booking date
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.round((end - start) / 60000);
    const bookingDate = startTime ? startTime.split('T')[0] : null;

    // Look up action for this event type
    const action = eventTypeSlug ? CALCOM_APPOINTMENT_ACTIONS[eventTypeSlug] : null;

    if (triggerEvent === 'BOOKING_CREATED') {
      console.log('Cal.com BOOKING_CREATED:', calcomUid, eventTitle, attendee.email, 'action:', action);

      // Try to match attendee email to a patient
      let patientId = null;
      if (attendee.email && !attendee.email.endsWith('@booking.rangemedical.com')) {
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('email', attendee.email)
          .single();
        if (patient) {
          patientId = patient.id;
        }
      } else if (attendee.email?.endsWith('@booking.rangemedical.com')) {
        // Extract patient_id from placeholder email
        const idPart = attendee.email.split('@')[0];
        if (idPart.length === 36) {
          patientId = idPart;
        }
      }

      const { error } = await supabase
        .from('calcom_bookings')
        .upsert({
          calcom_booking_id: calcomBookingId,
          calcom_uid: calcomUid,
          patient_id: patientId,
          patient_name: attendee.name,
          patient_email: attendee.email,
          service_name: eventTitle,
          service_slug: eventTypeSlug,
          calcom_event_type_id: eventTypeId,
          start_time: startTime,
          end_time: endTime,
          booking_date: bookingDate,
          duration_minutes: durationMinutes,
          status: 'scheduled',
          booked_by: patientId ? 'staff' : 'patient',
          staff_name: staffName,
          staff_email: staffEmail,
          service_details: Object.keys(serviceDetails).length > 0 ? serviceDetails : null
        }, {
          onConflict: 'calcom_booking_id'
        });

      if (error) {
        console.error('Webhook upsert error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
      }

      // Execute appointment action if patient is known
      if (patientId && action) {
        await executeAction(action, patientId, eventTypeSlug, serviceDetails);
      }

      return res.status(200).json({ success: true, message: 'Booking created/synced', action: action || 'none' });
    }

    if (triggerEvent === 'BOOKING_CANCELLED') {
      console.log('Cal.com BOOKING_CANCELLED:', calcomUid);

      // Get the booking before updating so we can reverse actions
      const { data: existing } = await supabase
        .from('calcom_bookings')
        .select('patient_id, service_slug')
        .eq('calcom_uid', calcomUid)
        .single();

      const { error } = await supabase
        .from('calcom_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('calcom_uid', calcomUid);

      if (error) {
        console.error('Webhook cancel update error:', error);
      }

      return res.status(200).json({ success: true, message: 'Booking cancelled', action: 'cancelled' });
    }

    if (triggerEvent === 'BOOKING_RESCHEDULED') {
      console.log('Cal.com BOOKING_RESCHEDULED:', calcomUid, 'to', startTime);

      const { error } = await supabase
        .from('calcom_bookings')
        .update({
          start_time: startTime,
          end_time: endTime,
          booking_date: bookingDate,
          duration_minutes: durationMinutes,
          staff_name: staffName,
          staff_email: staffEmail
        })
        .eq('calcom_uid', calcomUid);

      if (error) {
        console.error('Webhook reschedule update error:', error);
      }

      return res.status(200).json({ success: true, message: 'Booking rescheduled', action: 'rescheduled' });
    }

    // Unknown event type
    console.log('Cal.com webhook - unhandled event:', triggerEvent);
    return res.status(200).json({ success: true, message: 'Event type not handled', triggerEvent });
  } catch (error) {
    console.error('Cal.com webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing error', details: error.message });
  }
}

// =====================================================
// ACTION EXECUTORS
// Note: Session counting is handled through the Service Log.
// These actions log the appointment and update pipeline stages.
// =====================================================

async function executeAction(action, patientId, slug, serviceDetails) {
  try {
    switch (action) {
      case 'decrement':
        console.log(`Action: decrement for patient ${patientId}, slug ${slug}`);
        // Session decrement is handled via Service Log — log for tracking
        await logAppointmentAction(patientId, slug, 'decrement', serviceDetails);
        break;

      case 'track_visit':
        console.log(`Action: track_visit for patient ${patientId}, slug ${slug}`);
        await logAppointmentAction(patientId, slug, 'track_visit', serviceDetails);
        break;

      case 'lab_journey':
        console.log(`Action: lab_journey for patient ${patientId}, slug ${slug}`);
        await updateLabJourney(patientId, slug);
        break;

      case 'log':
      default:
        console.log(`Action: log for patient ${patientId}, slug ${slug}`);
        break;
    }
  } catch (err) {
    console.error(`executeAction error (${action}):`, err);
  }
}

async function logAppointmentAction(patientId, slug, action, serviceDetails) {
  const { error } = await supabase
    .from('appointment_logs')
    .insert({
      patient_id: patientId,
      appointment_type: slug,
      action_taken: action,
      service_details: Object.keys(serviceDetails).length > 0 ? serviceDetails : null,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.log('Could not log appointment action:', error.message);
  }
}

async function updateLabJourney(patientId, slug) {
  // Map slug to lab pipeline stage
  const stageMap = {
    'new-patient-blood-draw': 'blood_drawn',
    'follow-up-blood-draw': 'blood_drawn',
    'initial-lab-review': 'reviewed',
    'follow-up-lab-review': 'reviewed',
    'initial-lab-review-telemedicine': 'reviewed',
    'follow-up-lab-review-telemedicine': 'reviewed',
    'follow-up-lab-review-phone': 'reviewed',
  };

  const stage = stageMap[slug];
  if (!stage) return;

  // Find active lab record for this patient and update stage
  const { data: lab } = await supabase
    .from('labs')
    .select('id, status')
    .eq('patient_id', patientId)
    .in('status', ['ordered', 'collected', 'results_in'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lab) {
    const newStatus = stage === 'blood_drawn' ? 'collected' : 'reviewed';
    await supabase
      .from('labs')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', lab.id);

    console.log(`Lab journey updated: patient ${patientId}, lab ${lab.id} -> ${newStatus}`);
  }
}
