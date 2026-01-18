// /pages/api/peptides.js
// Fetch peptide options from Supabase peptides table
// Range Medical - 2026-01-17

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
    // Fetch peptides from peptides table
    const { data: peptides, error } = await supabase
      .from('peptides')
      .select('name, category, dose_options, frequency')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching peptides:', error);
      return res.status(500).json({ error: error.message });
    }

    // Group peptides by category for the dropdown
    const grouped = {};
    (peptides || []).forEach(p => {
      const category = p.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      // dose_options is an array - use first option as default or join them
      const doseStr = Array.isArray(p.dose_options) 
        ? p.dose_options[0] || '' 
        : p.dose_options || '';
      
      grouped[category].push({
        value: p.name,
        dose: doseStr,
        dose_options: p.dose_options || [],
        frequency: p.frequency || 'Daily'
      });
    });

    // Convert to array format matching PEPTIDE_OPTIONS structure
    const peptideOptions = Object.entries(grouped).map(([group, options]) => ({
      group,
      options
    }));

    return res.status(200).json({ 
      success: true,
      peptides: peptideOptions,
      total: peptides?.length || 0
    });

  } catch (error) {
    console.error('Peptides API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
