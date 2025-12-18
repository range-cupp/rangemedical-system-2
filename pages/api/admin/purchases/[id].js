// /pages/api/admin/purchases/[id].js
// Update purchase record - Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Purchase ID required' });
  }

  // PATCH - Update purchase
  if (req.method === 'PATCH') {
    const { amount, category, item_name, quantity } = req.body;

    try {
      // Build update object with only provided fields
      const updateData = {};
      
      if (amount !== undefined) {
        updateData.amount = parseFloat(amount);
      }
      if (category !== undefined) {
        updateData.category = category;
      }
      if (item_name !== undefined) {
        updateData.item_name = item_name;
      }
      if (quantity !== undefined) {
        updateData.quantity = parseInt(quantity);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data: purchase, error } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Purchase update error:', error);
        return res.status(500).json({ error: 'Failed to update purchase', details: error.message });
      }

      return res.status(200).json(purchase);

    } catch (error) {
      console.error('Purchase update error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  // GET - Get single purchase
  if (req.method === 'GET') {
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    return res.status(200).json(purchase);
  }

  // DELETE - Delete purchase
  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete purchase', details: error.message });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
