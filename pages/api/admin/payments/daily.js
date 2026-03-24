// /pages/api/admin/payments/daily.js
// Returns payment data grouped by day for calendar view + day detail
// GET ?month=2026-03 → per-day aggregates for that month
// GET ?date=2026-03-15 → all transactions for that specific day

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { month, date } = req.query;

  try {
    if (date) {
      return await handleDayDetail(date, res);
    } else if (month) {
      return await handleMonthSummary(month, res);
    } else {
      return res.status(400).json({ error: 'Provide ?month=YYYY-MM or ?date=YYYY-MM-DD' });
    }
  } catch (err) {
    console.error('Daily payments error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function handleMonthSummary(month, res) {
  // Parse month bounds
  const [year, mon] = month.split('-').map(Number);
  if (!year || !mon) return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });

  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
  const endYear = mon === 12 ? year + 1 : year;
  const endMon = mon === 12 ? 1 : mon + 1;
  const endDate = `${endYear}-${String(endMon).padStart(2, '0')}-01`;

  // Fetch purchases for the month
  const { data: purchases, error: pErr } = await supabase
    .from('purchases')
    .select('id, purchase_date, amount, amount_paid, stripe_amount_cents, stripe_status, payment_method, category')
    .gte('purchase_date', startDate)
    .lt('purchase_date', endDate)
    .order('purchase_date');

  if (pErr) throw pErr;

  // Fetch invoices for the month (use paid_at for paid, created_at for others)
  const { data: invoices, error: iErr } = await supabase
    .from('invoices')
    .select('id, status, total_cents, paid_at, created_at')
    .or(`and(paid_at.gte.${startDate},paid_at.lt.${endDate}),and(created_at.gte.${startDate},created_at.lt.${endDate})`);

  if (iErr) throw iErr;

  // Group by day
  const days = {};

  for (const p of (purchases || [])) {
    const day = p.purchase_date;
    if (!day) continue;
    if (!days[day]) days[day] = { count: 0, collected_cents: 0, outstanding_cents: 0, failed: 0, refunded_cents: 0 };

    days[day].count++;

    const amountCents = p.stripe_amount_cents || Math.round((p.amount_paid || p.amount || 0) * 100);

    if (p.stripe_status === 'failed' || p.stripe_status === 'requires_payment_method') {
      days[day].failed++;
    } else if (p.stripe_status === 'refunded') {
      days[day].refunded_cents += amountCents;
    } else {
      days[day].collected_cents += amountCents;
    }
  }

  for (const inv of (invoices || [])) {
    // For paid invoices, group by paid_at date; for others, group by created_at
    let day;
    if (inv.status === 'paid' && inv.paid_at) {
      day = inv.paid_at.split('T')[0];
    } else {
      day = (inv.created_at || '').split('T')[0];
    }

    if (!day || day < startDate || day >= endDate) continue;
    if (!days[day]) days[day] = { count: 0, collected_cents: 0, outstanding_cents: 0, failed: 0, refunded_cents: 0 };

    days[day].count++;

    if (inv.status === 'paid') {
      days[day].collected_cents += inv.total_cents || 0;
    } else if (inv.status === 'pending' || inv.status === 'sent') {
      days[day].outstanding_cents += inv.total_cents || 0;
    }
  }

  // Compute summary
  const summary = {
    total_collected_cents: 0,
    total_outstanding_cents: 0,
    total_refunded_cents: 0,
    failed_count: 0,
    transaction_count: 0,
  };

  for (const d of Object.values(days)) {
    summary.total_collected_cents += d.collected_cents;
    summary.total_outstanding_cents += d.outstanding_cents;
    summary.total_refunded_cents += d.refunded_cents;
    summary.failed_count += d.failed;
    summary.transaction_count += d.count;
  }

  return res.status(200).json({ days, summary });
}

async function handleDayDetail(date, res) {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  const nextDate = new Date(date + 'T00:00:00');
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split('T')[0];

  // Fetch purchases for this day
  const { data: purchases, error: pErr } = await supabase
    .from('purchases')
    .select('id, patient_id, patient_name, item_name, product_name, description, amount, amount_paid, stripe_amount_cents, stripe_status, stripe_verified_at, payment_method, category, source, purchase_date, created_at, stripe_payment_intent_id')
    .eq('purchase_date', date)
    .order('created_at', { ascending: false });

  if (pErr) throw pErr;

  // Fetch invoices for this day
  const { data: paidInvoices, error: iErr1 } = await supabase
    .from('invoices')
    .select('id, patient_id, patient_name, items, total_cents, subtotal_cents, discount_cents, status, paid_at, created_at, stripe_payment_intent_id')
    .eq('status', 'paid')
    .gte('paid_at', date)
    .lt('paid_at', nextDateStr);

  if (iErr1) throw iErr1;

  const { data: otherInvoices, error: iErr2 } = await supabase
    .from('invoices')
    .select('id, patient_id, patient_name, items, total_cents, subtotal_cents, discount_cents, status, paid_at, created_at, stripe_payment_intent_id')
    .neq('status', 'paid')
    .gte('created_at', date)
    .lt('created_at', nextDateStr);

  if (iErr2) throw iErr2;

  // Build unified transactions list
  const transactions = [];

  for (const p of (purchases || [])) {
    const displayAmount = p.stripe_amount_cents
      ? p.stripe_amount_cents / 100
      : (p.amount_paid && p.amount_paid < p.amount ? p.amount_paid : p.amount);

    const mismatch = p.stripe_amount_cents
      ? Math.abs(p.stripe_amount_cents - Math.round((p.amount_paid || p.amount) * 100)) > 1
      : false;

    transactions.push({
      type: 'purchase',
      id: p.id,
      patient_id: p.patient_id,
      patient_name: p.patient_name,
      description: p.description || p.item_name || p.product_name,
      amount: displayAmount,
      original_amount: p.amount,
      stripe_amount_cents: p.stripe_amount_cents,
      stripe_verified: !!p.stripe_verified_at,
      amount_mismatch: mismatch,
      payment_method: p.payment_method || 'unknown',
      status: p.stripe_status || 'succeeded',
      category: p.category,
      source: p.source,
      time: p.created_at,
    });
  }

  for (const inv of [...(paidInvoices || []), ...(otherInvoices || [])]) {
    const itemSummary = (inv.items || []).map(i => i.name || i.description).join(', ');
    transactions.push({
      type: 'invoice',
      id: inv.id,
      patient_id: inv.patient_id,
      patient_name: inv.patient_name,
      description: itemSummary || 'Invoice',
      amount: (inv.total_cents || 0) / 100,
      payment_method: 'invoice',
      status: inv.status,
      category: null,
      time: inv.status === 'paid' ? inv.paid_at : inv.created_at,
    });
  }

  // Sort by time descending
  transactions.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

  // Compute summary
  const collected = transactions
    .filter(t => t.status === 'succeeded' || t.status === 'paid')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const outstanding = transactions
    .filter(t => t.status === 'pending' || t.status === 'sent')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const failed = transactions.filter(t => t.status === 'failed' || t.status === 'requires_payment_method').length;
  const refunded = transactions.filter(t => t.status === 'refunded').reduce((sum, t) => sum + (t.amount || 0), 0);

  return res.status(200).json({
    date,
    transactions,
    summary: {
      collected,
      outstanding,
      failed,
      refunded,
      total: transactions.length,
    },
  });
}
