// /pages/api/admin/clinic-sources.js
// Clinic-source dashboard data: patient counts + revenue by Range Medical vs Range Sports Therapy.
// Pulls patient -> referral_source (falls back to intakes.how_heard), joins purchases for revenue.

import { createClient } from '@supabase/supabase-js';
import {
  bucketReferralSource,
  resolveReferralSource,
  CLINIC_SOURCES,
} from '../../../lib/clinic-source';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PAGE_SIZE = 1000;

async function fetchAll(table, select, orderField = null) {
  let rows = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (orderField) q = q.order(orderField, { ascending: true });
    const { data, error } = await q;
    if (error) throw new Error(`${table} fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    rows = rows.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function isRefunded(p) {
  const s = (p.stripe_status || '').toLowerCase();
  return s === 'refunded' || s === 'partially_refunded';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { start, end } = req.query;
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    // Inclusive end-of-day when a date-only value is passed
    if (endDate && end && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
      endDate.setHours(23, 59, 59, 999);
    }

    const [patients, intakes, purchases] = await Promise.all([
      fetchAll('patients', 'id, name, first_name, last_name, email, phone, referral_source, created_at'),
      fetchAll('intakes', 'patient_id, how_heard, created_at'),
      fetchAll('purchases', 'id, patient_id, amount_paid, stripe_status, stripe_amount_cents, stripe_payment_intent_id, purchase_date, created_at'),
    ]);

    // ── De-dupe purchases ─────────────────────────────────────────────────
    // Two known duplication patterns in the purchases table:
    //
    // 1. Same `stripe_payment_intent_id`, all lines share identical
    //    `amount_paid` matching `stripe_amount_cents/100`. A cart-total bug
    //    that multi-counts one charge.
    //
    // 2. Cross-source: a Stripe charge captured directly by the Stripe
    //    webhook AND also captured by the GHL webhook (or vice versa). Same
    //    patient, same amount, same day, from different source channels.
    //    Since every patient payment goes through Stripe, any non-Stripe-
    //    tagged row with a same-day same-patient same-amount Stripe-tagged
    //    sibling is the duplicate.
    //
    // Both patterns are handled by zeroing the extra copies so downstream
    // sums stay correct.
    {
      // Pattern 1 — within a single payment_intent
      const byPI = {};
      for (const p of purchases) {
        if (!p.stripe_payment_intent_id) continue;
        (byPI[p.stripe_payment_intent_id] ??= []).push(p);
      }
      const toZero = new Set();
      for (const lines of Object.values(byPI)) {
        if (lines.length < 2) continue;
        const amts = lines.map(l => parseFloat(l.amount_paid) || 0);
        if (!amts.every(a => a === amts[0])) continue;
        const stripeCents = lines[0].stripe_amount_cents;
        if (stripeCents == null || !lines.every(l => l.stripe_amount_cents === stripeCents)) continue;
        if (Math.abs(amts[0] - stripeCents / 100) > 0.02) continue;
        for (let i = 1; i < lines.length; i++) toZero.add(lines[i].id);
      }

      // Pattern 2 — cross-source duplicates: same patient, same amount, within
      // 2 days (GHL webhook can land a day before/after the direct Stripe
      // webhook depending on invoice flow). Prefer the Stripe-tagged row;
      // zero the sibling.
      const candidatesByKey = {};
      for (const p of purchases) {
        if (toZero.has(p.id)) continue;
        const amt = parseFloat(p.amount_paid) || 0;
        if (amt <= 0 || !p.patient_id) continue;
        const dateStr = p.purchase_date || (p.created_at ? p.created_at.slice(0, 10) : null);
        if (!dateStr) continue;
        const key = `${p.patient_id}__${amt.toFixed(2)}`;
        (candidatesByKey[key] ??= []).push({ p, dayMs: new Date(dateStr.slice(0, 10)).getTime() });
      }
      for (const rows of Object.values(candidatesByKey)) {
        if (rows.length < 2) continue;
        rows.sort((a, b) => a.dayMs - b.dayMs);
        // Cluster rows within 2 days of each other
        const clusters = [];
        let cur = [rows[0]];
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].dayMs - cur[cur.length - 1].dayMs <= 2 * 86400000) {
            cur.push(rows[i]);
          } else {
            clusters.push(cur);
            cur = [rows[i]];
          }
        }
        clusters.push(cur);
        for (const cluster of clusters) {
          if (cluster.length < 2) continue;
          // Keep the Stripe-tagged row if available, else the first
          const withPI = cluster.find(c => c.p.stripe_payment_intent_id);
          const keep = (withPI || cluster[0]).p;
          for (const c of cluster) {
            if (c.p.id !== keep.id) toZero.add(c.p.id);
          }
        }
      }

      for (const p of purchases) {
        if (toZero.has(p.id)) p.amount_paid = 0;
      }
    }

    // Build intake map: patient_id -> earliest intake with how_heard
    const intakeMap = {};
    for (const i of intakes) {
      if (!i.patient_id) continue;
      const existing = intakeMap[i.patient_id];
      if (!existing) intakeMap[i.patient_id] = i;
      else {
        const a = new Date(existing.created_at || 0).getTime();
        const b = new Date(i.created_at || 0).getTime();
        if (b < a && i.how_heard) intakeMap[i.patient_id] = i;
      }
    }

    // Build purchase map: patient_id -> { lifetime, period, lastPurchaseDate }
    const purchaseMap = {};
    for (const p of purchases) {
      if (!p.patient_id) continue;
      if (isRefunded(p)) continue;
      const amt = parseFloat(p.amount_paid) || 0;
      const dateStr = p.purchase_date || p.created_at;
      const d = dateStr ? new Date(dateStr) : null;

      const bucket = purchaseMap[p.patient_id] || { lifetime: 0, period: 0, lastPurchaseDate: null };
      bucket.lifetime += amt;
      if (d && (!bucket.lastPurchaseDate || d > bucket.lastPurchaseDate)) {
        bucket.lastPurchaseDate = d;
      }
      if (d && (!startDate || d >= startDate) && (!endDate || d <= endDate)) {
        bucket.period += amt;
      }
      purchaseMap[p.patient_id] = bucket;
    }

    // Assemble rows
    const rows = patients.map((p) => {
      const intake = intakeMap[p.id] || null;
      const resolved = resolveReferralSource(p, intake);
      const source = bucketReferralSource(resolved);
      const purchaseData = purchaseMap[p.id] || { lifetime: 0, period: 0, lastPurchaseDate: null };
      const createdAt = p.created_at ? new Date(p.created_at) : null;
      const isNewInPeriod = !!(createdAt && (!startDate || createdAt >= startDate) && (!endDate || createdAt <= endDate));
      const displayName = p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || '(no name)';

      return {
        patient_id: p.id,
        name: displayName,
        email: p.email || null,
        phone: p.phone || null,
        referral_source_raw: resolved,
        source, // range_medical | range_sports_therapy | unknown
        created_at: p.created_at || null,
        is_new_in_period: isNewInPeriod,
        last_purchase_date: purchaseData.lastPurchaseDate ? purchaseData.lastPurchaseDate.toISOString() : null,
        lifetime_spend: Math.round(purchaseData.lifetime * 100) / 100,
        period_spend: Math.round(purchaseData.period * 100) / 100,
      };
    });

    // Summary by bucket
    const sources = [CLINIC_SOURCES.RANGE_MEDICAL, CLINIC_SOURCES.RANGE_SPORTS_THERAPY, CLINIC_SOURCES.UNKNOWN];
    const summary = {};
    for (const s of sources) {
      summary[s] = {
        patient_count: 0,
        new_patients_in_period: 0,
        patients_with_spend_in_period: 0,
        period_revenue: 0,
        lifetime_revenue: 0,
      };
    }
    for (const r of rows) {
      const b = summary[r.source];
      b.patient_count += 1;
      if (r.is_new_in_period) b.new_patients_in_period += 1;
      if (r.period_spend > 0) b.patients_with_spend_in_period += 1;
      b.period_revenue += r.period_spend;
      b.lifetime_revenue += r.lifetime_spend;
    }
    for (const s of sources) {
      summary[s].period_revenue = Math.round(summary[s].period_revenue * 100) / 100;
      summary[s].lifetime_revenue = Math.round(summary[s].lifetime_revenue * 100) / 100;
    }

    return res.status(200).json({
      filters: {
        start: startDate ? startDate.toISOString() : null,
        end: endDate ? endDate.toISOString() : null,
      },
      summary,
      patients: rows,
    });
  } catch (err) {
    console.error('clinic-sources API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
