// /pages/api/peptides/index.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: peptides, error } = await supabase
      .from('peptides')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (error) {
      return res.status(500).json({ error: error.message, details: error });
    }

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
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}
