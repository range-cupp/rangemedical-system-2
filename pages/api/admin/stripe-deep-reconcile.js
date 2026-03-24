// /pages/api/admin/stripe-deep-reconcile.js
// Deep Stripe reconciliation — pulls ALL Stripe charges for a month
// and matches them to GHL purchases by customer email + date
// POST /api/admin/stripe-deep-reconcile { month: "2026-02" }
// GET  /api/admin/stripe-deep-reconcile?month=2026-02&dry_run=true (preview only)

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
  const dryRun = req.method === 'GET' || req.query.dry_run === 'true';

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Provide month as YYYY-MM (e.g. 2026-02)' });
  }

  try {
    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);
    const startDateStr = `${year}-${String(mon).padStart(2, '0')}-01`;
    const endDateStr = mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

    // ── Step 1: Pull ALL Stripe charges for the month ──────────────────
    const allCharges = [];
    let hasMore = true;
    let startingAfter = undefined;

    while (hasMore) {
      const params = {
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lt: Math.floor(endDate.getTime() / 1000),
        },
        limit: 100,
        expand: ['data.customer'],
      };
      if (startingAfter) params.starting_after = startingAfter;

      const charges = await stripe.charges.list(params);
      allCharges.push(...charges.data);
      hasMore = charges.has_more;
      if (charges.data.length > 0) {
        startingAfter = charges.data[charges.data.length - 1].id;
      }
    }

    // ── Step 2: Get all unreconciled purchases for the month ───────────
    const { data: purchases, error: pErr } = await supabase
      .from('purchases')
      .select('id, patient_id, patient_name, patient_email, purchase_date, amount, amount_paid, item_name, category, stripe_payment_intent_id, stripe_amount_cents, stripe_status')
      .gte('purchase_date', startDateStr)
      .lt('purchase_date', endDateStr)
      .order('purchase_date');

    if (pErr) throw pErr;

    // Build lookup maps for purchases
    // Key: email_lowercase -> array of purchases on each date
    const purchasesByEmail = {};
    const purchasesByName = {};

    for (const p of (purchases || [])) {
      if (p.patient_email) {
        const key = `${p.patient_email.toLowerCase()}|${p.purchase_date}`;
        if (!purchasesByEmail[key]) purchasesByEmail[key] = [];
        purchasesByEmail[key].push(p);
      }
      // Also index by name for fallback matching
      const nameKey = `${(p.patient_name || '').toLowerCase().trim()}|${p.purchase_date}`;
      if (!purchasesByName[nameKey]) purchasesByName[nameKey] = [];
      purchasesByName[nameKey].push(p);
    }

    // ── Step 3: Match Stripe charges to purchases ──────────────────────
    const matched = [];
    const unmatched = [];
    const alreadyReconciled = [];
    const updatedPurchaseIds = new Set();

    for (const charge of allCharges) {
      // Skip non-succeeded charges for matching purposes
      // (we'll handle refunds/failures separately)
      const chargeStatus = charge.refunded ? 'refunded'
        : charge.status === 'succeeded' ? 'succeeded'
        : charge.status === 'failed' ? 'failed'
        : charge.status;

      const chargeAmountCents = charge.amount;
      const chargeAmountDollars = chargeAmountCents / 100;
      const chargeDate = new Date(charge.created * 1000).toISOString().split('T')[0];

      // Get customer email from charge
      const customerEmail = (
        charge.billing_details?.email ||
        charge.customer?.email ||
        charge.receipt_email ||
        ''
      ).toLowerCase().trim();

      const customerName = (
        charge.billing_details?.name ||
        charge.customer?.name ||
        ''
      ).toLowerCase().trim();

      // Try to find matching purchase
      let matchedPurchase = null;
      let matchMethod = null;

      // Strategy 1: Match by email + date
      if (customerEmail) {
        const emailKey = `${customerEmail}|${chargeDate}`;
        const candidates = purchasesByEmail[emailKey] || [];
        // Find best match: prefer unreconciled, closest amount
        matchedPurchase = findBestMatch(candidates, chargeAmountCents, updatedPurchaseIds);
        if (matchedPurchase) matchMethod = 'email+date';
      }

      // Strategy 2: Match by name + date
      if (!matchedPurchase && customerName) {
        const nameKey = `${customerName}|${chargeDate}`;
        const candidates = purchasesByName[nameKey] || [];
        matchedPurchase = findBestMatch(candidates, chargeAmountCents, updatedPurchaseIds);
        if (matchedPurchase) matchMethod = 'name+date';
      }

      // Strategy 3: Fuzzy name match (first+last in either order) + date
      if (!matchedPurchase && customerName) {
        const nameParts = customerName.split(/\s+/).filter(Boolean);
        if (nameParts.length >= 2) {
          for (const key of Object.keys(purchasesByName)) {
            const [pName] = key.split('|');
            if (key.endsWith(`|${chargeDate}`) && nameParts.every(part => pName.includes(part))) {
              const candidates = purchasesByName[key];
              matchedPurchase = findBestMatch(candidates, chargeAmountCents, updatedPurchaseIds);
              if (matchedPurchase) {
                matchMethod = 'fuzzy_name+date';
                break;
              }
            }
          }
        }
      }

      if (matchedPurchase) {
        // Check if already reconciled with same amount
        if (matchedPurchase.stripe_amount_cents === chargeAmountCents && matchedPurchase.stripe_payment_intent_id === charge.payment_intent) {
          alreadyReconciled.push({
            charge_id: charge.id,
            purchase_id: matchedPurchase.id,
            patient_name: matchedPurchase.patient_name,
            amount: chargeAmountDollars,
          });
          updatedPurchaseIds.add(matchedPurchase.id);
          continue;
        }

        const oldAmount = parseFloat(matchedPurchase.amount_paid || matchedPurchase.amount || 0);
        const mismatch = Math.abs(chargeAmountCents - Math.round(oldAmount * 100)) > 1;

        updatedPurchaseIds.add(matchedPurchase.id);

        const matchRecord = {
          charge_id: charge.id,
          payment_intent: charge.payment_intent,
          purchase_id: matchedPurchase.id,
          patient_name: matchedPurchase.patient_name,
          customer_email: customerEmail,
          match_method: matchMethod,
          stripe_amount: chargeAmountDollars,
          old_amount: oldAmount,
          mismatch,
          stripe_status: chargeStatus,
          charge_date: chargeDate,
          purchase_date: matchedPurchase.purchase_date,
        };

        // Apply the fix if not dry run
        if (!dryRun) {
          const updateData = {
            stripe_amount_cents: chargeAmountCents,
            stripe_status: chargeStatus,
            stripe_payment_intent_id: charge.payment_intent,
            stripe_verified_at: new Date().toISOString(),
          };

          // Always update to Stripe's actual amount
          if (mismatch) {
            updateData.amount = chargeAmountDollars;
            updateData.amount_paid = chargeAmountDollars;
          }

          await supabase
            .from('purchases')
            .update(updateData)
            .eq('id', matchedPurchase.id);
        }

        matched.push(matchRecord);
      } else {
        unmatched.push({
          charge_id: charge.id,
          payment_intent: charge.payment_intent,
          customer_email: customerEmail,
          customer_name: customerName || charge.billing_details?.name || '',
          amount: chargeAmountDollars,
          status: chargeStatus,
          date: chargeDate,
          description: charge.description || '',
        });
      }
    }

    // ── Step 4: Find purchases with NO matching Stripe charge ──────────
    const unmatchedPurchases = (purchases || []).filter(p =>
      !updatedPurchaseIds.has(p.id) && !p.stripe_payment_intent_id
    );

    // ── Step 5: Summary ────────────────────────────────────────────────
    const totalStripeCollected = allCharges
      .filter(c => c.status === 'succeeded' && !c.refunded)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalDbAmount = (purchases || [])
      .reduce((sum, p) => sum + Math.round((parseFloat(p.amount_paid || p.amount || 0)) * 100), 0);

    const mismatches = matched.filter(m => m.mismatch);

    const result = {
      month,
      dry_run: dryRun,
      stripe: {
        total_charges: allCharges.length,
        succeeded: allCharges.filter(c => c.status === 'succeeded' && !c.refunded).length,
        total_collected_cents: totalStripeCollected,
        total_collected: (totalStripeCollected / 100).toFixed(2),
        refunded: allCharges.filter(c => c.refunded).length,
        failed: allCharges.filter(c => c.status === 'failed').length,
      },
      database: {
        total_purchases: (purchases || []).length,
        total_amount: (totalDbAmount / 100).toFixed(2),
        discrepancy: ((totalDbAmount - totalStripeCollected) / 100).toFixed(2),
      },
      reconciliation: {
        matched: matched.length,
        mismatches: mismatches.length,
        already_correct: alreadyReconciled.length,
        unmatched_charges: unmatched.length,
        unmatched_purchases: unmatchedPurchases.length,
      },
      details: {
        mismatches: mismatches.slice(0, 50),
        unmatched_charges: unmatched.slice(0, 30),
        unmatched_purchases: unmatchedPurchases.slice(0, 30).map(p => ({
          id: p.id,
          patient_name: p.patient_name,
          amount: parseFloat(p.amount || 0),
          date: p.purchase_date,
          item: p.item_name,
          category: p.category,
        })),
      },
    };

    if (!dryRun) {
      result.message = `Reconciled ${matched.length} purchases against Stripe. Fixed ${mismatches.length} amount mismatches. ${unmatched.length} Stripe charges unmatched (may be Mango Mint / Zenoti).`;
    } else {
      result.message = `DRY RUN: Would reconcile ${matched.length} purchases. ${mismatches.length} have incorrect amounts. ${unmatched.length} Stripe charges have no matching purchase. POST to apply fixes.`;
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('Deep Stripe reconciliation error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Find the best matching purchase from candidates
// Prefers: unreconciled > closest amount > first available
function findBestMatch(candidates, chargeAmountCents, usedIds) {
  if (!candidates || candidates.length === 0) return null;

  // Filter out already-used purchases
  const available = candidates.filter(p => !usedIds.has(p.id));
  if (available.length === 0) return null;

  // Prefer exact amount match first
  const exactMatch = available.find(p => {
    const pCents = Math.round((parseFloat(p.amount_paid || p.amount || 0)) * 100);
    return Math.abs(pCents - chargeAmountCents) <= 1;
  });
  if (exactMatch) return exactMatch;

  // Then prefer unreconciled purchases
  const unreconciled = available.filter(p => !p.stripe_amount_cents);
  if (unreconciled.length > 0) {
    // Return closest amount match
    return unreconciled.reduce((best, p) => {
      const diff = Math.abs(Math.round((parseFloat(p.amount_paid || p.amount || 0)) * 100) - chargeAmountCents);
      const bestDiff = Math.abs(Math.round((parseFloat(best.amount_paid || best.amount || 0)) * 100) - chargeAmountCents);
      return diff < bestDiff ? p : best;
    });
  }

  // Last resort: any available
  return available[0];
}
