// /pages/api/quotes/index.js
// List + create custom pricing quotes
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function genToken() {
  // 10-char url-safe token
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function computeTotals(items, discount_cents = 0) {
  const subtotal = (items || []).reduce((sum, it) => {
    const cents = Math.round(Number(it.price || 0) * 100) * Number(it.qty || 1);
    return sum + (isFinite(cents) ? cents : 0);
  }, 0);
  return {
    subtotal_cents: subtotal,
    discount_cents: Number(discount_cents) || 0,
    total_cents: Math.max(0, subtotal - (Number(discount_cents) || 0)),
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const {
        patient_id = null,
        recipient_name,
        recipient_email = null,
        recipient_phone = null,
        title = null,
        intro_note = null,
        items = [],
        discount_cents = 0,
        expires_at = null,
        created_by = null,
      } = req.body || {};

      if (!recipient_name) {
        return res.status(400).json({ error: 'recipient_name is required' });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required' });
      }

      const cleanItems = items.map((it) => ({
        name: String(it.name || '').trim(),
        description: String(it.description || '').trim(),
        price: Number(it.price) || 0,
        qty: Number(it.qty) || 1,
      })).filter((it) => it.name);

      const totals = computeTotals(cleanItems, discount_cents);

      const token = genToken();
      const { data, error } = await supabase
        .from('quotes')
        .insert({
          token,
          patient_id,
          recipient_name,
          recipient_email,
          recipient_phone,
          title,
          intro_note,
          items: cleanItems,
          ...totals,
          expires_at,
          status: 'draft',
          created_by,
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('quotes api error', err);
    return res.status(500).json({ error: err.message });
  }
}
