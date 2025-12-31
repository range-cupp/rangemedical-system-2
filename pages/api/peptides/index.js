// /pages/api/peptides/index.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
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

    // Group by category
    const grouped = {};
    peptides.forEach(peptide => {
      if (!grouped[peptide.category]) {
        grouped[peptide.category] = [];
      }
      grouped[peptide.category].push(peptide);
    });

    res.status(200).json({
      peptides,
      grouped,
      count: peptides.length
    });

  } catch (error) {
    console.error('Peptides API error:', error);
    res.status(500).json({ error: error.message });
  }
}
