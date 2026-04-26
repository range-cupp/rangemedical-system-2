// /pages/api/protocols/[id]/frequency.js
// Update only the scheduling/cadence fields on a protocol — frequency text,
// and (for HRT primary) injections_per_week. This is intentionally separate
// from PATCH /api/protocols/[id] which gates dose-related writes through the
// dose-change-guard. The user has explicitly classified frequency edits as
// non-clinical scheduling changes that don't need provider approval.
//
// Two targets are supported:
//   1. Primary protocol medication (default). Allowed fields:
//      - frequency  (text, e.g. "Weekly", "every 3.5 days")
//      - injections_per_week (int, HRT only — keeps SIG math consistent)
//
//   2. HRT secondary medication living inside the parent protocol's
//      secondary_medication_details JSON. Pass `secondary_medication_name`
//      in the body. Only `frequency` is editable — the entry's `frequency`
//      key (the free-text SIG line) gets overwritten in place.

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

  const { frequency, injections_per_week, secondary_medication_name } = req.body || {};

  if (frequency == null && injections_per_week == null) {
    return res.status(400).json({ error: 'frequency or injections_per_week is required' });
  }

  // Load the protocol — we may need to read its secondary_medication_details.
  const { data: existing, error: loadErr } = await supabase
    .from('protocols')
    .select('id, program_type, category, secondary_medication_details')
    .eq('id', id)
    .maybeSingle();

  if (loadErr || !existing) {
    return res.status(404).json({ error: 'Protocol not found' });
  }

  // ── SECONDARY MED BRANCH ──
  // Patch the matching entry inside secondary_medication_details JSON.
  if (secondary_medication_name) {
    if (frequency == null) {
      return res.status(400).json({ error: 'frequency is required when targeting a secondary medication' });
    }
    const existingDetails = existing.secondary_medication_details
      ? (typeof existing.secondary_medication_details === 'string'
          ? JSON.parse(existing.secondary_medication_details)
          : existing.secondary_medication_details)
      : [];

    const targetExists = existingDetails.some(d => (d.medication || d.name) === secondary_medication_name);
    if (!targetExists) {
      return res.status(404).json({ error: `${secondary_medication_name} is not on this protocol` });
    }

    const newFrequency = String(frequency).trim() || null;
    const updatedDetails = existingDetails.map(d => {
      if ((d.medication || d.name) === secondary_medication_name) {
        return { ...d, medication: d.medication || d.name, frequency: newFrequency };
      }
      return d;
    });

    const { data, error } = await supabase
      .from('protocols')
      .update({
        secondary_medication_details: updatedDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update secondary med frequency:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, protocol: data, secondary_medication_name });
  }

  // ── PRIMARY MED BRANCH ──
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
