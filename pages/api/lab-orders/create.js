// /pages/api/lab-orders/create.js
// Create a lab order from a purchase
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { purchaseId, patientId, orderType, notes } = req.body;

  if (!purchaseId || !patientId) {
    return res.status(400).json({ error: 'purchaseId and patientId required' });
  }

  try {
    // Create the lab order
    const { data: labOrder, error: labError } = await supabase
      .from('lab_orders')
      .insert({
        patient_id: patientId,
        purchase_id: purchaseId,
        order_type: orderType || 'Standard',
        order_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (labError) {
      console.error('Error creating lab order:', labError);
      return res.status(500).json({ error: 'Failed to create lab order' });
    }

    // Mark the purchase as handled (so it leaves the pipeline)
    await supabase
      .from('purchases')
      .update({ 
        protocol_created: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId);

    return res.status(200).json({ 
      success: true, 
      labOrder 
    });

  } catch (error) {
    console.error('Lab order error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
