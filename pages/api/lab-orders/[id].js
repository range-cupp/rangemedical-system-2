// /pages/api/lab-orders/[id].js
// Lab Order API - GET, PATCH, DELETE for individual lab orders
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Lab order ID required' });
  }

  // GET - Get single lab order
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('lab_orders')
        .select('*, patients(name, email, phone)')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Lab order not found' });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // PATCH - Update lab order
  if (req.method === 'PATCH') {
    try {
      const { status, order_type, notes } = req.body;

      const updates = {
        updated_at: new Date().toISOString()
      };

      if (status !== undefined) updates.status = status;
      if (order_type !== undefined) updates.order_type = order_type;
      if (notes !== undefined) updates.notes = notes;

      const { data, error } = await supabase
        .from('lab_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        return res.status(500).json({ error: 'Failed to update lab order', details: error.message });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // DELETE - Delete lab order
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('lab_orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        return res.status(500).json({ error: 'Failed to delete lab order' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
