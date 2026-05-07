// Backfill WL purchase quantity + protocol total_sessions
// Range Medical — 2026-05-06
//
// Background:
//   pages/admin/checkout.js previously sent quantity=item.wlConfig.totalInjections
//   without scaling by cart-line qty. A "1× 2mg" builder line bumped to cart qty 4
//   landed as item_name "Retatrutide — 1x 2mg x4" with purchases.quantity=1 and
//   protocols.total_sessions=1 (Keely Julian, 2026-04-30). Legacy "Monthly" POS
//   products had the same bug — the auto-protocol parser corrected total_sessions
//   to 4 but purchases.quantity stayed 1, so the cron's block-size detection saw
//   the wrong block size.
//
// This script:
//   1. Updates purchases.quantity to the implied count for clear cases:
//      - "Monthly" / "Comp Block" wording (4 weekly injections per month)
//      - Trailing "xN" cart multipliers on builder/dose names
//   2. For each affected protocol, sets total_sessions = max(current, sum of
//      corrected purchase quantities). Never reduces to preserve any manual
//      add-injections additions.
//   3. Skips ambiguous purchases (e.g. "8x 1mg" with qty=1 paid $162) — those
//      need human review.

import { createClient } from '@supabase/supabase-js';

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function impliedQty(name) {
  if (!name) return null;
  const lowerOrig = name.toLowerCase();
  const cleaned = name
    .replace(/\([^)]*off\)/gi, '')
    .replace(/\(\d+%[^)]*\)/g, '')
    .replace(/\(\$[^)]*\)/g, '')
    .replace(/\(discounted\)/gi, '')
    .trim();
  const lower = cleaned.toLowerCase();
  const groupRegex = /(\d+)x\s+(\d+(?:\.\d+)?)\s*mg/gi;
  const matches = [...cleaned.matchAll(groupRegex)];
  let remaining = cleaned;
  for (const m of matches) remaining = remaining.replace(m[0], '');
  const trailMult = remaining.match(/[x×]\s*(\d+)/i);
  const cartMult = trailMult ? parseInt(trailMult[1]) : null;
  if (lowerOrig.includes('monthly')) return 4 * (cartMult || 1);
  if (lowerOrig.includes('comp block')) return 4;
  if (matches.length > 0 && cartMult) {
    return matches.reduce((sum, m) => sum + parseInt(m[1]), 0) * cartMult;
  }
  if (lower.includes('weight loss program') && cartMult) return cartMult;
  if (matches.length === 0 && cartMult && /\d+(?:\.\d+)?\s*mg/i.test(cleaned)) return cartMult;
  return null;
}

const apply = process.argv.includes('--apply');

const since = new Date(); since.setDate(since.getDate() - 90);
const { data: purchases } = await s.from('purchases')
  .select('id, patient_id, patient_name, item_name, quantity, purchase_date, protocol_id, amount_paid')
  .eq('category', 'weight_loss')
  .gte('purchase_date', since.toISOString().slice(0, 10));

const fixes = [];
for (const p of purchases) {
  const implied = impliedQty(p.item_name);
  if (implied !== null && implied > p.quantity) fixes.push({ ...p, implied });
}

console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
console.log(`Purchase quantity fixes: ${fixes.length}`);

if (apply) {
  for (const f of fixes) {
    const { error } = await s.from('purchases').update({ quantity: f.implied }).eq('id', f.id);
    if (error) console.error(`  ✗ ${f.patient_name}: ${error.message}`);
    else console.log(`  ✓ [${f.quantity}→${f.implied}] ${f.patient_name} — ${f.item_name?.slice(0, 55)}`);
  }
}

// Now compute protocol updates: max(current, sum of post-fix purchase qty)
const protocolIds = [...new Set(fixes.map(f => f.protocol_id).filter(Boolean))];

const { data: protocols } = await s.from('protocols')
  .select('id, patient_id, total_sessions, sessions_used, status')
  .in('id', protocolIds);

const { data: allWlPurchases } = await s.from('purchases')
  .select('id, protocol_id, quantity, item_name')
  .eq('category', 'weight_loss')
  .in('protocol_id', protocolIds);

// Compute corrected qty per purchase (apply fixes in-memory)
const fixById = Object.fromEntries(fixes.map(f => [f.id, f.implied]));
const sumByProtocol = {};
for (const p of allWlPurchases) {
  const correctedQty = fixById[p.id] ?? p.quantity ?? 0;
  sumByProtocol[p.protocol_id] = (sumByProtocol[p.protocol_id] || 0) + correctedQty;
}

const protocolUpdates = [];
for (const proto of protocols) {
  const expected = sumByProtocol[proto.id] || 0;
  const current = proto.total_sessions || 0;
  if (expected > current) {
    protocolUpdates.push({ id: proto.id, current, expected, sessions_used: proto.sessions_used });
  }
}

console.log(`\nProtocol total_sessions bumps: ${protocolUpdates.length}`);
for (const u of protocolUpdates) {
  console.log(`  ${u.id}: total_sessions ${u.current} → ${u.expected} (used: ${u.sessions_used})`);
}

if (apply) {
  for (const u of protocolUpdates) {
    const { error } = await s.from('protocols').update({ total_sessions: u.expected }).eq('id', u.id);
    if (error) console.error(`  ✗ ${u.id}: ${error.message}`);
    else console.log(`  ✓ ${u.id} → ${u.expected}`);
  }
}

console.log('\nDone.');
