// /pages/api/cron/staff-prep-alert.js
// Daily cron — sends consolidated day-before prep summary to Tara
// Covers all appointments for the next calendar day with flag evaluation
// Runs at 4pm Pacific (0 0 * * * UTC) — "0 0 * * *"
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendBlooioMessage } from '../../../lib/blooio';
import { logComm } from '../../../lib/comms-log';
import { slugRequiresBloodWork } from '../../../lib/appointment-services';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Lab review slugs — labs_delivered flag is only relevant for these
const LAB_REVIEW_CATEGORIES = ['labs'];
const LAB_REVIEW_NAMES = ['lab review', 'initial lab review', 'follow-up lab review'];

function isLabReview(appt) {
  const name = (appt.service_name || '').toLowerCase();
  return LAB_REVIEW_NAMES.some(n => name.includes(n));
}

// Get tomorrow's date range in Pacific Time
function getTomorrowRange() {
  const now = new Date();
  const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  pacific.setDate(pacific.getDate() + 1);
  const y = pacific.getFullYear();
  const m = String(pacific.getMonth() + 1).padStart(2, '0');
  const d = String(pacific.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  return {
    dateStr,
    start: `${dateStr}T00:00:00-08:00`,
    end: `${dateStr}T23:59:59-08:00`,
  };
}

function formatAppointmentTime(isoString) {
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Evaluate prep flags for a single appointment
function evaluateFlags(appt) {
  const flags = [];

  if (!appt.forms_complete) {
    flags.push('Forms outstanding');
  }

  if (!appt.instructions_sent) {
    flags.push('Instructions not sent');
  }

  // prereqs_met only relevant for services requiring blood work
  // Check by matching service name against known requiresBloodWork slugs
  if (!appt.prereqs_met && appt.cal_com_booking_id) {
    // If prereqs_met is false AND this is a prereq-gated service, flag it
    // We check via service_name pattern since we have the appointment record not the slug
    const name = (appt.service_name || '').toLowerCase();
    const isPrereqService = name.includes('vitamin c') || name.includes('methylene blue') || name.includes('mb +') || name.includes('mb combo');
    if (isPrereqService) {
      flags.push('Blood work prereq not met');
    }
  }

  if (!appt.labs_delivered && isLabReview(appt)) {
    flags.push('Labs not delivered');
  }

  if (!appt.provider_briefed) {
    flags.push('Provider not yet briefed');
  }

  // visit_reason unconfirmed — empty or still has Cal.com placeholder
  if (!appt.visit_reason || appt.visit_reason.includes('to be confirmed by staff')) {
    flags.push('Visit reason not confirmed');
  }

  return flags;
}

// Build SMS message
function buildSMS(dateDisplay, appointments) {
  const hasAnyFlags = appointments.some(a => a.flags.length > 0);

  if (!hasAnyFlags) {
    return `Range Prep \u2014 ${dateDisplay}: All clear for tomorrow. \u2713`;
  }

  let msg = `Range Prep \u2014 ${dateDisplay}\n`;

  for (const appt of appointments) {
    const time = formatAppointmentTime(appt.start_time);
    msg += `\n${time} \u2014 ${appt.patient_name} (${appt.service_name})`;

    if (appt.flags.length === 0) {
      msg += '\n\u2713 All clear';
    } else {
      for (const flag of appt.flags) {
        msg += `\n\u26A0 ${flag}`;
      }
    }
  }

  msg += '\n\n---\nprovider_briefed = manual check';

  return msg;
}

// Build email HTML
function buildEmailHtml(dateDisplay, appointments) {
  const hasAnyFlags = appointments.some(a => a.flags.length > 0);

  const rows = appointments.map(appt => {
    const time = formatAppointmentTime(appt.start_time);
    const flagsHtml = appt.flags.length === 0
      ? '<span style="color: #22c55e; font-weight: 600;">&#x2713; All clear</span>'
      : appt.flags.map(f => `<span style="color: #f59e0b;">&#x26A0;&#xFE0F; ${f}</span>`).join('<br/>');

    return `
      <tr>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #111; font-size: 14px; white-space: nowrap; vertical-align: top;">${time}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; vertical-align: top;">
          <strong style="color: #111; font-size: 14px;">${appt.patient_name}</strong><br/>
          <span style="color: #666; font-size: 13px;">${appt.service_name}</span>
        </td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; font-size: 13px; line-height: 1.6; vertical-align: top;">${flagsHtml}</td>
      </tr>`;
  }).join('');

  const summaryColor = hasAnyFlags ? '#f59e0b' : '#22c55e';
  const summaryText = hasAnyFlags
    ? `${appointments.filter(a => a.flags.length > 0).length} of ${appointments.length} appointment(s) need attention`
    : 'All clear for tomorrow \u2713';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f5;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="background-color:#ffffff;max-width:640px;">

<!-- Header -->
<tr><td style="background-color:#000;padding:30px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:0.1em;">RANGE MEDICAL</h1>
  <p style="margin:10px 0 0;color:#a3a3a3;font-size:14px;">Staff Prep Alert</p>
</td></tr>

<!-- Summary -->
<tr><td style="padding:30px;">
  <h2 style="margin:0 0 5px;color:#111;font-size:18px;">Tomorrow &mdash; ${dateDisplay}</h2>
  <p style="margin:0 0 20px;color:${summaryColor};font-size:14px;font-weight:600;">${summaryText}</p>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden;">
    <tr style="background-color:#fafafa;">
      <th style="padding:10px 15px;text-align:left;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #eee;">Time</th>
      <th style="padding:10px 15px;text-align:left;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #eee;">Patient / Service</th>
      <th style="padding:10px 15px;text-align:left;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #eee;">Status</th>
    </tr>
    ${rows}
  </table>

  <p style="margin:20px 0 0;color:#999;font-size:12px;font-style:italic;">provider_briefed = manual check before each appointment</p>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#fafafa;padding:24px 30px;border-top:1px solid #eee;">
  <p style="margin:0;color:#888;font-size:13px;text-align:center;">Range Medical Staff Alert &bull; (949) 997-3988</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
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

  try {
    const { dateStr, start, end } = getTomorrowRange();
    const dateDisplay = formatDateDisplay(dateStr);

    console.log(`[staff-prep-alert] Building prep summary for ${dateStr}`);

    // Query tomorrow's scheduled appointments with all prep fields
    const { data: appointments, error: queryError } = await supabase
      .from('appointments')
      .select('id, patient_name, service_name, service_category, start_time, cal_com_booking_id, forms_complete, instructions_sent, prereqs_met, labs_delivered, provider_briefed, visit_reason')
      .eq('status', 'scheduled')
      .gte('start_time', `${dateStr}T00:00:00`)
      .lt('start_time', `${dateStr}T23:59:59`)
      .order('start_time', { ascending: true });

    if (queryError) {
      console.error('[staff-prep-alert] Query error:', queryError);
      return res.status(500).json({ error: queryError.message });
    }

    if (!appointments || appointments.length === 0) {
      console.log('[staff-prep-alert] No appointments tomorrow — skipping alert');
      return res.status(200).json({ success: true, message: 'No appointments tomorrow', date: dateStr });
    }

    console.log(`[staff-prep-alert] Found ${appointments.length} appointment(s) for tomorrow`);

    // Evaluate flags for each appointment
    const enriched = appointments.map(appt => ({
      ...appt,
      flags: evaluateFlags(appt),
    }));

    // Build messages
    const smsBody = buildSMS(dateDisplay, enriched);
    const emailHtml = buildEmailHtml(dateDisplay, enriched);

    const taraPhone = process.env.TARA_PHONE;
    const taraEmail = 'tara@range-medical.com';
    const results = { sms: null, email: null };

    // Send SMS via Blooio
    if (taraPhone) {
      try {
        const smsResult = await sendBlooioMessage({ to: taraPhone, message: smsBody });
        results.sms = smsResult.success ? 'sent' : 'error';

        await logComm({
          channel: 'sms',
          messageType: 'staff_prep_alert',
          message: smsBody,
          source: 'cron/staff-prep-alert',
          recipient: taraPhone,
          status: smsResult.success ? 'sent' : 'error',
          errorMessage: smsResult.error || null,
          direction: 'outbound',
        });

        console.log(`[staff-prep-alert] SMS ${smsResult.success ? 'sent' : 'failed'} to Tara`);
      } catch (smsErr) {
        results.sms = 'error';
        console.error('[staff-prep-alert] SMS error:', smsErr);
      }
    } else {
      console.warn('[staff-prep-alert] TARA_PHONE not set — skipping SMS');
      results.sms = 'skipped';
    }

    // Send email
    try {
      const hasFlags = enriched.some(a => a.flags.length > 0);
      const flagCount = enriched.filter(a => a.flags.length > 0).length;
      const subject = hasFlags
        ? `Prep Alert: ${flagCount} of ${enriched.length} appointments need attention \u2014 ${dateDisplay}`
        : `Prep Alert: All clear for ${dateDisplay} \u2713`;

      await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        replyTo: 'info@range-medical.com',
        to: taraEmail,
        subject,
        html: emailHtml,
      });

      results.email = 'sent';

      await logComm({
        channel: 'email',
        messageType: 'staff_prep_alert',
        message: emailHtml,
        source: 'cron/staff-prep-alert',
        recipient: taraEmail,
        subject,
        status: 'sent',
        direction: 'outbound',
      });

      console.log(`[staff-prep-alert] Email sent to ${taraEmail}`);
    } catch (emailErr) {
      results.email = 'error';
      console.error('[staff-prep-alert] Email error:', emailErr);
    }

    const flaggedCount = enriched.filter(a => a.flags.length > 0).length;
    console.log(`[staff-prep-alert] Done — ${enriched.length} appointments, ${flaggedCount} flagged`);

    return res.status(200).json({
      success: true,
      date: dateStr,
      appointments: enriched.length,
      flagged: flaggedCount,
      allClear: flaggedCount === 0,
      results,
    });

  } catch (error) {
    console.error('[staff-prep-alert] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
