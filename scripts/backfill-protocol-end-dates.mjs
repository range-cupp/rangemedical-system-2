#!/usr/bin/env node
// Recompute end_date for active non-HRT protocols using sessions + frequency.
//
// Usage:
//   node scripts/backfill-protocol-end-dates.mjs           # dry run
//   node scripts/backfill-protocol-end-dates.mjs --apply   # actually update
//
// Skips HRT (billing-cycle) and weight_loss (dose-group-based). Only updates
// when the stored end_date drifts from the derived value by more than 7 days.

import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

// Inlined copy of getDosesPerWeek / calculateProtocolDurationDays so this
// script can run without a build step. Mirror lib/protocol-config.js.
function getDosesPerWeek(frequency) {
  if (!frequency) return null;
  const f = String(frequency).toLowerCase().trim();
  if (f.includes('3x daily') || f.includes('3 times daily') || f.includes('tid')) return 21;
  if (f.includes('2x daily') || f.includes('twice daily') || f.includes('bid')) return 14;
  if (f === 'daily' || f === '7 days a week' || f.startsWith('1x daily') || f.includes('once daily') || f.includes('every day')) return 7;
  if (f.includes('5 on') || f.includes('5on') || f.includes('5 days on')) return 5;
  if (f.includes('every other day') || f.includes('eod')) return 3.5;
  const everyNMatch = f.match(/every\s+(\d+)\s*day/);
  if (everyNMatch) {
    const n = parseInt(everyNMatch[1]);
    if (n > 0) return 7 / n;
  }
  const perWeekMatch = f.match(/(\d+)(?:\s*-\s*\d+)?\s*x?\s*(?:per|\/|\s+a)\s*week/);
  if (perWeekMatch) return parseInt(perWeekMatch[1]);
  if (f === 'weekly' || f.includes('once weekly') || f.includes('once a week') || f.includes('1x per week')) return 1;
  if (f.includes('every 2 week') || f.includes('biweekly') || f.includes('every other week')) return 0.5;
  return null;
}

function calculateProtocolDurationDays(totalDoses, frequency) {
  const doses = parseInt(totalDoses);
  if (!doses || doses <= 0) return null;
  const dpw = getDosesPerWeek(frequency);
  if (!dpw || dpw <= 0) return null;
  return Math.ceil((doses / dpw) * 7);
}

// Peptides are intentionally excluded — their "frequency" field contains custom
// cycle descriptors ("Every 5 days x 20 days (3x/yr)", "5 on / 2 off") that the
// generic dpw parser can't interpret reliably. Peptide end_dates come from
// their catalog duration + phase logic in auto-protocol.js.
const ELIGIBLE_TYPES = ['injection', 'nad_injection', 'hbot', 'rlt', 'iv'];

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(a, b) {
  const ms = new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00');
  return Math.round(ms / 86400000);
}

const { data: protocols, error } = await supabase
  .from('protocols')
  .select('id, patient_name, program_type, medication, total_sessions, num_vials, doses_per_vial, frequency, start_date, end_date, status')
  .in('program_type', ELIGIBLE_TYPES)
  .in('status', ['active', 'queued'])
  .not('start_date', 'is', null)
  .order('start_date', { ascending: false });

if (error) {
  console.error('Query failed:', error.message);
  process.exit(1);
}

console.log(`Scanned ${protocols.length} active/queued protocols.\n`);

const drifted = [];
for (const p of protocols) {
  let totalDoses = p.total_sessions;
  if (!totalDoses && p.num_vials && p.doses_per_vial) {
    totalDoses = p.num_vials * p.doses_per_vial;
  }
  if (!totalDoses || !p.frequency) continue;

  const correctDays = calculateProtocolDurationDays(totalDoses, p.frequency);
  if (!correctDays) continue;

  const correctEnd = addDays(p.start_date, correctDays);
  const actualSpan = p.end_date ? daysBetween(p.start_date, p.end_date) : null;
  const drift = actualSpan === null ? null : Math.abs(actualSpan - correctDays);

  if (p.end_date === correctEnd) continue;
  if (drift !== null && drift <= 7) continue;

  drifted.push({
    id: p.id,
    patient: p.patient_name || '(unknown)',
    type: p.program_type,
    med: p.medication || '',
    sessions: totalDoses,
    freq: p.frequency,
    start: p.start_date,
    stored_end: p.end_date,
    correct_end: correctEnd,
    drift_days: drift,
  });
}

if (drifted.length === 0) {
  console.log('No protocols with end_date drift > 7 days. Nothing to do.');
  process.exit(0);
}

console.log(`Found ${drifted.length} protocols with end_date drift:\n`);
for (const d of drifted) {
  console.log(
    `  ${d.id.slice(0, 8)} · ${String(d.patient).padEnd(24)} · ${d.type.padEnd(14)} · ` +
    `${d.sessions} @ ${d.freq} · ${d.start} → ${d.stored_end}  (should be ${d.correct_end}, off by ${d.drift_days}d)`
  );
}

if (!APPLY) {
  console.log(`\nDry run. Re-run with --apply to update ${drifted.length} protocols.`);
  process.exit(0);
}

console.log(`\nApplying updates...`);
let ok = 0, fail = 0;
for (const d of drifted) {
  const { error: updErr } = await supabase
    .from('protocols')
    .update({ end_date: d.correct_end, updated_at: new Date().toISOString() })
    .eq('id', d.id);
  if (updErr) { console.error(`  FAIL ${d.id}: ${updErr.message}`); fail++; }
  else ok++;
}
console.log(`\nDone. Updated ${ok}, failed ${fail}.`);
