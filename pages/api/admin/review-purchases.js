// /pages/api/admin/review-purchases.js
// Fetch all purchases for amount review
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Simple password check
  const password = req.headers['x-admin-password'] || req.query.password;
  if (password !== 'range2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('id, patient_name, patient_email, item_name, category, amount, list_price, purchase_date, created_at')
        .order('purchase_date', { ascending: false, nullsFirst: false })
        .limit(500);

      if (error) {
        console.error('Error fetching purchases:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ purchases: purchases || [] });
    } catch (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
