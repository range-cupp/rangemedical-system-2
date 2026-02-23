// pages/api/labs/orders.js
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
    const { patient_id } = req.query;
    if (!patient_id) {
      return res.status(400).json({ success: false, error: 'patient_id required' });
    }

    const { data, error } = await supabase
      .from('labs')
      .select('id, test_date, lab_type, panel_type, status, lab_provider, notes')
      .eq('patient_id', patient_id)
      .order('test_date', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, orders: data || [] });
  } catch (error) {
    console.error('Lab orders error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
