// /pages/api/cron/start-funnel-nudge.js
// Daily cron — sends 24h and 72h nudge texts to /start funnel leads who haven't booked
// Runs at 4:00 PM Pacific (0 16 * * * / 00:00 UTC)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { isInQuietHours } from '../../../lib/quiet-hours';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Auth check
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isInQuietHours()) {
    return res.status(200).json({ skipped: true, reason: 'quiet hours' });
  }

  const results = { nudge24h: [], nudge72h: [], errors: [] };

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

    // --- 24-hour nudge ---
    // Leads that were texted, created >24h ago, haven't been nudged, haven't booked
    const { data: leads24h, error: err24 } = await supabase
      .from('start_leads')
      .select('id, first_name, phone, path')
      .eq('status', 'texted')
      .eq('nudge_24h_sent', false)
      .is('booked_at', null)
      .eq('consent_sms', true)
      .lt('created_at', twentyFourHoursAgo)
      .limit(50);

    if (err24) {
      console.error('24h query error:', err24);
      results.errors.push(err24.message);
    }

    for (const lead of (leads24h || [])) {
      try {
        const normalized = normalizePhone(lead.phone);
        if (!normalized) continue;

        const nextStepUrl = lead.path === 'injury'
          ? 'https://range-medical.com/range-assessment?path=injury&from=start'
          : `https://range-medical.com/start/energy?name=${encodeURIComponent(lead.first_name)}`;

        const message = lead.path === 'injury'
          ? `Hey ${lead.first_name}, just checking in. Ready to book your Recovery Visit? Pick a time here:\n\n${nextStepUrl}\n\n- Range Medical`
          : `Hey ${lead.first_name}, just checking in. Did you get a chance to watch the video? Here's your link to pick your lab panel when you're ready:\n\n${nextStepUrl}\n\n- Range Medical`;

        const smsResult = await sendSMS({ to: normalized, message });

        await supabase
          .from('start_leads')
          .update({ nudge_24h_sent: true, updated_at: new Date().toISOString() })
          .eq('id', lead.id);

        await logComm({
          channel: 'sms',
          messageType: 'start_funnel_nudge_24h',
          message,
          source: 'start-funnel-nudge',
          patientName: lead.first_name,
          recipient: normalized,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
        });

        results.nudge24h.push(lead.first_name);
      } catch (smsErr) {
        console.error(`24h nudge error for ${lead.first_name}:`, smsErr);
        results.errors.push(`24h: ${lead.first_name} - ${smsErr.message}`);
      }
    }

    // --- 72-hour nudge ---
    // Leads that got 24h nudge, created >72h ago, haven't been 72h nudged, haven't booked
    const { data: leads72h, error: err72 } = await supabase
      .from('start_leads')
      .select('id, first_name, phone, path')
      .eq('nudge_24h_sent', true)
      .eq('nudge_72h_sent', false)
      .is('booked_at', null)
      .eq('consent_sms', true)
      .lt('created_at', seventyTwoHoursAgo)
      .limit(50);

    if (err72) {
      console.error('72h query error:', err72);
      results.errors.push(err72.message);
    }

    for (const lead of (leads72h || [])) {
      try {
        const normalized = normalizePhone(lead.phone);
        if (!normalized) continue;

        const nextStepUrl = lead.path === 'injury'
          ? 'https://range-medical.com/range-assessment?path=injury&from=start'
          : `https://range-medical.com/start/energy?name=${encodeURIComponent(lead.first_name)}`;

        const message = lead.path === 'injury'
          ? `Hi ${lead.first_name}, wanted to reach out one last time. If you're still dealing with that injury, we're here when you're ready to book your Recovery Visit:\n\n${nextStepUrl}\n\nOr just reply to this text.\n\n- Range Medical`
          : `Hi ${lead.first_name}, wanted to reach out one last time. If you're still thinking about it, we're here when you're ready:\n\n${nextStepUrl}\n\nOr just reply to this text.\n\n- Range Medical`;

        const smsResult = await sendSMS({ to: normalized, message });

        await supabase
          .from('start_leads')
          .update({ nudge_72h_sent: true, updated_at: new Date().toISOString() })
          .eq('id', lead.id);

        await logComm({
          channel: 'sms',
          messageType: 'start_funnel_nudge_72h',
          message,
          source: 'start-funnel-nudge',
          patientName: lead.first_name,
          recipient: normalized,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          twilioMessageSid: smsResult.messageSid || null,
          provider: smsResult.provider || null,
        });

        results.nudge72h.push(lead.first_name);
      } catch (smsErr) {
        console.error(`72h nudge error for ${lead.first_name}:`, smsErr);
        results.errors.push(`72h: ${lead.first_name} - ${smsErr.message}`);
      }
    }

    console.log(`Start funnel nudge: 24h=${results.nudge24h.length}, 72h=${results.nudge72h.length}, errors=${results.errors.length}`);

    return res.status(200).json({
      success: true,
      sent24h: results.nudge24h.length,
      sent72h: results.nudge72h.length,
      errors: results.errors.length,
    });
  } catch (error) {
    console.error('Start funnel nudge error:', error);
    return res.status(500).json({ error: error.message });
  }
}
