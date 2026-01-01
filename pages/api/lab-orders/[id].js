// /pages/api/lab-orders/[id].js
// Lab Orders API - Delete and Update
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Lab order ID required' });
  }

  // DELETE - Remove lab order
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

  // PATCH - Update lab order (e.g., mark as complete)
  if (req.method === 'PATCH') {
    try {
      const { status, ...updates } = req.body;

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (status) {
        updateData.status = status;
        if (status === 'completed') {
          updateData.completed_date = new Date().toISOString().split('T')[0];
        }
      }

      const { data, error } = await supabase
        .from('lab_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        return res.status(500).json({ error: 'Failed to update lab order' });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
