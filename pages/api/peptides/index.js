// /pages/api/peptides/index.js
// Get all peptides

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
    const { data: peptides, error } = await supabase
      .from('peptides')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (error) throw error;

    return res.status(200).json(peptides || []);

  } catch (error) {
    console.error('Peptides API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
