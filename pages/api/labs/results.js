// pages/api/labs/results.js
import { createClient } from '@supabase/supabase-js';
const { biomarkerGroups, biomarkerMap, allBiomarkerKeys } = require('../../../lib/biomarker-config');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function computeFlag(value, refLow, refHigh, optLow, optHigh) {
  if (value === null || value === undefined) return null;
  if (refLow !== null && value < refLow) return 'low';
  if (refHigh !== null && value > refHigh) return 'high';
  // Borderline: within 10% of ref boundary
  if (refLow !== null && refHigh !== null) {
    const margin = (refHigh - refLow) * 0.1;
    if (value < refLow + margin) return 'borderline_low';
    if (value > refHigh - margin) return 'borderline_high';
  }
  if (optLow !== null && optHigh !== null && value >= optLow && value <= optHigh) return 'optimal';
  return 'normal';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lab_id, gender } = req.query;
    if (!lab_id) {
      return res.status(400).json({ success: false, error: 'lab_id required' });
    }

    // Fetch the lab row
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('*')
      .eq('id', lab_id)
      .single();

    if (labError) throw labError;
    if (!lab) return res.status(404).json({ success: false, error: 'Lab not found' });

    // Fetch reference ranges for gender
    let rangesQuery = supabase.from('lab_reference_ranges').select('*');
    if (gender) {
      rangesQuery = rangesQuery.or(`gender.eq.${gender},gender.eq.Both`);
    }
    const { data: ranges } = await rangesQuery;

    const rangesMap = {};
    (ranges || []).forEach(r => { rangesMap[r.biomarker] = r; });

    // Transform flat columns into structured array
    const results = [];
    for (const key of allBiomarkerKeys) {
      const value = lab[key];
      if (value === null || value === undefined) continue;

      const meta = biomarkerMap[key];
      const range = rangesMap[key] || {};

      const refLow = range.ref_low ?? range.reference_low ?? null;
      const refHigh = range.ref_high ?? range.reference_high ?? null;
      const optLow = range.optimal_low ?? null;
      const optHigh = range.optimal_high ?? null;

      results.push({
        biomarker_key: key,
        display_name: meta?.label || key,
        value: typeof value === 'number' ? value : parseFloat(value),
        unit: meta?.unit || range.unit || '',
        category: meta?.category || 'Other',
        ref_low: refLow,
        ref_high: refHigh,
        optimal_low: optLow,
        optimal_high: optHigh,
        flag: computeFlag(value, refLow, refHigh, optLow, optHigh)
      });
    }

    return res.status(200).json({
      success: true,
      lab: {
        id: lab.id,
        test_date: lab.test_date,
        lab_type: lab.lab_type,
        panel_type: lab.panel_type,
        lab_provider: lab.lab_provider,
        notes: lab.notes
      },
      results
    });
  } catch (error) {
    console.error('Lab results error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
