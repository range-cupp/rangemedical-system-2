// /pages/api/protocols/[id]/extend.js
// Extend take-home protocol supply by adding days
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

  const { id } = req.query;
  const { purchaseId, extendDays } = req.body;

  if (!id || !extendDays) {
    return res.status(400).json({ error: 'Protocol ID and extend days required' });
  }

  try {
    // Get the protocol
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Calculate new end date
    const currentEndDate = protocol.end_date ? new Date(protocol.end_date) : new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + parseInt(extendDays));

    // Update the protocol
    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        end_date: newEndDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
        notes: protocol.notes 
          ? `${protocol.notes}\nExtended by ${extendDays} days on ${new Date().toLocaleDateString()}`
          : `Extended by ${extendDays} days on ${new Date().toLocaleDateString()}`
      })
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to extend protocol' });
    }

    // Mark the purchase as used
    if (purchaseId) {
      await supabase
        .from('purchases')
        .update({ protocol_created: true })
        .eq('id', purchaseId);
    }

    return res.status(200).json({ 
      success: true, 
      message: `Supply extended by ${extendDays} days. New end date: ${newEndDate.toLocaleDateString()}`,
      newEndDate: newEndDate.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Extend protocol error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
