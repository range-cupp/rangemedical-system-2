// /pages/api/protocols/[id]/frequency.js
// Update only the scheduling/cadence fields on a protocol — frequency text,
// and (for HRT) injections_per_week. This is intentionally separate from
// PATCH /api/protocols/[id] which gates dose-related writes through the
// dose-change-guard. The user has explicitly classified frequency edits as
// non-clinical scheduling changes that don't need provider approval.
//
// Allowed fields:
//   - frequency  (text, e.g. "Weekly", "every 3.5 days")
//   - injections_per_week (int, HRT only — keeps the SIG math consistent)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Protocol ID is required' });
  }

  const { frequency, injections_per_week } = req.body || {};

  if (frequency == null && injections_per_week == null) {
    return res.status(400).json({ error: 'frequency or injections_per_week is required' });
  }

  // Confirm the protocol exists before writing.
  const { data: existing, error: loadErr } = await supabase
    .from('protocols')
    .select('id, program_type, category')
    .eq('id', id)
    .maybeSingle();

  if (loadErr || !existing) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  const update = { updated_at: new Date().toISOString() };
  if (frequency != null) update.frequency = String(frequency).trim() || null;
  if (injections_per_week != null) {
    const ipw = parseInt(injections_per_week);
    if (Number.isNaN(ipw) || ipw < 1 || ipw > 14) {
      return res.status(400).json({ error: 'injections_per_week must be between 1 and 14' });
    }
    update.injections_per_week = ipw;
  }

  const { data, error } = await supabase
    .from('protocols')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update protocol frequency:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, protocol: data });
}
