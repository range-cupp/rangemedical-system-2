#!/usr/bin/env node
/**
 * Range Medical — Daily P&L Report Generator
 *
 * Queries purchase_revenue_with_cogs for a target date, resolves COGS from
 * costs.json, aggregates by category, and upserts a row to daily_reports.
 *
 * Usage:
 *   node generate-report.js [YYYY-MM-DD]
 *
 *   If no date is supplied, defaults to yesterday (Pacific time).
 *
 * Required env vars:
 *   SUPABASE_URL          – https://your-project.supabase.co
 *   SUPABASE_SERVICE_KEY  – service-role key (not anon key)
 *
 * Optional env vars:
 *   COSTS_JSON_PATH  – override path to costs.json
 *                      default: ../pricing/costs 2.json (relative to this file)
 *   TZ               – set to 'America/Los_Angeles' to keep dates in Pacific time
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

// ── Config ─────────────────────────────────────────────────────────────────

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const COSTS_JSON_PATH     = process.env.COSTS_JSON_PATH
  || path.join(__dirname, '..', 'pricing', 'costs 2.json');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── costs.json loader ──────────────────────────────────────────────────────

/**
 * Loads costs.json (which uses JS-style // comments) and returns a
 * flat { [id]: entry } map for O(1) lookup during report generation.
 */
function loadCosts() {
  const raw  = fs.readFileSync(COSTS_JSON_PATH, 'utf8');
  const clean = raw.replace(/\/\/[^\n]*/g, ''); // strip // comments
  const data  = JSON.parse(clean);

  const map = {};
  if (Array.isArray(data.costs)) {
    for (const entry of data.costs) {
      if (entry && entry.id) map[entry.id] = entry;
    }
  }
  return map;
}

/**
 * Resolves the best available COGS value for a costs.json entry.
 *
 * Priority:
 *   1. cost_variants.pyxis  (if present — pyxis is primary supplier)
 *   2. cost_variants.anazao (backup supplier)
 *   3. entry.cogs           (standard single-supplier entries)
 */
function resolveCogs(entry) {
  if (!entry) return null;

  if (entry.cost_variants) {
    const v = entry.cost_variants.pyxis ?? entry.cost_variants.anazao;
    if (v && v.cogs != null) return parseFloat(v.cogs);
  }

  if (entry.cogs != null) return parseFloat(entry.cogs);
  return null;
}

// ── Category mapping ───────────────────────────────────────────────────────

const CATEGORY_MAP = [
  ['pep-',            'peptides'],
  ['wl-',             'weight_loss'],
  ['inj-nad-',        'nad_injection'],
  ['inj-',            'injections'],
  ['iv-nad-',         'iv_nad'],
  ['iv-vitc-',        'iv_vitc'],
  ['iv-glutathione-', 'iv_glutathione'],
  ['iv-methylene-',   'iv_mb'],
  ['iv-mb-',          'iv_mb'],
  ['iv-',             'iv_standard'],
  ['hbot-',           'hbot'],
  ['rlt-',            'red_light'],
  ['combo-',          'combo'],
  ['prp-',            'prp'],
  ['hrt-',            'hrt'],
  ['lab-',            'labs'],
  ['pkg-',            'packages'],
  ['other-',          'other'],
];

function categoryFromId(costsId) {
  if (!costsId) return 'other';
  for (const [prefix, cat] of CATEGORY_MAP) {
    if (costsId.startsWith(prefix)) return cat;
  }
  return 'other';
}

// ── Date helpers ───────────────────────────────────────────────────────────

/** Returns yesterday's date in YYYY-MM-DD, in Pacific time. */
function getYesterday() {
  const now = new Date();
  // Offset Pacific Standard Time (-8h) — works well for a morning cron.
  // For production, set TZ=America/Los_Angeles in the process environment.
  const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  pacific.setDate(pacific.getDate() - 1);
  return pacific.toISOString().slice(0, 10);
}

/** ISO 8601 date range (midnight-to-midnight Pacific) for a given YYYY-MM-DD. */
function pacificDayRange(date) {
  // Build the range as explicit UTC offsets so the query works regardless of
  // the server's local timezone.
  return {
    start: `${date}T00:00:00-08:00`,
    end:   `${date}T23:59:59-08:00`,
  };
}

// ── Core report logic ──────────────────────────────────────────────────────

