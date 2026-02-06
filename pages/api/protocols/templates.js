// /pages/api/protocols/templates.js
// Get all protocol templates for dropdown

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
    const { data: templates, error } = await supabase
      .from('protocol_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Group by category
    const grouped = {
      peptide: templates.filter(t => t.category === 'peptide'),
      weight_loss: templates.filter(t => t.category === 'weight_loss'),
      hrt: templates.filter(t => t.category === 'hrt'),
      injection: templates.filter(t => t.category === 'injection'),
      therapy: templates.filter(t => t.category === 'therapy')
    };

    return res.status(200).json({ templates, grouped });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: error.message });
  }
}
