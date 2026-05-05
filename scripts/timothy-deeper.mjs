import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PID = 'cc6d8d0d-7939-4aa4-913e-4de8c2d3794b';

console.log('═══ ALL purchases (any protocol) ═══\n');
const { data: allPurch } = await supabase
  .from('purchases')
  .select('*')
  .eq('patient_id', PID)
  .order('purchase_date');

for (const p of allPurch || []) {
  console.log(`${p.purchase_date} | $${p.amount_paid} | qty=${p.quantity} ${p.payment_method || '-'} | ${p.category || '-'}`);
  console.log(`  ${p.item_name}`);
  console.log(`  protocol_id=${p.protocol_id || 'UNLINKED'}`);
  console.log('');
}
console.log(`Total: ${allPurch?.length || 0} purchases\n`);

// May 5 note full body
console.log('═══ May 5 note body (full) ═══\n');
const { data: may5 } = await supabase
  .from('patient_notes')
  .select('id, note_date, status, encounter_service, body')
  .eq('patient_id', PID)
  .gte('note_date', '2026-05-05T00:00:00')
  .lt('note_date', '2026-05-06T00:00:00')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (may5) {
  console.log(`id=${may5.id}`);
  console.log(`status=${may5.status}, encounter_service=${may5.encounter_service}`);
  console.log(`body:\n${may5.body}\n`);

  // Test markdown parser
  const medRe = /\*\*Medication:\*\*\s*([^\n]+)/i;
  const doseRe = /\*\*Dose:\*\*\s*([^\n]+)/i;
  const mMd = may5.body.match(medRe);
  const dMd = may5.body.match(doseRe);
  console.log(`Markdown parser: med=${mMd?.[1] || 'NO MATCH'} dose=${dMd?.[1] || 'NO MATCH'}`);

  // Test HTML parser variant
  const medHtmlRe = /<strong>Medication:<\/strong>\s*([^\n<]+)/i;
  const doseHtmlRe = /<strong>Dose:<\/strong>\s*([^\n<]+)/i;
  const mHtml = may5.body.match(medHtmlRe);
  const dHtml = may5.body.match(doseHtmlRe);
  console.log(`HTML parser: med=${mHtml?.[1] || 'NO MATCH'} dose=${dHtml?.[1] || 'NO MATCH'}`);
}

// Apr 22 note
console.log('\n═══ Apr 22 WL Injection note ═══\n');
const { data: apr22 } = await supabase
  .from('patient_notes')
  .select('id, status, encounter_service, body')
  .eq('patient_id', PID)
  .ilike('encounter_service', '%injection%')
  .gte('note_date', '2026-04-22T00:00:00')
  .lt('note_date', '2026-04-23T00:00:00')
  .maybeSingle();

if (apr22) {
  console.log(`id=${apr22.id} status=${apr22.status}`);
  console.log(`body:\n${apr22.body?.substring(0, 500)}`);
}
