// /pages/api/cron/appointment-reminder.js
// Daily cron — sends 24-hour appointment reminder SMS for all appointment types
// Blood draws are excluded (handled by lab-prep-reminder with specific prep instructions)
// Runs at 9:00 AM PST (17:00 UTC) — "0 17 * * *"
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { isInQuietHours } from '../../../lib/quiet-hours';
import { sendBlooioMessage } from '../../../lib/blooio';
import { REQUIRED_FORMS } from '../../../lib/appointment-services';
import { FORM_DEFINITIONS } from '../../../lib/form-bundles';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Blood draw slugs — already handled by lab-prep-reminder cron
const BLOOD_DRAW_SLUGS = ['new-patient-blood-draw', 'follow-up-blood-draw'];

// 8 message variations so texts feel personal (no service type for patient privacy)
const REMINDER_MESSAGES = [
  (name, time) => `Hi ${name}! Just a friendly reminder — your appointment with Range Medical is tomorrow at ${time}. See you then!`,
  (name, time) => `Hey ${name}, quick reminder that your appointment is tomorrow at ${time} at Range Medical. We look forward to seeing you!`,
  (name, time) => `Hi ${name}! Reminder: your appointment with Range Medical is tomorrow at ${time}. See you there!`,
  (name, time) => `Hey ${name}, don't forget — your appointment at Range Medical is tomorrow at ${time}. Let us know if you need to reschedule: (949) 997-3988`,
  (name, time) => `Hi ${name}! This is a reminder that your appointment is scheduled for tomorrow at ${time} at Range Medical. See you there!`,
  (name, time) => `Hey ${name}, just a heads up — your appointment with Range Medical is tomorrow at ${time}. We'll see you there!`,
  (name, time) => `Hi ${name}! Your appointment at Range Medical is coming up tomorrow at ${time}. Can't wait to see you!`,
  (name, time) => `Hey ${name}, reminder: appointment tomorrow at ${time} at Range Medical. Need to reschedule? Call or text (949) 997-3988.`,
];

function getReminderMessage(firstName, time) {
  const index = Math.floor(Math.random() * REMINDER_MESSAGES.length);
  return REMINDER_MESSAGES[index](firstName, time);
}

