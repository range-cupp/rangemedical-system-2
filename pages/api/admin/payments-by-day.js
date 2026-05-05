// /pages/api/admin/payments-by-day.js
// Returns purchases grouped by Pacific-time day with daily totals.
// Used by the "Daily" tab on /admin/payments.

import { createClient } from '@supabase/supabase-js';
import { toPacificDate } from '../../../lib/date-utils';
import { lookupCogsCents } from '../../../lib/cogs-lookup';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const days = Math.min(parseInt(req.query.days || '30', 10) || 30, 180);
  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const PAGE = 1000;
    let from = 0;
    let all = [];
    while (true) {
      const { data, error } = await supabase
        .from('purchases')
        .select('id, patient_id, patient_name, item_name, product_name, medication, description, category, quantity, amount, amount_paid, original_amount, payment_method, source, stripe_status, card_brand, card_last4, purchase_date, created_at')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);

      if (error) {
        console.error('payments-by-day fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch purchases', details: error.message });
      }
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < PAGE) break;
      from += PAGE;
    }

    // Group by Pacific date
    const byDay = new Map();
    for (const p of all) {
      // Skip refunded / failed records — they're not real revenue
      if (p.stripe_status === 'failed' || p.stripe_status === 'refunded') continue;

      const dateKey = p.purchase_date || toPacificDate(p.created_at);
      if (!byDay.has(dateKey)) byDay.set(dateKey, []);

      const cogsCents = lookupCogsCents(p);
      const amountPaid = parseFloat(p.amount_paid ?? p.amount ?? 0) || 0;

      byDay.get(dateKey).push({
        ...p,
        amount_paid_num: amountPaid,
        cogs_cents: cogsCents,
        is_comp: amountPaid === 0,
      });
    }

    // Build sorted day buckets with totals
    const days_out = Array.from(byDay.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, purchases]) => {
        const collected = purchases.reduce((s, p) => s + p.amount_paid_num, 0);
        const cogsCents = purchases.reduce((s, p) => s + (p.cogs_cents || 0), 0);
        const compCount = purchases.filter(p => p.is_comp).length;
        const txnCount = purchases.length;
        return {
          date,
          collected,
          cogs_cents: cogsCents,
          margin: collected - cogsCents / 100,
          comp_count: compCount,
          txn_count: txnCount,
          purchases,
        };
      });

    const totals = {
      collected: days_out.reduce((s, d) => s + d.collected, 0),
      cogs_cents: days_out.reduce((s, d) => s + d.cogs_cents, 0),
      txn_count: days_out.reduce((s, d) => s + d.txn_count, 0),
      comp_count: days_out.reduce((s, d) => s + d.comp_count, 0),
    };

    return res.status(200).json({ days: days_out, totals });
  } catch (err) {
    console.error('payments-by-day error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
