// /pages/api/quotes/manage/[id].js
// Get, update, or delete a quote by ID (admin)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

const cleanItemList = (arr) => (Array.isArray(arr) ? arr : []).map((it) => ({
  name: String(it.name || '').trim(),
  description: String(it.description || '').trim(),
  price: Number(it.price) || 0,
  qty: Number(it.qty) || 1,
})).filter((it) => it.name);

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    // GET — fetch single quote by ID
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Quote not found' });
      return res.status(200).json(data);
    }

    // PUT — update quote
    if (req.method === 'PUT') {
      const {
        recipient_name,
        recipient_email = null,
        recipient_phone = null,
        patient_id = null,
        title = null,
        intro_note = null,
        items = [],
        discount_cents = 0,
        options = null,
        expires_at = null,
      } = req.body || {};

      if (!recipient_name) {
        return res.status(400).json({ error: 'recipient_name is required' });
      }

      let cleanOptions = null;
      if (Array.isArray(options) && options.length > 0) {
        cleanOptions = options.slice(0, 3).map((opt, i) => {
          const optItems = cleanItemList(opt.items);
          const optTotals = computeTotals(optItems, opt.discount_cents || 0);
          return {
            name: String(opt.name || `Option ${i + 1}`).trim() || `Option ${i + 1}`,
            items: optItems,
            ...optTotals,
          };
        }).filter((o) => o.items.length > 0);
        if (cleanOptions.length === 0) cleanOptions = null;
      }

      const cleanItems = cleanOptions ? cleanOptions[0].items : cleanItemList(items);
      if (cleanItems.length === 0) {
        return res.status(400).json({ error: 'At least one item is required' });
      }
      const totals = cleanOptions
        ? { subtotal_cents: cleanOptions[0].subtotal_cents, discount_cents: cleanOptions[0].discount_cents, total_cents: cleanOptions[0].total_cents }
        : computeTotals(cleanItems, discount_cents);

      const { data, error } = await supabase
        .from('quotes')
        .update({
          patient_id,
          recipient_name,
          recipient_email,
          recipient_phone,
          title,
          intro_note,
          items: cleanItems,
          options: cleanOptions,
          ...totals,
          expires_at,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    // DELETE — delete quote
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('quotes manage [id] api error', err);
    return res.status(500).json({ error: err.message });
  }
}
