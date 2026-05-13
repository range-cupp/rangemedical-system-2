// /pages/api/cron/lab-prep-reminder.js
// Daily cron — sends lab prep instructions for upcoming blood draw appointments
// Two send windows: 3 days before and the day before
// Sends actual prep link directly (no "reply READY" flow)
// Runs at 9:15 AM Pacific (15 16 * * * UTC)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { isInQuietHours } from '../../../lib/quiet-hours';
import { pacificDayUTCBounds } from '../../../lib/date-utils';
import { createLabPrepToken, buildLabPrepUrl } from '../../../lib/lab-prep-token';
import { hasBlooioOptIn, isBlooioProvider, queuePendingLinkMessage } from '../../../lib/blooio-optin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getPacificDateOffset(daysAhead) {
  const now = new Date();
  const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  pacific.setDate(pacific.getDate() + daysAhead);
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

function formatAppointmentDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getFirstName(patient) {
  if (patient.first_name) return patient.first_name;
  if (patient.name) return patient.name.split(' ')[0];
  return 'there';
}

async function fetchLabAppointments(dateStr) {
  const { startUTC, endUTC } = pacificDayUTCBounds(dateStr);
  const { data, error } = await supabase
    .from('appointments')
    .select('id, patient_id, patient_name, patient_phone, service_name, service_category, start_time, status')
    .eq('service_category', 'labs')
    .gte('start_time', startUTC.toISOString())
    .lt('start_time', endUTC.toISOString())
    .in('status', ['scheduled', 'confirmed']);
  if (error) throw error;
  return data || [];
}

