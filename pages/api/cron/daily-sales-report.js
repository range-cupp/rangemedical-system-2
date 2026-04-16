// /pages/api/cron/daily-sales-report.js
// Daily end-of-day sales report — revenue, sessions, new & returning patients
// Sent at 8 PM PST to cupp@range-medical.com (add investors later)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';
import { sendSMS } from '../../../lib/send-sms';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Recipients — add investor emails here when ready
const REPORT_RECIPIENTS = [
  'cupp@range-medical.com',
];

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
          timeZone: 'America/Los_Angeles',
    });
    const shortDate = pacificDate.toLocaleDateString('en-US', {
      month: 'numeric', day: 'numeric', year: '2-digit',
          timeZone: 'America/Los_Angeles',
    });

    console.log(`Daily Sales Report — fetching data for ${today}`);

    // ── 1. Revenue: today's purchases ──────────────────────────────────
    const { data: purchases, error: purchaseErr } = await supabase
      .from('purchases')
      .select('id, patient_id, patient_name, item_name, description, amount, amount_paid, category, payment_method, purchase_date, created_at')
      .eq('purchase_date', today)
      .neq('dismissed', true)
      .order('created_at', { ascending: true });

    if (purchaseErr) throw purchaseErr;

    // Use ?? (not ||) so amount_paid=0 (comps) doesn't fall through to catalog price
    const totalRevenue = (purchases || []).reduce((sum, p) => {
      const amt = parseFloat(p.amount_paid ?? p.amount ?? 0);
      return sum + amt;
    }, 0);

    const transactionCount = (purchases || []).length;

    // Revenue by category
    const revenueByCategory = {};
    (purchases || []).forEach(p => {
      const cat = p.category || 'other';
      if (!revenueByCategory[cat]) revenueByCategory[cat] = { count: 0, total: 0 };
      revenueByCategory[cat].count++;
      revenueByCategory[cat].total += parseFloat(p.amount_paid ?? p.amount ?? 0);
    });

    // Revenue by payment method
    const revenueByPayment = {};
    (purchases || []).forEach(p => {
      const method = p.payment_method || 'unknown';
      if (!revenueByPayment[method]) revenueByPayment[method] = { count: 0, total: 0 };
      revenueByPayment[method].count++;
      revenueByPayment[method].total += parseFloat(p.amount_paid ?? p.amount ?? 0);
    });

    // ── 2. Sessions: today's service log entries ───────────────────────
    const { data: sessions, error: sessionErr } = await supabase
      .from('service_logs')
      .select('id, patient_id, category, entry_type, medication, created_at')
      .eq('entry_date', today)
      .order('created_at', { ascending: true });

    if (sessionErr) throw sessionErr;

    const sessionCount = (sessions || []).length;

    // Sessions by category
    const sessionsByCategory = {};
    (sessions || []).forEach(s => {
      const cat = s.category || 'other';
      if (!sessionsByCategory[cat]) sessionsByCategory[cat] = 0;
      sessionsByCategory[cat]++;
    });

    // ── 3. Patients: new vs returning ──────────────────────────────────
    // Count new patients (created today) — no names for PHI protection
    const { count: newPatientCount, error: newPatErr } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59.999`);

    if (newPatErr) throw newPatErr;

    // Returning = unique patients in today's service logs who were NOT created today
    const { data: newPatientIds } = await supabase
      .from('patients')
      .select('id')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59.999`);

    const newIdSet = new Set((newPatientIds || []).map(p => p.id));
    const todaySessionPatientIds = [...new Set((sessions || []).map(s => s.patient_id).filter(Boolean))];
    const returningPatientCount = todaySessionPatientIds.filter(id => !newIdSet.has(id)).length;

    // ── 4. Build and send email ────────────────────────────────────────
    const subject = `End of Day ${shortDate} — $${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const html = buildReportEmail({
      displayDate,
      shortDate,
      today,
      totalRevenue,
      transactionCount,
      revenueByCategory,
      revenueByPayment,
      sessionCount,
      sessionsByCategory,
      newPatientCount: newPatientCount || 0,
      returningPatientCount,
      purchases: purchases || [],
    });

    const { error: sendError } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: REPORT_RECIPIENTS,
      subject,
      html,
    });

    if (sendError) {
      console.error('Daily Sales Report send error:', sendError);
      await logComm({
        channel: 'email',
        messageType: 'daily_sales_report',
        message: subject,
        source: 'cron/daily-sales-report',
        recipient: REPORT_RECIPIENTS.join(', '),
        subject,
        status: 'error',
        errorMessage: sendError.message || String(sendError),
      });
      throw new Error('Failed to send daily sales report');
    }

    await logComm({
      channel: 'email',
      messageType: 'daily_sales_report',
      message: `EOD report: $${totalRevenue.toFixed(2)} revenue, ${sessionCount} sessions, ${newPatientCount} new patients`,
      source: 'cron/daily-sales-report',
      recipient: REPORT_RECIPIENTS.join(', '),
      subject,
      status: 'sent',
    });

    // ── 5. Send SMS with same numbers ────────────────────────────────────
    const smsBody = buildReportSMS({
      shortDate,
      totalRevenue,
      transactionCount,
      revenueByCategory,
      sessionCount,
      sessionsByCategory,
      newPatientCount,
      returningPatientCount,
    });

    const smsResult = await sendSMS({ to: '+19496900339', message: smsBody });

    if (smsResult.success) {
      await logComm({
        channel: 'sms',
        messageType: 'daily_sales_report',
        message: smsBody,
        source: 'cron/daily-sales-report',
        recipient: '+19496900339',
        status: 'sent',
      });
      console.log('Daily Sales Report SMS sent to Chris');
    } else {
      console.error('Daily Sales Report SMS error:', smsResult.error);
      await logComm({
        channel: 'sms',
        messageType: 'daily_sales_report',
        message: smsBody,
        source: 'cron/daily-sales-report',
        recipient: '+19496900339',
        status: 'error',
        errorMessage: smsResult.error,
      });
    }

    console.log(`Daily Sales Report sent — $${totalRevenue.toFixed(2)}, ${sessionCount} sessions, ${newPatientCount} new patients`);

    return res.status(200).json({
      success: true,
      date: today,
      totalRevenue,
      transactionCount,
      sessionCount,
      newPatientCount,
      returningPatientCount,
      recipients: REPORT_RECIPIENTS,
    });
  } catch (error) {
    console.error('Daily Sales Report error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── Category display helpers ──────────────────────────────────────────────
const CATEGORY_LABELS = {
  hrt: 'HRT',
  weight_loss: 'Weight Loss',
  peptide: 'Peptides',
  iv_therapy: 'IV Therapy',
  iv: 'IV Therapy',
  hbot: 'HBOT',
  red_light: 'Red Light',
  rlt: 'Red Light',
  injection: 'Injections',
  testosterone: 'Testosterone',
  vitamin: 'Vitamins',
  other: 'Other',
};

function catLabel(cat) {
  return CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Build HTML email ──────────────────────────────────────────────────────
function buildReportEmail({
  displayDate, shortDate, today, totalRevenue, transactionCount,
  revenueByCategory, revenueByPayment, sessionCount, sessionsByCategory,
  newPatientCount, returningPatientCount,
  purchases,
}) {
  const headerBg = '#111111';
  const accent = '#10b981';

  // Sort categories by revenue descending
  const sortedCats = Object.entries(revenueByCategory)
    .sort((a, b) => b[1].total - a[1].total);

  // Sort session categories by count descending
  const sortedSessionCats = Object.entries(sessionsByCategory)
    .sort((a, b) => b[1] - a[1]);

  // Category breakdown rows
  const categoryRows = sortedCats.map(([cat, data], idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `
      <tr style="background: ${bg};">
        <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #1f2937;">${catLabel(cat)}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #6b7280;">${data.count}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #111;">${fmtMoney(data.total)}</td>
      </tr>`;
  }).join('');

  // Session breakdown rows
  const sessionRows = sortedSessionCats.map(([cat, count], idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `
      <tr style="background: ${bg};">
        <td style="padding: 8px 16px; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${catLabel(cat)}</td>
        <td style="padding: 8px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #111;">${count}</td>
      </tr>`;
  }).join('');

  // Payment method rows
  const paymentRows = Object.entries(revenueByPayment)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([method, data], idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
      const label = method === 'stripe' ? 'Stripe' : method === 'cash' ? 'Cash' : method === 'manual' ? 'Manual' : method === 'ghl' ? 'GHL' : method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `
        <tr style="background: ${bg};">
          <td style="padding: 8px 16px; border-bottom: 1px solid #f3f4f6; color: #1f2937;">${label}</td>
          <td style="padding: 8px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #6b7280;">${data.count}</td>
          <td style="padding: 8px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #111;">${fmtMoney(data.total)}</td>
        </tr>`;
    }).join('');

  // No patient names — counts only (PHI protection)

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
            <td style="background: ${headerBg}; padding: 28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Range Medical</div>
                    <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 4px;">End of Day ${shortDate}</div>
                    <div style="font-size: 13px; color: #9ca3af; margin-top: 2px;">${displayDate}</div>
                  </td>
                  <td align="right" style="vertical-align: bottom;">
                    <div style="font-size: 36px; font-weight: 800; color: ${accent};">${fmtMoney(totalRevenue)}</div>
                    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Total Revenue</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quick Stats -->
          <tr>
            <td style="padding: 24px 32px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="25%" style="padding: 16px 8px; background: #f0fdf4; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #16a34a;">${transactionCount}</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Transactions</div>
                  </td>
                  <td width="8"></td>
                  <td width="25%" style="padding: 16px 8px; background: #eff6ff; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #2563eb;">${sessionCount}</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Sessions</div>
                  </td>
                  <td width="8"></td>
                  <td width="25%" style="padding: 16px 8px; background: #faf5ff; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #7c3aed;">${newPatientCount}</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">New Patients</div>
                  </td>
                  <td width="8"></td>
                  <td width="25%" style="padding: 16px 8px; background: #fff7ed; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #ea580c;">${returningPatientCount}</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Returning</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Revenue by Category -->
          <tr>
            <td style="padding: 24px 32px 0 32px;">
              <div style="font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Revenue by Category</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Category</th>
                  <th style="padding: 8px 16px; text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Count</th>
                  <th style="padding: 8px 16px; text-align: right; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Revenue</th>
                </tr>
                ${categoryRows || '<tr><td colspan="3" style="padding: 16px; text-align: center; color: #9ca3af; font-style: italic;">No purchases today</td></tr>'}
              </table>
            </td>
          </tr>

          <!-- Sessions by Type -->
          ${sessionCount > 0 ? `
          <tr>
            <td style="padding: 20px 32px 0 32px;">
              <div style="font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Sessions by Type</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Type</th>
                  <th style="padding: 8px 16px; text-align: right; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Count</th>
                </tr>
                ${sessionRows}
              </table>
            </td>
          </tr>` : ''}

          <!-- Payment Methods -->
          ${Object.keys(revenueByPayment).length > 0 ? `
          <tr>
            <td style="padding: 20px 32px 0 32px;">
              <div style="font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Payment Methods</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Method</th>
                  <th style="padding: 8px 16px; text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Count</th>
                  <th style="padding: 8px 16px; text-align: right; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Amount</th>
                </tr>
                ${paymentRows}
              </table>
            </td>
          </tr>` : ''}

          <!-- Patient counts only — no names (PHI protection) -->

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; margin-top: 24px;">
              <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                <div style="font-size: 12px; color: #9ca3af; text-align: center;">
                  Range Medical &mdash; End of Day Report &mdash; ${today}
                </div>
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

// ── Build plain-text SMS ─────────────────────────────────────────────────────
function buildReportSMS({
  shortDate, totalRevenue, transactionCount, revenueByCategory,
  sessionCount, sessionsByCategory, newPatientCount, returningPatientCount,
}) {
  const lines = [];
  lines.push(`Range Medical EOD ${shortDate}`);
  lines.push(`Revenue: ${fmtMoney(totalRevenue)} (${transactionCount} txns)`);

  // Category breakdown
  const sortedCats = Object.entries(revenueByCategory).sort((a, b) => b[1].total - a[1].total);
  if (sortedCats.length > 0) {
    lines.push('');
    sortedCats.forEach(([cat, data]) => {
      lines.push(`  ${catLabel(cat)}: ${fmtMoney(data.total)} (${data.count})`);
    });
  }

  lines.push('');
  lines.push(`Sessions: ${sessionCount}`);

  const sortedSessionCats = Object.entries(sessionsByCategory).sort((a, b) => b[1] - a[1]);
  if (sortedSessionCats.length > 0) {
    sortedSessionCats.forEach(([cat, count]) => {
      lines.push(`  ${catLabel(cat)}: ${count}`);
    });
  }

  lines.push('');
  lines.push(`New patients: ${newPatientCount}`);
  lines.push(`Returning: ${returningPatientCount}`);

  return lines.join('\n');
}
