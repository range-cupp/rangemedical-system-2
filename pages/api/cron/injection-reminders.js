// /pages/api/cron/injection-reminders.js
// Daily cron to send injection reminders via GHL SMS
// Range Medical
//
// Runs at 5pm PST - sends reminder if patient hasn't logged today's injection
// Only sends on injection days (respects weekly frequency for weight loss)
// Only sends between 9am-6pm PST

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../lib/blooio-optin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check if current time is within allowed window (8am-6pm PST)
function isWithinAllowedHours() {
  const now = new Date();
  const pstHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
  return pstHour >= 8 && pstHour < 18; // 8am to 6pm PST
}

// Determine if today is an injection day based on protocol frequency
function isInjectionDay(startDate, frequency) {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const dayNumber = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  
  if (!frequency || frequency === 'Daily') return true;
  
  // 1x weekly - only days 1, 8, 15, 22, etc.
  if (frequency === '1x weekly') {
    return ((dayNumber - 1) % 7) === 0;
  }
  
  // 2x weekly - days 1, 4, 8, 11, etc. (Mon/Thu pattern)
  if (frequency === '2x weekly') {
    const dayInWeek = ((dayNumber - 1) % 7) + 1;
    return dayInWeek === 1 || dayInWeek === 4;
  }
  
  // 3x weekly - days 1, 3, 5, 8, 10, 12, etc. (Mon/Wed/Fri)
  if (frequency === '3x weekly') {
    const dayInWeek = ((dayNumber - 1) % 7) + 1;
    return dayInWeek === 1 || dayInWeek === 3 || dayInWeek === 5;
  }
  
  // 5 days on / 2 days off
  if (frequency.includes('5 days on')) {
    const dayInWeek = ((dayNumber - 1) % 7) + 1;
    return dayInWeek <= 5;
  }
  
  // Every other day
  if (frequency === 'Every other day') {
    return dayNumber % 2 === 1;
  }
  
  return true;
}

// Send SMS via Twilio — looks up patient phone by protocol
async function sendSMSForProtocol(protocol, message) {
  // Get patient phone from patients table
  const { data: patient } = await supabase
    .from('patients')
    .select('phone')
    .eq('id', protocol.patient_id)
    .single();

  const phone = normalizePhone(patient?.phone);
  if (!phone) return { sent: false, error: 'No phone number' };

  const result = await sendSMS({ to: phone, message });
  return { sent: result.success, error: result.error, messageSid: result.messageSid };
}

function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
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

  // Check time window (skip if outside 8am-6pm Pacific, unless forced)
  const force = req.query?.force === 'true';
  if (!force && !isWithinAllowedHours()) {
    return res.status(200).json({
      success: true,
      message: 'Outside allowed hours (8am-6pm Pacific). No reminders sent.',
      skipped: true
    });
  }

  const results = { sent: [], skipped: [], errors: [] };

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get active TAKE-HOME protocols with reminders enabled
    // In-clinic patients don't need injection reminders
    // Real columns: delivery_method (not injection_location),
    //   checkin_reminder_enabled/peptide_reminders_enabled (not reminders_enabled)
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .eq('status', 'active')
      .eq('delivery_method', 'take_home')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
      .not('patient_id', 'is', null);

    if (protocolsError) {
      throw new Error(`Protocols query error: ${protocolsError.message}`);
    }

    for (const protocol of (protocols || [])) {
      // Skip if reminders not enabled for this protocol type
      if (!protocol.checkin_reminder_enabled && !protocol.peptide_reminders_enabled) {
        results.skipped.push({ patient: protocol.patient_name, reason: 'Reminders not enabled' });
        continue;
      }

      // Check if today is an injection day for this protocol
      // Real column is 'frequency' (not 'dose_frequency')
      const freq = protocol.frequency;
      if (!isInjectionDay(protocol.start_date, freq)) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: `Not injection day (${freq})`
        });
        continue;
      }

      // Calculate which day number today is
      const startDate = new Date(protocol.start_date);
      startDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const dayNumber = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Check if they've already logged today
      const { data: todayLog } = await supabase
        .from('injection_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('day_number', dayNumber)
        .single();

      if (todayLog) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: 'Already logged today'
        });
        continue;
      }

      // Send reminder
      const firstName = getFirstName(protocol.patient_name);
      const trackerUrl = `https://app.range-medical.com/track/${protocol.access_token}`;
      const isWeightLoss = freq === '1x weekly' || freq === '2x weekly';

      let message;
      if (isWeightLoss) {
        const weekNum = Math.ceil(dayNumber / 7);
        if (freq === '2x weekly') {
          const isSecondShot = ((dayNumber - 1) % 7) >= 3;
          message = `Hi ${firstName}! It's injection day (Week ${weekNum}, ${isSecondShot ? 'shot 2' : 'shot 1'}) for your weight loss program. Log it when done: ${trackerUrl} - Range Medical`;
        } else {
          message = `Hi ${firstName}! It's your Week ${weekNum} injection day. Log it when done: ${trackerUrl} - Range Medical`;
        }
      } else {
        message = `Hi ${firstName}! Quick reminder - Day ${dayNumber} injection done? Tap to log: ${trackerUrl} - Range Medical`;
      }

      // Get patient phone for opt-in check
      const { data: patientData } = await supabase
        .from('patients')
        .select('phone')
        .eq('id', protocol.patient_id)
        .single();
      const phone = normalizePhone(patientData?.phone);

      if (!phone) {
        results.skipped.push({ patient: protocol.patient_name, reason: 'No phone number' });
        continue;
      }

      // Blooio two-step: if first contact, send link-free version + queue link message
      if (isBlooioProvider() && !(await hasBlooioOptIn(phone))) {
        const optInMessage = isWeightLoss
          ? `Hi ${firstName}! It's injection day for your weight loss program. Reply YES to get your tracking link. - Range Medical`
          : `Hi ${firstName}! Quick reminder - time for your injection. Reply YES to get your tracking link. - Range Medical`;

        const optInResult = await sendSMS({ to: phone, message: optInMessage });
        if (optInResult.success) {
          await queuePendingLinkMessage({
            phone,
            message,
            messageType: 'injection_reminder',
            patientId: protocol.patient_id,
            patientName: protocol.patient_name,
          });
          results.sent.push({ patient: protocol.patient_name, day: dayNumber, twoStep: true });
        } else {
          results.errors.push({ patient: protocol.patient_name, error: optInResult.error || 'Opt-in SMS failed' });
        }
        continue;
      }

      const smsResult = await sendSMS({ to: phone, message });

      if (smsResult.success) {
        results.sent.push({ patient: protocol.patient_name, day: dayNumber });
      } else {
        results.errors.push({ patient: protocol.patient_name, error: smsResult.error || 'SMS failed' });
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error) {
    console.error('Injection reminders error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
