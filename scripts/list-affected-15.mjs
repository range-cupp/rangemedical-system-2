import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PROTO_IDS = [
  '663b4f53-0779-4ff8-8e0c-d9c8e9a5921d',
  '7e106f54-d783-4665-ad89-d78449a5968b',
  '065dda4f-0945-4ef1-8a58-ba54c02d3435',
  '0c8927e9-5b5e-4945-a409-55da4630108e',
  'b224560f-e9c0-4535-8707-957979c83da9',
  '3b396c32-11ec-47c5-8620-7b06672cda33',
  '89c2230f-1c25-4188-8903-88aa8e0274b3',
  'e674906a-5163-4ea2-a0e7-52571d2d761f',
  '3251c22e-e3a1-400f-a895-b07c627d74b1',
  'd878904d-aa70-4e91-b923-abf9992ca19e',
  '32320048-70e2-4b27-ac3b-27e01423ca2e',
  '1df382a2-68d1-4526-9c90-94d0e5106b3e',
  'fded5d85-1711-4915-96a0-cb74767b2d60',
  '9dec5330-6220-4029-9f1f-a579abd6ebe3',
  'b659be77-1c59-4d75-ae30-b13274765bb5',
];

const { data: protos } = await supabase
  .from('protocols')
  .select('id, patient_id, program_type, medication, sessions_used, total_sessions, status')
  .in('id', PROTO_IDS);

const patientIds = [...new Set(protos.map(p => p.patient_id))];
const { data: patients } = await supabase
  .from('patients')
  .select('id, first_name, last_name')
  .in('id', patientIds);
const byId = Object.fromEntries(patients.map(p => [p.id, `${p.first_name} ${p.last_name}`]));

console.log('15 protocols affected by the backfill cleanup:\n');
console.log('| Patient                  | Program       | Med           | Sessions  | Status   |');
console.log('|--------------------------|---------------|---------------|-----------|----------|');
for (const p of protos.sort((a,b) => (byId[a.patient_id] || '').localeCompare(byId[b.patient_id] || ''))) {
  const name = (byId[p.patient_id] || '?').padEnd(24);
  const prog = (p.program_type || '').padEnd(13);
  const med = (p.medication || '-').padEnd(13);
  const sessions = `${p.sessions_used}/${p.total_sessions}`.padEnd(9);
  console.log(`| ${name} | ${prog} | ${med} | ${sessions} | ${p.status} |`);
}
