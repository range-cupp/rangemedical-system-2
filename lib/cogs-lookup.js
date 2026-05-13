// /lib/cogs-lookup.js
// Look up cost-of-goods (cents) for a purchase row.
//
// Source of truth: data/costs.json — confirmed Anazao/Pyxis/McGuff/Merit/THS
// supplier numbers with per-line breakdowns. Lookup priority:
//   1. purchase.costs_id  (explicit service id, e.g. "iv-nad-1000")
//   2. exact name match against costs.json entries (medication, item_name, product_name)
//   3. fuzzy contains-match against costs.json entry names
//   4. vial-catalog (shop SKUs)
//
// Returns null when nothing matches — UI shows "—".

import fs from 'fs';
import path from 'path';
import { VIAL_CATALOG } from './vial-catalog';

const norm = (s) => (s || '').toLowerCase()
  .replace(/\s*\([^)]*\)/g, '')        // strip parentheticals — "(Thymosin Beta 4)" etc.
  .replace(/[^a-z0-9]+/g, ' ')         // non-alphanumeric → space
  .replace(/([a-z])(\d)/g, '$1 $2')    // "tb4" → "tb 4" so TB4 matches TB-4
  .replace(/\s+/g, ' ').trim();

// ── data/costs.json loader ──────────────────────────────────────────────────
// JSON file uses JS-style // comments for human readability — strip on load.

function loadCosts() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'costs.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const clean = raw.replace(/\/\/[^\n]*/g, '');
    const data = JSON.parse(clean);
    return Array.isArray(data?.costs) ? data.costs : [];
  } catch (e) {
    console.warn('[cogs-lookup] failed to load data/costs.json:', e.message);
    return [];
  }
}

function resolveEntryCogs(entry) {
  if (!entry) return null;
  // Multi-supplier entries store costs under cost_variants.{supplier}
  if (entry.cost_variants) {
    const v = entry.cost_variants.pyxis ?? entry.cost_variants.anazao ?? entry.cost_variants.mcguff;
    if (v && v.cogs != null) return Number(v.cogs);
  }
  if (entry.cogs != null) return Number(entry.cogs);
  return null;
}

const COSTS = loadCosts();

const COSTS_BY_ID = (() => {
  const idx = new Map();
  for (const e of COSTS) if (e?.id) idx.set(e.id, e);
  return idx;
})();

const COSTS_BY_NAME = (() => {
  const idx = new Map();
  for (const e of COSTS) if (e?.name) idx.set(norm(e.name), e);
  return idx;
})();

// ── Vial catalog index (fallback for shop SKUs) ─────────────────────────────

const VIAL_INDEX = (() => {
  const idx = new Map();
  for (const v of VIAL_CATALOG) {
    if (v.cogsCents == null) continue;
    if (v.name)     idx.set(norm(v.name), v);
    if (v.subtitle) idx.set(norm(v.subtitle), v);
    if (v.id)       idx.set(norm(v.id), v);
  }
  return idx;
})();

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns cost-of-goods in cents for a purchase row, or null if unknown.
 * Does NOT multiply by quantity — costs.json entries are per-protocol/per-purchase totals,
 * and the quantity field on purchases represents injection count for protocol tracking.
 * Tries: costs_id → WL dose-tier match → name match in costs.json → vial catalog.
 */
export function lookupCogsCents(purchase) {
  if (!purchase) return null;

  // 1. Explicit costs_id (e.g. "iv-nad-1000") — most precise
  if (purchase.costs_id) {
    const entry = COSTS_BY_ID.get(purchase.costs_id);
    const dollars = resolveEntryCogs(entry);
    if (dollars != null) return Math.round(dollars * 100);
  }

  // 2. WL dose-tier matching — extract dose from item_name to find the right tier
  const wlMatch = matchWlDoseTier(purchase);
  if (wlMatch != null) return wlMatch;

  const candidates = [purchase.medication, purchase.item_name, purchase.product_name]
    .filter(Boolean)
    .map(norm);

  for (const c of candidates) {
    if (!c) continue;

    // 3. Exact-name match in costs.json
    const exact = COSTS_BY_NAME.get(c);
    const exactDollars = resolveEntryCogs(exact);
    if (exactDollars != null) return Math.round(exactDollars * 100);

    // 4. Fuzzy contains-match (e.g. "NAD+ 1000mg IV" → "NAD+ 1000mg")
    for (const [key, entry] of COSTS_BY_NAME) {
      if (c.includes(key) || key.includes(c)) {
        const dollars = resolveEntryCogs(entry);
        if (dollars != null) return Math.round(dollars * 100);
      }
    }

    // 5. Vial catalog (shop SKUs — peptides, etc. by trade name)
    const vial = VIAL_INDEX.get(c);
    if (vial?.cogsCents != null) return vial.cogsCents;
    for (const [key, v] of VIAL_INDEX) {
      if (c.includes(key) || key.includes(c)) {
        if (v.cogsCents != null) return v.cogsCents;
      }
    }
  }

  return null;
}

// ── WL dose-tier matching ──────────────────────────────────────────────────
// WL purchases store dose info in item_name (e.g. "Retatrutide — 4x 2mg").
// Map extracted dose to the correct costs.json tier entry so we don't default
// to dose 1 for every Retatrutide/Tirzepatide purchase.

const WL_DOSE_MAP = {
  retatrutide: [
    { mg: 0.5, id: 'wl-reta-d1' },
    { mg: 1,   id: 'wl-reta-d2' },
    { mg: 2,   id: 'wl-reta-d3' },
    { mg: 3,   id: 'wl-reta-d4' },
    { mg: 4,   id: 'wl-reta-d5' },
    { mg: 6,   id: 'wl-reta-d6' },
  ],
  tirzepatide: [
    { mg: 2.5,  id: 'wl-tirz-d1' },
    { mg: 5,    id: 'wl-tirz-d2' },
    { mg: 7.5,  id: 'wl-tirz-d3' },
    { mg: 10,   id: 'wl-tirz-d4' },
    { mg: 12.5, id: 'wl-tirz-d5' },
  ],
};

function matchWlDoseTier(purchase) {
  const cat = (purchase.category || '').toLowerCase();
  if (cat !== 'weight_loss') return null;

  const med = (purchase.medication || '').toLowerCase().trim();
  const tiers = WL_DOSE_MAP[med];
  if (!tiers) return null;

  // Extract dose from item_name — patterns like "4x 2mg", "2x 5mg", "Dose 3 (2mg/week)"
  const text = [purchase.item_name, purchase.product_name, purchase.description]
    .filter(Boolean).join(' ');
  const doseMatch = text.match(/(\d+(?:\.\d+)?)\s*mg/i);
  if (doseMatch) {
    const doseMg = parseFloat(doseMatch[1]);
    const tier = tiers.find(t => t.mg === doseMg);
    if (tier) {
      const entry = COSTS_BY_ID.get(tier.id);
      const dollars = resolveEntryCogs(entry);
      if (dollars != null) return Math.round(dollars * 100);
    }
  }

  return null;
}

/**
 * Returns the full costs.json entry for a service id (or null).
 * Useful when the caller needs the breakdown, not just the total.
 */
export function getCostsEntryById(id) {
  return COSTS_BY_ID.get(id) || null;
}
