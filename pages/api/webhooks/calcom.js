// /pages/api/webhooks/calcom.js
// Range Medical - Cal.com Webhook Handler
// Receives booking events from Cal.com and syncs to calcom_bookings table
// Executes appointment actions (decrement, track_visit, log, lab_journey)
// CREATED: 2026-02-22
// UPDATED: 2026-02-24 - Added CALCOM_APPOINTMENT_ACTIONS mapping

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendAppointmentNotification } from '../../../lib/appointment-notifications';
import { sendProviderNotification } from '../../../lib/provider-notifications';
import { todayPacific } from '../../../lib/date-utils';
import { slugRequiresBloodWork, BLOOD_WORK_VALIDITY_DAYS, getPrepInstructions, TELEMEDICINE_LINK_APPEND, REQUIRED_FORMS } from '../../../lib/appointment-services';
import { sendBlooioMessage } from '../../../lib/blooio';
import { createFormBundle, FORM_DEFINITIONS } from '../../../lib/form-bundles';
import { sendSMS as sendSMSRouter, normalizePhone as normalizePhoneUtil } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../lib/blooio-optin';

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
  'range-iv-immune': 'decrement',
  'range-iv-energy': 'decrement',
  'range-iv-recovery': 'decrement',
  'range-iv-detox': 'decrement',
  'nad-iv-250': 'decrement',
  'nad-iv-500': 'decrement',
  'nad-iv-750': 'decrement',
  'nad-iv-1000': 'decrement',
  'vitamin-c-iv': 'decrement',
  'vitamin-c-iv-25g': 'decrement',
  'vitamin-c-iv-50g': 'decrement',
  'vitamin-c-iv-75g': 'decrement',
  'methylene-blue-iv': 'decrement',
  'mb-combo-iv': 'decrement',
  'glutathione-iv': 'decrement',
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
  'follow-up-consultation-telemedicine': 'log',
  'follow-up-consultation-phone': 'log',
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

// Cal.com event type ID → slug mapping
// Cal.com webhooks don't reliably include the slug, so we map from the numeric ID
const EVENT_TYPE_ID_TO_SLUG = {
  4835888: 'range-injections',
  4835890: 'new-patient-blood-draw',        // legacy "Elite" variant
  4835900: 'injection-weight-loss',
  4835902: 'injection-peptide',
  4858865: 'new-patient-blood-draw',
  4858866: 'follow-up-blood-draw',
  4858867: 'initial-lab-review',
  4858868: 'follow-up-lab-review',
  4858872: 'injection-testosterone',
  4858873: 'injection-weight-loss',
  4858874: 'injection-peptide',
  4858877: 'red-light-therapy',
  4858878: 'range-iv',
  4858886: 'initial-consultation',
  4858888: 'follow-up-consultation',
  4969224: 'specialty-iv',
  5077412: 'follow-up-consultation-telemedicine',
  5077413: 'follow-up-consultation-phone',
};

