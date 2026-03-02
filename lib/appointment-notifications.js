// /lib/appointment-notifications.js
// Appointment notification sender — handles email + SMS with quiet hours
// Sends confirmation, cancellation, and reschedule notifications to patients
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { isInQuietHours, getNextSendTime } from './quiet-hours';
import {
  generateBookingConfirmationHtml,
  generateBookingCancellationHtml,
  generateBookingRescheduleHtml,
} from './appointment-emails';
import { logComm } from './comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// =====================================================
// PHONE NORMALIZATION (matches /pages/api/twilio/send-sms.js)
// =====================================================

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (phone.startsWith('+') && digits.length >= 10) return '+' + digits;
  return null;
}

// =====================================================
// DATE/TIME FORMATTING (Pacific timezone)
// =====================================================

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
}

function formatTime(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  });
}

function formatShortDate(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
}

// =====================================================
// SMS TEMPLATES
// =====================================================

const SMS_TEMPLATES = {
  confirmation: ({ firstName, serviceName, date, time }) =>
    `Hi ${firstName}! Your ${serviceName} appointment is confirmed for ${date} at ${time}. See you at Range Medical!`,
  cancellation: ({ firstName, serviceName, date }) =>
    `Hi ${firstName}, your ${serviceName} appointment on ${date} has been cancelled. Call (949) 997-3988 to reschedule.`,
  reschedule: ({ firstName, serviceName, date, time }) =>
    `Hi ${firstName}, your ${serviceName} appointment has been rescheduled to ${date} at ${time}. See you at Range Medical!`,
};

// =====================================================
// EMAIL SUBJECTS
// =====================================================

const EMAIL_SUBJECTS = {
  confirmation: (serviceName) => `Appointment Confirmed: ${serviceName} — Range Medical`,
  cancellation: (serviceName) => `Appointment Cancelled: ${serviceName} — Range Medical`,
  reschedule: (serviceName) => `Appointment Rescheduled: ${serviceName} — Range Medical`,
};

// =====================================================
// SEND SMS VIA TWILIO
// =====================================================

