// GET /api/invoices/list
// List invoices with optional filters

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, patient_id, start_date, end_date, limit } = req.query;

    let query = supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    query = query.limit(parseInt(limit) || 50);

    const { data: invoices, error } = await query;

    if (error) {
      console.error('List invoices error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ invoices });
  } catch (error) {
    console.error('List invoices error:', error);
    return res.status(500).json({ error: error.message });
  }
}
