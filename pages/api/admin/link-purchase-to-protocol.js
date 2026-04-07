// /pages/api/admin/link-purchase-to-protocol.js
// Link an orphan purchase to the patient's active protocol matching the purchase category.
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { purchase_id, protocol_id } = req.body || {};
  if (!purchase_id) return res.status(400).json({ error: 'purchase_id required' });

  try {
    // Load the purchase
    const { data: purchase, error: pErr } = await supabase
      .from('purchases')
      .select('id, patient_id, category, protocol_id')
      .eq('id', purchase_id)
      .single();
    if (pErr || !purchase) return res.status(404).json({ error: 'Purchase not found' });

    if (purchase.protocol_id) {
      return res.status(200).json({ success: true, already_linked: true, protocol_id: purchase.protocol_id });
    }

    let targetProtocolId = protocol_id;

    // If no explicit protocol provided, find active protocol in the same category
    if (!targetProtocolId) {
      const { data: protocols } = await supabase
        .from('protocols')
        .select('id, status, start_date')
        .eq('patient_id', purchase.patient_id)
        .eq('program_type', purchase.category)
        .order('start_date', { ascending: false });

      // Prefer active, then most recent
      const active = (protocols || []).find(p => p.status === 'active');
      targetProtocolId = active?.id || protocols?.[0]?.id || null;
    }

    if (!targetProtocolId) {
      return res.status(404).json({ error: `No ${purchase.category} protocol found for this patient` });
    }

    const { error: uErr } = await supabase
      .from('purchases')
      .update({ protocol_id: targetProtocolId })
      .eq('id', purchase_id);
    if (uErr) throw uErr;

    return res.status(200).json({ success: true, protocol_id: targetProtocolId });
  } catch (err) {
    console.error('link-purchase-to-protocol error', err);
    return res.status(500).json({ error: err.message });
  }
}
