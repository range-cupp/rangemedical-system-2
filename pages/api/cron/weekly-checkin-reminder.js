// /pages/api/cron/weekly-checkin-reminder.js
// Daily cron to send weight loss check-in SMS reminders via Twilio.
// Runs at 9:00 AM PST. Cadence-aware: sends every N days where N is parsed
// from the protocol's frequency (Weekly = 7, Every 10 Days = 10, etc.). Uses
// the most recent successful send in checkin_reminders_log as the anchor;
// for first-time sends, anchors to injection_day when set.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../lib/blooio-optin';
import { parseFrequencyDays } from '../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Get active weight loss protocols — join patients to get phone number.
    // Cadence-aware gating happens per-protocol below; we no longer filter on
    // injection_day at the SQL level so 10-day / 14-day cadences fire too.
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_name,
        program_type,
        delivery_method,
        injection_day,
        frequency,
        start_date,
        checkin_reminder_enabled,
        patients!inner (
          id,
          name,
          first_name,
          phone,
          ghl_contact_id
        )
      `)
      .eq('status', 'active')
      .ilike('program_type', 'weight_loss%')
      .eq('checkin_reminder_enabled', true)
      .or('delivery_method.neq.in_clinic,delivery_method.is.null');

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
    console.log('Found ' + protocolList.length + ' active WL protocols with check-in enabled');

    // Anchor "today" in PST midnight so day-diffs are stable
    const todayMidnightPST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    todayMidnightPST.setHours(0, 0, 0, 0);

    for (const protocol of protocolList) {
      const patient = protocol.patients;
      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
      const ghlContactId = patient.ghl_contact_id;

      // Cadence gate: only send when it's been >= cadence days since the last send.
      // First-time sends anchor to injection_day if set; otherwise fire today.
      const cadenceDays = parseFrequencyDays(protocol.frequency);

      const { data: lastSendRow } = await supabase
        .from('checkin_reminders_log')
        .select('sent_at')
        .eq('protocol_id', protocol.id)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSendRow?.sent_at) {
        const lastDate = new Date(lastSendRow.sent_at);
        lastDate.setHours(0, 0, 0, 0);
        const daysSince = Math.floor((todayMidnightPST - lastDate) / 86400000);
        if (daysSince < cadenceDays) {
          results.skipped.push({
            patient: patient.name,
            reason: `last sent ${daysSince}d ago, cadence ${cadenceDays}d`,
          });
          continue;
        }
      } else if (protocol.injection_day && protocol.injection_day !== todayPacific) {
        // No prior send — wait for the patient's chosen day-of-week
        results.skipped.push({
          patient: patient.name,
          reason: `first send anchored to ${protocol.injection_day} (today is ${todayPacific})`,
        });
        continue;
      }

      // Need a phone number for Twilio
      const phone = normalizePhone(patient.phone);
      if (!phone) {
        results.skipped.push({
          patient: patient.name,
          reason: 'No phone number on file'
        });
        continue;
      }

      // Build the check-in URL
      const checkinUrl = 'https://app.range-medical.com/patient-checkin.html?contact_id=' + (ghlContactId || patient.id);

      // Build the message — phrasing follows the protocol's actual cadence
      const cadenceWord = cadenceDays === 7 ? 'weekly' : cadenceDays === 14 ? 'biweekly' : `${cadenceDays}-day`;
      const message = 'Hi ' + firstName + '! 📊\n\nTime for your ' + cadenceWord + ' weight loss check-in. Takes 30 seconds:\n\n' + checkinUrl + '\n\n- Range Medical';

      // Blooio two-step: if first contact, send link-free version + queue link message
      if (isBlooioProvider() && !(await hasBlooioOptIn(phone))) {
        const optInMessage = `Hi ${firstName}! Time for your ${cadenceWord} weight loss check-in. Reply YES to get your check-in link. - Range Medical`;

        const optInResult = await sendSMS({ to: phone, message: optInMessage });
        if (optInResult.success) {
          await queuePendingLinkMessage({
            phone,
            message,
            messageType: 'wl_weekly_checkin',
            patientId: patient.id,
            patientName: patient.name,
          });
          await logReminder(protocol.id, patient.id, ghlContactId, patient.name, 'sent', null, optInMessage);
          await logComm({
            channel: 'sms',
            messageType: 'blooio_optin_request',
            message: optInMessage,
            source: 'weekly-checkin-reminder',
            patientId: patient.id,
            protocolId: protocol.id,
            ghlContactId,
            patientName: patient.name,
            recipient: phone,
            twilioMessageSid: optInResult.messageSid,
            provider: optInResult.provider || null,
            direction: 'outbound',
          });
          results.sent.push({ patient: patient.name, protocolId: protocol.id, twoStep: true });
        } else {
          results.errors.push({ patient: patient.name, error: optInResult.error });
          await logReminder(protocol.id, patient.id, ghlContactId, patient.name, 'error', optInResult.error, optInMessage);
        }
        continue;
      }

      // Direct send — patient already opted in or not using Blooio
      const smsResult = await sendSMS({ to: phone, message });

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
        await logComm({
          channel: 'sms',
          messageType: 'wl_weekly_checkin',
          message,
          source: 'weekly-checkin-reminder',
          patientId: patient.id,
          protocolId: protocol.id,
          ghlContactId,
          patientName: patient.name,
          recipient: phone,
          twilioMessageSid: smsResult.messageSid,
          provider: smsResult.provider || null,
          direction: 'outbound',
        });
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
        await logComm({
          channel: 'sms',
          messageType: 'wl_weekly_checkin',
          message,
          source: 'weekly-checkin-reminder',
          patientId: patient.id,
          protocolId: protocol.id,
          ghlContactId,
          patientName: patient.name,
          recipient: phone,
          status: 'error',
          errorMessage: smsResult.error,
          provider: smsResult.provider || null,
          direction: 'outbound',
        });
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
