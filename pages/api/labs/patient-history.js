// pages/api/labs/patient-history.js
import { createClient } from '@supabase/supabase-js';
const { allBiomarkerKeys, biomarkerMap } = require('../../../lib/biomarker-config');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { patient_id, gender } = req.query;
    if (!patient_id) {
      return res.status(400).json({ success: false, error: 'patient_id required' });
    }

    // Fetch all labs for patient
    const { data: labs, error: labsError } = await supabase
      .from('labs')
      .select('*')
      .eq('patient_id', patient_id)
      .order('test_date', { ascending: false });

    if (labsError) throw labsError;

    // Fetch reference ranges
    let rangesQuery = supabase.from('lab_reference_ranges').select('*');
    if (gender) {
      rangesQuery = rangesQuery.or(`gender.eq.${gender},gender.eq.Both`);
    }
    const { data: ranges } = await rangesQuery;

    const rangesMap = {};
    (ranges || []).forEach(r => { rangesMap[r.biomarker] = r; });

    // Transform each lab
    const labResults = (labs || []).map(lab => {
      const biomarkers = [];
      for (const key of allBiomarkerKeys) {
        const value = lab[key];
        if (value === null || value === undefined) continue;

        const meta = biomarkerMap[key];
        const range = rangesMap[key] || {};
        const refLow = range.ref_low ?? range.reference_low ?? null;
        const refHigh = range.ref_high ?? range.reference_high ?? null;

        biomarkers.push({
          biomarker_key: key,
          display_name: meta?.label || key,
          value: typeof value === 'number' ? value : parseFloat(value),
          unit: meta?.unit || '',
          category: meta?.category || 'Other',
          ref_low: refLow,
          ref_high: refHigh
        });
      }

      return {
        id: lab.id,
        test_date: lab.test_date,
        lab_type: lab.lab_type,
        panel_type: lab.panel_type,
        lab_provider: lab.lab_provider,
        biomarkers
      };
    });

    return res.status(200).json({ success: true, labs: labResults });
  } catch (error) {
    console.error('Patient history error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
