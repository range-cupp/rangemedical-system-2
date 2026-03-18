// /pages/api/cron/iv-followup.js
// Daily cron — sends next-day follow-up text after IV therapy sessions
// Runs at 10:00 AM PST (18:00 UTC) — "0 18 * * *"
// Message appears from Nurse Lily — warm, personal check-in
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { isInQuietHours } from '../../../lib/quiet-hours';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 8 message variations so texts feel natural, not robotic
const FOLLOWUP_MESSAGES = [
  (name) => `Hi ${name}! It's Lily from Range Medical. Just checking in after your IV yesterday — how are you feeling today? Let us know if you need anything!`,
  (name) => `Hey ${name}, it's Lily at Range! Wanted to see how you're doing after your IV session yesterday. Hope you're feeling great! Text us if you have any questions.`,
  (name) => `Hi ${name}! Lily here from Range Medical. How are you feeling after your IV yesterday? Drink plenty of water today and let us know if you need anything!`,
  (name) => `Hey ${name}! It's Lily from Range. Just wanted to check in — how are you feeling after yesterday's IV? We're here if you need anything at all.`,
  (name) => `Hi ${name}, Lily from Range Medical here! Hope you're feeling awesome after your IV yesterday. Stay hydrated and don't hesitate to reach out if you need us!`,
  (name) => `Hey ${name}! Lily at Range checking in. How did you feel after your IV yesterday? Remember to keep up the water intake today. We're always here for you!`,
  (name) => `Hi ${name}! It's Lily from Range. Quick check-in — how's everything going after your IV session yesterday? Let us know how you're feeling!`,
  (name) => `Hey ${name}, it's Lily at Range Medical! Just following up on your IV from yesterday. How are you feeling? Text us anytime if you have questions!`,
];

function getFollowUpMessage(firstName) {
  const index = Math.floor(Math.random() * FOLLOWUP_MESSAGES.length);
  return FOLLOWUP_MESSAGES[index](firstName);
}

function getYesterdayDateStr() {
  const now = new Date();
  // Get today in Pacific Time
  const parts = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/');
  // Subtract one day
  const today = new Date(`${parts[2]}-${parts[0]}-${parts[1]}T12:00:00`);
  today.setDate(today.getDate() - 1);
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayStartUTC() {
  const now = new Date();
  const parts = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/');
  // Start of today in Pacific, converted to UTC for comms_log queries
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

  // Check quiet hours (skip if outside 8am-8pm Pacific, unless forced)
  const force = req.query?.force === 'true';
  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'Outside Pacific send window (8 AM – 8 PM)' });
  }

  const results = { sent: [], skipped: [], errors: [] };

  try {
    const yesterdayStr = getYesterdayDateStr();
    const todayStartUTC = getTodayStartUTC();

    console.log(`IV follow-up cron running. Checking IV sessions from ${yesterdayStr}`);

    // Get IV therapy sessions from yesterday with patient info
    const { data: ivSessions, error: queryError } = await supabase
      .from('service_logs')
      .select('id, patient_id, entry_date, medication, patients!inner(id, first_name, name, phone)')
      .eq('category', 'iv_therapy')
      .eq('entry_type', 'session')
      .eq('entry_date', yesterdayStr)
      .not('patients.phone', 'is', null);

    if (queryError) {
      throw new Error(`Service logs query error: ${queryError.message}`);
    }

    if (!ivSessions || ivSessions.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No IV therapy sessions found for ${yesterdayStr}.`,
        summary: { sent: 0, skipped: 0, errors: 0 },
      });
    }

    console.log(`Found ${ivSessions.length} IV session(s) from ${yesterdayStr}`);

    // Deduplicate by patient (one follow-up per patient even if multiple IVs)
    const seenPatients = new Set();

    for (const session of ivSessions) {
      const patient = session.patients;
      const patientId = session.patient_id;

      // Skip if already processing this patient
      if (seenPatients.has(patientId)) {
        results.skipped.push({
          patient: patient.name || patient.first_name,
          reason: 'Duplicate — already sending for this patient',
        });
        continue;
      }
      seenPatients.add(patientId);

      // Check for existing follow-up sent today (dedup for re-runs)
      const { data: existingComm } = await supabase
        .from('comms_log')
        .select('id')
        .eq('patient_id', patientId)
        .eq('message_type', 'iv_post_followup')
        .gte('created_at', todayStartUTC)
        .limit(1)
        .maybeSingle();

      if (existingComm) {
        results.skipped.push({
          patient: patient.name || patient.first_name,
          reason: 'Follow-up already sent today',
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
      const message = getFollowUpMessage(firstName);

      // Send SMS
      const smsResult = await sendSMS({ to: phone, message });

      if (smsResult.success) {
        // Log to comms_log
        await logComm({
          channel: 'sms',
          messageType: 'iv_post_followup',
          message,
          source: 'iv-followup',
          patientId,
          patientName: patient.name || `${patient.first_name}`,
          recipient: phone,
          twilioMessageSid: smsResult.messageSid,
          direction: 'outbound',
          provider: smsResult.provider || null,
        });

        results.sent.push({
          patient: patient.name || patient.first_name,
          ivDate: yesterdayStr,
          medication: session.medication,
        });

        console.log(`IV follow-up sent to ${patient.name || patient.first_name} (${phone})`);
      } else {
        results.errors.push({
          patient: patient.name || patient.first_name,
          error: smsResult.error || 'SMS failed',
        });
        console.error(`IV follow-up SMS failed for ${patient.name || patient.first_name}:`, smsResult.error);
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      ivDate: yesterdayStr,
      summary: {
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      details: results,
    });

  } catch (error) {
    console.error('IV follow-up cron error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
