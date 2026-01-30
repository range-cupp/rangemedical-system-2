// /pages/api/admin/check-purchases.js
// Quick endpoint to check specific purchases by date range
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { start_date, end_date, item_name, amount } = req.query;

  try {
    let query = supabase
      .from('purchases')
      .select('id, patient_name, patient_id, ghl_contact_id, item_name, amount, purchase_date, created_at')
      .order('purchase_date', { ascending: false });

    if (start_date) {
      query = query.gte('purchase_date', start_date);
    }
    if (end_date) {
      query = query.lte('purchase_date', end_date);
    }
    if (item_name) {
      query = query.ilike('item_name', `%${item_name}%`);
    }
    if (amount) {
      query = query.eq('amount', parseFloat(amount));
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    return res.status(200).json({
      count: data?.length || 0,
      purchases: data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
