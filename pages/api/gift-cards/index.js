// pages/api/gift-cards/index.js
// List and create gift cards
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate RM-XXXX-XXXX code (no ambiguous chars: 0/O/1/I/L)
function generateCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s1 = '', s2 = '';
  for (let i = 0; i < 4; i++) {
    s1 += chars[Math.floor(Math.random() * chars.length)];
    s2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RM-${s1}-${s2}`;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // List gift cards (admin)
    const { status, search, limit = 50 } = req.query;

    let query = supabase
      .from('gift_cards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,buyer_name.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ gift_cards: data || [] });
  }

  if (req.method === 'POST') {
    // Create a gift card after purchase
    const { buyer_patient_id, buyer_name, amount, purchase_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Generate unique code (retry if collision)
    let code;
    let attempts = 0;
    while (attempts < 5) {
      code = generateCode();
      const { data: existing } = await supabase
        .from('gift_cards')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      if (!existing) break;
      attempts++;
    }

    const { data: card, error } = await supabase
      .from('gift_cards')
      .insert({
        code,
        initial_amount: amount,
        remaining_amount: amount,
        status: 'active',
        buyer_patient_id: buyer_patient_id || null,
        buyer_name: buyer_name || null,
        purchase_id: purchase_id || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ gift_card: card });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
