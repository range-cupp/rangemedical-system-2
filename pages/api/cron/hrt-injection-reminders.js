// /pages/api/cron/hrt-injection-reminders.js
// Daily cron to send HRT take-home injection reminders via GHL SMS
// Range Medical
//
// Runs at 5pm UTC (9 AM PST) — sends reminder on Mon/Thu or Tue/Fri
// based on hrt_reminder_schedule field

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;

// Check if current time is within allowed window (9am-6pm PST)
function isWithinAllowedHours() {
  const now = new Date();
  const pstHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
  return pstHour >= 9 && pstHour < 18;
}

// Get today's day name in PST timezone
function getTodayDayName() {
  const now = new Date();
  return now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Los_Angeles' });
}

// Get today's date string in PST timezone (YYYY-MM-DD)
function getTodayDateStr() {
  const now = new Date();
  const parts = now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/');
  return `${parts[2]}-${parts[0]}-${parts[1]}`;
}

// Check if today matches the schedule
function isScheduledDay(schedule) {
  const dayName = getTodayDayName();
  if (schedule === 'mon_thu') return dayName === 'Monday' || dayName === 'Thursday';
  if (schedule === 'tue_fri') return dayName === 'Tuesday' || dayName === 'Friday';
  return false;
}

// Send SMS via GHL
async function sendSMS(contactId, message) {
  if (!GHL_API_KEY || !contactId) return false;

  try {
    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: contactId,
        message: message
      })
    });

    return response.ok;
  } catch (error) {
    console.error('SMS error:', error);
    return false;
  }
}

// Log a sent text to protocol_logs (prevents double-sends)
async function logSent(protocolId, patientId, logType, message) {
  try {
    await supabase.from('protocol_logs').insert({
      protocol_id: protocolId,
      patient_id: patientId,
      log_type: logType,
      log_date: getTodayDateStr(),
      notes: message
    });
  } catch (err) {
    console.error('Failed to log:', err);
  }
}

function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

export default async function handler(req, res) {
  // Verify authorization
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const authHeader = req.headers['authorization'];
  const isAuthorized =
    cronSecret === process.env.CRON_SECRET ||
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    req.headers['x-vercel-signature'];

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check time window
  if (!isWithinAllowedHours()) {
    return res.status(200).json({
      success: true,
      message: 'Outside allowed hours (9am-6pm PST). No reminders sent.',
      skipped: true
    });
  }

  const results = { sent: [], skipped: [], errors: [] };

  try {
    const todayStr = getTodayDateStr();

    // Get active HRT take-home protocols with reminders enabled
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .eq('status', 'active')
      .eq('hrt_reminders_enabled', true)
      .eq('delivery_method', 'take_home')
      .eq('program_type', 'hrt')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
      .not('ghl_contact_id', 'is', null);

    if (protocolsError) {
      throw new Error(`Protocols query error: ${protocolsError.message}`);
    }

    if (!protocols || protocols.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No eligible HRT protocols found.',
        summary: { sent: 0, skipped: 0, errors: 0 }
      });
    }

    for (const protocol of protocols) {
      // Check if today is a scheduled injection day
      if (!protocol.hrt_reminder_schedule || !isScheduledDay(protocol.hrt_reminder_schedule)) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: `Not a scheduled day (schedule: ${protocol.hrt_reminder_schedule || 'none'})`
        });
        continue;
      }

      // Double-send prevention: check protocol_logs for today
      const { data: existingLog } = await supabase
        .from('protocol_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'hrt_injection_reminder')
        .eq('log_date', todayStr)
        .maybeSingle();

      if (existingLog) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: 'Already sent today'
        });
        continue;
      }

      // Send reminder
      const firstName = getFirstName(protocol.patient_name);
      const message = `Hi ${firstName}! It's injection day — time for your testosterone injection. — Range Medical`;

      const sent = await sendSMS(protocol.ghl_contact_id, message);

      if (sent) {
        await logSent(protocol.id, protocol.patient_id, 'hrt_injection_reminder', message);
        results.sent.push({ patient: protocol.patient_name });
      } else {
        results.errors.push({ patient: protocol.patient_name, error: 'SMS failed' });
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
    console.error('HRT injection reminders error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