async function sendSMS(to, message) {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  const messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim();

  if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
    console.log('Twilio not configured — skipping SMS');
    return { success: false, error: 'Twilio not configured' };
  }

  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams();
    params.append('To', normalizedTo);

    // Use Messaging Service SID for A2P compliance (carriers block direct number sends)
    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid);
    } else {
      params.append('From', fromNumber);
    }
    params.append('Body', message);

    // Add delivery status callback so we know if message actually reaches the phone
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com').replace(/\/$/, '');
    params.append('StatusCallback', `${baseUrl}/api/twilio/status-callback`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || 'SMS send failed' };
    }
    return { success: true, sid: data.sid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// =====================================================
// RESOLVE PATIENT PHONE (fallback to patients table)
// =====================================================

async function resolvePhone(patient) {
  if (patient.phone) return patient.phone;
  if (!patient.id) return null;

  const { data } = await supabase
    .from('patients')
    .select('phone')
    .eq('id', patient.id)
    .single();

  return data?.phone || null;
}

// =====================================================
// QUEUE NOTIFICATION (for quiet hours)
// =====================================================

async function queueNotification({ patientId, patientName, channel, messageType, recipient, subject, message, metadata }) {
  const { error } = await supabase.from('notification_queue').insert({
    patient_id: patientId,
    patient_name: patientName,
    channel,
    message_type: messageType,
    recipient,
    subject,
    message,
    scheduled_for: getNextSendTime(),
    status: 'pending',
    metadata: metadata || {},
  });

  if (error) {
    console.error('Queue insert error:', error);
  } else {
    console.log(`Notification queued (${channel}): ${messageType} for ${patientName} → ${recipient}`);
  }
}

// =====================================================
// MAIN EXPORT: sendAppointmentNotification
// =====================================================

/**
 * Send appointment notification (email + SMS) to patient
 * Respects quiet hours (7am-7pm Pacific) — queues if outside window
 *
 * @param {Object} params
 * @param {'confirmation'|'cancellation'|'reschedule'} params.type
 * @param {Object} params.patient - { id, name, email, phone }
 * @param {Object} params.appointment - { serviceName, startTime, endTime, durationMinutes, location, notes }
 */
export async function sendAppointmentNotification({ type, patient, appointment }) {
  const firstName = (patient.name || 'there').split(' ')[0];
  const serviceName = appointment.serviceName || 'Appointment';
  const date = formatDate(appointment.startTime);
  const shortDate = formatShortDate(appointment.startTime);
  const time = formatTime(appointment.startTime);
  const duration = appointment.durationMinutes || 0;
  const location = appointment.location || 'Range Medical — Newport Beach';
  const messageType = `appointment_${type}`;

  // Build SMS message
  const smsText = SMS_TEMPLATES[type]({
    firstName,
    serviceName,
    date: shortDate,
    time,
  });

  // Build email HTML
  const emailGenerators = {
    confirmation: generateBookingConfirmationHtml,
    cancellation: generateBookingCancellationHtml,
    reschedule: generateBookingRescheduleHtml,
  };
  const emailHtml = emailGenerators[type]({
    patientName: patient.name,
    serviceName,
    date,
    time,
    duration,
    location,
    notes: appointment.notes,
  });

  const emailSubject = EMAIL_SUBJECTS[type](serviceName);
  const quiet = isInQuietHours();

  console.log(`Appointment notification: ${type} for ${patient.name} | quiet=${quiet}`);

  // Resolve phone early so we can send email + SMS in parallel
  const phone = await resolvePhone(patient);

  // Build promises array — send email + SMS in parallel for speed
  const promises = [];

  // --- EMAIL ---
  if (patient.email && !patient.email.endsWith('@booking.rangemedical.com')) {
    const emailPromise = (async () => {
      if (quiet) {
        await queueNotification({
          patientId: patient.id,
          patientName: patient.name,
          channel: 'email',
          messageType,
          recipient: patient.email,
          subject: emailSubject,
          message: emailHtml,
          metadata: { serviceName, startTime: appointment.startTime, type },
        });
      } else {
        try {
          await resend.emails.send({
            from: 'Range Medical <noreply@range-medical.com>',
            replyTo: 'info@range-medical.com',
            to: patient.email,
            subject: emailSubject,
            html: emailHtml,
          });

          await logComm({
            channel: 'email',
            messageType,
            message: emailHtml,
            source: 'appointment-notifications',
            patientId: patient.id,
            patientName: patient.name,
            recipient: patient.email,
            subject: emailSubject,
            status: 'sent',
          });

          console.log(`Email sent: ${messageType} → ${patient.email}`);
        } catch (err) {
          console.error('Email send error:', err);
          await logComm({
            channel: 'email',
            messageType,
            message: emailHtml,
            source: 'appointment-notifications',
            patientId: patient.id,
            patientName: patient.name,
            recipient: patient.email,
            subject: emailSubject,
            status: 'error',
            errorMessage: err.message,
          });
        }
      }
    })();
    promises.push(emailPromise);
  }

  // --- SMS ---
  if (phone) {
    const smsPromise = (async () => {
      if (quiet) {
        await queueNotification({
          patientId: patient.id,
          patientName: patient.name,
          channel: 'sms',
          messageType,
          recipient: phone,
          subject: null,
          message: smsText,
          metadata: { serviceName, startTime: appointment.startTime, type },
        });
      } else {
        const smsResult = await sendSMS(phone, smsText);

        await logComm({
          channel: 'sms',
          messageType,
          message: smsText,
          source: 'appointment-notifications',
          patientId: patient.id,
          patientName: patient.name,
          recipient: phone,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.sid || null,
        });

        if (smsResult.success) {
          console.log(`SMS sent: ${messageType} → ${phone}`);
        } else {
          console.error(`SMS failed: ${smsResult.error}`);
        }
      }
    })();
    promises.push(smsPromise);
  }

  // Wait for both email + SMS to complete
  await Promise.allSettled(promises);
}
