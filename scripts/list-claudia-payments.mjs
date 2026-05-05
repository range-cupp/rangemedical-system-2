import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const PID = '6ceba3d7-7da1-4595-81b1-826bce5352a2';

// All purchases for Claudia (any protocol)
const { data: purch } = await supabase
  .from('purchases')
  .select('*')
  .eq('patient_id', PID)
  .order('purchase_date');

console.log(`All purchases for Claudia (${purch?.length || 0}):\n`);
let totalDollars = 0;
let totalDosesAssumed = 0;
const rows = [];
for (const p of purch || []) {
  const isWL = (p.category || '').includes('weight') || /retatrutide|tirzepatide|semaglutide/i.test(p.item_name || '');
  // Heuristic: how many doses does this purchase cover?
  // - if quantity > 1 and item_name says "× N" or "x2" or "Single", trust quantity
  // - if quantity == 1 and item_name is generic "Weight Loss Injection" with no count, assume 4-pack
  const itemLower = (p.item_name || '').toLowerCase();
  const hasMultiplier = /×\s*\d|\bx\s*\d|\bsingle\b/i.test(p.item_name || '');
  let assumedDoses;
  if (!isWL) assumedDoses = null;
  else if (p.quantity > 1) assumedDoses = p.quantity;
  else if (hasMultiplier) assumedDoses = p.quantity;
  else assumedDoses = 4; // legacy 4-pack assumption

  rows.push({
    date: p.purchase_date,
    amount: p.amount_paid,
    item: p.item_name,
    qty_stored: p.quantity,
    is_wl: isWL,
    assumed_doses: assumedDoses,
    protocol_id: p.protocol_id?.substring(0, 8),
  });

  if (isWL) {
    totalDollars += parseFloat(p.amount_paid || 0);
    totalDosesAssumed += assumedDoses || 0;
  }
}

// Pretty print
for (const r of rows) {
  console.log(`  ${r.date} | $${r.amount.toString().padStart(7)} | qty_stored=${r.qty_stored} | ${r.item}`);
  console.log(`              → assumed ${r.assumed_doses ?? '—'} doses ${r.is_wl ? '(WL)' : '(non-WL — excluded)'}`);
  console.log('');
}

console.log(`──────────────────────────────────────────`);
console.log(`Total WL spent: $${totalDollars.toFixed(2)}`);
console.log(`Total WL doses (assumed): ${totalDosesAssumed}`);
