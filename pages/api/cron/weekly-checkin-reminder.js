// /pages/api/cron/weekly-checkin-reminder.js
// Daily cron to send weekly weight loss check-in SMS reminders
// Runs at 9:00 AM PST - sends reminder to patients on their injection day
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;

// Get current day of week in Pacific Time
function getPacificDayOfWeek() {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[pacificTime.getDay()];
}

// Check if current time is around 9 AM PST (allow 8-10 AM window)
function isWithinAllowedHours() {
  const now = new Date();
  const pstHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
  return pstHour >= 8 && pstHour <= 10;
}

// Send SMS via GHL
async function sendSMS(contactId, message) {
  if (!GHL_API_KEY || !contactId) {
    console.log('Missing GHL_API_KEY or contactId');
    return { success: false, error: 'Missing API key or contact ID' };
  }

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

    const data = await response.json();

    if (!response.ok) {
      console.error('GHL SMS error:', data);
      return { success: false, error: data.message || 'SMS failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: error.message };
  }
}

// Log the reminder
async function logReminder(protocolId, patientId, ghlContactId, patientName, status, errorMessage, messageContent) {
  try {
    await supabase
      .from('checkin_reminders_log')
      .insert({
        protocol_id: protocolId,
        patient_id: patientId,
        ghl_contact_id: ghlContactId,
        patient_name: patientName,
        status: status,
        error_message: errorMessage,
        message_content: messageContent
      });
  } catch (err) {
    console.error('Failed to log reminder:', err);
  }
}

export default async function handler(req, res) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  const cronSecret = req.headers['x-cron-secret'];
  const isAuthorized =
    cronSecret === process.env.CRON_SECRET ||
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    req.query.secret === process.env.CRON_SECRET;

  // Allow Vercel cron (comes with special header)
  const isVercelCron = req.headers['x-vercel-cron-signature'];

  if (!isAuthorized && !isVercelCron) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = { sent: [], skipped: [], errors: [] };
  const todayPacific = getPacificDayOfWeek();

  try {
    // Check time window (skip if not around 9 AM PST, unless forced)
    const forceRun = req.query.force === 'true';
    if (!isWithinAllowedHours() && !forceRun) {
      return res.status(200).json({
        success: true,
        message: 'Outside allowed hours (8-10 AM PST). Current time check skipped.',
        todayPacific,
        skipped: true
      });
    }

    // Get active weight loss protocols where:
    // - checkin_reminder_enabled = true
    // - injection_day = today's day of week
    // - patient has ghl_contact_id
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_name,
        program_type,
        injection_day,
        checkin_reminder_enabled,
        patients!inner (
          id,
          name,
          first_name,
          ghl_contact_id
        )
      `)
      .eq('status', 'active')
      .eq('program_type', 'weight_loss')
      .eq('checkin_reminder_enabled', true)
      .eq('injection_day', todayPacific)
      .not('patients.ghl_contact_id', 'is', null);

    if (protocolsError) {
      // If columns don't exist yet, return helpful message
      if (protocolsError.message.includes('column')) {
        return res.status(200).json({
          success: false,
          error: 'Database columns not yet created. Please run the SQL migration.',
          details: protocolsError.message
        });
      }
      throw new Error('Protocols query error: ' + protocolsError.message);
    }

    const protocolList = protocols || [];
    console.log('Found ' + protocolList.length + ' protocols to send reminders to on ' + todayPacific);

    for (const protocol of protocolList) {
      const patient = protocol.patients;
      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
      const ghlContactId = patient.ghl_contact_id;

      // Build the check-in URL
      const checkinUrl = 'https://app.range-medical.com/patient-checkin.html?contact_id=' + ghlContactId;

      // Build the message
      const message = 'Hi ' + firstName + '! 📊\n\nTime for your weekly weight loss check-in. Takes 30 seconds:\n\n' + checkinUrl + '\n\n- Range Medical';

      // Send the SMS
      const smsResult = await sendSMS(ghlContactId, message);

      if (smsResult.success) {
        results.sent.push({
          patient: patient.name,
          protocolId: protocol.id
        });
        await logReminder(
          protocol.id,
          patient.id,
          ghlContactId,
          patient.name,
          'sent',
          null,
          message
        );
        await logComm({ channel: 'sms', messageType: 'wl_weekly_checkin', message, source: 'weekly-checkin-reminder', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name });
      } else {
        results.errors.push({
          patient: patient.name,
          error: smsResult.error
        });
        await logReminder(
          protocol.id,
          patient.id,
          ghlContactId,
          patient.name,
          'error',
          smsResult.error,
          message
        );
        await logComm({ channel: 'sms', messageType: 'wl_weekly_checkin', message, source: 'weekly-checkin-reminder', patientId: patient.id, protocolId: protocol.id, ghlContactId, patientName: patient.name, status: 'error', errorMessage: smsResult.error });
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      todayPacific,
      summary: {
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error) {
    console.error('Weekly check-in reminder error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
