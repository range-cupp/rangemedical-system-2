// /pages/api/purchases/mark-lab-order.js
// Mark a purchase as a lab order (removes from pipeline)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { purchaseId } = req.body;

  if (!purchaseId) {
    return res.status(400).json({ error: 'Purchase ID is required' });
  }

  try {
    // Mark the purchase as protocol_created = true to remove from pipeline
    // Labs don't need a protocol, they just need to be tracked
    const { error } = await supabase
      .from('purchases')
      .update({ 
        protocol_created: true,
        category: 'labs'
      })
      .eq('id', purchaseId);

    if (error) throw error;

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error marking as lab order:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
