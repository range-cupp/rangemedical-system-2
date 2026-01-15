// /pages/api/notifications/[id].js
// Manage purchase notifications

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    return updateNotification(id, req.body, res);
  }

  if (req.method === 'DELETE') {
    return dismissNotification(id, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function updateNotification(id, data, res) {
  try {
    const { data: notification, error } = await supabase
      .from('purchase_notifications')
      .update({
        status: data.status,
        assigned_protocol_id: data.protocolId,
        actioned_by: data.actionedBy,
        actioned_at: new Date().toISOString(),
        notes: data.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function dismissNotification(id, res) {
  try {
    const { error } = await supabase
      .from('purchase_notifications')
      .update({
        status: 'dismissed',
        actioned_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
