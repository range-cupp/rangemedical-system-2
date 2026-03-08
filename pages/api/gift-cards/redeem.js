// pages/api/gift-cards/redeem.js
// Redeem (deduct balance from) a gift card
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, amount, redeemed_by_patient_id, redeemed_by_name, purchase_id } = req.body;

  if (!code || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Code and amount are required' });
  }

  const normalizedCode = code.trim().toUpperCase();

  // Look up the card
  const { data: card, error: lookupError } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle();

  if (lookupError) return res.status(500).json({ error: lookupError.message });
  if (!card) return res.status(404).json({ error: 'Gift card not found' });
  if (card.status !== 'active') return res.status(400).json({ error: 'Gift card is not active' });
  if (card.remaining_amount < amount) {
    return res.status(400).json({
      error: `Insufficient balance. Card has ${(card.remaining_amount / 100).toFixed(2)} remaining.`,
    });
  }

  const balanceBefore = card.remaining_amount;
  const balanceAfter = balanceBefore - amount;
  const newStatus = balanceAfter <= 0 ? 'depleted' : 'active';

  // Update the gift card balance
  const { error: updateError } = await supabase
    .from('gift_cards')
    .update({
      remaining_amount: balanceAfter,
      status: newStatus,
    })
    .eq('id', card.id)
    .eq('remaining_amount', balanceBefore); // Optimistic lock

  if (updateError) return res.status(500).json({ error: updateError.message });

  // Create redemption record
  const { error: redemptionError } = await supabase
    .from('gift_card_redemptions')
    .insert({
      gift_card_id: card.id,
      purchase_id: purchase_id || null,
      amount,
      redeemed_by_patient_id: redeemed_by_patient_id || null,
      redeemed_by_name: redeemed_by_name || null,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
    });

  if (redemptionError) {
    console.error('Redemption record insert error:', redemptionError);
    // Don't fail — the card was already updated
  }

  return res.status(200).json({
    success: true,
    remaining_amount: balanceAfter,
    status: newStatus,
  });
}
