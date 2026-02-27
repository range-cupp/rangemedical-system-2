// =====================================================
// FIX: Rachel Snyder - Duplicate weight check-in & session count
// CREATED: 2026-02-26
//
// Data found:
//   - protocol_logs has a "checkin" entry with weight 156 on 2026-02-26
//   - service_logs has an "injection" entry with weight 156 on 2026-02-26
//   - Command Center shows 156 lbs twice because both tables are queried
//   - sessions_used=1, total_sessions=8 — should be 8 and 12
//
// Fix:
//   1. Delete the protocol_logs "checkin" entry (duplicate weight source)
//   2. Update sessions_used=8, total_sessions=12 on the protocol
// =====================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://teivfptpozltpqwahgdl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PROTOCOL_ID = 'd51a8e52-639a-4f9b-af7e-b1080ec1aff5';
const PATIENT_ID = 'cf842714-f64a-4bcc-9bbe-3757b54d0547';
const DUPLICATE_CHECKIN_ID = '65de3b2e-16a4-492f-bdf3-da2b3ac986e2';

// ─── FIX 1: Delete duplicate protocol_logs checkin ────────────

console.log('FIX 1: Deleting duplicate protocol_logs checkin entry...');
console.log(`  ID: ${DUPLICATE_CHECKIN_ID} (checkin, weight=156, 2026-02-26)\n`);

const { error: deleteErr } = await supabase
  .from('protocol_logs')
  .delete()
  .eq('id', DUPLICATE_CHECKIN_ID);

if (deleteErr) {
  console.error('  ERROR:', deleteErr);
  process.exit(1);
}
console.log('  Done.\n');

// ─── FIX 2: Update session count on protocol ─────────────────

console.log('FIX 2: Updating protocol session counts...');
console.log('  sessions_used: 1 → 8');
console.log('  total_sessions: 8 → 12\n');

const { error: updateErr } = await supabase
  .from('protocols')
  .update({
    sessions_used: 8,
    total_sessions: 12,
    updated_at: new Date().toISOString()
  })
  .eq('id', PROTOCOL_ID);

if (updateErr) {
  console.error('  ERROR:', updateErr);
  process.exit(1);
}
console.log('  Done.\n');

// ─── VERIFICATION ─────────────────────────────────────────────

console.log('VERIFICATION:\n');

// Check protocol
const { data: proto } = await supabase
  .from('protocols')
  .select('sessions_used, total_sessions, status')
  .eq('id', PROTOCOL_ID);

const p = proto?.[0];
console.log('Protocol:');
console.log(`  sessions_used: ${p?.sessions_used} (expected 8)`);
console.log(`  total_sessions: ${p?.total_sessions} (expected 12)`);
console.log(`  status: ${p?.status}`);
console.log(`  ✓ sessions_used correct: ${p?.sessions_used === 8}`);
console.log(`  ✓ total_sessions correct: ${p?.total_sessions === 12}\n`);

// Check protocol_logs — should only have the "renewal" entry, no "checkin"
const { data: remainingLogs } = await supabase
  .from('protocol_logs')
  .select('id, log_date, log_type, weight')
  .eq('protocol_id', PROTOCOL_ID)
  .order('log_date', { ascending: true });

console.log(`protocol_logs remaining (${remainingLogs?.length || 0} entries):`);
remainingLogs?.forEach(l => console.log(`  [${l.id}] ${l.log_date} — type: ${l.log_type}, weight: ${l.weight}`));

const hasCheckin = remainingLogs?.some(l => l.log_type === 'checkin');
console.log(`  ✓ No duplicate checkin: ${!hasCheckin}\n`);

// Check service_logs still has the injection with weight
const { data: svcLogs } = await supabase
  .from('service_logs')
  .select('id, entry_date, entry_type, weight')
  .eq('patient_id', PATIENT_ID)
  .eq('category', 'weight_loss')
  .order('entry_date', { ascending: true });

console.log(`service_logs (${svcLogs?.length || 0} entries):`);
svcLogs?.forEach(s => console.log(`  [${s.id}] ${s.entry_date} — type: ${s.entry_type}, weight: ${s.weight}`));
console.log();

const allPassed = p?.sessions_used === 8 && p?.total_sessions === 12 && !hasCheckin;
console.log(allPassed ? '=== ALL CHECKS PASSED ===' : '=== SOME CHECKS FAILED ===');
