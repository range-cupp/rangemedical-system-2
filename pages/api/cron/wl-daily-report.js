// /pages/api/cron/wl-daily-report.js
// Daily 6 PM PST email report of weight loss injection & medication pickup service log entries
// Sent to cupp@range-medical.com
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const REPORT_RECIPIENT = 'cupp@range-medical.com';

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
    const now = new Date();
    const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const today = pacificDate.toISOString().split('T')[0];
    const displayDate = pacificDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    console.log(`WL Daily Report — fetching entries for ${today}`);

    // Fetch today's weight loss service log entries (injections + pickups)
    const { data: entries, error: fetchError } = await supabase
      .from('service_logs')
      .select('*')
      .eq('category', 'weight_loss')
      .eq('entry_date', today)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('WL Daily Report fetch error:', fetchError);
      throw fetchError;
    }

    // Enrich entries with patient names
    const enrichedEntries = await enrichWithPatientNames(entries || []);

    // Separate by type
    const injections = enrichedEntries.filter(e => e.entry_type === 'injection' || e.entry_type === 'session');
    const pickups = enrichedEntries.filter(e => e.entry_type === 'pickup');

    // Build and send the email
    const subject = `Daily WL Report — ${displayDate}`;
    const html = buildReportEmail({
      displayDate,
      today,
      injections,
      pickups,
      totalEntries: enrichedEntries.length,
    });

    const { error: sendError } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: REPORT_RECIPIENT,
      subject,
      html,
    });

    if (sendError) {
      console.error('WL Daily Report send error:', sendError);
      await logComm({
        channel: 'email',
        messageType: 'wl_daily_report',
        message: subject,
        source: 'cron/wl-daily-report',
        recipient: REPORT_RECIPIENT,
        subject,
        status: 'error',
        errorMessage: sendError.message || String(sendError),
      });
      throw new Error('Failed to send report email');
    }

    await logComm({
      channel: 'email',
      messageType: 'wl_daily_report',
      message: `Daily WL report: ${enrichedEntries.length} entries (${injections.length} injections, ${pickups.length} pickups)`,
      source: 'cron/wl-daily-report',
      recipient: REPORT_RECIPIENT,
      subject,
      status: 'sent',
    });

    console.log(`✓ WL Daily Report sent — ${enrichedEntries.length} entries for ${today}`);

    return res.status(200).json({
      success: true,
      date: today,
      totalEntries: enrichedEntries.length,
      injections: injections.length,
      pickups: pickups.length,
      recipient: REPORT_RECIPIENT,
    });
  } catch (error) {
    console.error('WL Daily Report error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Enrich entries with patient names from patients table
async function enrichWithPatientNames(entries) {
  const patientIds = [...new Set(entries.map(e => e.patient_id).filter(Boolean))];
  if (patientIds.length === 0) return entries;

  const { data: patients } = await supabase
    .from('patients')
    .select('id, name, first_name, last_name')
    .in('id', patientIds);

  const nameMap = {};
  (patients || []).forEach(p => {
    nameMap[p.id] = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown';
  });

  return entries.map(e => ({
    ...e,
    patient_name: nameMap[e.patient_id] || e.patient_name || 'Unknown',
  }));
}

// Build the HTML email
function buildReportEmail({ displayDate, today, injections, pickups, totalEntries }) {
  const headerBg = '#1f2937';
  const accentColor = '#22c55e';

  const buildTableRows = (items) => {
    if (items.length === 0) {
      return `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #9ca3af; font-style: italic;">None today</td></tr>`;
    }
    return items.map((item, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
      const time = item.created_at
        ? new Date(item.created_at).toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' })
        : '—';
      return `
        <tr style="background: ${bg};">
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-weight: 600;">${item.patient_name}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6;">${item.medication || '—'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6;">${item.dosage || '—'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6;">${item.weight ? item.weight + ' lbs' : '—'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${time}</td>
        </tr>`;
    }).join('');
  };

  const buildSection = (title, emoji, items) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 16px; background: #f9fafb; border-radius: 8px 8px 0 0; border-bottom: 2px solid ${accentColor};">
          <span style="font-size: 16px; font-weight: 700; color: #1f2937;">${emoji} ${title}</span>
          <span style="font-size: 14px; color: #6b7280; margin-left: 8px;">(${items.length})</span>
        </td>
      </tr>
      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Patient</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Medication</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Dosage</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Weight</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Time</th>
            </tr>
            ${buildTableRows(items)}
          </table>
        </td>
      </tr>
    </table>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: ${headerBg}; padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 700; color: #ffffff;">Daily Weight Loss Report</div>
                    <div style="font-size: 14px; color: #9ca3af; margin-top: 4px;">${displayDate}</div>
                  </td>
                  <td align="right">
                    <div style="font-size: 32px; font-weight: 800; color: ${accentColor};">${totalEntries}</div>
                    <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase;">Total Entries</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <!-- Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding: 16px; background: #f0fdf4; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #16a34a;">${injections.length}</div>
                    <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Injections</div>
                  </td>
                  <td width="16"></td>
                  <td width="50%" style="padding: 16px; background: #eff6ff; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #2563eb;">${pickups.length}</div>
                    <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Medication Pickups</div>
                  </td>
                </tr>
              </table>

              ${buildSection('Injections', '💉', injections)}
              ${buildSection('Medication Pickups', '📦', pickups)}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 12px; color: #9ca3af; text-align: center;">
                Range Medical &mdash; Automated daily report &mdash; ${today}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