async function generateReport(targetDate) {
  console.log(`\n📊  Generating P&L report for ${targetDate}…`);

  // 1. Load COGS data
  const costsMap = loadCosts();
  console.log(`    Loaded ${Object.keys(costsMap).length} cost entries from costs.json`);

  // 2. Pull Stripe purchases for the target date (stripe_pos + payment_link)
  const { start, end } = pacificDayRange(targetDate);
  const { data: purchases, error: queryError } = await supabase
    .from('purchase_revenue_with_cogs')
    .select('id, item_name, amount_paid, source, costs_id, costs_id_confidence, is_mapped, service_category')
    .in('source', ['stripe_pos', 'payment_link'])
    .gte('created_at', start)
    .lte('created_at', end);

  if (queryError) {
    throw new Error(`Supabase query failed: ${queryError.message}`);
  }

  console.log(`    Found ${purchases.length} transactions`);

  // 3. Aggregate P&L
  const byCategory   = {};    // { [category]: { revenue_cents, cogs_cents, count } }
  const unmapped     = [];    // transactions we could not resolve COGS for
  let totalRevenue   = 0;
  let totalCogs      = 0;
  let mappedCount    = 0;

  for (const txn of purchases) {
    const revenue = parseFloat(txn.amount_paid) || 0;
    totalRevenue += revenue;

    if (!txn.is_mapped || !txn.costs_id) {
      unmapped.push({
        item_name:  txn.item_name,
        source:     txn.source,
        amount_paid: revenue,
      });
      continue;
    }

    const entry = costsMap[txn.costs_id];
    const cogs  = resolveCogs(entry);

    if (cogs == null) {
      // Mapped to a costs_id that has no COGS value yet (e.g., wl-semaglutide)
      unmapped.push({
        item_name:  txn.item_name,
        source:     txn.source,
        amount_paid: revenue,
        costs_id:   txn.costs_id,
        note:       'costs_id resolved but COGS not yet entered in costs.json',
      });
      continue;
    }

    mappedCount++;
    totalCogs += cogs;

    const cat = categoryFromId(txn.costs_id);
    if (!byCategory[cat]) {
      byCategory[cat] = { revenue_cents: 0, cogs_cents: 0, count: 0 };
    }
    byCategory[cat].revenue_cents += Math.round(revenue * 100);
    byCategory[cat].cogs_cents    += Math.round(cogs * 100);
    byCategory[cat].count         += 1;
  }

  // 4. Compute summary figures
  const grossProfit    = totalRevenue - totalCogs;
  const grossMarginPct = totalRevenue > 0
    ? Math.round((grossProfit / totalRevenue) * 10000) / 100
    : null;

  // Add gross_profit_cents and margin to each category for the email digest
  for (const cat of Object.values(byCategory)) {
    cat.gross_profit_cents = cat.revenue_cents - cat.cogs_cents;
    cat.gross_margin_pct   = cat.revenue_cents > 0
      ? Math.round((cat.gross_profit_cents / cat.revenue_cents) * 10000) / 100
      : null;
  }

  const report = {
    report_date:              targetDate,
    total_revenue_cents:      Math.round(totalRevenue * 100),
    total_cogs_cents:         Math.round(totalCogs * 100),
    gross_margin_pct:         grossMarginPct,
    transaction_count:        purchases.length,
    mapped_transaction_count: mappedCount,
    by_category:              byCategory,
    unmapped_transactions:    unmapped,
    generated_at:             new Date().toISOString(),
  };

  // 5. Upsert into daily_reports (replace if re-run for same date)
  const { error: upsertError } = await supabase
    .from('daily_reports')
    .upsert(report, { onConflict: 'report_date' });

  if (upsertError) {
    throw new Error(`Failed to save report: ${upsertError.message}`);
  }

  // 6. Console summary
  const fmt    = (cents)   => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const fmtPct = (pct)     => pct != null ? `${pct.toFixed(1)}%` : 'n/a';
  const mappingPct = purchases.length > 0
    ? Math.round((mappedCount / purchases.length) * 100)
    : 0;

  console.log(`\n${'─'.repeat(48)}`);
  console.log(`  Range Medical  ·  P&L Report  ·  ${targetDate}`);
  console.log(`${'─'.repeat(48)}`);
  console.log(`  Revenue       ${fmt(report.total_revenue_cents).padStart(12)}`);
  console.log(`  COGS          ${fmt(report.total_cogs_cents).padStart(12)}`);
  console.log(`  Gross Profit  ${fmt(report.total_revenue_cents - report.total_cogs_cents).padStart(12)}`);
  console.log(`  Gross Margin  ${fmtPct(grossMarginPct).padStart(12)}`);
  console.log(`${'─'.repeat(48)}`);
  console.log(`  Transactions  ${String(purchases.length).padStart(12)}`);
  console.log(`  Mapped        ${String(mappedCount).padStart(12)}  (${mappingPct}%)`);
  console.log(`  Unmapped      ${String(unmapped.length).padStart(12)}`);

  if (Object.keys(byCategory).length > 0) {
    console.log(`\n  By category:`);
    const sorted = Object.entries(byCategory).sort((a, b) => b[1].revenue_cents - a[1].revenue_cents);
    for (const [cat, data] of sorted) {
      console.log(`    ${cat.padEnd(18)}  ${fmt(data.revenue_cents).padStart(10)}  margin ${fmtPct(data.gross_margin_pct)}`);
    }
  }

  console.log(`${'─'.repeat(48)}\n`);
  console.log(`  ✅  Saved to daily_reports (report_date: ${targetDate})\n`);

  return report;
}

// ── CLI entry point ────────────────────────────────────────────────────────

const targetDate = process.argv[2] || getYesterday();

// Validate date format
if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
  console.error(`❌  Invalid date: "${targetDate}". Expected YYYY-MM-DD.`);
  process.exit(1);
}

generateReport(targetDate)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌  Report generation failed:', err.message);
    process.exit(1);
  });

module.exports = { generateReport };
