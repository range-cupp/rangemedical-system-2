// /pages/api/admin/mark-read.js
// Mark inbound SMS messages as read
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

  try {
    const { patientId, all } = req.body;

    if (!patientId && !all) {
      return res.status(400).json({ error: 'patientId or all:true required' });
    }

    const now = new Date().toISOString();

    if (all) {
      // Mark ALL unread inbound SMS as read
      const { data, error } = await supabase
        .from('comms_log')
        .update({ read_at: now })
        .eq('direction', 'inbound')
        .eq('channel', 'sms')
        .is('read_at', null)
        .select('id');

      if (error) {
        console.error('Mark all read error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        marked: data?.length || 0,
      });
    }

    // Mark specific patient's inbound SMS as read
    const { data, error } = await supabase
      .from('comms_log')
      .update({ read_at: now })
      .eq('direction', 'inbound')
      .eq('channel', 'sms')
      .eq('patient_id', patientId)
      .is('read_at', null)
      .select('id');

    if (error) {
      console.error('Mark read error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      marked: data?.length || 0,
    });

  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: error.message });
  }
}
