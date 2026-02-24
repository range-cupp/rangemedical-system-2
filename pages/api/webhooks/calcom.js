// /pages/api/webhooks/calcom.js
// Range Medical - Cal.com Webhook Handler
// Receives booking events from Cal.com and syncs to calcom_bookings table
// Executes appointment actions (decrement, track_visit, log, lab_journey)
// CREATED: 2026-02-22
// UPDATED: 2026-02-24 - Added CALCOM_APPOINTMENT_ACTIONS mapping

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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

      // Send staff notification (fire-and-forget)
      sendStaffNotification('created', {
        staffEmail, staffName, patientName: attendee.name,
        serviceName: eventTitle, startTime, durationMinutes,
        serviceDetails, bookingDate
      }).catch(err => console.error('Staff notification failed:', err));

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

      // Send staff notification for cancellation (fire-and-forget)
      sendStaffNotification('cancelled', {
        staffEmail, staffName, patientName: attendee.name,
        serviceName: eventTitle, startTime, durationMinutes,
        serviceDetails, bookingDate
      }).catch(err => console.error('Staff cancel notification failed:', err));

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

      // Send staff notification for reschedule (fire-and-forget)
      sendStaffNotification('rescheduled', {
        staffEmail, staffName, patientName: attendee.name,
        serviceName: eventTitle, startTime, durationMinutes,
        serviceDetails, bookingDate
      }).catch(err => console.error('Staff reschedule notification failed:', err));

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