async function sendLabPrepSMS({ booking, patient, messageType, results }) {
  const phone = patient?.phone || booking.patient_phone;
  const displayName = booking.patient_name || patient?.name || 'Patient';
  const firstName = patient ? getFirstName(patient) : displayName.split(' ')[0];

  if (!phone) {
    results.skipped.push({ name: displayName, type: messageType, reason: 'No phone number' });
    return;
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    results.skipped.push({ name: displayName, type: messageType, reason: 'Invalid phone number' });
    return;
  }

  // Dedup — check if we already sent this specific reminder type for this patient recently
  const dedupDays = messageType === 'lab_prep_3day' ? 5 : 3;
  const { data: existing } = await supabase
    .from('comms_log')
    .select('id')
    .eq('message_type', messageType)
    .eq('recipient', normalizedPhone)
    .eq('direction', 'outbound')
    .gte('created_at', new Date(Date.now() - dedupDays * 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (existing && existing.length > 0) {
    results.skipped.push({ name: displayName, type: messageType, reason: 'Already sent' });
    return;
  }

  // Create lab prep token and URL
  const appointmentDate = booking.start_time ? booking.start_time.split('T')[0] : null;
  const token = await createLabPrepToken({
    patientId: booking.patient_id || null,
    patientName: displayName,
    patientPhone: normalizedPhone,
    appointmentDate,
  });
  const labPrepUrl = buildLabPrepUrl(token);

  const appointmentTime = formatAppointmentTime(booking.start_time);
  const appointmentDate_display = formatAppointmentDate(booking.start_time);

  let message;
  if (messageType === 'lab_prep_day_before') {
    message = `Hi ${firstName}! Reminder — your blood work at Range Medical is tomorrow at ${appointmentTime}. Please review your fasting & lab prep instructions:\n\n${labPrepUrl}\n\n— Range Medical`;
  } else {
    message = `Hi ${firstName}! Your blood work at Range Medical is coming up on ${appointmentDate_display} at ${appointmentTime}. Please review your fasting & lab prep instructions ahead of time:\n\n${labPrepUrl}\n\n— Range Medical`;
  }

  try {
    // Blooio two-step opt-in: if patient hasn't replied via Blooio before,
    // send a plain text prompt and queue the link message for auto-delivery
    if (isBlooioProvider() && !(await hasBlooioOptIn(normalizedPhone))) {
      const optinPrompt = `Hi ${firstName}! Range Medical here — we have lab prep instructions for your upcoming blood draw. Reply YES and we'll send the link right over!`;

      const promptResult = await sendSMS({
        to: normalizedPhone,
        message: optinPrompt,
        patientEmail: patient?.email || null,
        patientName: displayName,
        log: {
          messageType: `${messageType}_optin_prompt`,
          source: 'cron/lab-prep-reminder(blooio-optin)',
          patientId: booking.patient_id || null,
        },
      });

      if (promptResult.success) {
        await queuePendingLinkMessage({
          phone: normalizedPhone,
          message,
          messageType: 'lab_prep_links',
          patientId: booking.patient_id || null,
          patientName: displayName,
        });
        results.sent.push({ name: displayName, phone: normalizedPhone, type: messageType, optinRequired: true });
        console.log(`[lab-prep-reminder] Sent opt-in prompt + queued link for patient ${booking.patient_id?.slice(0, 8) || 'unknown'}`);
      } else {
        results.errors.push({ name: displayName, type: messageType, error: promptResult.error });
        console.error(`[lab-prep-reminder] Opt-in prompt failed for ${displayName}:`, promptResult.error);
      }
      return;
    }

    const smsResult = await sendSMS({
      to: normalizedPhone,
      message,
      patientEmail: patient?.email || null,
      patientName: displayName,
      log: {
        messageType,
        source: 'cron/lab-prep-reminder',
        patientId: booking.patient_id || null,
      },
    });

    if (smsResult.success) {
      results.sent.push({ name: displayName, phone: normalizedPhone, type: messageType });
      console.log(`[lab-prep-reminder] Sent ${messageType} to patient ${booking.patient_id?.slice(0, 8) || 'unknown'}`);
    } else {
      results.errors.push({ name: displayName, type: messageType, error: smsResult.error });
      console.error(`[lab-prep-reminder] Failed ${messageType} for ${displayName}:`, smsResult.error);
    }

  } catch (smsError) {
    results.errors.push({ name: displayName, type: messageType, error: smsError.message });
    console.error(`[lab-prep-reminder] SMS error for ${displayName}:`, smsError);
  }
}

export default async function handler(req, res) {
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

  const force = req.query?.force === 'true';
  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'Outside Pacific send window (8 AM – 8 PM)' });
  }

  const results = { sent: [], skipped: [], errors: [] };

  try {
    const tomorrowStr = getPacificDateOffset(1);
    const threeDaysStr = getPacificDateOffset(3);

    console.log(`[lab-prep-reminder] Checking blood draws for tomorrow (${tomorrowStr}) and 3-day (${threeDaysStr})`);

    // Fetch appointments for both windows in parallel
    const [tomorrowBookings, threeDayBookings] = await Promise.all([
      fetchLabAppointments(tomorrowStr),
      fetchLabAppointments(threeDaysStr),
    ]);

    const allBookings = [
      ...tomorrowBookings.map(b => ({ ...b, _messageType: 'lab_prep_day_before' })),
      ...threeDayBookings.map(b => ({ ...b, _messageType: 'lab_prep_3day' })),
    ];

    if (allBookings.length === 0) {
      console.log('[lab-prep-reminder] No blood draw appointments in either window');
      return res.status(200).json({ success: true, message: 'No blood draw appointments', ...results });
    }

    console.log(`[lab-prep-reminder] Found ${tomorrowBookings.length} tomorrow + ${threeDayBookings.length} 3-day appointments`);

    // Collect unique patient IDs and fetch patient data
    const patientIds = [...new Set(allBookings.map(b => b.patient_id).filter(Boolean))];
    let patientMap = {};

    if (patientIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone, email')
        .in('id', patientIds);

      if (patients) {
        patients.forEach(p => { patientMap[p.id] = p; });
      }
    }

    // Send lab prep instructions for each booking
    for (const booking of allBookings) {
      const patient = booking.patient_id ? patientMap[booking.patient_id] : null;
      await sendLabPrepSMS({
        booking,
        patient,
        messageType: booking._messageType,
        results,
      });
    }

    console.log(`[lab-prep-reminder] Done — sent: ${results.sent.length}, skipped: ${results.skipped.length}, errors: ${results.errors.length}`);

    return res.status(200).json({
      success: true,
      tomorrow: tomorrowStr,
      threeDay: threeDaysStr,
      ...results,
    });

  } catch (error) {
    console.error('[lab-prep-reminder] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
