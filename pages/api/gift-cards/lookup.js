// pages/api/gift-cards/lookup.js
// Look up a gift card by code for POS redemption
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const normalizedCode = code.trim().toUpperCase();

  const { data: card, error } = await supabase
    .from('gift_cards')
    .select('id, code, initial_amount, remaining_amount, status, buyer_name, created_at')
    .eq('code', normalizedCode)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!card) return res.status(404).json({ error: 'Gift card not found' });

  return res.status(200).json({ gift_card: card });
}
