// /pages/api/patients/[id]/comms.js
// Per-patient communications API
// Supports channel filter and pagination
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const limit = Math.min(500, parseInt(req.query.limit) || 200);
  const channel = req.query.channel; // 'sms' | 'email' | 'call' | undefined (all)
  const phone = req.query.phone; // optional: query by phone instead of patient_id

  if (!id && !phone) {
    return res.status(400).json({ error: 'Patient ID or phone required' });
  }

  try {
    let query = supabase
      .from('comms_log')
      .select('id, channel, message_type, message, status, error_message, recipient, subject, direction, source, created_at');

    if (id && id !== '_' && phone) {
      // Query by patient_id OR matching phone — catches orphaned pre-link messages
      query = query.or(`patient_id.eq.${id},recipient.eq.${phone}`);
    } else if (id && id !== '_') {
      query = query.eq('patient_id', id);
    } else if (phone) {
      query = query.eq('recipient', phone);
    }

    query = query.order('created_at', { ascending: false }).limit(limit);

    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data: comms, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      comms: comms || [],
      total: comms?.length || 0
    });

  } catch (error) {
    console.error('Comms API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
