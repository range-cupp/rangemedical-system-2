// /pages/api/cron/hrt-iv-reminders.js
// Monthly cron to remind HRT membership patients about their complimentary monthly IV
// Range Medical
//
// Checks active HRT protocols with a payment in the last 30 days.
// If no IV session found in that window, sends ONE SMS reminder per billing cycle.
// Waits at least 14 days after payment before sending the reminder.

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { isInQuietHours } from '../../../lib/quiet-hours';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getTodayDateStr() {
  const now = new Date();
  const parts = now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/');
  return `${parts[2]}-${parts[0]}-${parts[1]}`;
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

  // Check quiet hours (skip if outside 8am-8pm Pacific, unless forced)
  const force = req.query?.force === 'true';
  if (!force && isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'Outside Pacific send window (8 AM – 8 PM)' });
  }

  const results = { sent: [], skipped: [], errors: [] };

  try {
    const todayStr = getTodayDateStr();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Get active HRT protocols with a recent payment
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('id, patient_id, patient_name, ghl_contact_id, last_payment_date, patients!inner(phone)')
      .eq('status', 'active')
      .eq('program_type', 'hrt')
      .gte('last_payment_date', thirtyDaysAgoStr)
      .not('patients.phone', 'is', null);

    if (protocolsError) {
      throw new Error(`Protocols query error: ${protocolsError.message}`);
    }

    if (!protocols || protocols.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No eligible HRT protocols with recent payment found.',
        summary: { sent: 0, skipped: 0, errors: 0 }
      });
    }

    for (const protocol of protocols) {
      // Only send reminder once at least 14 days have passed since payment
      const paymentDate = new Date(protocol.last_payment_date);
      const daysSincePayment = Math.floor((new Date() - paymentDate) / (1000 * 60 * 60 * 24));
      if (daysSincePayment < 14) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: `Only ${daysSincePayment} days since payment (waiting for 14)`
        });
        continue;
      }

      // One reminder per billing cycle: check if already sent since last payment
      const { data: existingLog } = await supabase
        .from('protocol_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'hrt_iv_reminder')
        .gte('log_date', protocol.last_payment_date)
        .maybeSingle();

      if (existingLog) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: 'Already reminded this billing cycle'
        });
        continue;
      }

      // Check for IV session since last payment (billing cycle window)
      const cycleStart = protocol.last_payment_date || thirtyDaysAgoStr;
      const { data: ivLogs } = await supabase
        .from('service_logs')
        .select('id, service_date')
        .eq('patient_id', protocol.patient_id)
        .in('category', ['iv', 'iv_therapy'])
        .gte('service_date', cycleStart)
        .limit(1);

      if (ivLogs && ivLogs.length > 0) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: `IV already used on ${ivLogs[0].service_date}`
        });
        continue;
      }

      // Send reminder via Twilio
      const firstName = getFirstName(protocol.patient_name);
      const message = `Hi ${firstName}! Your Range IV is included with your HRT membership this month. Call or text us to schedule! — Range Medical`;

      const phone = normalizePhone(protocol.patients?.phone);
      if (!phone) {
        results.skipped.push({ patient: protocol.patient_name, reason: 'No phone number' });
        continue;
      }

      const smsResult = await sendSMS({ to: phone, message });

      if (smsResult.success) {
        await supabase.from('protocol_logs').insert({
          protocol_id: protocol.id,
          patient_id: protocol.patient_id,
          log_type: 'hrt_iv_reminder',
          log_date: todayStr,
          notes: message
        });

        await logComm({
          channel: 'sms',
          messageType: 'hrt_iv_reminder',
          message,
          source: 'cron',
          patientId: protocol.patient_id,
          protocolId: protocol.id,
          ghlContactId: protocol.ghl_contact_id,
          patientName: protocol.patient_name,
          recipient: phone,
          twilioMessageSid: smsResult.messageSid,
        });

        results.sent.push({ patient: protocol.patient_name });
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
    console.error('HRT IV reminders error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
