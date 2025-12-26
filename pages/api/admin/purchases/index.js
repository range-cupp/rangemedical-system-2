// /pages/api/admin/purchases/index.js
// Purchases API - No auth required (internal use)
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET - List purchases
  if (req.method === 'GET') {
    const { category, search, days, limit, source } = req.query;

    try {
      let query = supabase
        .from('purchases')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Category filter
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      // Source filter
      if (source) {
        query = query.eq('source', source);
      }

      // Date filter
      if (days && days !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
        query = query.gte('created_at', daysAgo.toISOString());
      }

      // Search
      if (search) {
        query = query.or(`patient_name.ilike.%${search}%,item_name.ilike.%${search}%,patient_email.ilike.%${search}%`);
      }

      // Limit - use provided limit or fetch all (up to 10000)
      const maxLimit = limit ? parseInt(limit) : 10000;
      query = query.limit(maxLimit);

      const { data: purchases, error, count } = await query;

      if (error) {
        console.error('Purchases fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch purchases', details: error.message });
      }

      // Calculate stats
      const total = count || purchases?.length || 0;
      const revenue = purchases?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

      return res.status(200).json({
        purchases: purchases || [],
        total,
        revenue
      });

    } catch (error) {
      console.error('Purchases API error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  // POST - Create purchase (for manual entry)
  if (req.method === 'POST') {
    const {
      patient_name,
      patient_email,
      patient_phone,
      ghl_contact_id,
      item_name,
      amount,
      list_price,
      quantity,
      category,
      source,
      purchase_date
    } = req.body;

    if (!patient_name || !item_name) {
      return res.status(400).json({ error: 'patient_name and item_name required' });
    }

    try {
      const { data, error } = await supabase
        .from('purchases')
        .insert({
          patient_name,
          patient_email,
          patient_phone,
          ghl_contact_id,
          item_name,
          amount: amount || 0,
          list_price: list_price || null,
          quantity: quantity || 1,
          category: category || 'Other',
          source: source || 'manual',
          purchase_date: purchase_date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create purchase', details: error.message });
      }

      return res.status(201).json(data);

    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
