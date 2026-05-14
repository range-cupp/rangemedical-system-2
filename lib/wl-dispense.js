// /lib/wl-dispense.js
// Shared dispense + payment helpers for weight-loss tracking.
// Used by:
//   - /pages/api/admin/wl-tracker.js     → builds the tracker dashboard
//   - /pages/api/protocols/active-wl.js  → feeds the encounter modal popup
//
// "Dispense" answers "do I need to ship the next block of injections?"
// "Payment" answers "did money change hands on the last block?"
// They're independent: a comp patient's block can still run out (dispense
// due) even though they never paid (payment = comp).
//
// Range Medical

function daysBetween(aISO, bISO) {
  const a = new Date(aISO + 'T12:00:00');
  const b = new Date(bISO + 'T12:00:00');
  return Math.round((b - a) / 86400000);
}

// Parse a WL purchase into the number of injections it covers. The qty field
// is reliable for itemized buys ("5x 8mg" qty=5), but monthly/4-week-supply
// items come through as qty=1 with the count buried in the item_name.
export function injectionsFromPurchase(purchase) {
  if (!purchase) return 0;
  const itemName = String(purchase.item_name || '').toLowerCase();
  const qty = Number(purchase.quantity || 1) || 1;

  // Itemized multi-buys: "5x 8mg" qty=5, "4x 2.5mg" qty=4 → trust qty
  if (qty >= 2) return qty;

  // "4 week supply" / "12 week supply" / "8 weeks" → use the number
  const weekMatch = itemName.match(/(\d+)\s*week/);
  if (weekMatch) {
    const n = parseInt(weekMatch[1], 10);
    if (n > 0) return n;
  }

  // "Monthly" line items = ~4 weekly injections
  if (/monthly|month/.test(itemName)) return 4;

  // Fallback: a single injection
  return 1;
}

// Payment status — strictly "did money change hands?" Doesn't care about
// coverage runout; that's the dispense badge's job. Comp patients always show
// "Comp" here, even after their block is exhausted, so staff can tell at a
// glance "this patient has never paid" vs "this patient paid for a block that
// just ran out."
export function computePaymentStatus(lastPurchase, protocolComp) {
  if (protocolComp) {
    return { state: 'comp', label: 'Comp', last_purchase_date: lastPurchase?.purchase_date || null, amount_paid: 0 };
  }
  if (!lastPurchase) {
    return { state: 'unknown', label: 'No purchases', last_purchase_date: null, amount_paid: null };
  }
  const amount = Number(lastPurchase.amount_paid) || 0;
  if (amount === 0) {
    return { state: 'comp', label: 'Comp', last_purchase_date: lastPurchase.purchase_date, amount_paid: 0 };
  }
  return {
    state: 'paid',
    label: `Paid $${amount.toFixed(0)}`,
    last_purchase_date: lastPurchase.purchase_date,
    amount_paid: amount,
  };
}

// Dispense status — "do I need to send out the next block of injections?"
// Computed from the most recent purchase (paid or comp): each block of
// injections covers `injections × cadence` days. When that runs out, the
// patient needs the next block dispatched. Independent of payment state.
//
// Returns:
//   { state, label, sessions_remaining, total, used, days_until_due,
//     last_dispensed_date, coverage_days }
//
// state ∈ 'send_now' | 'due_now' | 'due_soon' | 'active' | 'never'
//   send_now : days_until_due ≤ 0  (block exhausted)
//   due_now  : days_until_due ≤ 7
//   due_soon : days_until_due ≤ 14
//   active   : days_until_due > 14
//   never    : no purchase on file
export function computeDispenseStatus(cadenceDays, lastPurchase, todayISO) {
  if (!lastPurchase) {
    return {
      state: 'never', label: 'Never sent',
      sessions_remaining: 0, total: 0, used: 0, days_until_due: null,
      last_dispensed_date: null, coverage_days: 0,
    };
  }

  const injectionsCovered = injectionsFromPurchase(lastPurchase);
  const coverageDays = injectionsCovered * cadenceDays;
  const daysSincePurchase = Math.max(0, daysBetween(lastPurchase.purchase_date, todayISO));
  const daysRemaining = coverageDays - daysSincePurchase;

  const baseFields = {
    sessions_remaining: Math.max(0, injectionsCovered - Math.floor(daysSincePurchase / cadenceDays)),
    total: injectionsCovered,
    used: Math.min(injectionsCovered, Math.floor(daysSincePurchase / cadenceDays)),
    days_until_due: Math.max(0, daysRemaining),
    last_dispensed_date: lastPurchase.purchase_date,
    coverage_days: coverageDays,
  };

  if (daysRemaining <= 0) {
    return { state: 'send_now', label: 'Send next block', ...baseFields, days_until_due: 0 };
  }
  if (daysRemaining <= 7) {
    return { state: 'due_now', label: `Send in ${daysRemaining}d`, ...baseFields };
  }
  if (daysRemaining <= 14) {
    return { state: 'due_soon', label: `Send in ${daysRemaining}d`, ...baseFields };
  }
  return { state: 'active', label: `${daysRemaining}d supply`, ...baseFields };
}
