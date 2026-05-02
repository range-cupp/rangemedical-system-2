// /pages/api/cron/weekly-checkin-reminder.js
// Daily cron at 9:20 AM PT. Three jobs in one sweep, per take-home WL protocol:
//   1. Original check-in SMS on the patient's injection day (or cadence anchor)
//   2. First nudge 24h after the original if no check-in logged
//   3. Final nudge 72h after the original if still no check-in
// Opt-outs (reminder_opt_out = true) are skipped entirely.
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

function getPacificDayOfWeek() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const pst = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  return days[pst.getDay()];
}

function getPacificMidnight() {
  const pst = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  pst.setHours(0, 0, 0, 0);
  return pst;
}

function isWithinAllowedHours() {
  const hr = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getHours();
  return hr >= 8 && hr <= 10;
}

async function logReminder({ protocol_id, patient_id, ghl_contact_id, patient_name, status, error_message, message_content, nudge_level }) {
  try {
    await supabase.from('checkin_reminders_log').insert({
      protocol_id, patient_id, ghl_contact_id, patient_name,
      status, error_message, message_content, nudge_level,
    });
  } catch (err) {
    console.error('Failed to log reminder:', err);
  }
}

function buildOriginalMessage(firstName, cadenceWord, url) {
  return `Hi ${firstName}! 📊\n\nTime for your ${cadenceWord} weight loss check-in. Takes 30 seconds:\n\n${url}\n\n- Range Medical`;
}

function buildFirstNudge(firstName, url) {
  return `Hi ${firstName}! Just a quick reminder to log your weight & side effects from this week's injection: ${url}\n\n- Range Medical`;
}

function buildFinalNudge(firstName, url) {
  return `Hi ${firstName}! Last reminder for this week's check-in: ${url}\n\nIf you have any concerns or questions, just text us back.\n\n- Range Medical`;
}

