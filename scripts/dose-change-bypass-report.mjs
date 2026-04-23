// /scripts/dose-change-bypass-report.mjs
// One-shot: list every WL/HRT dose change in the last N days that did NOT go
// through the approval flow (i.e. no matching dose_change_requests row).
// Emits a ratification list that Burgess can review.
//
// Usage:
//   node scripts/dose-change-bypass-report.mjs [--days=60]

import { createClient } from '@supabase/supabase-js';

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const daysArg = process.argv.find((a) => a.startsWith('--days='));
const DAYS = daysArg ? parseInt(daysArg.split('=')[1]) : 60;
const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

// 1. All dose_change log rows from protocol_logs
const { data: logs, error } = await s
  .from('protocol_logs')
  .select('id, protocol_id, patient_id, log_type, log_date, dose, notes, logged_by, created_at')
  .in('log_type', ['dose_change', 'dose_change_blocked'])
  .gte('created_at', since)
  .order('created_at', { ascending: false });

if (error) {
  console.error(error);
  process.exit(1);
}

if (!logs || logs.length === 0) {
  console.log(`No dose changes in the last ${DAYS} days.`);
  process.exit(0);
}

// 2. Load protocols + patients for context
const protocolIds = [...new Set(logs.map((l) => l.protocol_id))];
const patientIds = [...new Set(logs.map((l) => l.patient_id))];

const { data: protocols } = await s
  .from('protocols')
  .select('id, program_type, medication, selected_dose')
  .in('id', protocolIds);
const protoById = Object.fromEntries((protocols || []).map((p) => [p.id, p]));

const { data: patients } = await s
  .from('patients')
  .select('id, name')
  .in('id', patientIds);
const patientById = Object.fromEntries((patients || []).map((p) => [p.id, p]));

// 3. Cross-reference with dose_change_requests to mark which were properly approved
const { data: requests } = await s
  .from('dose_change_requests')
  .select('id, protocol_id, proposed_dose, status, approved_at, applied_at')
  .in('protocol_id', protocolIds)
  .gte('created_at', since);

const approvedByProtocol = {};
for (const r of requests || []) {
  if (!['approved', 'applied'].includes(r.status)) continue;
  if (!approvedByProtocol[r.protocol_id]) approvedByProtocol[r.protocol_id] = [];
  approvedByProtocol[r.protocol_id].push(r);
}

// 4. Filter WL/HRT protocols and detect bypasses
const normalize = (x) => (x == null ? '' : String(x).trim().toLowerCase().replace(/\s+/g, ''));
const isWL = (pt) => pt && pt.toLowerCase().includes('weight_loss');
const isHRT = (pt) => pt && (pt.toLowerCase() === 'hrt' || pt.toLowerCase().includes('hrt'));

const rows = [];
for (const log of logs) {
  const proto = protoById[log.protocol_id];
  if (!proto) continue;
  const wl = isWL(proto.program_type);
  const hrt = isHRT(proto.program_type);
  if (!wl && !hrt) continue;

  const approvals = approvedByProtocol[log.protocol_id] || [];
  const matchedApproval = approvals.find(
    (a) => normalize(a.proposed_dose) === normalize(log.dose)
  );

  rows.push({
    when: log.created_at.slice(0, 10),
    patient: patientById[log.patient_id]?.name || '(unknown)',
    program: wl ? 'WL' : 'HRT',
    medication: proto.medication || '',
    new_dose: log.dose,
    logged_by: log.logged_by,
    log_type: log.log_type,
    approved: !!matchedApproval,
    approval_status: matchedApproval?.status || null,
    note_excerpt: (log.notes || '').slice(0, 140).replace(/\n/g, ' '),
  });
}

// 5. Output
const bypassed = rows.filter((r) => !r.approved);
const approved = rows.filter((r) => r.approved);

console.log('='.repeat(80));
console.log(`DOSE CHANGE BYPASS REPORT — last ${DAYS} days`);
console.log('='.repeat(80));
console.log(`Total WL/HRT dose-change log entries: ${rows.length}`);
console.log(`  Went through approval:  ${approved.length}`);
console.log(`  BYPASSED approval:      ${bypassed.length}`);
console.log('');

if (bypassed.length === 0) {
  console.log('No bypassed dose changes. System healthy.');
  process.exit(0);
}

console.log('BYPASSED (need Burgess ratification):');
console.log('-'.repeat(80));
for (const r of bypassed) {
  console.log(`${r.when} | ${r.program} | ${r.patient} | ${r.medication} → ${r.new_dose}`);
  console.log(`  by ${r.logged_by}  [${r.log_type}]`);
  if (r.note_excerpt) console.log(`  "${r.note_excerpt}..."`);
  console.log('');
}

// Also emit JSON for tooling
const outPath = `/tmp/dose-change-bypass-report-${new Date().toISOString().slice(0, 10)}.json`;
await import('fs').then((fs) =>
  fs.writeFileSync(outPath, JSON.stringify({ days: DAYS, bypassed, approved }, null, 2))
);
console.log(`JSON: ${outPath}`);
