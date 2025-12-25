// /pages/api/admin/purchases/dedupe.js
// Remove duplicate purchases - keeps the oldest record
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to dedupe.' });
  }

  const { dry_run = true } = req.body; // Default to dry run for safety

  try {
    // Get all purchases
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: true }); // Oldest first

    if (error) throw error;

    // Find duplicates by ghl_payment_id (keep first/oldest)
    const seen = new Set();
    const toDelete = [];

    purchases.forEach(p => {
      if (p.ghl_payment_id) {
        if (seen.has(p.ghl_payment_id)) {
          toDelete.push({
            id: p.id,
            reason: 'duplicate_payment_id',
            ghl_payment_id: p.ghl_payment_id,
            item_name: p.item_name,
            patient_name: p.patient_name,
            amount: p.amount
          });
        } else {
          seen.add(p.ghl_payment_id);
        }
      }
    });

    // Also check for exact duplicates by patient + item + date + amount (no payment ID)
    const comboKey = (p) => `${p.patient_name}|${p.item_name}|${p.payment_date}|${p.amount}`;
    const seenCombos = new Set();

    purchases.forEach(p => {
      if (!p.ghl_payment_id) { // Only check records without payment ID
        const key = comboKey(p);
        if (seenCombos.has(key)) {
          toDelete.push({
            id: p.id,
            reason: 'duplicate_combo',
            key,
            item_name: p.item_name,
            patient_name: p.patient_name,
            amount: p.amount
          });
        } else {
          seenCombos.add(key);
        }
      }
    });

    if (dry_run) {
      return res.status(200).json({
        dry_run: true,
        message: 'This is a dry run. Set dry_run: false to actually delete.',
        would_delete: toDelete.length,
        records_to_delete: toDelete
      });
    }

    // Actually delete
    if (toDelete.length > 0) {
      const idsToDelete = toDelete.map(d => d.id);
      
      const { error: deleteError } = await supabase
        .from('purchases')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;
    }

    return res.status(200).json({
      dry_run: false,
      deleted: toDelete.length,
      records_deleted: toDelete
    });

  } catch (error) {
    console.error('Dedupe error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
