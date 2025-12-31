// /pages/api/peptides/index.js
// Get all peptides grouped by category

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
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
    const grouped = peptides.reduce((acc, peptide) => {
      if (!acc[peptide.category]) {
        acc[peptide.category] = [];
      }
      acc[peptide.category].push(peptide);
      return acc;
    }, {});

    // Define category order
    const categoryOrder = [
      'Weight Loss',
      'Recovery',
      'Growth Hormone',
      'Sexual Health',
      'HRT Support',
      'Immune',
      'Cognitive',
      'Sleep',
      'Longevity',
      'Skin/Hair',
      'Metabolic',
      'Mitochondrial',
      'Neuropathy',
      'Cardiovascular',
      'Joint',
      'Muscle',
      'Oncology Support'
    ];

    // Sort grouped object by category order
    const sortedGrouped = {};
    categoryOrder.forEach(cat => {
      if (grouped[cat]) {
        sortedGrouped[cat] = grouped[cat];
      }
    });

    res.status(200).json({
      peptides,
      grouped: sortedGrouped,
      count: peptides.length
    });

  } catch (error) {
    console.error('Error fetching peptides:', error);
    res.status(500).json({ error: error.message });
  }
}
