// /pages/api/ai/membership-status.js
// Fetches subscription/membership info for a patient for the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, description, service_category, status, amount_cents, interval, interval_count, current_period_start, current_period_end, cancel_at_period_end, canceled_at, started_at')
      .eq('patient_id', patient_id)
      .order('started_at', { ascending: false });

    if (error) throw error;

    const memberships = (data || []).map(s => ({
      name: s.description,
      category: s.service_category,
      status: s.status,
      price: s.amount_cents ? `$${(s.amount_cents / 100).toFixed(0)}` : null,
      billing_cycle: s.interval_count > 1 ? `every ${s.interval_count} ${s.interval}s` : `every ${s.interval}`,
      current_period_end: s.current_period_end,
      cancels_at_period_end: s.cancel_at_period_end,
      canceled_at: s.canceled_at,
      started: s.started_at,
    }));

    const active = memberships.filter(m => m.status === 'active');
    const cancelled = memberships.filter(m => ['canceled', 'past_due'].includes(m.status));

    return res.status(200).json({
      memberships,
      summary: {
        active_count: active.length,
        total: memberships.length,
        active_names: active.map(m => m.name).join(', ') || 'None',
      },
    });
  } catch (err) {
    console.error('Membership status error:', err);
    return res.status(500).json({ error: 'Failed to fetch membership status' });
  }
}
