// /pages/api/admin/purchases/diagnostics.js
// Check for duplicate purchases and data integrity
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all purchases
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Find duplicates by ghl_payment_id
    const paymentIdCounts = {};
    const duplicatesByPaymentId = [];
    
    purchases.forEach(p => {
      if (p.ghl_payment_id) {
        if (!paymentIdCounts[p.ghl_payment_id]) {
          paymentIdCounts[p.ghl_payment_id] = [];
        }
        paymentIdCounts[p.ghl_payment_id].push(p);
      }
    });

    Object.entries(paymentIdCounts).forEach(([paymentId, items]) => {
      if (items.length > 1) {
        duplicatesByPaymentId.push({
          ghl_payment_id: paymentId,
          count: items.length,
          purchases: items.map(p => ({
            id: p.id,
            item_name: p.item_name,
            patient_name: p.patient_name,
            amount: p.amount,
            created_at: p.created_at
          }))
        });
      }
    });

    // Find duplicates by combination of patient + item + date + amount
    const comboKey = (p) => `${p.patient_name}|${p.item_name}|${p.payment_date}|${p.amount}`;
    const comboCounts = {};
    const duplicatesByCombo = [];

    purchases.forEach(p => {
      const key = comboKey(p);
      if (!comboCounts[key]) {
        comboCounts[key] = [];
      }
      comboCounts[key].push(p);
    });

    Object.entries(comboCounts).forEach(([key, items]) => {
      if (items.length > 1) {
        duplicatesByCombo.push({
          key,
          count: items.length,
          purchases: items.map(p => ({
            id: p.id,
            ghl_payment_id: p.ghl_payment_id,
            item_name: p.item_name,
            patient_name: p.patient_name,
            amount: p.amount,
            created_at: p.created_at
          }))
        });
      }
    });

    // Summary stats
    const stats = {
      total_purchases: purchases.length,
      with_ghl_payment_id: purchases.filter(p => p.ghl_payment_id).length,
      without_ghl_payment_id: purchases.filter(p => !p.ghl_payment_id).length,
      with_protocol: purchases.filter(p => p.protocol_id).length,
      without_protocol: purchases.filter(p => !p.protocol_id).length,
      unique_patients: [...new Set(purchases.map(p => p.patient_name))].length,
      date_range: {
        earliest: purchases.length ? purchases[purchases.length - 1].payment_date : null,
        latest: purchases.length ? purchases[0].payment_date : null
      }
    };

    // Category breakdown
    const categoryBreakdown = {};
    purchases.forEach(p => {
      const cat = p.category || 'Unknown';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, total_amount: 0 };
      }
      categoryBreakdown[cat].count++;
      categoryBreakdown[cat].total_amount += parseFloat(p.amount) || 0;
    });

    return res.status(200).json({
      stats,
      category_breakdown: categoryBreakdown,
      duplicates: {
        by_payment_id: {
          count: duplicatesByPaymentId.length,
          items: duplicatesByPaymentId
        },
        by_patient_item_date_amount: {
          count: duplicatesByCombo.length,
          items: duplicatesByCombo.slice(0, 20) // Limit to first 20
        }
      }
    });

  } catch (error) {
    console.error('Diagnostics error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
