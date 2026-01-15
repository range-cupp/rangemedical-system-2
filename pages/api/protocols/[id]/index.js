// /pages/api/protocols/[id]/index.js
// GET single protocol, DELETE protocol
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Protocol ID required' });
  }

  // GET - fetch single protocol
  if (req.method === 'GET') {
    try {
      const { data: protocol, error } = await supabase
        .from('protocols')
        .select(`
          *,
          patients (
            id,
            name,
            ghl_contact_id
          )
        `)
        .eq('id', id)
        .single();

      if (error || !protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      return res.status(200).json({ success: true, protocol });
    } catch (err) {
      console.error('Fetch protocol error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // DELETE - delete protocol and its logs
  if (req.method === 'DELETE') {
    try {
      // First, get the protocol to confirm it exists
      const { data: protocol, error: fetchError } = await supabase
        .from('protocols')
        .select('id, patient_id')
        .eq('id', id)
        .single();

      if (fetchError || !protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
      }

      // Delete associated logs first (due to foreign key constraint)
      const { error: logsError } = await supabase
        .from('protocol_logs')
        .delete()
        .eq('protocol_id', id);

      if (logsError) {
        console.error('Delete logs error:', logsError);
        // Continue anyway - logs might not exist
      }

      // Delete the protocol
      const { error: deleteError } = await supabase
        .from('protocols')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete protocol error:', deleteError);
        return res.status(500).json({ error: 'Failed to delete protocol' });
      }

      console.log(`✓ Protocol ${id} deleted`);

      return res.status(200).json({
        success: true,
        message: 'Protocol deleted'
      });

    } catch (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
