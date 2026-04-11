// /pages/api/dose-change-requests/history.js
// Returns all dose change requests for a patient (audit trail).

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id, protocol_id } = req.query;

  if (!patient_id && !protocol_id) {
    return res.status(400).json({ error: 'patient_id or protocol_id required' });
  }

  try {
    let query = supabase
      .from('dose_change_requests')
      .select('id, patient_name, protocol_id, current_dose, proposed_dose, current_injections_per_week, proposed_injections_per_week, change_type, reason, requested_by_name, requested_at, provider_name, sms_sent_at, link_opened_at, approved_at, denied_at, denial_reason, status, applied_at, new_protocol_id, expires_at')
      .order('created_at', { ascending: false });

    if (patient_id) query = query.eq('patient_id', patient_id);
    if (protocol_id) query = query.eq('protocol_id', protocol_id);

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ requests: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
