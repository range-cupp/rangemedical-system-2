// /pages/api/cron/lab-prep-reminder.js
// Daily cron — sends day-before lab prep reminder SMS for blood draw appointments
// Patients reply READY to receive their lab prep instructions link
// Runs at 9 AM Pacific (0 16 * * * UTC)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';
import { isInQuietHours } from '../../../lib/quiet-hours';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Blood draw event slugs (must match calcom webhook mapping)
const BLOOD_DRAW_SLUGS = ['new-patient-blood-draw', 'follow-up-blood-draw'];

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

// Format time from ISO timestamp to readable Pacific time (e.g., "9:30 AM")
function formatAppointmentTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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
    console.log(`[lab-prep-reminder] Checking blood draw appointments for ${tomorrowStr}`);

    // Find tomorrow's blood draw bookings that are still scheduled
    const { data: bookings, error: bookingsError } = await supabase
      .from('calcom_bookings')
      .select(`
        id,
        patient_id,
        patient_name,
        patient_phone,
        service_slug,
        start_time,
        booking_date,
        status
      `)
      .in('service_slug', BLOOD_DRAW_SLUGS)
      .eq('booking_date', tomorrowStr)
      .eq('status', 'scheduled');

    if (bookingsError) {
      console.error('[lab-prep-reminder] Bookings query error:', bookingsError);
      return res.status(500).json({ error: bookingsError.message });
    }

    if (!bookings || bookings.length === 0) {
      console.log('[lab-prep-reminder] No blood draw appointments tomorrow');
      return res.status(200).json({ success: true, message: 'No blood draw appointments tomorrow', ...results });
    }

    console.log(`[lab-prep-reminder] Found ${bookings.length} blood draw appointments for tomorrow`);

    // Get patient details for those with patient_id
    const patientIds = bookings.map(b => b.patient_id).filter(Boolean);
    let patientMap = {};

    if (patientIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name, first_name, last_name, phone')
        .in('id', patientIds);

      if (patients) {
        patients.forEach(p => { patientMap[p.id] = p; });
      }
    }

    // Process each booking
    for (const booking of bookings) {
      const patient = booking.patient_id ? patientMap[booking.patient_id] : null;
      const phone = patient?.phone || booking.patient_phone;
      const displayName = booking.patient_name || patient?.name || 'Patient';
      const firstName = patient ? getFirstName(patient) : displayName.split(' ')[0];

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

      // Dedup — check if we already sent a lab_prep_reminder for this patient + booking date
      const { data: existing } = await supabase
        .from('comms_log')
        .select('id')
        .eq('message_type', 'lab_prep_reminder')
        .eq('recipient', normalizedPhone)
        .eq('direction', 'outbound')
        .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        results.skipped.push({ name: displayName, reason: 'Already sent reminder' });
        continue;
      }

      // Build reminder SMS
      const appointmentTime = formatAppointmentTime(booking.start_time);
      const message = `Hi ${firstName}! Quick reminder \u2014 your blood work at Range Medical is tomorrow at ${appointmentTime}. Please review your fasting & lab prep instructions before your visit. Reply READY to get your prep guide. \u2014 Range Medical`;

      // Send SMS
      try {
        const smsResult = await sendSMS({ to: normalizedPhone, message });

        if (smsResult.success) {
          results.sent.push({ name: displayName, phone: normalizedPhone });
          console.log(`[lab-prep-reminder] Sent to ${displayName} (${normalizedPhone})`);
        } else {
          results.errors.push({ name: displayName, error: smsResult.error });
          console.error(`[lab-prep-reminder] Failed for ${displayName}:`, smsResult.error);
        }

        // Log to comms_log
        await logComm({
          channel: 'sms',
          messageType: 'lab_prep_reminder',
          message,
          source: 'cron/lab-prep-reminder',
          patientId: booking.patient_id || null,
          patientName: displayName,
          recipient: normalizedPhone,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
          direction: 'outbound',
        }).catch(err => console.error('[lab-prep-reminder] Log error:', err));

      } catch (smsError) {
        results.errors.push({ name: displayName, error: smsError.message });
        console.error(`[lab-prep-reminder] SMS error for ${displayName}:`, smsError);
      }
    }

    console.log(`[lab-prep-reminder] Done — sent: ${results.sent.length}, skipped: ${results.skipped.length}, errors: ${results.errors.length}`);

    return res.status(200).json({
      success: true,
      tomorrow: tomorrowStr,
      ...results,
    });

  } catch (error) {
    console.error('[lab-prep-reminder] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
