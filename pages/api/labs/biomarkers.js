// pages/api/labs/biomarkers.js
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
    const { data, error } = await supabase
      .from('biomarker_library')
      .select('*')
      .order('category')
      .order('sort_order');

    if (error) throw error;

    // Return as object keyed by biomarker_key
    const library = {};
    (data || []).forEach(row => {
      library[row.biomarker_key] = row;
    });

    return res.status(200).json({ success: true, library });
  } catch (error) {
    console.error('Biomarker library error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
