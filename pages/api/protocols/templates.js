// /pages/api/protocols/templates.js
// Get all protocol templates for dropdown

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
    const { data: templates, error } = await supabase
      .from('protocol_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Reclassify "therapy" templates into proper categories based on name
    for (const t of templates) {
      if (t.category === 'therapy') {
        const name = (t.name || '').toLowerCase();
        if (name.includes('hbot') || name.includes('hyperbaric')) {
          t.category = 'hbot';
        } else if (name.includes('red light') || name.includes('rlt')) {
          t.category = 'rlt';
        } else if (name.includes('iv')) {
          t.category = 'iv';
        }
      }
      if (t.name && t.name.toLowerCase().includes('combo membership')) {
        t.category = 'combo_membership';
      }
    }

    // Group by category dynamically
    const grouped = {};
    for (const t of templates) {
      const cat = t.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    }

    return res.status(200).json({ templates, grouped });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: error.message });
  }
}
