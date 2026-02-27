// /pages/api/cron/hrt-iv-reminders.js
// Daily cron to remind HRT membership patients about their complimentary monthly IV
// Range Medical
//
// Checks active HRT protocols with a payment in the last 30 days.
// If no IV session found in that window, sends SMS reminder via GHL.

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;

function getTodayDateStr() {
  const now = new Date();
  const parts = now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/');
  return `${parts[2]}-${parts[0]}-${parts[1]}`;
}

function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

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
    const todayStr = getTodayDateStr();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Get active HRT protocols with a recent payment
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('id, patient_id, patient_name, ghl_contact_id, last_payment_date')
      .eq('status', 'active')
      .eq('program_type', 'hrt')
      .gte('last_payment_date', thirtyDaysAgoStr)
      .not('ghl_contact_id', 'is', null);

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
      // Double-send prevention: check protocol_logs for today
      const { data: existingLog } = await supabase
        .from('protocol_logs')
        .select('id')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'hrt_iv_reminder')
        .eq('log_date', todayStr)
        .maybeSingle();

      if (existingLog) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: 'Already sent today'
        });
        continue;
      }

      // Check for IV session in the last 30 days
      const { data: ivLogs } = await supabase
        .from('service_logs')
        .select('id, service_date')
        .eq('patient_id', protocol.patient_id)
        .eq('category', 'iv')
        .gte('service_date', thirtyDaysAgoStr)
        .limit(1);

      if (ivLogs && ivLogs.length > 0) {
        results.skipped.push({
          patient: protocol.patient_name,
          reason: `IV already used on ${ivLogs[0].service_date}`
        });
        continue;
      }

      // Send reminder
      const firstName = getFirstName(protocol.patient_name);
      const message = `Hi ${firstName}! Your Range IV is included with your HRT membership this month. Call or text us to schedule! — Range Medical`;

      const sent = await sendSMS(protocol.ghl_contact_id, message);

      if (sent) {
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
          patientName: protocol.patient_name
        });

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
    console.error('HRT IV reminders error:', error);
    return res.status(500).json({ error: error.message, results });
  }
}
