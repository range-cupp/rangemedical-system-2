// /pages/api/admin/import-transactions.js
// Import transaction sheets (Mango Mint, Zenoti, etc.) to reconcile purchase amounts
// POST /api/admin/import-transactions
// Body: { transactions: [...], source: "mango_mint" | "zenoti", dry_run: true/false }
//
// Each transaction: { customer_name, customer_email?, date, amount, description? }
// Matches to existing GHL purchases and updates amounts to reflect what was actually charged.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transactions, source, dry_run } = req.body;

  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'Provide transactions array' });
  }

  if (!source) {
    return res.status(400).json({ error: 'Provide source (mango_mint, zenoti, etc.)' });
  }

  try {
    // Get date range from transactions
    const dates = transactions.map(t => t.date).filter(Boolean).sort();
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    if (!minDate || !maxDate) {
      return res.status(400).json({ error: 'Transactions must have valid dates (YYYY-MM-DD)' });
    }

    // Pad max date by 1 day for range query
    const maxDateObj = new Date(maxDate + 'T00:00:00');
    maxDateObj.setDate(maxDateObj.getDate() + 1);
    const endDate = maxDateObj.toISOString().split('T')[0];

    // Fetch all purchases in the date range
    const { data: purchases, error: pErr } = await supabase
      .from('purchases')
      .select('id, patient_id, patient_name, patient_email, purchase_date, amount, amount_paid, item_name, category, stripe_amount_cents, stripe_status, source')
      .gte('purchase_date', minDate)
      .lt('purchase_date', endDate)
      .order('purchase_date');

    if (pErr) throw pErr;

    // Index purchases by email+date and name+date
    const byEmail = {};
    const byName = {};
    for (const p of (purchases || [])) {
      if (p.patient_email) {
        const key = `${p.patient_email.toLowerCase()}|${p.purchase_date}`;
        if (!byEmail[key]) byEmail[key] = [];
        byEmail[key].push(p);
      }
      const nameKey = `${(p.patient_name || '').toLowerCase().trim()}|${p.purchase_date}`;
      if (!byName[nameKey]) byName[nameKey] = [];
      byName[nameKey].push(p);
    }

    const matched = [];
    const unmatched = [];
    const usedIds = new Set();

    for (const txn of transactions) {
      const txnAmountCents = Math.round((parseFloat(txn.amount) || 0) * 100);
      const txnDate = txn.date;
      const txnEmail = (txn.customer_email || '').toLowerCase().trim();
      const txnName = (txn.customer_name || '').toLowerCase().trim();

      if (!txnDate || txnAmountCents === 0) {
        unmatched.push({ ...txn, reason: 'Missing date or zero amount' });
        continue;
      }

      let matchedPurchase = null;
      let matchMethod = null;

      // Strategy 1: Email + date
      if (txnEmail) {
        const candidates = byEmail[`${txnEmail}|${txnDate}`] || [];
        matchedPurchase = findBestMatch(candidates, txnAmountCents, usedIds);
        if (matchedPurchase) matchMethod = 'email+date';
      }

      // Strategy 2: Name + date
      if (!matchedPurchase && txnName) {
        const candidates = byName[`${txnName}|${txnDate}`] || [];
        matchedPurchase = findBestMatch(candidates, txnAmountCents, usedIds);
        if (matchedPurchase) matchMethod = 'name+date';
      }

      // Strategy 3: Fuzzy name + date
      if (!matchedPurchase && txnName) {
        const nameParts = txnName.split(/\s+/).filter(Boolean);
        if (nameParts.length >= 2) {
          for (const key of Object.keys(byName)) {
            const [pName] = key.split('|');
            if (key.endsWith(`|${txnDate}`) && nameParts.every(part => pName.includes(part))) {
              const candidates = byName[key];
              matchedPurchase = findBestMatch(candidates, txnAmountCents, usedIds);
              if (matchedPurchase) {
                matchMethod = 'fuzzy_name+date';
                break;
              }
            }
          }
        }
      }

      if (matchedPurchase) {
        usedIds.add(matchedPurchase.id);
        const oldAmount = parseFloat(matchedPurchase.amount_paid || matchedPurchase.amount || 0);
        const txnAmountDollars = txnAmountCents / 100;
        const mismatch = Math.abs(txnAmountCents - Math.round(oldAmount * 100)) > 1;

        const record = {
          purchase_id: matchedPurchase.id,
          patient_name: matchedPurchase.patient_name,
          match_method: matchMethod,
          old_amount: oldAmount,
          actual_amount: txnAmountDollars,
          mismatch,
          date: txnDate,
          source_description: txn.description || '',
        };

        if (!dry_run && mismatch) {
          await supabase
            .from('purchases')
            .update({
              amount: txnAmountDollars,
              amount_paid: txnAmountDollars,
              stripe_amount_cents: txnAmountCents,
              stripe_status: 'succeeded',
              stripe_verified_at: new Date().toISOString(),
            })
            .eq('id', matchedPurchase.id);
        } else if (!dry_run && !mismatch) {
          // Still mark as verified even if amount matches
          await supabase
            .from('purchases')
            .update({
              stripe_amount_cents: txnAmountCents,
              stripe_status: 'succeeded',
              stripe_verified_at: new Date().toISOString(),
            })
            .eq('id', matchedPurchase.id);
        }

        matched.push(record);
      } else {
        unmatched.push({
          customer_name: txn.customer_name,
          customer_email: txn.customer_email,
          amount: parseFloat(txn.amount),
          date: txnDate,
          description: txn.description,
          reason: 'No matching purchase found',
        });
      }
    }

    const mismatches = matched.filter(m => m.mismatch);

    return res.status(200).json({
      source,
      dry_run: !!dry_run,
      message: dry_run
        ? `DRY RUN: Would match ${matched.length} of ${transactions.length} transactions. ${mismatches.length} have incorrect amounts. POST with dry_run: false to apply.`
        : `Matched ${matched.length} of ${transactions.length} transactions. Fixed ${mismatches.length} incorrect amounts.`,
      summary: {
        total_transactions: transactions.length,
        matched: matched.length,
        mismatches: mismatches.length,
        amount_correct: matched.length - mismatches.length,
        unmatched: unmatched.length,
      },
      details: {
        mismatches: mismatches.slice(0, 50),
        unmatched: unmatched.slice(0, 30),
      },
    });

  } catch (err) {
    console.error('Transaction import error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function findBestMatch(candidates, amountCents, usedIds) {
  if (!candidates || candidates.length === 0) return null;
  const available = candidates.filter(p => !usedIds.has(p.id));
  if (available.length === 0) return null;

  // Prefer exact amount match
  const exact = available.find(p => {
    const pCents = Math.round((parseFloat(p.amount_paid || p.amount || 0)) * 100);
    return Math.abs(pCents - amountCents) <= 1;
  });
  if (exact) return exact;

  // Then unreconciled, closest amount
  const unreconciled = available.filter(p => !p.stripe_amount_cents);
  if (unreconciled.length > 0) {
    return unreconciled.reduce((best, p) => {
      const diff = Math.abs(Math.round((parseFloat(p.amount_paid || p.amount || 0)) * 100) - amountCents);
      const bestDiff = Math.abs(Math.round((parseFloat(best.amount_paid || best.amount || 0)) * 100) - amountCents);
      return diff < bestDiff ? p : best;
    });
  }

  return available[0];
}
