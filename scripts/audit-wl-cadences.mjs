import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const { data, error } = await supabase
  .from('protocols')
  .select('id, patient_id, frequency, selected_dose, status, start_date, end_date, patients(name)')
  .ilike('program_type', 'weight_loss%')
  .eq('status', 'active');

if (error) { console.error(error); process.exit(1); }

const byFreq = {};
for (const p of data) {
  const key = p.frequency || '(null)';
  byFreq[key] = byFreq[key] || [];
  byFreq[key].push(p);
}

console.log(`Total ACTIVE weight loss protocols: ${data.length}\n`);
const sortedKeys = Object.keys(byFreq).sort((a, b) => byFreq[b].length - byFreq[a].length);
for (const k of sortedKeys) {
  console.log(`\n=== frequency = "${k}"  (${byFreq[k].length} protocol${byFreq[k].length > 1 ? 's' : ''}) ===`);
  for (const p of byFreq[k]) {
    console.log(`  ${p.patients?.name?.padEnd(30) || 'Unknown'.padEnd(30)}  dose=${p.selected_dose || '?'}  ${p.start_date}→${p.end_date}`);
  }
}