async function sendAndLog({ protocol, patient, message, nudgeLevel, messageType, results }) {
  const phone = normalizePhone(patient.phone);
  if (!phone) {
    results.skipped.push({ patient: patient.name, nudge_level: nudgeLevel, reason: 'No phone' });
    return false;
  }

  // Blooio two-step: first contact gets opt-in prompt + queued link
  if (isBlooioProvider() && !(await hasBlooioOptIn(phone))) {
    const optInMessage = `Hi ${patient.first_name || patient.name}! Range Medical needs to send you your weight loss check-in link. Reply YES to receive it.`;
    const optInResult = await sendSMS({ to: phone, message: optInMessage });
    if (optInResult.success) {
      await queuePendingLinkMessage({
        phone, message,
        messageType, patientId: patient.id, patientName: patient.name,
      });
      await logReminder({
        protocol_id: protocol.id, patient_id: patient.id, ghl_contact_id: patient.ghl_contact_id,
        patient_name: patient.name, status: 'sent', error_message: null,
        message_content: optInMessage, nudge_level: nudgeLevel,
      });
      await logComm({
        channel: 'sms', messageType: 'blooio_optin_request', message: optInMessage,
        source: 'weekly-checkin-reminder', patientId: patient.id, protocolId: protocol.id,
        ghlContactId: patient.ghl_contact_id, patientName: patient.name, recipient: phone,
        twilioMessageSid: optInResult.messageSid, provider: optInResult.provider || null, direction: 'outbound',
      });
      results.sent.push({ patient: patient.name, nudge_level: nudgeLevel, twoStep: true });
      return true;
    }
    results.errors.push({ patient: patient.name, nudge_level: nudgeLevel, error: optInResult.error });
    return false;
  }

  const smsResult = await sendSMS({ to: phone, message });
  if (smsResult.success) {
    results.sent.push({ patient: patient.name, nudge_level: nudgeLevel });
    await logReminder({
      protocol_id: protocol.id, patient_id: patient.id, ghl_contact_id: patient.ghl_contact_id,
      patient_name: patient.name, status: 'sent', error_message: null,
      message_content: message, nudge_level: nudgeLevel,
    });
    await logComm({
      channel: 'sms', messageType, message, source: 'weekly-checkin-reminder',
      patientId: patient.id, protocolId: protocol.id, ghlContactId: patient.ghl_contact_id,
      patientName: patient.name, recipient: phone, twilioMessageSid: smsResult.messageSid,
      provider: smsResult.provider || null, direction: 'outbound',
    });
    return true;
  }
  results.errors.push({ patient: patient.name, nudge_level: nudgeLevel, error: smsResult.error });
  await logReminder({
    protocol_id: protocol.id, patient_id: patient.id, ghl_contact_id: patient.ghl_contact_id,
    patient_name: patient.name, status: 'error', error_message: smsResult.error,
    message_content: message, nudge_level: nudgeLevel,
  });
  return false;
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
  if (!isAuthorized) return res.status(401).json({ error: 'Unauthorized' });

  const results = { sent: [], skipped: [], errors: [] };
  const todayDayName = getPacificDayOfWeek();
  const todayMidnight = getPacificMidnight();

  try {
    const forceRun = req.query.force === 'true';
    if (!isWithinAllowedHours() && !forceRun) {
      return res.status(200).json({
        success: true,
        message: 'Outside allowed hours (8-10 AM PST).',
        todayPacific: todayDayName,
        skipped: true,
      });
    }

    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id, patient_id, program_name, program_type, delivery_method,
        injection_day, frequency, checkin_cadence_days,
        checkin_reminder_enabled, reminder_opt_out,
        patients!inner ( id, name, first_name, phone, ghl_contact_id )
      `)
      .eq('status', 'active')
      .ilike('program_type', 'weight_loss%')
      .eq('checkin_reminder_enabled', true)
      .eq('reminder_opt_out', false)
      .or('delivery_method.neq.in_clinic,delivery_method.is.null');

    if (protocolsError) {
      throw new Error('Protocols query error: ' + protocolsError.message);
    }

    const protocolList = protocols || [];
    console.log(`[wl-checkin] ${protocolList.length} eligible protocols, today is ${todayDayName}`);

    for (const protocol of protocolList) {
      const patient = protocol.patients;
      const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');
      const ghlContactId = patient.ghl_contact_id;
      const checkinUrl = `https://app.range-medical.com/patient-checkin.html?contact_id=${ghlContactId || patient.id}`;

      const cadenceDays = (Number.isInteger(protocol.checkin_cadence_days) && protocol.checkin_cadence_days > 0)
        ? protocol.checkin_cadence_days
        : parseFrequencyDays(protocol.frequency);
      const cadenceWord = cadenceDays === 7 ? 'weekly' : cadenceDays === 14 ? 'biweekly' : `${cadenceDays}-day`;

      // Find the most recent ORIGINAL send (nudge_level = 0). Cadence is anchored
      // off this — nudges don't reset the cadence clock.
      const { data: lastOriginal } = await supabase
        .from('checkin_reminders_log')
        .select('sent_at, nudge_level')
        .eq('protocol_id', protocol.id)
        .eq('status', 'sent')
        .eq('nudge_level', 0)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const daysSinceOriginal = lastOriginal?.sent_at
        ? Math.floor((todayMidnight - new Date(new Date(lastOriginal.sent_at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).setHours(0, 0, 0, 0)) / 86400000)
        : null;

      // ── Job 1: Send a new original if cadence has elapsed ───────────────
      const shouldSendOriginal = (() => {
        if (!lastOriginal) {
          // First-ever send: anchor to injection_day if set, else fire today
          return !protocol.injection_day || protocol.injection_day === todayDayName;
        }
        return daysSinceOriginal >= cadenceDays;
      })();

      if (shouldSendOriginal) {
        const message = buildOriginalMessage(firstName, cadenceWord, checkinUrl);
        await sendAndLog({
          protocol, patient, message, nudgeLevel: 0,
          messageType: 'wl_weekly_checkin', results,
        });
        continue;
      }

      // ── Job 2 & 3: Nudges (only relevant if we have a recent original) ──
      if (!lastOriginal) {
        results.skipped.push({
          patient: patient.name,
          reason: `first send anchored to ${protocol.injection_day} (today is ${todayDayName})`,
        });
        continue;
      }

      // Has the patient already completed their check-in for this cycle?
      const originalDate = new Date(lastOriginal.sent_at).toISOString().split('T')[0];
      const { count: completedCount } = await supabase
        .from('service_logs')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patient.id)
        .eq('category', 'weight_loss')
        .eq('entry_type', 'weight_check')
        .gte('entry_date', originalDate);

      if ((completedCount || 0) > 0) {
        results.skipped.push({ patient: patient.name, reason: 'already completed this cycle' });
        continue;
      }

      // First nudge at +1 day
      if (daysSinceOriginal === 1) {
        const message = buildFirstNudge(firstName, checkinUrl);
        await sendAndLog({
          protocol, patient, message, nudgeLevel: 1,
          messageType: 'wl_checkin_nudge_1', results,
        });
        continue;
      }

      // Final nudge at +3 days, only if we haven't already sent it
      if (daysSinceOriginal === 3) {
        const { count: nudge2Count } = await supabase
          .from('checkin_reminders_log')
          .select('id', { count: 'exact', head: true })
          .eq('protocol_id', protocol.id)
          .eq('status', 'sent')
          .eq('nudge_level', 2)
          .gte('sent_at', lastOriginal.sent_at);
        if ((nudge2Count || 0) > 0) {
          results.skipped.push({ patient: patient.name, reason: 'final nudge already sent' });
          continue;
        }
        const message = buildFinalNudge(firstName, checkinUrl);
        await sendAndLog({
          protocol, patient, message, nudgeLevel: 2,
          messageType: 'wl_checkin_nudge_2', results,
        });
        continue;
      }

      results.skipped.push({
        patient: patient.name,
        reason: `day +${daysSinceOriginal} of cycle, nothing due`,
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      todayPacific: todayDayName,
      summary: {
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      details: results,
    });
  } catch (error) {
    console.error('Weekly check-in reminder error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
