// /pages/api/purchases/index.js
// Purchases API - Create new purchases
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // POST - Create new purchase
  if (req.method === 'POST') {
    try {
      const {
        patient_id,
        ghl_contact_id,
        patient_name,
        item_name,
        product_name,
        amount,
        amount_paid,
        purchase_date,
        category,
        protocol_created = false,
        dismissed = false
      } = req.body;

      if (!item_name) {
        return res.status(400).json({ error: 'Product name is required' });
      }

      const purchaseData = {
        patient_id: patient_id || null,
        ghl_contact_id: ghl_contact_id || null,
        patient_name: patient_name || null,
        item_name,
        product_name: product_name || item_name,
        amount: amount || 0,
        amount_paid: amount_paid || amount || 0,
        purchase_date: purchase_date || new Date().toISOString().split('T')[0],
        category: category || 'Other',
        protocol_created,
        dismissed,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single();

      if (error) {
        console.error('Error creating purchase:', error);
        return res.status(500).json({ error: 'Failed to create purchase' });
      }

      return res.status(200).json(data);

    } catch (error) {
      console.error('Purchases API error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
