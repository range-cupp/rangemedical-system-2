// /pages/api/cron/injection-reminders.js
// Daily cron to send injection reminders via GHL SMS
// Range Medical
//
// Runs at 5pm PST - sends reminder if patient hasn't logged today's injection
// Only sends on injection days (respects weekly frequency for weight loss)
// Only sends between 9am-6pm PST

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
  return pstHour >= 9 && pstHour < 18; // 9am to 6pm PST
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

function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

export default async function handler(req, res) {
  // Verify authorization
  const cronSecret = req.headers['x-cron-secret'];
  const isAuthorized = cronSecret === process.env.CRON_SECRET || req.method === 'GET';
  
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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get active TAKE-HOME protocols with reminders enabled
    // In-clinic patients don't need injection reminders
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .eq('status', 'active')
      .eq('reminders_enabled', true)
      .eq('injection_location', 'take_home')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
      .not('ghl_contact_id', 'is', null);

    if (protocolsError) {
      throw new Error(`Protocols query error: ${protocolsError.message}`);
    }

    for (const protocol of (protocols || [])) {
      // Check if today is an injection day for this protocol
      if (!isInjectionDay(protocol.start_date, protocol.dose_frequency)) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: `Not injection day (${protocol.dose_frequency})`
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
      const isWeightLoss = protocol.dose_frequency === '1x weekly' || protocol.dose_frequency === '2x weekly';
      
      let message;
      if (isWeightLoss) {
        const weekNum = Math.ceil(dayNumber / 7);
        if (protocol.dose_frequency === '2x weekly') {
          const isSecondShot = ((dayNumber - 1) % 7) >= 3;
          message = `Hi ${firstName}! It's injection day (Week ${weekNum}, ${isSecondShot ? 'shot 2' : 'shot 1'}) for your weight loss program. Log it when done: ${trackerUrl} - Range Medical`;
        } else {
          message = `Hi ${firstName}! It's your Week ${weekNum} injection day. Log it when done: ${trackerUrl} - Range Medical`;
        }
      } else {
        message = `Hi ${firstName}! Quick reminder - Day ${dayNumber} injection done? Tap to log: ${trackerUrl} - Range Medical`;
      }

      const sent = await sendSMS(protocol.ghl_contact_id, message);
      
      if (sent) {
        results.sent.push({ patient: protocol.patient_name, day: dayNumber });
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
    console.error('Injection reminders error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
