// Brian Wallin and Catherine Loquet had frequency="Monthly" (a billing label
// inherited from their service name) but they are actually on weekly in-clinic
// injections. Set frequency="Weekly" and delivery_method="in_clinic" so the
// schedule projects on a 7-day cadence and the take-home check-in cron
// correctly excludes them.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

console.log('=== Before ===');
const { data: before } = await supabase
  .from('protocols')
  .select('id, frequency, delivery_method, status, start_date, end_date, selected_dose, patients(name)')
  .ilike('program_type', 'weight_loss%')
  .eq('frequency', 'Monthly');
for (const p of before || []) {
  console.log(`  ${p.patients?.name?.padEnd(25)}  ${p.id}  ${p.selected_dose}  ${p.status}  delivery=${p.delivery_method || 'null'}`);
}

const ids = (before || []).map(p => p.id);
if (ids.length === 0) {
  console.log('No "Monthly" WL protocols found — nothing to update.');
  process.exit(0);
}

console.log(`\n=== Updating ${ids.length} protocol(s) → Weekly + in_clinic ===`);
const { data: updated, error } = await supabase
  .from('protocols')
  .update({ frequency: 'Weekly', delivery_method: 'in_clinic', updated_at: new Date().toISOString() })
  .in('id', ids)
  .select('id, frequency, delivery_method, patients(name)');

if (error) {
  console.error('error:', error.message);
  process.exit(1);
}
for (const p of updated || []) {
  console.log(`  ✓ ${p.patients?.name?.padEnd(25)}  ${p.id}  →  ${p.frequency}, ${p.delivery_method}`);
}