// Get tomorrow's date in Pacific Time (YYYY-MM-DD)
function getTomorrowDateStr() {
  const now = new Date();
  const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  pacific.setDate(pacific.getDate() + 1);
  const y = pacific.getFullYear();
  const m = String(pacific.getMonth() + 1).padStart(2, '0');
  const d = String(pacific.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatAppointmentTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Clean up service slug into a readable name
function formatServiceName(slug) {
  if (!slug) return 'appointment';
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getFirstName(patient) {
  if (patient.first_name) return patient.first_name;
  if (patient.name) return patient.name.split(' ')[0];
  return 'there';
}

export default async function handler(req, res) {
  // Verify cron authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isVercelCron = !!req.headers['x-vercel-cron-signature'];
  const isAuthorized = isVercelCron || (
    process.env.CRON_SECRET && (
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`
    )
  );

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check quiet hours (skip if outside 8am-8pm Pacific, unless forced)
  const force = req.query?.force === 'true';
  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'Outside Pacific send window (8 AM – 8 PM)' });
  }

  const results = { sent: [], skipped: [], errors: [] };

  try {
    const tomorrowStr = getTomorrowDateStr();
    console.log(`[appointment-reminder] Checking appointments for ${tomorrowStr}`);

    // Find tomorrow's bookings that are still scheduled (exclude blood draws)
    const { data: bookings, error: bookingsError } = await supabase
      .from('calcom_bookings')
      .select(`
        id,
        patient_id,
        patient_name,
        patient_phone,
        service_slug,
        service_name,
        start_time,
        booking_date,
        status
      `)
      .eq('booking_date', tomorrowStr)
      .eq('status', 'scheduled');

    if (bookingsError) {
      console.error('[appointment-reminder] Bookings query error:', bookingsError);
      return res.status(500).json({ error: bookingsError.message });
    }

    // Filter out blood draws (handled by lab-prep-reminder)
    const filteredBookings = (bookings || []).filter(
      b => !BLOOD_DRAW_SLUGS.includes(b.service_slug)
    );

    if (filteredBookings.length === 0) {
      console.log('[appointment-reminder] No non-lab appointments tomorrow');
      return res.status(200).json({
        success: true,
        message: `No appointments to remind for ${tomorrowStr}`,
        summary: { sent: 0, skipped: 0, errors: 0 },
      });
    }

    console.log(`[appointment-reminder] Found ${filteredBookings.length} appointment(s) for tomorrow`);

    // Get patient details for those with patient_id
    const patientIds = filteredBookings.map(b => b.patient_id).filter(Boolean);
    let patientMap = {};

    if (patientIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone')
        .in('id', [...new Set(patientIds)]);

      if (patients) {
        patients.forEach(p => { patientMap[p.id] = p; });
      }
    }

    // Deduplicate by patient + date (one reminder per patient even if multiple appointments)
    const seenPatients = new Set();

    for (const booking of filteredBookings) {
      const patient = booking.patient_id ? patientMap[booking.patient_id] : null;
      const phone = patient?.phone || booking.patient_phone;
      const displayName = booking.patient_name || patient?.name || 'Patient';
      const firstName = patient ? getFirstName(patient) : displayName.split(' ')[0];
      const patientKey = booking.patient_id || phone;

      // Skip if already processing this patient
      if (patientKey && seenPatients.has(patientKey)) {
        results.skipped.push({ name: displayName, reason: 'Multiple appointments — already reminded' });
        continue;
      }
      if (patientKey) seenPatients.add(patientKey);

      // Must have a phone number
      if (!phone) {
        results.skipped.push({ name: displayName, reason: 'No phone number' });
        continue;
      }

      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        results.skipped.push({ name: displayName, reason: 'Invalid phone number' });
        continue;
      }

      // Dedup — check if we already sent an appointment_reminder for this patient recently
      const { data: existing } = await supabase
        .from('comms_log')
        .select('id')
        .eq('message_type', 'appointment_reminder')
        .eq('recipient', normalizedPhone)
        .eq('direction', 'outbound')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        results.skipped.push({ name: displayName, reason: 'Already sent reminder in last 24h' });
        continue;
      }

      // Build reminder SMS (generic — no service type for patient privacy)
      const appointmentTime = formatAppointmentTime(booking.start_time);
      const serviceName = booking.service_name || formatServiceName(booking.service_slug);
      const message = getReminderMessage(firstName, appointmentTime);

      // Send SMS
      try {
        const smsResult = await sendSMS({ to: normalizedPhone, message });

        if (smsResult.success) {
          results.sent.push({ name: displayName, service: serviceName, time: appointmentTime });
          console.log(`[appointment-reminder] Sent to ${displayName} (${normalizedPhone})`);
        } else {
          results.errors.push({ name: displayName, error: smsResult.error });
          console.error(`[appointment-reminder] Failed for ${displayName}:`, smsResult.error);
        }

        // Log to comms_log
        await logComm({
          channel: 'sms',
          messageType: 'appointment_reminder',
          message,
          source: 'cron/appointment-reminder',
          patientId: booking.patient_id || null,
          patientName: displayName,
          recipient: normalizedPhone,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
          direction: 'outbound',
        }).catch(err => console.error('[appointment-reminder] Log error:', err));

      } catch (smsError) {
        results.errors.push({ name: displayName, error: smsError.message });
        console.error(`[appointment-reminder] SMS error for ${displayName}:`, smsError);
      }
    }

    console.log(`[appointment-reminder] Done — sent: ${results.sent.length}, skipped: ${results.skipped.length}, errors: ${results.errors.length}`);

    // ── T-03: Alert Tara about incomplete forms for tomorrow's appointments ──
    const incompleteFormsAlerts = [];
    try {
      const { data: tomorrowAppts } = await supabase
        .from('appointments')
        .select('id, patient_name, service_name, service_category, start_time, forms_complete')
        .eq('status', 'scheduled')
        .eq('forms_complete', false)
        .gte('start_time', `${tomorrowStr}T00:00:00`)
        .lt('start_time', `${tomorrowStr}T23:59:59`);

      if (tomorrowAppts && tomorrowAppts.length > 0) {
        const taraPhone = process.env.TARA_PHONE;
        if (taraPhone) {
          const lines = tomorrowAppts.map(a => {
            const time = formatAppointmentTime(a.start_time);
            const requiredForms = REQUIRED_FORMS[a.service_category];
            const formNames = requiredForms
              ? requiredForms.map(id => FORM_DEFINITIONS[id]?.name || id).join(', ')
              : 'intake forms';
            return `• ${a.patient_name} — ${a.service_name} at ${time} (missing: ${formNames})`;
          }).join('\n');

          const alertMsg = `⚠️ FORMS INCOMPLETE — ${tomorrowAppts.length} patient(s) with outstanding forms for tomorrow:\n\n${lines}\n\nPlease follow up before their appointments.`;

          await sendBlooioMessage({ to: taraPhone, message: alertMsg });
          console.log(`[appointment-reminder] Tara alerted about ${tomorrowAppts.length} incomplete form(s)`);
          tomorrowAppts.forEach(a => incompleteFormsAlerts.push(a.patient_name));
        } else {
          console.warn('[appointment-reminder] TARA_PHONE not set — skipping incomplete forms alert');
        }
      }
    } catch (formsErr) {
      console.error('[appointment-reminder] Incomplete forms check error:', formsErr);
    }

    return res.status(200).json({
      success: true,
      tomorrow: tomorrowStr,
      summary: {
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
        incompleteFormsAlerts: incompleteFormsAlerts.length,
      },
      details: { ...results, incompleteFormsAlerts },
    });

  } catch (error) {
    console.error('[appointment-reminder] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