// Derive slug from service_name when ID mapping and payload slug are both missing
function deriveSlugFromTitle(title) {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes('new patient blood draw')) return 'new-patient-blood-draw';
  if (t.includes('follow up blood draw') || t.includes('follow-up blood draw')) return 'follow-up-blood-draw';
  if (t.includes('initial lab review')) return 'initial-lab-review';
  if (t.includes('follow up lab review') || t.includes('follow-up lab review')) return 'follow-up-lab-review';
  if (t.includes('injection - testosterone') || t.includes('injection-testosterone')) return 'injection-testosterone';
  if (t.includes('injection - weight loss') || t.includes('injection-weight loss')) return 'injection-weight-loss';
  if (t.includes('injection - peptide') || t.includes('injection-peptide')) return 'injection-peptide';
  if (t.includes('red light therapy')) return 'red-light-therapy';
  if (t.includes('range iv')) return 'range-iv';
  if (t.includes('specialty iv')) return 'specialty-iv';
  if (t.includes('range injections')) return 'range-injections';
  if (t.includes('hbot')) return 'hbot';
  if (t.includes('nad') && t.includes('iv')) return 'nad-iv-500';
  if (t.includes('nad') && t.includes('injection')) return 'nad-injection';
  if (t.includes('vitamin c') && t.includes('iv')) return 'vitamin-c-iv';
  if (t.includes('methylene blue') && t.includes('iv')) return 'methylene-blue-iv';
  if (t.includes('mb combo')) return 'mb-combo-iv';
  if (t.includes('glutathione') && t.includes('iv')) return 'glutathione-iv';
  if (t.includes('follow-up consultation') && t.includes('telemedicine')) return 'follow-up-consultation-telemedicine';
  if (t.includes('follow-up consultation') && t.includes('phone')) return 'follow-up-consultation-phone';
  if (t.includes('follow-up consultation') || t.includes('follow up consultation')) return 'follow-up-consultation';
  if (t.includes('initial consultation')) return 'initial-consultation';
  if (t.includes('injection - medical') || t.includes('injection-medical')) return 'injection-medical';
  return null;
}

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
    const rawEventTitle = bookingData.title || bookingData.eventTitle;
    // Strip "between Provider and Patient" from CalCom titles for patient-facing messages
    const eventTitle = rawEventTitle ? rawEventTitle.replace(/\s+between\s+.+$/i, '') : rawEventTitle;
    const eventTypeId = bookingData.eventTypeId;
    // Resolve slug: try payload first, then ID mapping, then derive from title
    const eventTypeSlug = bookingData.eventType?.slug
      || bookingData.slug
      || EVENT_TYPE_ID_TO_SLUG[eventTypeId]
      || deriveSlugFromTitle(eventTitle);

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

      // Try to match attendee to a patient — email first, then name fallback
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
      // Fallback: match by name if email didn't resolve
      if (!patientId && attendee.name) {
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .ilike('name', attendee.name.trim())
          .single();
        if (patient) {
          patientId = patient.id;
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
          patient_phone: attendee.phone || null,
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

      // Also upsert into native appointments table
      const slugToCategory = {
        'new-patient-blood-draw': 'labs', 'follow-up-blood-draw': 'labs',
        'initial-lab-review': 'labs', 'follow-up-lab-review': 'labs',
        'range-injections': 'injection', 'nad-injection': 'injection',
        'injection-testosterone': 'hrt', 'injection-weight-loss': 'weight_loss',
        'injection-peptide': 'peptide', 'hbot': 'hbot', 'red-light-therapy': 'rlt',
        'range-iv': 'iv', 'range-iv-immune': 'iv', 'range-iv-energy': 'iv',
        'range-iv-recovery': 'iv', 'range-iv-detox': 'iv',
        'nad-iv-250': 'iv', 'nad-iv-500': 'iv', 'nad-iv-750': 'iv', 'nad-iv-1000': 'iv',
        'vitamin-c-iv': 'iv', 'vitamin-c-iv-25g': 'iv', 'vitamin-c-iv-50g': 'iv', 'vitamin-c-iv-75g': 'iv',
        'methylene-blue-iv': 'iv', 'mb-combo-iv': 'iv', 'glutathione-iv': 'iv', 'specialty-iv': 'iv',
        'initial-consultation': 'other', 'follow-up-consultation': 'follow_up_consultation',
        'follow-up-consultation-telemedicine': 'follow_up_consultation', 'follow-up-consultation-phone': 'follow_up_consultation',
      };
      await supabase.from('appointments').upsert({
        patient_id: patientId,
        patient_name: attendee.name || 'Unknown',
        patient_phone: attendee.phone || null,
        service_name: eventTitle || eventTypeSlug || 'Cal.com Booking',
        service_category: slugToCategory[eventTypeSlug] || 'other',
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        status: 'scheduled',
        source: 'cal_com',
        cal_com_booking_id: String(calcomBookingId),
      }, { onConflict: 'cal_com_booking_id' }).then(({ error: apptErr }) => {
        if (apptErr) console.error('Appointments upsert error:', apptErr);
      });

      // Execute appointment action if patient is known
      if (patientId && action) {
        await executeAction(action, patientId, eventTypeSlug, serviceDetails);
      }

      // Send staff notification email (fire-and-forget)
      sendStaffNotification('created', {
        staffEmail, staffName, patientName: attendee.name,
        serviceName: eventTitle, startTime, durationMinutes,
        serviceDetails, bookingDate
      }).catch(err => console.error('Staff notification failed:', err));

      // Send provider SMS notification (fire-and-forget)
      sendProviderNotification({
        type: 'created',
        staff: { name: staffName, email: staffEmail },
        appointment: { patientName: attendee.name, serviceName: eventTitle, startTime },
      }).catch(err => console.error('Provider SMS notification failed:', err));

      // Send patient notification — email + SMS with quiet hours (fire-and-forget)
      // For staff-booked appointments (@booking.rangemedical.com), look up real email/phone
      // from patients table so the patient still gets their confirmation + prep instructions
      const isStaffBooked = attendee.email?.endsWith('@booking.rangemedical.com');
      let patientEmail = isStaffBooked ? null : attendee.email;
      let patientPhone = attendee.phone || null;

      if (isStaffBooked && patientId) {
        const { data: patientRecord } = await supabase
          .from('patients')
          .select('email, phone')
          .eq('id', patientId)
          .single();
        if (patientRecord) {
          patientEmail = patientRecord.email || null;
          patientPhone = patientRecord.phone || patientPhone;
        }
      }

      if (patientEmail || patientPhone) {
        const bookingLocation = bookingData.location || bookingData.metadata?.location || null;
        sendAppointmentNotification({
          type: 'confirmation',
          patient: {
            id: patientId,
            name: attendee.name,
            email: patientEmail,
            phone: patientPhone,
          },
          appointment: {
            serviceName: eventTitle,
            startTime,
            endTime,
            durationMinutes,
            location: bookingLocation,
            notes: serviceDetails.notes || null,
            serviceSlug: eventTypeSlug,
          },
        }).catch(err => console.error('Patient confirmation notification failed:', err));
      }

      // ── T-05: Blood work prerequisite check ──
      // For services requiring blood work, verify labs are on file within validity window
      if (slugRequiresBloodWork(eventTypeSlug)) {
        const prereqResult = await checkBloodWorkPrereq(patientId, eventTypeSlug, {
          patientName: attendee.name,
          serviceName: eventTitle,
          startTime,
          calcomBookingId,
        });
        // Update prereqs_met on the appointments record
        if (calcomBookingId) {
          await supabase.from('appointments')
            .update({ prereqs_met: prereqResult.met })
            .eq('cal_com_booking_id', String(calcomBookingId))
            .then(({ error: prereqErr }) => {
              if (prereqErr) console.error('Prereq update error:', prereqErr);
            });
        }
      }

      // ── T-02: Pre-visit instruction send ──
      // Send prep instructions for the booked service (fire-and-forget)
      sendPrepInstructions({
        eventTypeSlug,
        patientId,
        patientName: attendee.name,
        patientEmail,
        patientPhone,
        serviceName: eventTitle,
        startTime,
        calcomBookingId: String(calcomBookingId),
      }).catch(err => console.error('Prep instructions send failed:', err));

      // ── T-03: Auto-send intake and consent forms ──
      // Send required forms for the booked service category (fire-and-forget)
      sendRequiredForms({
        eventTypeSlug,
        serviceCategory: slugToCategory[eventTypeSlug] || 'other',
        patientId,
        patientName: attendee.name,
        patientEmail,
        patientPhone,
        calcomBookingId: String(calcomBookingId),
      }).catch(err => console.error('Form auto-send failed:', err));

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

      // Also update appointments table
      if (calcomBookingId) {
        await supabase.from('appointments')
          .update({ status: 'cancelled' })
          .eq('cal_com_booking_id', String(calcomBookingId))
          .then(({ error: apptErr }) => {
            if (apptErr) console.error('Appointments cancel error:', apptErr);
          });
      }

      // Send staff notification for cancellation (fire-and-forget)
      sendStaffNotification('cancelled', {
        staffEmail, staffName, patientName: attendee.name,
        serviceName: eventTitle, startTime, durationMinutes,
        serviceDetails, bookingDate
      }).catch(err => console.error('Staff cancel notification failed:', err));

      // Send provider SMS for cancellation (fire-and-forget)
      sendProviderNotification({
        type: 'cancelled',
        staff: { name: staffName, email: staffEmail },
        appointment: { patientName: attendee.name, serviceName: eventTitle, startTime },
      }).catch(err => console.error('Provider SMS cancel failed:', err));

      // Send patient cancellation notification (fire-and-forget)
      // For staff-booked appointments, look up real contact info from patients table
      {
        const cancelPatientId = existing?.patient_id || null;
        const isCancelStaffBooked = attendee.email?.endsWith('@booking.rangemedical.com');
        let cancelEmail = isCancelStaffBooked ? null : attendee.email;
        let cancelPhone = attendee.phone || null;

        if (isCancelStaffBooked && cancelPatientId) {
          const { data: cancelPatient } = await supabase
            .from('patients')
            .select('email, phone')
            .eq('id', cancelPatientId)
            .single();
          if (cancelPatient) {
            cancelEmail = cancelPatient.email || null;
            cancelPhone = cancelPatient.phone || cancelPhone;
          }
        }

        if (cancelEmail || cancelPhone) {
          sendAppointmentNotification({
            type: 'cancellation',
            patient: {
              id: cancelPatientId,
              name: attendee.name,
              email: cancelEmail,
              phone: cancelPhone,
            },
            appointment: {
              serviceName: eventTitle,
              startTime,
              endTime,
              durationMinutes,
            },
          }).catch(err => console.error('Patient cancellation notification failed:', err));
        }
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

      // Also update appointments table
      if (calcomBookingId) {
        await supabase.from('appointments')
          .update({ start_time: startTime, end_time: endTime, duration_minutes: durationMinutes })
          .eq('cal_com_booking_id', String(calcomBookingId))
          .then(({ error: apptErr }) => {
            if (apptErr) console.error('Appointments reschedule error:', apptErr);
          });
      }

      // Send staff notification for reschedule (fire-and-forget)
      sendStaffNotification('rescheduled', {
        staffEmail, staffName, patientName: attendee.name,
        serviceName: eventTitle, startTime, durationMinutes,
        serviceDetails, bookingDate
      }).catch(err => console.error('Staff reschedule notification failed:', err));

      // Send provider SMS for reschedule (fire-and-forget)
      sendProviderNotification({
        type: 'rescheduled',
        staff: { name: staffName, email: staffEmail },
        appointment: { patientName: attendee.name, serviceName: eventTitle, startTime },
      }).catch(err => console.error('Provider SMS reschedule failed:', err));

      // Send patient reschedule notification (fire-and-forget)
      // For staff-booked appointments, look up real contact info from patients table
      {
        const { data: rescheduledBooking } = await supabase
          .from('calcom_bookings')
          .select('patient_id')
          .eq('calcom_uid', calcomUid)
          .single();

        const reschedPatientId = rescheduledBooking?.patient_id || null;
        const isReschedStaffBooked = attendee.email?.endsWith('@booking.rangemedical.com');
        let reschedEmail = isReschedStaffBooked ? null : attendee.email;
        let reschedPhone = attendee.phone || null;

        if (isReschedStaffBooked && reschedPatientId) {
          const { data: reschedPatient } = await supabase
            .from('patients')
            .select('email, phone')
            .eq('id', reschedPatientId)
            .single();
          if (reschedPatient) {
            reschedEmail = reschedPatient.email || null;
            reschedPhone = reschedPatient.phone || reschedPhone;
          }
        }

        if (reschedEmail || reschedPhone) {
          sendAppointmentNotification({
            type: 'reschedule',
            patient: {
              id: reschedPatientId,
              name: attendee.name,
              email: reschedEmail,
              phone: reschedPhone,
            },
            appointment: {
              serviceName: eventTitle,
              startTime,
              endTime,
              durationMinutes,
              serviceSlug: eventTypeSlug,
            },
          }).catch(err => console.error('Patient reschedule notification failed:', err));
        }
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
  const isBloodDraw = ['new-patient-blood-draw', 'follow-up-blood-draw'].includes(slug);
  const isLabReview = ['initial-lab-review', 'follow-up-lab-review', 'initial-lab-review-telemedicine', 'follow-up-lab-review-telemedicine', 'follow-up-lab-review-phone'].includes(slug);

  if (!isBloodDraw && !isLabReview) return;

  const LAB_PIPELINE_STAGES = ['draw_scheduled', 'blood_draw_complete', 'results_received', 'provider_reviewed', 'consult_scheduled', 'consult_complete'];

  if (isBloodDraw) {
    // Blood draw appointment booked → create lab protocol at draw_scheduled (if none exists)
    const isFollowUp = slug === 'follow-up-blood-draw';
    const labType = isFollowUp ? 'follow_up' : 'new_patient';

    // Check for existing active lab protocol for this patient
    const { data: existingLab } = await supabase
      .from('protocols')
      .select('id, status')
      .eq('patient_id', patientId)
      .eq('program_type', 'labs')
      .in('status', LAB_PIPELINE_STAGES.filter(s => s !== 'consult_complete'))
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!existingLab) {
      // No active lab protocol — create one at draw_scheduled
      const programName = `${isFollowUp ? 'Follow-up' : 'New Patient'} Labs`;
      const today = todayPacific();

      const { data: newLab, error: insertErr } = await supabase
        .from('protocols')
        .insert({
          patient_id: patientId,
          program_name: programName,
          program_type: 'labs',
          delivery_method: labType,
          status: 'draw_scheduled',
          start_date: today,
          notes: 'Auto-created from Cal.com blood draw appointment'
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Auto-create lab protocol error:', insertErr);
      } else {
        console.log(`✓ Lab protocol auto-created: patient ${patientId}, protocol ${newLab.id} at draw_scheduled`);
      }
    } else {
      console.log(`Lab protocol already exists for patient ${patientId}: ${existingLab.id} at ${existingLab.status}`);
    }
  }

  if (isLabReview) {
    // Lab review appointment booked → advance to consult_scheduled if at provider_reviewed
    const { data: labProto } = await supabase
      .from('protocols')
      .select('id, status')
      .eq('patient_id', patientId)
      .eq('program_type', 'labs')
      .eq('status', 'provider_reviewed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (labProto) {
      await supabase
        .from('protocols')
        .update({ status: 'consult_scheduled', updated_at: new Date().toISOString() })
        .eq('id', labProto.id);

      console.log(`✓ Lab protocol advanced to consult_scheduled: patient ${patientId}, protocol ${labProto.id}`);
    }
  }

  // Legacy: also update labs table if it has matching records
  const legacyStageMap = {
    'new-patient-blood-draw': 'collected',
    'follow-up-blood-draw': 'collected',
    'initial-lab-review': 'reviewed',
    'follow-up-lab-review': 'reviewed',
    'initial-lab-review-telemedicine': 'reviewed',
    'follow-up-lab-review-telemedicine': 'reviewed',
    'follow-up-lab-review-phone': 'reviewed',
  };

  const legacyStatus = legacyStageMap[slug];
  if (legacyStatus) {
    const { data: lab } = await supabase
      .from('labs')
      .select('id, status')
      .eq('patient_id', patientId)
      .in('status', ['ordered', 'collected', 'results_in'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lab) {
      await supabase
        .from('labs')
        .update({ status: legacyStatus, updated_at: new Date().toISOString() })
        .eq('id', lab.id);
      console.log(`Legacy lab updated: patient ${patientId}, lab ${lab.id} -> ${legacyStatus}`);
    }
  }
}

// =====================================================
// BLOOD WORK PREREQUISITE CHECK (T-05)
// =====================================================

async function checkBloodWorkPrereq(patientId, slug, { patientName, serviceName, startTime, calcomBookingId }) {
  // If no patient matched, we can't verify — flag for Tara
  if (!patientId) {
    console.log(`Blood work prereq: no patient_id for ${patientName}, flagging as unmet`);
    await alertTaraPrereqMissing({ patientName, serviceName, startTime, reason: 'Patient not matched in system' });
    return { met: false };
  }

  // Calculate the cutoff date (90 days ago)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - BLOOD_WORK_VALIDITY_DAYS);
  const cutoffISO = cutoff.toISOString().split('T')[0]; // YYYY-MM-DD

  // Check labs table for blood work within validity window
  const { data: recentLab } = await supabase
    .from('labs')
    .select('id, test_date, status')
    .eq('patient_id', patientId)
    .gte('test_date', cutoffISO)
    .in('status', ['results_in', 'reviewed', 'provider_reviewed', 'consult_complete', 'collected'])
    .order('test_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentLab) {
    console.log(`✓ Blood work prereq met for ${patientName}: lab ${recentLab.id} from ${recentLab.test_date}`);
    return { met: true };
  }

  // No valid blood work on file — alert Tara
  console.log(`✗ Blood work prereq NOT met for ${patientName} — no labs within ${BLOOD_WORK_VALIDITY_DAYS} days`);
  await alertTaraPrereqMissing({ patientName, serviceName, startTime, reason: `No blood work on file within ${BLOOD_WORK_VALIDITY_DAYS} days` });
  return { met: false };
}

async function alertTaraPrereqMissing({ patientName, serviceName, startTime, reason }) {
  const taraPhone = process.env.TARA_PHONE;
  if (!taraPhone) {
    console.error('TARA_PHONE env var not set — cannot send prereq alert');
    return;
  }

  const apptDate = startTime
    ? new Date(startTime).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
      })
    : 'Unknown date';

  const message = `⚠️ PREREQ ALERT — Blood work missing\n\nPatient: ${patientName}\nService: ${serviceName}\nAppointment: ${apptDate}\nReason: ${reason}\n\nPlease verify blood work is on file before this appointment. Do NOT cancel — resolve with patient.`;

  try {
    await sendBlooioMessage({ to: taraPhone, message });
    console.log(`Prereq alert sent to Tara for ${patientName}`);
  } catch (err) {
    console.error('Failed to send Tara prereq alert:', err);
  }
}

// =====================================================
// T-02: PRE-VISIT INSTRUCTION SEND
// =====================================================

async function sendPrepInstructions({ eventTypeSlug, patientId, patientName, patientEmail, patientPhone, serviceName, startTime, calcomBookingId }) {
  // Blood draws use gender-specific logic in appointment-notifications.js (already sent with confirmation)
  const BLOOD_DRAW_SLUGS = ['new-patient-blood-draw', 'follow-up-blood-draw'];
  if (BLOOD_DRAW_SLUGS.includes(eventTypeSlug)) {
    // Mark instructions_sent since they're included in the confirmation email
    if (calcomBookingId) {
      await supabase.from('appointments').update({ instructions_sent: true }).eq('cal_com_booking_id', calcomBookingId);
    }
    return;
  }

  const prep = getPrepInstructions(eventTypeSlug);
  if (!prep) {
    console.log(`No prep instructions for slug: ${eventTypeSlug}`);
    return;
  }

  const firstName = (patientName || 'there').split(' ')[0];

  // Check if this is a telemedicine slug and append video link
  const isTelemedicine = eventTypeSlug?.includes('telemedicine');
  let smsBody = `Hi ${firstName}! ${prep.sms}`;
  if (isTelemedicine) {
    smsBody += TELEMEDICINE_LINK_APPEND;
  }
  smsBody += ' — Range Medical';

  const phone = patientPhone ? normalizePhoneUtil(patientPhone) : null;

  // Send SMS prep instructions
  if (phone) {
    try {
      const smsResult = await sendSMSRouter({ to: phone, message: smsBody });
      await logComm({
        channel: 'sms',
        messageType: 'prep_instructions',
        message: smsBody,
        source: 'calcom-webhook',
        patientId,
        patientName,
        recipient: phone,
        status: smsResult.success ? 'sent' : 'error',
        errorMessage: smsResult.error || null,
        direction: 'outbound',
      });
      if (smsResult.success) {
        console.log(`Prep instructions SMS sent for ${patientName} (${eventTypeSlug})`);
      }
    } catch (err) {
      console.error('Prep instructions SMS error:', err);
    }
  }

  // Mark instructions_sent on appointment
  if (calcomBookingId) {
    await supabase.from('appointments').update({ instructions_sent: true }).eq('cal_com_booking_id', calcomBookingId)
      .then(({ error: err }) => { if (err) console.error('instructions_sent update error:', err); });
  }
}

// =====================================================
// T-03: AUTO-SEND INTAKE AND CONSENT FORMS
// =====================================================

async function sendRequiredForms({ eventTypeSlug, serviceCategory, patientId, patientName, patientEmail, patientPhone, calcomBookingId }) {
  const requiredFormIds = REQUIRED_FORMS[serviceCategory];
  if (!requiredFormIds || requiredFormIds.length === 0) {
    console.log(`No required forms for category: ${serviceCategory}`);
    return;
  }

  // Check which forms the patient already has on file
  let completedFormIds = [];
  if (patientId) {
    // Check consents table
    const { data: consents } = await supabase
      .from('consents')
      .select('consent_type')
      .eq('patient_id', patientId);

    if (consents) {
      const consentMap = {
        'hipaa': 'hipaa', 'blood_draw': 'blood-draw', 'blood-draw': 'blood-draw',
        'hrt': 'hrt', 'peptide': 'peptide', 'iv': 'iv', 'iv_injection': 'iv',
        'hbot': 'hbot', 'weight_loss': 'weight-loss', 'weight-loss': 'weight-loss',
        'red_light': 'red-light', 'red-light': 'red-light', 'prp': 'prp',
        'exosome_iv': 'exosome-iv', 'exosome-iv': 'exosome-iv',
        'knee_aspiration': 'knee-aspiration', 'knee-aspiration': 'knee-aspiration',
      };
      completedFormIds = consents.map(c => consentMap[c.consent_type] || c.consent_type).filter(Boolean);
    }

    // Check intakes table for medical intake
    if (requiredFormIds.includes('intake')) {
      const { data: intakes } = await supabase
        .from('intakes')
        .select('id')
        .eq('patient_id', patientId)
        .limit(1);
      if (intakes && intakes.length > 0) {
        completedFormIds.push('intake');
      }
    }
  }

  // Filter to only missing forms
  const completedSet = new Set(completedFormIds);
  const missingFormIds = requiredFormIds.filter(id => !completedSet.has(id));

  if (missingFormIds.length === 0) {
    console.log(`All forms already on file for ${patientName} (${serviceCategory})`);
    // Mark forms_complete since everything is already done
    if (calcomBookingId) {
      await supabase.from('appointments').update({ forms_complete: true }).eq('cal_com_booking_id', calcomBookingId);
    }
    return;
  }

  console.log(`Missing forms for ${patientName}: ${missingFormIds.join(', ')}`);

  const phone = patientPhone ? normalizePhoneUtil(patientPhone) : null;
  if (!phone && !patientEmail) {
    console.log(`No contact info for form send — skipping for ${patientName}`);
    return;
  }

  try {
    // Create form bundle
    const bundle = await createFormBundle({
      formIds: missingFormIds,
      patientId: patientId || null,
      patientName: patientName || null,
      patientEmail: patientEmail || null,
      patientPhone: phone || null,
      metadata: { source: 'auto_booking', calcomBookingId },
    });

    const firstName = (patientName || 'there').split(' ')[0];

    // Send SMS with form link
    if (phone) {
      const formCount = missingFormIds.length;
      const messageBody = formCount === 1
        ? `Hi ${firstName}! Range Medical here. Please complete your ${FORM_DEFINITIONS[missingFormIds[0]]?.name || 'form'} before your visit:\n\n${bundle.url}`
        : `Hi ${firstName}! Range Medical here. Please complete your ${formCount} forms before your visit:\n\n${bundle.url}`;

      // Respect Blooio two-step opt-in
      if (isBlooioProvider()) {
        const optedIn = await hasBlooioOptIn(phone);
        if (!optedIn) {
          // Send opt-in request first, queue the link message
          const optInMsg = formCount === 1
            ? `Hi ${firstName}! Range Medical here. We have your ${FORM_DEFINITIONS[missingFormIds[0]]?.name || 'form'} ready for you. Reply YES to receive it.`
            : `Hi ${firstName}! Range Medical here. We have ${formCount} forms ready for you. Reply YES to receive them.`;

          await sendSMSRouter({ to: phone, message: optInMsg });
          await queuePendingLinkMessage({
            phone,
            message: messageBody,
            messageType: 'form_links',
            patientId: patientId || null,
            patientName: patientName || null,
          });
          console.log(`Form opt-in sent for ${patientName} (bundle: ${bundle.token})`);
        } else {
          await sendSMSRouter({ to: phone, message: messageBody });
          console.log(`Forms SMS sent for ${patientName} (bundle: ${bundle.token})`);
        }
      } else {
        await sendSMSRouter({ to: phone, message: messageBody });
        console.log(`Forms SMS sent for ${patientName} (bundle: ${bundle.token})`);
      }

      await logComm({
        channel: 'sms',
        messageType: 'form_links',
        message: `Auto-sent ${formCount} form(s) for ${serviceCategory} booking`,
        source: 'calcom-webhook-auto',
        patientId: patientId || null,
        patientName,
        recipient: phone,
        status: 'sent',
        direction: 'outbound',
      });
    }

    // forms_complete stays false (default) — will be updated when patient completes forms

  } catch (err) {
    console.error('Form auto-send error:', err);
  }
}

// =====================================================
// STAFF NOTIFICATION EMAILS
// =====================================================

const resend = new Resend(process.env.RESEND_API_KEY);

function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles'
  });
}

