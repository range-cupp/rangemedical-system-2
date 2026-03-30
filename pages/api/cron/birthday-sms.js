// /pages/api/cron/birthday-sms.js
// Daily cron — sends happy birthday SMS with free injection gift link
// Runs at 9:00 AM PST (17:00 UTC) — "0 17 * * *"
// Range Medical

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.range-medical.com';

// 8 message variations — each includes the gift link
const BIRTHDAY_MESSAGES = [
  (name, link) => `Happy Birthday, ${name}! 🎂 From all of us at Range Medical — enjoy a FREE injection on us this month! Pick yours here: ${link}`,
  (name, link) => `It's your day, ${name}! 🎉 Happy Birthday from Range Medical. Your gift: a free injection this month — pick one here: ${link}`,
  (name, link) => `Happy Birthday, ${name}! 🥳 The Range Medical crew has a gift for you — a free injection! Choose yours: ${link}`,
  (name, link) => `Hey ${name}, Happy Birthday! 🎂 We want to celebrate you — enjoy a free injection on Range Medical this month: ${link}`,
  (name, link) => `Happy Birthday, ${name}! 🎉 Your birthday gift from Range Medical: a free injection. Book yours here: ${link}`,
  (name, link) => `${name}, it's your birthday! 🥳 We have a gift for you — a free injection on us. Pick your time: ${link}`,
  (name, link) => `Wishing you the happiest birthday, ${name}! 🎂 Your gift from Range Medical — a free injection: ${link}`,
  (name, link) => `Happy Birthday, ${name}! 🎉 Here's to another amazing year. Your gift: a free injection on us — book here: ${link}`,
];

function getBirthdayMessage(firstName, giftLink) {
  const index = Math.floor(Math.random() * BIRTHDAY_MESSAGES.length);
  return BIRTHDAY_MESSAGES[index](firstName, giftLink);
}

function getTodayPST() {
  const now = new Date();
  const parts = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/');
  return {
    month: parts[0],
    day: parts[1],
    year: parts[2],
    dateStr: `${parts[2]}-${parts[0]}-${parts[1]}`,
  };
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

// Get the last day of a given month (for gift expiration)
function getEndOfMonth(year, month) {
  // month is 1-12
  return new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
}

// Generate a short, URL-safe token
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
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
    const { month, day, year, dateStr } = getTodayPST();
    const todayStartUTC = getTodayStartUTC();

    console.log(`Birthday SMS cron running. Looking for birthdays on ${month}/${day}`);

    // Query patients whose date_of_birth matches today's month and day
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

      // Create or reuse birthday gift token for this year
      let giftToken;

      // Check if a gift already exists for this patient this year
      const { data: existingGift } = await supabase
        .from('birthday_gifts')
        .select('id, token')
        .eq('patient_id', patient.id)
        .eq('birth_year', parseInt(year))
        .maybeSingle();

      if (existingGift) {
        giftToken = existingGift.token;
      } else {
        // Create a new gift
        giftToken = generateToken();
        const expiresAt = getEndOfMonth(year, month);

        const { error: insertError } = await supabase
          .from('birthday_gifts')
          .insert({
            patient_id: patient.id,
            token: giftToken,
            birth_month: parseInt(month),
            birth_year: parseInt(year),
            expires_at: expiresAt.toISOString(),
          });

        if (insertError) {
          console.error(`Failed to create birthday gift for ${patient.name}:`, insertError);
          results.errors.push({
            patient: patient.name || patient.first_name,
            error: `Gift creation failed: ${insertError.message}`,
          });
          continue;
        }
      }

      const giftLink = `${BASE_URL}/birthday/${giftToken}`;
      const firstName = getFirstName(patient);
      const message = getBirthdayMessage(firstName, giftLink);

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
          giftToken,
        });

        console.log(`Birthday SMS sent to ${patient.name || patient.first_name} (${phone}) — gift: ${giftLink}`);
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
