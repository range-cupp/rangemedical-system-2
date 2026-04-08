// /pages/api/cron/data-audit-digest.js
// Nightly data integrity audit — emails Chris a summary of open issues.
// Only sends when there are HIGH severity issues (or weekly rollup even if clean).
// Range Medical

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const REPORT_RECIPIENTS = ['cupp@range-medical.com'];

const TYPE_LABELS = {
  missing_service_log: 'Appointment without service log',
  missing_dose: 'Injection missing dose',
  protocol_overflow: 'Protocol needs extension',
  owes_money: 'Owes money',
  orphan_purchase: 'Purchase not linked to protocol',
  orphan_service_log: 'Service log not linked to protocol',
  unlinked_note: 'Clinical note without appointment',
};

export default async function handler(req, res) {
  // Auth (Vercel cron signature or CRON_SECRET)
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

  try {
    // Call the audit endpoint internally
    const host = req.headers.host;
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const auditUrl = `${protocol}://${host}/api/admin/data-audit`;
    const auditRes = await fetch(auditUrl);
    const audit = await auditRes.json();
    if (!auditRes.ok) throw new Error(audit.error || 'Audit call failed');

    const { summary, issues } = audit;
    const isMonday = new Date().getDay() === 1;
    const force = req.query?.force === 'true';

    // Skip emailing on low-activity days (no high issues + not Monday rollup)
    if (!force && summary.high === 0 && !isMonday) {
      return res.status(200).json({
        success: true,
        skipped: true,
        reason: 'No high-severity issues and not weekly rollup day',
        summary,
      });
    }

    // Group high-severity issues by patient for the email
    const highIssues = issues.filter(i => i.severity === 'high');
    const byPatient = {};
    highIssues.forEach(i => {
      const key = i.patient_id || 'unknown';
      if (!byPatient[key]) byPatient[key] = { name: i.patient_name, items: [] };
      byPatient[key].items.push(i);
    });
    const sortedPatients = Object.values(byPatient).sort((a, b) => b.items.length - a.items.length);

    const typeBreakdown = Object.entries(summary.by_type)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${TYPE_LABELS[type] || type}</td><td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${count}</td></tr>`)
      .join('');

    const patientRows = sortedPatients.slice(0, 20).map(p => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
          <div style="font-weight:700;color:#0f172a;">${p.name}</div>
          ${p.items.map(i => `<div style="font-size:12px;color:#64748b;margin-top:2px;">• ${i.message}</div>`).join('')}
        </td>
      </tr>
    `).join('');

    const severityColor = summary.high > 0 ? '#b91c1c' : summary.medium > 0 ? '#a16207' : '#16a34a';

    const html = `
<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f8fafc;padding:20px;margin:0;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;">
    <div style="padding:24px 32px;border-bottom:2px solid #0f172a;">
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Range Medical — Data Health</div>
      <div style="font-size:24px;font-weight:700;color:#0f172a;margin-top:4px;">${isMonday ? 'Weekly ' : 'Nightly '}Audit</div>
      <div style="font-size:13px;color:#64748b;margin-top:2px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' , timeZone: 'America/Los_Angeles' })}</div>
    </div>

    <div style="padding:24px 32px;">
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;padding:16px;border:1px solid #e2e8f0;">
          <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;">Total issues</div>
          <div style="font-size:32px;font-weight:700;color:${severityColor};margin-top:4px;">${summary.total}</div>
        </div>
        <div style="flex:1;padding:16px;border:1px solid #fecaca;background:#fef2f2;">
          <div style="font-size:10px;color:#b91c1c;text-transform:uppercase;font-weight:700;">High priority</div>
          <div style="font-size:32px;font-weight:700;color:#b91c1c;margin-top:4px;">${summary.high}</div>
        </div>
      </div>

      ${summary.total > 0 ? `
        <h3 style="font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:0.1em;margin:0 0 8px;">Breakdown by type</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;margin-bottom:24px;font-size:13px;">
          ${typeBreakdown}
        </table>
      ` : '<div style="padding:24px;background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a;text-align:center;font-weight:700;">✓ No issues found — database is clean</div>'}

      ${sortedPatients.length > 0 ? `
        <h3 style="font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:0.1em;margin:0 0 8px;">High-severity issues by patient</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
          ${patientRows}
        </table>
        ${sortedPatients.length > 20 ? `<div style="margin-top:8px;font-size:12px;color:#64748b;">+ ${sortedPatients.length - 20} more patients…</div>` : ''}
      ` : ''}

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
        <a href="https://range-medical.com/admin/data-health" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;font-size:13px;">
          Open Data Health Dashboard →
        </a>
      </div>
    </div>
  </div>
</body></html>`;

    const subject = summary.high > 0
      ? `⚠️ Data Health: ${summary.high} high-priority issue${summary.high > 1 ? 's' : ''} · ${summary.total} total`
      : `✓ Data Health: ${summary.total} open issue${summary.total !== 1 ? 's' : ''} (weekly rollup)`;

    const { error: sendError } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: REPORT_RECIPIENTS,
      subject,
      html,
    });

    if (sendError) throw new Error(sendError.message || String(sendError));

    return res.status(200).json({ success: true, sent: true, summary });
  } catch (err) {
    console.error('data-audit-digest error', err);
    return res.status(500).json({ error: err.message });
  }
}
