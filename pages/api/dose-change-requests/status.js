// /pages/api/dose-change-requests/status.js
// Check the status of a pending dose change request.
// Used by the patient profile UI to poll for approval.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { request_id, protocol_id } = req.query;

  if (!request_id && !protocol_id) {
    return res.status(400).json({ error: 'request_id or protocol_id required' });
  }

  try {
    let query = supabase
      .from('dose_change_requests')
      .select('id, status, patient_name, current_dose, proposed_dose, change_type, requested_by_name, requested_at, provider_name, sms_sent_at, link_opened_at, approved_at, denied_at, denial_reason, applied_at, new_protocol_id, expires_at');

    if (request_id) {
      query = query.eq('id', request_id);
    } else {
      query = query.eq('protocol_id', protocol_id)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return res.status(404).json({ error: 'No pending dose change request found' });
    }

    // Auto-expire if past expiration
    if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
      await supabase
        .from('dose_change_requests')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', data.id);
      data.status = 'expired';
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
