// List protocols touched by the last backfill (159 syncs).
// Strategy: find service_logs whose note_id was set within the recent
// backfill window (last 30 min), join up to protocol + patient.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

// Service logs updated recently with a note_id linkage
const { data: logs } = await supabase
  .from('service_logs')
  .select('id, protocol_id, patient_id, entry_date, dosage, note_id, updated_at')
  .gte('updated_at', since)
  .not('note_id', 'is', null)
  .order('updated_at');

console.log(`service_logs touched in last 30 min with note_id: ${logs?.length || 0}\n`);

const byProtocol = new Map();
for (const l of logs || []) {
  if (!byProtocol.has(l.protocol_id)) byProtocol.set(l.protocol_id, { rows: [], patient_id: l.patient_id });
  byProtocol.get(l.protocol_id).rows.push(l);
}

const protoIds = [...byProtocol.keys()].filter(Boolean);
const { data: protos } = await supabase
  .from('protocols')
  .select('id, patient_id, program_type, medication, sessions_used, total_sessions, status')
  .in('id', protoIds);

const patientIds = [...new Set(protos.map(p => p.patient_id))];
const { data: patients } = await supabase
  .from('patients')
  .select('id, first_name, last_name')
  .in('id', patientIds);
const byPid = Object.fromEntries(patients.map(p => [p.id, `${p.first_name} ${p.last_name}`]));

console.log(`Protocols affected: ${protos.length}\n`);
console.log('| Patient                  | Program       | Sessions  | Touched | Status   |');
console.log('|--------------------------|---------------|-----------|---------|----------|');
const sorted = protos.sort((a,b) => (byPid[a.patient_id]||'').localeCompare(byPid[b.patient_id]||''));
for (const p of sorted) {
  const name = (byPid[p.patient_id] || '?').padEnd(24);
  const prog = (p.program_type || '').padEnd(13);
  const sessions = `${p.sessions_used}/${p.total_sessions}`.padEnd(9);
  const touched = String(byProtocol.get(p.id).rows.length).padEnd(7);
  console.log(`| ${name} | ${prog} | ${sessions} | ${touched} | ${p.status} |`);
}
