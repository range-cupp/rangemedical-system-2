// pages/api/labs/results.js
import { createClient } from '@supabase/supabase-js';
const { biomarkerGroups, biomarkerMap, allBiomarkerKeys, computeFlag } = require('../../../lib/biomarker-config');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lab_id, lab_ids, gender } = req.query;
    const ids = lab_ids ? lab_ids.split(',') : lab_id ? [lab_id] : [];
    if (ids.length === 0) {
      return res.status(400).json({ success: false, error: 'lab_id or lab_ids required' });
    }

    // Fetch lab row(s) — merge multiple into one combined result
    const { data: labs, error: labError } = await supabase
      .from('labs')
      .select('*')
      .in('id', ids);

    if (labError) throw labError;
    if (!labs || labs.length === 0) return res.status(404).json({ success: false, error: 'Lab not found' });

    // Merge all lab rows into one combined object (prefer non-null values)
    const lab = {};
    for (const row of labs) {
      for (const [key, value] of Object.entries(row)) {
        if (value !== null && value !== undefined) {
          lab[key] = value;
        }
      }
    }
    // Use the first lab's metadata
    lab.id = labs[0].id;
    lab.test_date = labs[0].test_date;
    lab.lab_type = labs[0].lab_type;
    lab.panel_type = labs.map(l => l.panel_type).filter(Boolean).join(', ');
    lab.lab_provider = labs[0].lab_provider;

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

      const refLow = range.min_value ?? range.ref_low ?? range.reference_low ?? null;
      const refHigh = range.max_value ?? range.ref_high ?? range.reference_high ?? null;
      const optLow = range.optimal_min ?? range.optimal_low ?? null;
      const optHigh = range.optimal_max ?? range.optimal_high ?? null;

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
