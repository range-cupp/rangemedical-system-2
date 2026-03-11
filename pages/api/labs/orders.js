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
      .select('id, test_date, lab_type, panel_type, status, lab_provider, notes, pdf_url')
      .eq('patient_id', patient_id)
      .order('test_date', { ascending: false });

    if (error) throw error;

    // Group by test_date to deduplicate tabs
    const grouped = {};
    (data || []).forEach(row => {
      const key = row.test_date;
      if (!grouped[key]) {
        grouped[key] = {
          id: row.id,
          lab_ids: [row.id],
          test_date: row.test_date,
          lab_type: row.lab_type,
          panel_types: row.panel_type ? [row.panel_type] : [],
          status: row.status,
          lab_provider: row.lab_provider,
          notes: row.notes,
          pdf_url: row.pdf_url || null,
        };
      } else {
        grouped[key].lab_ids.push(row.id);
        if (row.panel_type && !grouped[key].panel_types.includes(row.panel_type)) {
          grouped[key].panel_types.push(row.panel_type);
        }
        if (row.pdf_url && !grouped[key].pdf_url) {
          grouped[key].pdf_url = row.pdf_url;
        }
      }
    });

    const orders = Object.values(grouped).map(g => ({
      ...g,
      panel_type: g.panel_types.join(', '),
    }));

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Lab orders error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
