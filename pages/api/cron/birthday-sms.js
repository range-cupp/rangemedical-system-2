// /pages/api/cron/birthday-sms.js
// Daily cron — sends happy birthday SMS to patients on their birthday
// Runs at 9:00 AM PST (17:00 UTC) — "0 17 * * *"
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 8 message variations so texts feel personal, not robotic
const BIRTHDAY_MESSAGES = [
  (name) => `Happy Birthday, ${name}! 🎂 From all of us at Range Medical — we hope you have an amazing day. Cheers to another year of feeling your best!`,
  (name) => `It's your day, ${name}! 🎉 Happy Birthday from the Range Medical team. Here's to your health and happiness — enjoy every moment today!`,
  (name) => `Happy Birthday, ${name}! 🥳 The whole Range Medical crew is sending you good vibes today. Hope it's a great one!`,
  (name) => `Hey ${name}, Happy Birthday! 🎂 Wishing you an incredible day from everyone at Range Medical. You deserve it!`,
  (name) => `Happy Birthday, ${name}! 🎉 From your friends at Range Medical — may this year be your healthiest and happiest yet!`,
  (name) => `${name}, it's your birthday! 🥳 The Range Medical team is thinking of you today. Hope you're celebrating big!`,
  (name) => `Wishing you the happiest of birthdays, ${name}! 🎂 From all of us at Range Medical — enjoy your special day!`,
  (name) => `Happy Birthday, ${name}! 🎉 Here's to another amazing year. The whole Range Medical team is cheering for you today!`,
];

function getBirthdayMessage(firstName) {
  const index = Math.floor(Math.random() * BIRTHDAY_MESSAGES.length);
  return BIRTHDAY_MESSAGES[index](firstName);
}

function getTodayMMDD() {
  // Get today's month and day in Pacific Time
  const now = new Date();
  const parts = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/');
  return { month: parts[0], day: parts[1], dateStr: `${parts[2]}-${parts[0]}-${parts[1]}` };
}

function getTodayStartUTC() {
  const now = new Date();
  const parts = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/');
  return new Date(`${parts[2]}-${parts[0]}-${parts[1]}T00:00:00-08:00`).toISOString();
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

  const results = { sent: [], skipped: [], errors: [] };

  try {
    const { month, day, dateStr } = getTodayMMDD();
    const todayStartUTC = getTodayStartUTC();

    console.log(`Birthday SMS cron running. Looking for birthdays on ${month}/${day}`);

    // Query patients whose date_of_birth matches today's month and day
    // date_of_birth is stored as a date string (YYYY-MM-DD)
    const { data: patients, error: queryError } = await supabase
      .from('patients')
      .select('id, first_name, name, phone, date_of_birth')
      .not('phone', 'is', null)
      .not('date_of_birth', 'is', null);

    if (queryError) {
      throw new Error(`Patients query error: ${queryError.message}`);
    }

    // Filter to patients whose birthday month/day matches today
    const birthdayPatients = (patients || []).filter((p) => {
      if (!p.date_of_birth) return false;
      const dob = p.date_of_birth; // format: YYYY-MM-DD
      const dobMonth = dob.substring(5, 7);
      const dobDay = dob.substring(8, 10);
      return dobMonth === month && dobDay === day;
    });

    if (birthdayPatients.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No patient birthdays today (${month}/${day}).`,
        summary: { sent: 0, skipped: 0, errors: 0 },
      });
    }

    console.log(`Found ${birthdayPatients.length} birthday(s) today (${month}/${day})`);

    for (const patient of birthdayPatients) {
      // Check for existing birthday SMS sent today (dedup for re-runs)
      const { data: existingComm } = await supabase
        .from('comms_log')
        .select('id')
        .eq('patient_id', patient.id)
        .eq('message_type', 'birthday_sms')
        .gte('created_at', todayStartUTC)
        .limit(1)
        .maybeSingle();

      if (existingComm) {
        results.skipped.push({
          patient: patient.name || patient.first_name,
          reason: 'Birthday SMS already sent today',
        });
        continue;
      }

      // Normalize phone
      const phone = normalizePhone(patient.phone);
      if (!phone) {
        results.skipped.push({
          patient: patient.name || patient.first_name,
          reason: 'Invalid phone number',
        });
        continue;
      }

      // Pick a random message
      const firstName = getFirstName(patient);
      const message = getBirthdayMessage(firstName);

      // Send SMS
      const smsResult = await sendSMS({ to: phone, message });

      if (smsResult.success) {
        await logComm({
          channel: 'sms',
          messageType: 'birthday_sms',
          message,
          source: 'birthday-sms',
          patientId: patient.id,
          patientName: patient.name || patient.first_name,
          recipient: phone,
          twilioMessageSid: smsResult.messageSid,
          direction: 'outbound',
          provider: smsResult.provider || null,
        });

        results.sent.push({
          patient: patient.name || patient.first_name,
          dob: patient.date_of_birth,
        });

        console.log(`Birthday SMS sent to ${patient.name || patient.first_name} (${phone})`);
      } else {
        results.errors.push({
          patient: patient.name || patient.first_name,
          error: smsResult.error || 'SMS failed',
        });
        console.error(`Birthday SMS failed for ${patient.name || patient.first_name}:`, smsResult.error);
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      date: dateStr,
      summary: {
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      details: results,
    });

  } catch (error) {
    console.error('Birthday SMS cron error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
