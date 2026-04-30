// /pages/api/cron/peptide-weekly-checkin.js
// Weekly peptide check-in — plain text, rotating messages, no links
// Runs daily but only sends if 7+ days since last check-in for each patient
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { PEPTIDE_PROGRAM_TYPES } from '../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rotating check-in messages — casual, human, no week/day numbers, no links
const CHECKIN_MESSAGES = [
  (name) => `Hey ${name}, just checking in — how's the peptide therapy going? Any questions, just text us back. - Range Medical`,
  (name) => `Hi ${name}! Quick check-in from Range Medical. How are you feeling on your peptide protocol? Let us know if anything comes up.`,
  (name) => `Hey ${name}, hope you're doing well. Just wanted to touch base and see how everything's going with your peptides. - Range Medical`,
  (name) => `Hi ${name} — weekly check-in from the Range team. How's everything going? We're here if you need anything.`,
  (name) => `Hey ${name}, just reaching out to see how you're feeling. Any updates or questions on your peptide therapy? - Range Medical`,
  (name) => `Hi ${name}! Checking in from Range Medical. How are things going with your protocol? Don't hesitate to reach out if you need us.`,
  (name) => `Hey ${name}, hope all is well. Just doing our weekly check-in — how's the peptide therapy treating you? - Range Medical`,
  (name) => `Hi ${name} — just wanted to see how you're doing. Any changes or questions about your peptides? We're always here. - Range Medical`,
  (name) => `Hey ${name}, quick check-in. How's everything going with your peptide protocol? Let us know if you need anything at all. - Range Medical`,
  (name) => `Hi ${name}! Range Medical here. Just touching base — how are you feeling? We're here if anything comes up.`,
  (name) => `Hey ${name}, just wanted to check in and see how things are going. How are you feeling on your peptides? - Range Medical`,
  (name) => `Hi ${name} — hope you're having a good week. Just checking in on your peptide therapy. Text us if you need anything. - Range Medical`,
];

function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

// Pick a message based on patient ID + current week so same patient gets different messages each week
function pickMessage(patientId, firstName) {
  // Use patient UUID chars + week number for a deterministic but rotating pick
  const weekOfYear = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
  const idSum = (patientId || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const index = (idSum + weekOfYear) % CHECKIN_MESSAGES.length;
  return CHECKIN_MESSAGES[index](firstName);
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
    const todayStr = todayPacific();

    // First check-in goes out 7 days after protocol start, not the next day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    // Get active peptide protocols that started at least 7 days ago
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('id, patient_id, patient_name, program_type, medication, start_date, end_date')
      .eq('status', 'active')
      .in('program_type', PEPTIDE_PROGRAM_TYPES)
      .lte('start_date', sevenDaysAgoStr)
      .gte('end_date', todayStr)
      .not('patient_id', 'is', null);

    if (protocolsError) {
      throw new Error(`Protocols query error: ${protocolsError.message}`);
    }

    // Deduplicate by patient — one check-in per patient even if they have multiple peptide protocols
    const seenPatients = new Set();

    for (const protocol of (protocols || [])) {
      if (seenPatients.has(protocol.patient_id)) {
        results.skipped.push({ patient: protocol.patient_name, reason: 'Already handled (multiple protocols)' });
        continue;
      }
      seenPatients.add(protocol.patient_id);

      // Check if we sent a peptide check-in in the last 6 days (send on day 7+)
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
      const sixDaysAgoStr = sixDaysAgo.toISOString();

      const { data: recentComm } = await supabase
        .from('comms_log')
        .select('id')
        .eq('patient_id', protocol.patient_id)
        .eq('message_type', 'peptide_weekly_checkin')
        .gte('created_at', sixDaysAgoStr)
        .limit(1);

      if (recentComm?.length) {
        results.skipped.push({ patient: protocol.patient_name, reason: 'Check-in sent within last 7 days' });
        continue;
      }

      // Skip if patient texted US in the last 2 days (inbound = they're already engaged)
      // Only inbound counts — outbound appointment reminders etc. shouldn't suppress check-ins
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString();

      const { data: recentInbound } = await supabase
        .from('comms_log')
        .select('id')
        .eq('patient_id', protocol.patient_id)
        .eq('channel', 'sms')
        .eq('direction', 'inbound')
        .gte('created_at', twoDaysAgoStr)
        .limit(1);

      if (recentInbound?.length) {
        results.skipped.push({ patient: protocol.patient_name, reason: 'Patient texted us recently (last 2 days)' });
        continue;
      }

      // Get patient phone
      const { data: patient } = await supabase
        .from('patients')
        .select('phone')
        .eq('id', protocol.patient_id)
        .single();

      const phone = normalizePhone(patient?.phone);
      if (!phone) {
        results.skipped.push({ patient: protocol.patient_name, reason: 'No phone number' });
        continue;
      }

      // Pick a rotating message
      const firstName = getFirstName(protocol.patient_name);
      const message = pickMessage(protocol.patient_id, firstName);

      // Send plain text SMS — no links, no opt-in flow
      const smsResult = await sendSMS({ to: phone, message });

      if (smsResult.success) {
        results.sent.push({ patient: protocol.patient_name });
        await logComm({
          channel: 'sms',
          messageType: 'peptide_weekly_checkin',
          message,
          source: 'peptide-weekly-checkin',
          patientId: protocol.patient_id,
          protocolId: protocol.id,
          patientName: protocol.patient_name,
          recipient: phone,
          twilioMessageSid: smsResult.messageSid,
          provider: smsResult.provider || null,
          direction: 'outbound',
        });
      } else {
        results.errors.push({ patient: protocol.patient_name, error: smsResult.error });
        await logComm({
          channel: 'sms',
          messageType: 'peptide_weekly_checkin',
          message,
          source: 'peptide-weekly-checkin',
          patientId: protocol.patient_id,
          protocolId: protocol.id,
          patientName: protocol.patient_name,
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
      summary: {
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error) {
    console.error('Peptide weekly check-in error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
