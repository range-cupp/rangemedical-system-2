// =====================================================
// PROTOCOL STATUS UPDATE API
// /pages/api/admin/protocol/status.js
// Updates protocol status (active, completed, cancelled)
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { protocol_id, status } = req.body;

  if (!protocol_id) {
    return res.status(400).json({ success: false, error: 'Protocol ID required' });
  }

  if (!status || !['active', 'completed', 'cancelled', 'paused'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // If completing, set end date to today if not already passed
    if (status === 'completed') {
      const { data: protocol } = await supabase
        .from('protocols')
        .select('end_date')
        .eq('id', protocol_id)
        .single();
      
      if (!protocol?.end_date || new Date(protocol.end_date) > new Date()) {
        updateData.end_date = new Date().toISOString().split('T')[0];
      }
    }

    const { data, error } = await supabase
      .from('protocols')
      .update(updateData)
      .eq('id', protocol_id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      message: `Protocol marked as ${status}`
    });

  } catch (error) {
    console.error('Protocol status update error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
