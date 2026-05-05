// /lib/cogs-lookup.js
// Look up cost-of-goods (cents) for a purchase row.
// Vials have reliable wholesale data in vial-catalog.js. For other categories
// (IV bags, HBOT sessions, RLT, weight-loss meds, HRT), COGS is not tracked,
// so we return null and the UI shows "—".

import { VIAL_CATALOG } from './vial-catalog';

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Build a normalized lookup map once. Match by name OR subtitle, since
// purchase rows store the item name inconsistently (sometimes the trade name,
// sometimes the full blend label).
const VIAL_INDEX = (() => {
  const idx = new Map();
  for (const v of VIAL_CATALOG) {
    if (v.cogsCents == null) continue;
    if (v.name) idx.set(norm(v.name), v);
    if (v.subtitle) idx.set(norm(v.subtitle), v);
    if (v.id) idx.set(norm(v.id), v);
  }
  return idx;
})();

// HRT / weight-loss / peptide-injection meds with rough wholesale-per-fill
// cost (cents). These are tracked manually because purchases for these
// categories are billed monthly (HRT/WL) or as a single injection (NAD,
// glutathione) and don't map to the shop vial catalog.
//
// Numbers are conservative estimates from clinic supply pricing — update
// here when wholesale changes. Returning null for anything not listed.
const SERVICE_COGS_CENTS = {
  // HRT (per monthly fill, ~10mL bottle)
  'testosterone cypionate': 2500,
  'testosterone cyp': 2500,
  'hcg': 4500,
  'enclomiphene': 1500,
  'anastrozole': 800,

  // Weight loss (per monthly fill)
  'semaglutide': 8000,
  'tirzepatide': 12000,
  'retatrutide': 18000,

  // IV ingredients (single bag — bag + nutrients)
  'nad': 6000,           // 250mg dose, conservative
  'nad+': 6000,
  'myers cocktail': 1800,
  'recovery iv': 2000,
  'immunity iv': 2000,
  'performance iv': 2000,
  'inner beauty iv': 2000,
  'glutathione': 1200,
  'b12 shot': 200,
};

/**
 * Returns cost-of-goods in cents for a purchase row, or null if unknown.
 * Multiplies by quantity. Tries: medication, item_name, product_name.
 */
export function lookupCogsCents(purchase) {
  if (!purchase) return null;
  const qty = Math.max(1, Number(purchase.quantity) || 1);

  const candidates = [purchase.medication, purchase.item_name, purchase.product_name]
    .filter(Boolean)
    .map(norm);

  for (const c of candidates) {
    if (!c) continue;

    // Try vial catalog first (exact normalized match)
    const vial = VIAL_INDEX.get(c);
    if (vial && vial.cogsCents != null) return vial.cogsCents * qty;

    // Try contains-match against vial names (e.g. "BPC-157 / TB-500" purchase
    // matching "BPC-157 / Thymosin Beta-4")
    for (const [key, v] of VIAL_INDEX) {
      if (c.includes(key) || key.includes(c)) {
        if (v.cogsCents != null) return v.cogsCents * qty;
      }
    }

    // Service-level fallback — exact key match
    if (SERVICE_COGS_CENTS[c] != null) return SERVICE_COGS_CENTS[c] * qty;

    // Service-level fallback — substring match (e.g. "testosterone cypionate
    // 200mg/ml" matches "testosterone cypionate")
    for (const key of Object.keys(SERVICE_COGS_CENTS)) {
      if (c.includes(key)) return SERVICE_COGS_CENTS[key] * qty;
    }
  }

  return null;
}
