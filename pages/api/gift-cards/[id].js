// pages/api/gift-cards/[id].js
// Get gift card detail with redemption history / Void a card
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // Get card + redemption history
    const { data: card, error: cardError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (cardError) return res.status(500).json({ error: cardError.message });
    if (!card) return res.status(404).json({ error: 'Gift card not found' });

    const { data: redemptions, error: redemptionsError } = await supabase
      .from('gift_card_redemptions')
      .select('*')
      .eq('gift_card_id', id)
      .order('created_at', { ascending: false });

    if (redemptionsError) {
      console.error('Error fetching redemptions:', redemptionsError);
    }

    return res.status(200).json({
      gift_card: card,
      redemptions: redemptions || [],
    });
  }

  if (req.method === 'PUT') {
    // Void a gift card
    const { status } = req.body;

    if (status !== 'voided') {
      return res.status(400).json({ error: 'Only voiding is supported' });
    }

    const { data: card, error } = await supabase
      .from('gift_cards')
      .update({ status: 'voided' })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ gift_card: card });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
