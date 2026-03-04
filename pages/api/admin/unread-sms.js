// /pages/api/admin/unread-sms.js
// Returns count of unread inbound SMS messages
// Polled every 15 seconds from AdminLayout for front desk notifications
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Count unread inbound SMS
    const { count, error: countError } = await supabase
      .from('comms_log')
      .select('*', { count: 'exact', head: true })
      .eq('direction', 'inbound')
      .eq('channel', 'sms')
      .is('read_at', null);

    if (countError) {
      console.error('Unread count error:', countError);
      return res.status(500).json({ error: countError.message });
    }

    // Get the most recent unread message for notification preview
    let latest = null;
    if (count > 0) {
      const { data: latestMsg } = await supabase
        .from('comms_log')
        .select('id, patient_name, message, recipient, created_at')
        .eq('direction', 'inbound')
        .eq('channel', 'sms')
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestMsg) {
        latest = {
          id: latestMsg.id,
          patientName: latestMsg.patient_name || latestMsg.recipient,
          message: latestMsg.message ? latestMsg.message.substring(0, 100) : '',
          time: latestMsg.created_at,
        };
      }
    }

    // Set short cache to prevent hammering
    res.setHeader('Cache-Control', 'private, max-age=5');

    return res.status(200).json({
      count: count || 0,
      latest,
    });

  } catch (error) {
    console.error('Unread SMS error:', error);
    return res.status(500).json({ error: error.message });
  }
}
