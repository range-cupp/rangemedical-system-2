// Backfill dose_history for Claudia Rangel's Retatrutide WL protocol.
//
// Service log shows 4 dose tiers across the same protocol:
//   2026-02-02: 2mg  (starting dose)
//   2026-02-24: 4mg
//   2026-03-24: 6mg
//   2026-04-28: 8mg  (Lily's encounter note today, provider-approved retroactively)
//
// dose_history is currently [] because the increases bypassed the
// /api/protocols/[id]/dose-change endpoint (the only place that appends to
// dose_history). We seed all four entries here so the medical audit trail
// matches reality. The protocol stays one continuous record — selected_dose
// remains 8mg, no new protocol rows are created.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PROTOCOL_ID = '18c239dc-b81a-4b43-8038-f19441f0e2fc';

const doseHistory = [
  {
    date: '2026-02-02',
    dose: '2mg',
    injections_per_week: 1,
    notes: 'Starting dose',
  },
  {
    date: '2026-02-24',
    dose: '4mg',
    injections_per_week: 1,
    notes: 'Dose increase 2mg → 4mg (backfilled from service log audit)',
  },
  {
    date: '2026-03-24',
    dose: '6mg',
    injections_per_week: 1,
    notes: 'Dose increase 4mg → 6mg (backfilled from service log audit)',
  },
  {
    date: '2026-04-28',
    dose: '8mg',
    injections_per_week: 1,
    notes: 'Dose increase 6mg → 8mg — provider-approved retroactively (Lily encounter note 2026-04-28; flagged the workflow gap that allowed this)',
  },
];

const { data: before } = await supabase
  .from('protocols')
  .select('id, medication, selected_dose, dose_history')
  .eq('id', PROTOCOL_ID)
  .single();

console.log('BEFORE:');
console.log('  selected_dose:', before.selected_dose);
console.log('  dose_history:', JSON.stringify(before.dose_history));
console.log();

if (Array.isArray(before.dose_history) && before.dose_history.length > 0) {
  console.error('Refusing to overwrite — dose_history is already populated:');
  console.error(JSON.stringify(before.dose_history, null, 2));
  process.exit(1);
}

const { data: updated, error } = await supabase
  .from('protocols')
  .update({
    dose_history: doseHistory,
    updated_at: new Date().toISOString(),
  })
  .eq('id', PROTOCOL_ID)
  .select('id, medication, selected_dose, dose_history')
  .single();

if (error) {
  console.error('Update failed:', error);
  process.exit(1);
}

console.log('AFTER:');
console.log('  selected_dose:', updated.selected_dose);
console.log('  dose_history:');
updated.dose_history.forEach((entry, i) => {
  console.log(`    [${i}] ${entry.date}  ${entry.dose.padEnd(5)} ${entry.injections_per_week}x/wk — ${entry.notes}`);
});