function formatServiceDetails(details) {
  if (!details || Object.keys(details).length === 0) return '';
  const labels = {
    injectionTier: 'Tier',
    injectionType: 'Type',
    nadDose: 'NAD+ Dose',
    ivType: 'IV Type',
    notes: 'Notes'
  };
  return Object.entries(details)
    .map(([key, val]) => `<strong>${labels[key] || key}:</strong> ${val}`)
    .join('<br/>');
}

function generateStaffNotificationHtml(eventType, data) {
  const { patientName, serviceName, startTime, durationMinutes, serviceDetails, bookingDate } = data;

  const titles = {
    created: 'New Booking',
    rescheduled: 'Booking Rescheduled',
    cancelled: 'Booking Cancelled'
  };

  const subtitles = {
    created: 'A new appointment has been booked for you.',
    rescheduled: 'An appointment has been rescheduled.',
    cancelled: 'An appointment has been cancelled.'
  };

  const headerColors = {
    created: '#000000',
    rescheduled: '#000000',
    cancelled: '#000000'
  };

  const title = titles[eventType] || 'Booking Update';
  const subtitle = subtitles[eventType] || 'An appointment has been updated.';
  const detailsHtml = formatServiceDetails(serviceDetails);

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f5;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;max-width:600px;">

<!-- Header -->
<tr><td style="background-color:${headerColors[eventType]};padding:30px;text-align:center;">
  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.1em;">RANGE MEDICAL</h1>
  <p style="margin:10px 0 0;color:#a3a3a3;font-size:14px;">${title}</p>
</td></tr>

<!-- Content -->
<tr><td style="padding:40px 30px;">
  <p style="margin:0 0 25px;color:#404040;font-size:15px;line-height:1.7;">${subtitle}</p>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 25px;">
  <tr><td style="border-left:4px solid #000000;padding-left:20px;">
    <h3 style="margin:0 0 15px;color:#000000;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Appointment Details</h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding:4px 0;color:#737373;font-size:14px;width:100px;vertical-align:top;">Patient</td>
        <td style="padding:4px 0;color:#171717;font-size:15px;font-weight:600;">${patientName || 'Unknown'}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#737373;font-size:14px;vertical-align:top;">Service</td>
        <td style="padding:4px 0;color:#171717;font-size:15px;font-weight:600;">${serviceName || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#737373;font-size:14px;vertical-align:top;">Date</td>
        <td style="padding:4px 0;color:#171717;font-size:15px;">${formatDateTime(startTime)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#737373;font-size:14px;vertical-align:top;">Duration</td>
        <td style="padding:4px 0;color:#171717;font-size:15px;">${durationMinutes} minutes</td>
      </tr>
    </table>
  </td></tr>
  </table>

  ${detailsHtml ? `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 25px;">
  <tr><td style="background-color:#fafafa;padding:15px 20px;border-left:3px solid #000000;">
    <p style="margin:0 0 8px;color:#737373;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Service Details</p>
    <p style="margin:0;color:#404040;font-size:14px;line-height:1.7;">${detailsHtml}</p>
  </td></tr>
  </table>` : ''}

  ${eventType === 'cancelled' ? `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr><td style="background-color:#fafafa;padding:15px 20px;border-left:3px solid #dc2626;">
    <p style="margin:0;color:#dc2626;font-size:14px;font-weight:600;">This appointment has been cancelled and removed from your schedule.</p>
  </td></tr>
  </table>` : ''}

</td></tr>

<!-- Footer -->
<tr><td style="background-color:#fafafa;padding:30px;text-align:center;border-top:2px solid #e5e5e5;">
  <p style="margin:0 0 10px;color:#737373;font-size:13px;">Range Medical Staff Notification</p>
  <p style="margin:0;color:#000000;font-size:15px;font-weight:600;">(949) 997-3988</p>
  <p style="margin:15px 0 0;color:#a3a3a3;font-size:12px;">Range Medical &#8226; Newport Beach, CA</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendStaffNotification(eventType, data) {
  const { staffEmail, staffName } = data;
  if (!staffEmail) {
    console.log('No staff email — skipping notification');
    return;
  }

  const subjects = {
    created: `New Booking: ${data.patientName} - ${data.serviceName}`,
    rescheduled: `Rescheduled: ${data.patientName} - ${data.serviceName}`,
    cancelled: `Cancelled: ${data.patientName} - ${data.serviceName}`
  };

  const html = generateStaffNotificationHtml(eventType, data);

  await resend.emails.send({
    from: 'Range Medical <noreply@range-medical.com>',
    replyTo: 'info@range-medical.com',
    to: staffEmail,
    subject: subjects[eventType] || `Booking Update: ${data.patientName}`,
    html
  });

  console.log(`Staff notification sent: ${eventType} -> ${staffEmail}`);
}
