// /pages/api/protocols/link-purchase.js
// Link a purchase to an existing protocol (updates payment info on protocol)

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
    const { protocolId, purchaseId } = req.body;

    if (!protocolId || !purchaseId) {
      return res.status(400).json({ error: 'protocolId and purchaseId are required' });
    }

    // Fetch the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Fetch the protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', protocolId)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Update purchase to link to protocol
    const { error: updatePurchaseError } = await supabase
      .from('purchases')
      .update({
        protocol_id: protocolId,
        protocol_created: true
      })
      .eq('id', purchaseId);

    if (updatePurchaseError) throw updatePurchaseError;

    // Update protocol payment info
    const existingPaid = parseFloat(protocol.amount_paid) || 0;
    const newPayment = parseFloat(purchase.amount_paid) || parseFloat(purchase.amount) || 0;

    const { error: updateProtocolError } = await supabase
      .from('protocols')
      .update({
        amount_paid: existingPaid + newPayment,
        payment_date: purchase.purchase_date || todayPacific(),
        updated_at: new Date().toISOString()
      })
      .eq('id', protocolId);

    if (updateProtocolError) throw updateProtocolError;

    return res.status(200).json({
      success: true,
      message: `Purchase linked to protocol. Payment of $${newPayment.toFixed(2)} recorded.`
    });

  } catch (error) {
    console.error('Error linking purchase to protocol:', error);
    return res.status(500).json({ error: error.message });
  }
}
