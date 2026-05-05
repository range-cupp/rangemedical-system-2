// Re-render the spawn-backfill recounts with patient names instead of IDs.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const data = JSON.parse(readFileSync('/tmp/spawn.json', 'utf8'));
const recounts = data.recounts;

// The endpoint returned 8-char prefixes. Resolve each by joining via the
// protocol_id (also a prefix) → full protocol → full patient.
const shortProtoIds = [...new Set(recounts.map(r => r.protocol_id))];
const { data: allProtos } = await supabase
  .from('protocols')
  .select('id, patient_id')
  .eq('program_type', 'weight_loss');

const protoByShort = {};
for (const p of allProtos) {
  const short = p.id.substring(0, 8);
  if (shortProtoIds.includes(short)) protoByShort[short] = p;
}

const fullPids = [...new Set(Object.values(protoByShort).map(p => p.patient_id))];
const { data: patients } = await supabase
  .from('patients')
  .select('id, first_name, last_name')
  .in('id', fullPids);
const nameByPid = Object.fromEntries(patients.map(p => [p.id, `${p.first_name} ${p.last_name}`]));

const byShort = {};
for (const r of recounts) {
  const proto = protoByShort[r.protocol_id];
  byShort[r.patient_id] = proto ? nameByPid[proto.patient_id] : null;
}

// Sort by delta size (descending)
recounts.sort((a, b) => (b.after - b.before) - (a.after - a.before));

console.log('| Patient                  | Before → After / Total | Δ   | Status         |');
console.log('|--------------------------|------------------------|-----|----------------|');
for (const r of recounts) {
  const name = (byShort[r.patient_id] || `?? ${r.patient_id}`).padEnd(24);
  const ba = `${r.before} → ${r.after} / ${r.total}`.padEnd(22);
  const delta = `+${r.after - r.before}`.padEnd(3);
  let status = '';
  if (r.after > r.total) status = '⚠️ Payment Due';
  else if (r.after === r.total) status = '✓ paid up exact';
  else status = `${r.total - r.after} remaining`;
  console.log(`| ${name} | ${ba} | ${delta} | ${status.padEnd(14)} |`);
}
console.log(`\nTotal protocols: ${recounts.length}`);
