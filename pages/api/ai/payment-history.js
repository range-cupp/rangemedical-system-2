// /pages/api/ai/payment-history.js
// Fetches payment history, balance, and invoices for a patient for the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    const [purchaseRes, patientRes, invoiceRes] = await Promise.all([
      supabase
        .from('purchases')
        .select('id, item_name, product_name, category, amount_paid, quantity, payment_method, stripe_status, purchase_date, created_at')
        .eq('patient_id', patient_id)
        .eq('dismissed', false)
        .order('purchase_date', { ascending: false })
        .limit(20),

      supabase
        .from('patients')
        .select('account_credit_cents')
        .eq('id', patient_id)
        .single(),

      supabase
        .from('invoices')
        .select('id, total_cents, status, items, sent_at, paid_at, created_at')
        .eq('patient_id', patient_id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const purchases = (purchaseRes.data || []).map(p => ({
      item: p.item_name || p.product_name,
      category: p.category,
      amount: p.amount_paid ? `$${Number(p.amount_paid).toFixed(2)}` : null,
      quantity: p.quantity,
      method: p.payment_method,
      stripe_status: p.stripe_status,
      date: p.purchase_date || p.created_at,
    }));

    const invoices = (invoiceRes.data || []).map(inv => ({
      total: inv.total_cents ? `$${(inv.total_cents / 100).toFixed(2)}` : null,
      status: inv.status,
      items: Array.isArray(inv.items) ? inv.items.map(i => i.name || i.description).filter(Boolean) : [],
      sent: inv.sent_at,
      paid: inv.paid_at,
      date: inv.created_at,
    }));

    const creditBalance = patientRes.data?.account_credit_cents || 0;
    const totalSpent = (purchaseRes.data || []).reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
    const pendingInvoices = invoices.filter(i => ['pending', 'sent'].includes(i.status));

    return res.status(200).json({
      purchases,
      invoices,
      summary: {
        credit_balance: creditBalance ? `$${(creditBalance / 100).toFixed(2)}` : '$0.00',
        credit_balance_cents: creditBalance,
        total_spent: `$${totalSpent.toFixed(2)}`,
        purchase_count: purchases.length,
        pending_invoices: pendingInvoices.length,
        last_payment: purchases[0]?.date || null,
      },
    });
  } catch (err) {
    console.error('Payment history error:', err);
    return res.status(500).json({ error: 'Failed to fetch payment history' });
  }
}
