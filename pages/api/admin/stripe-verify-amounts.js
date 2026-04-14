// /pages/api/admin/stripe-verify-amounts.js
// Closes the loop: compares what Stripe ACTUALLY charged vs what the DB says.
//
// For single-item PaymentIntents: auto-corrects amount_paid to match Stripe.
// For multi-item PaymentIntents: flags mismatches for manual review.
//
// GET  /api/admin/stripe-verify-amounts?month=2026-04           → dry run (preview)
// POST /api/admin/stripe-verify-amounts  { month: "2026-04" }   → apply corrections

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const month = req.query.month || req.body?.month;
  const dryRun = req.method === 'GET';

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Provide month as YYYY-MM (e.g. 2026-04)' });
  }

  try {
    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);
    const startDateStr = `${year}-${String(mon).padStart(2, '0')}-01`;
    const endDateStr = mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

    // ── Step 1: Pull ALL succeeded Stripe PaymentIntents for the month ────
    const allPIs = [];
    let hasMore = true;
    let startingAfter = undefined;

    while (hasMore) {
      const params = {
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lt: Math.floor(endDate.getTime() / 1000),
        },
        limit: 100,
      };
      if (startingAfter) params.starting_after = startingAfter;

      const result = await stripe.paymentIntents.list(params);
      allPIs.push(...result.data);
      hasMore = result.has_more;
      if (result.data.length > 0) {
        startingAfter = result.data[result.data.length - 1].id;
      }
    }

    // Only care about succeeded PIs
    const succeededPIs = allPIs.filter(pi => pi.status === 'succeeded');

    // ── Step 2: Get all purchases for the month that have a PI ID ──────────
    const { data: purchases, error: pErr } = await supabase
      .from('purchases')
      .select('id, patient_id, patient_name, patient_email, purchase_date, amount, amount_paid, item_name, category, stripe_payment_intent_id, stripe_amount_cents, stripe_status, payment_method')
      .gte('purchase_date', startDateStr)
      .lt('purchase_date', endDateStr)
      .order('purchase_date');

    if (pErr) throw pErr;

    // ── Step 3: Group DB purchases by PaymentIntent ID ────────────────────
    const purchasesByPI = {};
    const purchasesWithoutPI = [];

    for (const p of (purchases || [])) {
      if (p.stripe_payment_intent_id) {
        if (!purchasesByPI[p.stripe_payment_intent_id]) purchasesByPI[p.stripe_payment_intent_id] = [];
        purchasesByPI[p.stripe_payment_intent_id].push(p);
      } else {
        purchasesWithoutPI.push(p);
      }
    }

    // ── Step 4: Compare each PI to its DB records ─────────────────────────
    const verified = [];       // Amounts match — no action needed
    const corrected = [];      // Single-item PI — auto-corrected
    const flagged = [];        // Multi-item PI with mismatch — needs manual review
    const missingInDB = [];    // Stripe PI with no matching purchase in DB
    const corrections = [];    // Actual updates to apply

    for (const pi of succeededPIs) {
      const stripeAmountCents = pi.amount_received || pi.amount;
      const stripeAmountDollars = stripeAmountCents / 100;
      const dbRecords = purchasesByPI[pi.id] || [];

      if (dbRecords.length === 0) {
        // Stripe charged but no DB record
        missingInDB.push({
          payment_intent: pi.id,
          stripe_amount: stripeAmountDollars,
          stripe_date: new Date(pi.created * 1000).toISOString().split('T')[0],
          description: pi.description || pi.metadata?.description || '',
          customer: pi.customer || '',
        });
        continue;
      }

      // Sum of what DB thinks was paid
      const dbSumCents = dbRecords.reduce((sum, p) => {
        return sum + Math.round((parseFloat(p.amount_paid ?? p.amount ?? 0)) * 100);
      }, 0);

      const diffCents = Math.abs(stripeAmountCents - dbSumCents);

      if (diffCents <= 1) {
        // Amounts match — mark as verified
        verified.push({
          payment_intent: pi.id,
          stripe_amount: stripeAmountDollars,
          db_amount: dbSumCents / 100,
          items: dbRecords.length,
          patients: [...new Set(dbRecords.map(p => p.patient_name))],
        });

        // Update stripe_verified_at if not already set
        for (const p of dbRecords) {
          if (!p.stripe_verified_at) {
            corrections.push({
              purchase_id: p.id,
              update: { stripe_verified_at: new Date().toISOString(), stripe_status: 'succeeded' },
              type: 'verify_only',
            });
          }
        }
        continue;
      }

      // Mismatch found
      if (dbRecords.length === 1) {
        // Single-item PI — Stripe is the source of truth, auto-correct
        const record = dbRecords[0];
        const oldAmount = parseFloat(record.amount_paid ?? record.amount ?? 0);

        corrected.push({
          payment_intent: pi.id,
          purchase_id: record.id,
          patient_name: record.patient_name,
          item_name: record.item_name,
          old_amount: oldAmount,
          new_amount: stripeAmountDollars,
          difference: ((stripeAmountCents - Math.round(oldAmount * 100)) / 100).toFixed(2),
          purchase_date: record.purchase_date,
        });

        corrections.push({
          purchase_id: record.id,
          update: {
            amount_paid: stripeAmountDollars,
            stripe_amount_cents: stripeAmountCents,
            stripe_status: 'succeeded',
            stripe_verified_at: new Date().toISOString(),
          },
          type: 'amount_correction',
          old_amount: oldAmount,
          new_amount: stripeAmountDollars,
        });
      } else {
        // Multi-item PI — can't auto-correct, flag for review
        flagged.push({
          payment_intent: pi.id,
          stripe_amount: stripeAmountDollars,
          db_sum: dbSumCents / 100,
          difference: ((stripeAmountCents - dbSumCents) / 100).toFixed(2),
          items: dbRecords.map(p => ({
            purchase_id: p.id,
            patient_name: p.patient_name,
            item_name: p.item_name,
            amount_paid: parseFloat(p.amount_paid ?? p.amount ?? 0),
            purchase_date: p.purchase_date,
          })),
        });
      }
    }

    // ── Step 5: Find DB purchases with PI IDs that DON'T exist in Stripe ──
    const stripePIIds = new Set(succeededPIs.map(pi => pi.id));
    const orphanedPurchases = [];
    for (const [piId, records] of Object.entries(purchasesByPI)) {
      if (!stripePIIds.has(piId) && !allPIs.find(p => p.id === piId)) {
        for (const r of records) {
          orphanedPurchases.push({
            purchase_id: r.id,
            payment_intent: piId,
            patient_name: r.patient_name,
            item_name: r.item_name,
            amount_paid: parseFloat(r.amount_paid ?? r.amount ?? 0),
            purchase_date: r.purchase_date,
          });
        }
      }
    }

    // ── Step 6: Apply corrections if not dry run ──────────────────────────
    if (!dryRun && corrections.length > 0) {
      for (const c of corrections) {
        await supabase
          .from('purchases')
          .update(c.update)
          .eq('id', c.purchase_id);
      }
    }

    // ── Step 7: Build summary ─────────────────────────────────────────────
    const totalStripe = succeededPIs.reduce((s, pi) => s + (pi.amount_received || pi.amount), 0);
    const totalDB = (purchases || [])
      .filter(p => p.payment_method !== 'cash' && p.payment_method !== 'gift_card')
      .reduce((s, p) => s + Math.round((parseFloat(p.amount_paid ?? p.amount ?? 0)) * 100), 0);

    const cashTotal = (purchases || [])
      .filter(p => p.payment_method === 'cash')
      .reduce((s, p) => s + Math.round((parseFloat(p.amount_paid ?? p.amount ?? 0)) * 100), 0);

    const giftCardTotal = (purchases || [])
      .filter(p => p.payment_method === 'gift_card')
      .reduce((s, p) => s + Math.round((parseFloat(p.amount_paid ?? p.amount ?? 0)) * 100), 0);

    return res.status(200).json({
      month,
      dry_run: dryRun,
      summary: {
        stripe_total: (totalStripe / 100).toFixed(2),
        db_stripe_total: (totalDB / 100).toFixed(2),
        db_cash_total: (cashTotal / 100).toFixed(2),
        db_gift_card_total: (giftCardTotal / 100).toFixed(2),
        discrepancy: ((totalDB - totalStripe) / 100).toFixed(2),
        stripe_charges: succeededPIs.length,
        db_purchases: (purchases || []).length,
      },
      results: {
        verified: verified.length,
        corrected: corrected.length,
        flagged: flagged.length,
        missing_in_db: missingInDB.length,
        orphaned_purchases: orphanedPurchases.length,
        no_stripe_id: purchasesWithoutPI.length,
      },
      corrected: corrected.length > 0 ? corrected : undefined,
      flagged: flagged.length > 0 ? flagged : undefined,
      missing_in_db: missingInDB.length > 0 ? missingInDB.slice(0, 30) : undefined,
      orphaned_purchases: orphanedPurchases.length > 0 ? orphanedPurchases : undefined,
    });

  } catch (err) {
    console.error('Stripe verify amounts error:', err);
    return res.status(500).json({ error: err.message });
  }
}
