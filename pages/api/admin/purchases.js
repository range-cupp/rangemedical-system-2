// /pages/api/admin/purchases.js
// Purchases API - List and filter purchases
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      category, 
      search, 
      days, 
      ghl_contact_id,
      limit = 200, 
      offset = 0 
    } = req.query;

    // Build query
    let query = supabase
      .from('purchases')
      .select('*', { count: 'exact' })
      .order('purchase_date', { ascending: false });

    // Category filter
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    // Contact filter
    if (ghl_contact_id) {
      query = query.eq('ghl_contact_id', ghl_contact_id);
    }

    // Search filter
    if (search) {
      query = query.or(`patient_name.ilike.%${search}%,item_name.ilike.%${search}%,patient_email.ilike.%${search}%`);
    }

    // Date range filter
    if (days && days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      query = query.gte('purchase_date', daysAgo.toISOString().split('T')[0]);
    }

    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Purchases query error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Calculate revenue
    const revenue = data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

    return res.status(200).json({
      purchases: data || [],
      total: count || 0,
      revenue: revenue,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
