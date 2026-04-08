#!/usr/bin/env node
/**
 * Range Medical — Nightly P&L Digest Sender
 *
 * Pulls the report for a given date from daily_reports and emails it
 * to the configured recipients using the Resend API.
 *
 * Can be chained after generate-report.js:
 *   node generate-report.js && node send-digest.js
 *
 * Usage:
 *   node send-digest.js [YYYY-MM-DD]
 *
 *   If no date supplied, defaults to yesterday (Pacific time).
 *
 * Required env vars:
 *   SUPABASE_URL          – https://your-project.supabase.co
 *   SUPABASE_SERVICE_KEY  – service-role key
 *   RESEND_API_KEY        – from resend.com dashboard
 *   DIGEST_FROM           – sender address verified with Resend (e.g. "reports@range-medical.com")
 *   DIGEST_TO             – comma-separated recipient list (e.g. "chris@range-medical.com")
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

// ── Config ─────────────────────────────────────────────────────────────────

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY       = process.env.RESEND_API_KEY;
const DIGEST_FROM          = process.env.DIGEST_FROM  || 'reports@range-medical.com';
const DIGEST_TO            = (process.env.DIGEST_TO   || 'cupp@range-medical.com')
  .split(',').map(s => s.trim());

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}
if (!RESEND_API_KEY) {
  console.error('❌  Missing RESEND_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Formatting helpers ─────────────────────────────────────────────────────

const fmt    = (cents)  => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const fmtPct = (pct)    => pct != null ? `${pct.toFixed(1)}%` : '—';
const fmtDay = (dateStr) => {
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

// Category display labels (prettier names for the email)
const CAT_LABELS = {
  peptides:       'Peptides',
  weight_loss:    'Weight Loss (GLP-1)',
  nad_injection:  'NAD+ Injections',
  injections:     'Injections',
  iv_nad:         'NAD+ IV',
  iv_vitc:        'Vitamin C IV',
  iv_glutathione: 'Glutathione IV',
  iv_mb:          'Methylene Blue IV',
  iv_standard:    'Standard IVs',
  hbot:           'HBOT',
  red_light:      'Red Light Therapy',
  combo:          'Combo Memberships',
  prp:            'PRP',
  hrt:            'HRT',
  labs:           'Lab Panels',
  packages:       'Packages',
  other:          'Other',
};

// ── HTML email template ────────────────────────────────────────────────────

function buildEmailHtml(report) {
  const dateLabel = fmtDay(report.report_date);
  const revenue   = fmt(report.total_revenue_cents);
  const cogs      = fmt(report.total_cogs_cents);
  const profit    = fmt(report.total_revenue_cents - report.total_cogs_cents);
  const margin    = fmtPct(report.gross_margin_pct);
  const mappingPct = report.transaction_count > 0
    ? Math.round((report.mapped_transaction_count / report.transaction_count) * 100)
    : 0;

  // Sort categories by revenue descending
  const categories = Object.entries(report.by_category || {})
    .sort((a, b) => b[1].revenue_cents - a[1].revenue_cents);

  // Top unmapped items (by revenue, capped at 10)
  const topUnmapped = (report.unmapped_transactions || [])
    .filter(t => t.amount_paid > 0)
    .sort((a, b) => b.amount_paid - a.amount_paid)
    .slice(0, 10);

  const unmappedRevenue = (report.unmapped_transactions || [])
    .reduce((sum, t) => sum + (parseFloat(t.amount_paid) || 0), 0);

  // Color-coded margin (green ≥ 80%, yellow ≥ 65%, red otherwise)
  const marginColor = report.gross_margin_pct >= 80 ? '#16a34a'
                    : report.gross_margin_pct >= 65 ? '#d97706'
                    : '#dc2626';

  // Category rows HTML
  const catRows = categories.map(([cat, data]) => {
    const label  = CAT_LABELS[cat] || cat;
    const mColor = data.gross_margin_pct >= 80 ? '#16a34a'
                 : data.gross_margin_pct >= 65 ? '#d97706'
                 : '#dc2626';
    return `
      <tr>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#374151;">${label}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-variant-numeric:tabular-nums; color:#111827;">${fmt(data.revenue_cents)}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-variant-numeric:tabular-nums; color:#6b7280;">${fmt(data.cogs_cents)}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-variant-numeric:tabular-nums; color:#111827;">${fmt(data.gross_profit_cents)}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:600; color:${mColor};">${fmtPct(data.gross_margin_pct)}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; text-align:right; color:#6b7280;">${data.count}</td>
      </tr>`;
  }).join('');

  // Unmapped rows HTML
  const unmappedRows = topUnmapped.length > 0 ? `
    <tr>
      <td colspan="2" style="padding:4px 12px; font-size:12px; color:#6b7280;">
        <em>${topUnmapped.map(t =>
          `${t.item_name} (${fmt(Math.round(t.amount_paid * 100))})`
        ).join(', ')}${topUnmapped.length < (report.unmapped_transactions || []).filter(t=>t.amount_paid>0).length ? ', …' : ''}</em>
      </td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Range Medical — Daily P&L ${report.report_date}</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; padding:32px 16px;">
    <tr><td>
      <table width="600" cellpadding="0" cellspacing="0" style="margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a; padding:24px 32px;">
            <div style="color:#94a3b8; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Range Medical</div>
            <div style="color:#ffffff; font-size:22px; font-weight:700;">Daily P&amp;L Report</div>
            <div style="color:#64748b; font-size:14px; margin-top:4px;">${dateLabel}</div>
          </td>
        </tr>

        <!-- Summary cards -->
        <tr>
          <td style="padding:24px 32px; background:#f8fafc; border-bottom:1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:25%; text-align:center; padding:0 8px;">
                  <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:4px;">Revenue</div>
                  <div style="font-size:24px; font-weight:700; color:#111827;">${revenue}</div>
                </td>
                <td style="width:25%; text-align:center; padding:0 8px; border-left:1px solid #e2e8f0;">
                  <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:4px;">COGS</div>
                  <div style="font-size:24px; font-weight:700; color:#374151;">${cogs}</div>
                </td>
                <td style="width:25%; text-align:center; padding:0 8px; border-left:1px solid #e2e8f0;">
                  <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:4px;">Gross Profit</div>
                  <div style="font-size:24px; font-weight:700; color:#111827;">${profit}</div>
                </td>
                <td style="width:25%; text-align:center; padding:0 8px; border-left:1px solid #e2e8f0;">
                  <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:4px;">Gross Margin</div>
                  <div style="font-size:24px; font-weight:700; color:${marginColor};">${margin}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Category breakdown -->
        <tr>
          <td style="padding:24px 32px 8px;">
            <div style="font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:12px;">By Category</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:8px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; border-bottom:2px solid #e2e8f0;">Category</th>
                  <th style="padding:8px 12px; text-align:right; font-size:11px; font-weight:600; color:#64748b; border-bottom:2px solid #e2e8f0;">Revenue</th>
                  <th style="padding:8px 12px; text-align:right; font-size:11px; font-weight:600; color:#64748b; border-bottom:2px solid #e2e8f0;">COGS</th>
                  <th style="padding:8px 12px; text-align:right; font-size:11px; font-weight:600; color:#64748b; border-bottom:2px solid #e2e8f0;">Profit</th>
                  <th style="padding:8px 12px; text-align:right; font-size:11px; font-weight:600; color:#64748b; border-bottom:2px solid #e2e8f0;">Margin</th>
                  <th style="padding:8px 12px; text-align:right; font-size:11px; font-weight:600; color:#64748b; border-bottom:2px solid #e2e8f0;">Txns</th>
                </tr>
              </thead>
              <tbody>
                ${catRows}
              </tbody>
              <!-- Totals row -->
              <tfoot>
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 12px; font-weight:700; color:#111827; border-top:2px solid #e2e8f0;">Total</td>
                  <td style="padding:10px 12px; text-align:right; font-weight:700; color:#111827; border-top:2px solid #e2e8f0;">${revenue}</td>
                  <td style="padding:10px 12px; text-align:right; font-weight:700; color:#6b7280; border-top:2px solid #e2e8f0;">${cogs}</td>
                  <td style="padding:10px 12px; text-align:right; font-weight:700; color:#111827; border-top:2px solid #e2e8f0;">${profit}</td>
                  <td style="padding:10px 12px; text-align:right; font-weight:700; color:${marginColor}; border-top:2px solid #e2e8f0;">${margin}</td>
                  <td style="padding:10px 12px; text-align:right; font-weight:700; color:#6b7280; border-top:2px solid #e2e8f0;">${report.mapped_transaction_count}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>

        <!-- Unmapped transactions -->
        ${unmappedRevenue > 0 ? `
        <tr>
          <td style="padding:16px 32px 8px;">
            <div style="background:#fefce8; border:1px solid #fde68a; border-radius:6px; padding:12px 16px;">
              <div style="font-size:12px; font-weight:600; color:#92400e; margin-bottom:6px;">
                ⚠️  ${report.unmapped_transactions.filter(t=>t.amount_paid>0).length} unmapped transactions — ${fmt(Math.round(unmappedRevenue * 100))} excluded from COGS
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${unmappedRows}
              </table>
              <div style="font-size:11px; color:#b45309; margin-top:6px;">
                These transactions have no COGS mapping yet. Check purchase_costs_lookup to improve coverage.
              </div>
            </div>
          </td>
        </tr>` : ''}

        <!-- Transaction stats footer -->
        <tr>
          <td style="padding:16px 32px 24px;">
            <div style="font-size:12px; color:#94a3b8; text-align:center;">
              ${report.transaction_count} total transactions &nbsp;·&nbsp;
              ${report.mapped_transaction_count} mapped (${mappingPct}%) &nbsp;·&nbsp;
              Generated ${new Date(report.generated_at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} PT
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a; padding:16px 32px; text-align:center;">
            <div style="font-size:11px; color:#475569;">Range Medical &nbsp;·&nbsp; Newport Beach, CA &nbsp;·&nbsp; Internal Use Only</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// Plain-text fallback for email clients that don't render HTML
function buildEmailText(report) {
  const lines = [
    `RANGE MEDICAL — Daily P&L Report`,
    `Date: ${report.report_date}`,
    `${'='.repeat(50)}`,
    `Revenue:       ${fmt(report.total_revenue_cents)}`,
    `COGS:          ${fmt(report.total_cogs_cents)}`,
    `Gross Profit:  ${fmt(report.total_revenue_cents - report.total_cogs_cents)}`,
    `Gross Margin:  ${fmtPct(report.gross_margin_pct)}`,
    ``,
    `BY CATEGORY`,
    `${'─'.repeat(50)}`,
  ];

  const sorted = Object.entries(report.by_category || {})
    .sort((a, b) => b[1].revenue_cents - a[1].revenue_cents);

  for (const [cat, data] of sorted) {
    const label = (CAT_LABELS[cat] || cat).padEnd(22);
    lines.push(`${label}  ${fmt(data.revenue_cents).padStart(10)}  margin ${fmtPct(data.gross_margin_pct)}`);
  }

  lines.push(`${'─'.repeat(50)}`);
  lines.push(`${'Total'.padEnd(22)}  ${fmt(report.total_revenue_cents).padStart(10)}  margin ${fmtPct(report.gross_margin_pct)}`);

  const unmappedRev = (report.unmapped_transactions || [])
    .reduce((s, t) => s + (parseFloat(t.amount_paid) || 0), 0);

  if (unmappedRev > 0) {
    lines.push(``, `⚠  ${(report.unmapped_transactions || []).filter(t=>t.amount_paid>0).length} unmapped transactions (${fmt(Math.round(unmappedRev * 100))} excluded from COGS)`);
  }

  lines.push(``, `${report.transaction_count} total transactions · ${report.mapped_transaction_count} mapped`);

  return lines.join('\n');
}

// ── Resend API sender ──────────────────────────────────────────────────────

async function sendViaResend(subject, html, text) {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    DIGEST_FROM,
      to:      DIGEST_TO,
      subject,
      html,
      text,
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(`Resend API error ${res.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

// ── Core digest logic ──────────────────────────────────────────────────────

async function sendDigest(targetDate) {
  console.log(`\n📧  Sending digest for ${targetDate}…`);

  // Pull the saved report
  const { data: rows, error } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('report_date', targetDate)
    .limit(1);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);

  if (!rows || rows.length === 0) {
    throw new Error(`No report found for ${targetDate}. Run generate-report.js first.`);
  }

  const report = rows[0];

  // Build and send email
  const subject = `Range Medical P&L — ${report.report_date}  ·  ${fmt(report.total_revenue_cents)} rev  ·  ${fmtPct(report.gross_margin_pct)} margin`;
  const html    = buildEmailHtml(report);
  const text    = buildEmailText(report);

  console.log(`    Subject: ${subject}`);
  console.log(`    To: ${DIGEST_TO.join(', ')}`);

  const result = await sendViaResend(subject, html, text);

  // Mark as sent in DB
  await supabase
    .from('daily_reports')
    .update({ sent_at: new Date().toISOString() })
    .eq('report_date', targetDate);

  console.log(`    ✅  Email sent (id: ${result.id})\n`);
  return result;
}

// ── Date helper (mirrors generate-report.js) ──────────────────────────────

function getYesterday() {
  const pacific = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  pacific.setDate(pacific.getDate() - 1);
  return pacific.toISOString().slice(0, 10);
}

// ── CLI entry point ────────────────────────────────────────────────────────

const targetDate = process.argv[2] || getYesterday();

sendDigest(targetDate)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌  Digest send failed:', err.message);
    process.exit(1);
  });

module.exports = { sendDigest };
