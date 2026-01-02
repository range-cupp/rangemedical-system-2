// /pages/api/protocols/[id]/delete.js
// Delete a protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  try {
    // First, get the protocol to find linked purchase
    const { data: protocol, error: fetchError } = await supabase
      .from('protocols')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Reset any purchases linked to this protocol
    await supabase
      .from('purchases')
      .update({ 
        protocol_id: null,
        protocol_created: false
      })
      .eq('protocol_id', id);

    // Delete any protocol logs
    await supabase
      .from('protocol_logs')
      .delete()
      .eq('protocol_id', id);

    // Delete the protocol
    const { error: deleteError } = await supabase
      .from('protocols')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return res.status(200).json({ success: true, message: 'Protocol deleted' });

  } catch (error) {
    console.error('Error deleting protocol:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
