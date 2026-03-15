// /lib/appointment-notifications.js
// Appointment notification sender — handles email + SMS with quiet hours
// Sends confirmation, cancellation, and reschedule notifications to patients
// SMS sent via Blooio (lib/send-sms.js unified router)
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
import { sendSMS as sendSMSRouter, normalizePhone as normalizePhoneUtil } from './send-sms';

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
// SEND SMS — via unified router (Blooio primary)
// =====================================================

async function sendSMS(to, message, patientId = null) {
  const normalizedTo = normalizePhoneUtil(to);
  if (!normalizedTo) {
    return { success: false, error: 'Invalid phone number' };
  }

  const result = await sendSMSRouter({ to: normalizedTo, message });
  return {
    success: result.success,
    via: result.provider || 'unknown',
    sid: result.messageSid || null,
    error: result.error || null,
  };
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
  // Dedup: skip if an identical notification was already queued or sent in the last 10 minutes.
  // This prevents duplicates from webhook double-fires or multiple code paths (e.g. staff bot
  // calling sendAppointmentNotification directly AND the Cal.com webhook doing the same).
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('notification_queue')
    .select('id, status')
    .eq('patient_id', patientId)
    .eq('message_type', messageType)
    .eq('channel', channel)
    .eq('recipient', recipient)
    .in('status', ['pending', 'sent'])
    .gte('created_at', tenMinutesAgo)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`Dedup: skipping duplicate ${channel} ${messageType} for ${patientName} (already queued/sent within 10 min)`);
    return;
  }

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
 * Respects quiet hours (8am-8pm Pacific) — queues if outside window
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

  // Dedup check for live sends: if this notification was already sent in the last 10 minutes,
  // skip entirely. Prevents duplicates from webhook double-fires or multiple code paths.
  if (!quiet && patient.id) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentlySent } = await supabase
      .from('comms_log')
      .select('id')
      .eq('patient_id', patient.id)
      .eq('message_type', messageType)
      .eq('status', 'sent')
      .gte('created_at', tenMinutesAgo)
      .limit(1);
    if (recentlySent && recentlySent.length > 0) {
      console.log(`Dedup: skipping duplicate ${messageType} for ${patient.name} (sent within 10 min)`);
      return;
    }
  }

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
        const smsResult = await sendSMS(phone, smsText, patient.id);

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
