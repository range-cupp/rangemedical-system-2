// /pages/api/purchases/update.js
// Update purchase record
// Range Medical - 2026-01-17

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, ...updates } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Purchase ID required' });
    }

    // Only allow specific fields to be updated
    const allowedFields = ['protocol_created', 'protocol_id', 'notes'];
    const sanitizedUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from('purchases')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating purchase:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      purchase: data 
    });

  } catch (error) {
    console.error('Purchase update error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
