// /pages/api/protocols/comp-block.js
// Mark a block as complimentary by creating a $0 purchase linked to the protocol.
// The block ordering is implicit — purchases are assigned to blocks by date order.

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { protocolId, blockNum, compDate, note } = req.body;

    if (!protocolId) {
      return res.status(400).json({ error: 'protocolId is required' });
    }

    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, medication, ghl_contact_id, patient_name, patient_email, patient_phone')
      .eq('id', protocolId)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const purchaseDate = compDate || todayPacific();
    const blockLabel = blockNum ? `Block ${blockNum}` : 'Block';
    const itemName = `${protocol.medication || 'WL Injection'} — Comp ${blockLabel}`;

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        patient_id: protocol.patient_id,
        ghl_contact_id: protocol.ghl_contact_id || null,
        patient_name: protocol.patient_name || null,
        patient_email: protocol.patient_email || null,
        patient_phone: protocol.patient_phone || null,
        protocol_id: protocolId,
        protocol_created: true,
        purchase_date: purchaseDate,
        category: 'weight_loss',
        item_name: itemName,
        product_name: itemName,
        original_item_name: itemName,
        amount: 0,
        amount_paid: 0,
        list_price: 0,
        quantity: 4,
        payment_method: 'comp',
        source: 'manual_comp',
        description: note || `Complimentary ${blockLabel.toLowerCase()} (4 injections)`,
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    return res.status(200).json({
      success: true,
      purchase,
      message: `${blockLabel} marked complimentary.`,
    });

  } catch (error) {
    console.error('Error comping block:', error);
    return res.status(500).json({ error: error.message });
  }
}
