// /pages/api/protocols/[id]/delete.js
// Delete a protocol

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  try {
    // First check if protocol exists
    const { data: existing, error: checkError } = await supabase
      .from('protocols')
      .select('id, patient_id')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Delete the protocol
    const { error } = await supabase
      .from('protocols')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Protocol deleted' });

  } catch (error) {
    console.error('Error deleting protocol:', error);
    return res.status(500).json({ error: error.message });
  }
}
