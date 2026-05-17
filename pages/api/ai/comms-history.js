// /pages/api/ai/comms-history.js
// Fetches recent communications for a patient for the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const INTERNAL_TYPES = [
  'lab_review_scheduling', 'daily_sales_report', 'daily_numbers',
  'provider_created', 'provider_rescheduled', 'task_assignment',
  'giveaway_staff_alert', 'dose_change_request', 'dose_change_approved',
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { patient_id, channel, limit = '15' } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    let query = supabase
      .from('comms_log')
      .select('id, channel, message_type, message, subject, direction, source, status, recipient, sent_by_employee_name, created_at, needs_response')
      .eq('patient_id', patient_id)
      .not('message_type', 'in', `(${INTERNAL_TYPES.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (channel) query = query.eq('channel', channel);

    const { data, error } = await query;
    if (error) throw error;

    const comms = (data || []).map(c => ({
      channel: c.channel,
      type: c.message_type,
      direction: c.direction || 'outbound',
      subject: c.subject,
      message: c.message?.slice(0, 200) + (c.message?.length > 200 ? '...' : ''),
      sent_by: c.sent_by_employee_name,
      status: c.status,
      needs_response: c.needs_response,
      date: c.created_at,
    }));

    const summary = {
      total: comms.length,
      inbound: comms.filter(c => c.direction === 'inbound').length,
      outbound: comms.filter(c => c.direction === 'outbound').length,
      needs_response: comms.filter(c => c.needs_response).length,
    };

    return res.status(200).json({ comms, summary });
  } catch (err) {
    console.error('Comms history error:', err);
    return res.status(500).json({ error: 'Failed to fetch comms history' });
  }
}
