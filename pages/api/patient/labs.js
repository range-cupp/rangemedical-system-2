// pages/api/patient/labs.js
// Public lab results API — no auth required.
// The lab UUID is the access token: cryptographically random, unguessable.
// GET /api/patient/labs?id={lab_uuid}
// Returns: { lab, results, biomarkerLibrary, patient }
// Range Medical

import { createClient } from '@supabase/supabase-js';
const { biomarkerMap, allBiomarkerKeys } = require('../../../lib/biomarker-config');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function computeFlag(value, refLow, refHigh, optLow, optHigh) {
  if (value === null || value === undefined) return null;
  if (refLow !== null && value < refLow) return 'low';
  if (refHigh !== null && value > refHigh) return 'high';
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

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Lab ID required' });
  }

  try {
    // Fetch the lab by UUID — UUID is the access token
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('*')
      .eq('id', id)
      .single();

    if (labError || !lab) {
      return res.status(404).json({ error: 'Lab results not found' });
    }

    // Fetch patient info (for gender + name only — no sensitive data returned to client)
    const { data: patient } = await supabase
      .from('patients')
      .select('id, first_name, name, gender')
      .eq('id', lab.patient_id)
      .single();

    const gender = patient?.gender || null;
    const firstName = patient?.first_name || (patient?.name || '').split(' ')[0] || null;

    // Fetch reference ranges for patient gender
    let rangesQuery = supabase.from('lab_reference_ranges').select('*');
    if (gender) {
      rangesQuery = rangesQuery.or(`gender.eq.${gender},gender.eq.Both`);
    }
    const { data: ranges } = await rangesQuery;

    const rangesMap = {};
    (ranges || []).forEach(r => { rangesMap[r.biomarker] = r; });

    // Transform flat lab columns into structured biomarker array
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

    // Fetch biomarker library (educational content)
    const { data: bioData } = await supabase
      .from('biomarker_library')
      .select('*')
      .order('sort_order');

    const biomarkerLibrary = {};
    (bioData || []).forEach(row => {
      biomarkerLibrary[row.biomarker_key] = row;
    });

    return res.status(200).json({
      success: true,
      lab: {
        id: lab.id,
        test_date: lab.test_date,
        lab_type: lab.lab_type,
        panel_type: lab.panel_type,
        lab_provider: lab.lab_provider,
      },
      patient: {
        firstName,
        gender,
      },
      results,
      biomarkerLibrary,
    });
  } catch (err) {
    console.error('Patient labs API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
