// /pages/api/ai/lab-results.js
// Fetches lab results for a patient for the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    const { data, error } = await supabase
      .from('labs')
      .select('id, test_date, panel_type, lab_provider, status, completed_date, results_received_date, results, ai_synopsis, next_lab_date, notes')
      .eq('patient_id', patient_id)
      .order('test_date', { ascending: false })
      .limit(10);

    if (error) throw error;

    const labs = (data || []).map(l => {
      const biomarkers = [];
      if (l.results && typeof l.results === 'object') {
        for (const [key, val] of Object.entries(l.results)) {
          if (val && typeof val === 'object' && val.value !== undefined) {
            biomarkers.push({ name: key, value: val.value, unit: val.unit, flag: val.flag });
          } else if (val !== null && val !== undefined) {
            biomarkers.push({ name: key, value: val });
          }
        }
      }

      return {
        test_date: l.test_date,
        panel: l.panel_type,
        provider: l.lab_provider,
        status: l.status,
        completed: l.completed_date,
        results_received: l.results_received_date,
        next_lab_date: l.next_lab_date,
        synopsis: l.ai_synopsis?.slice(0, 300) || null,
        notes: l.notes?.slice(0, 200) || null,
        biomarker_count: biomarkers.length,
        biomarkers: biomarkers.slice(0, 20),
      };
    });

    const summary = {
      total: labs.length,
      pending: labs.filter(l => ['pending', 'awaiting_results', 'draw_scheduled', 'draw_complete'].includes(l.status)).length,
      completed: labs.filter(l => ['completed', 'provider_reviewed'].includes(l.status)).length,
      next_lab: labs.find(l => l.next_lab_date)?.next_lab_date || null,
    };

    return res.status(200).json({ labs, summary });
  } catch (err) {
    console.error('Lab results error:', err);
    return res.status(500).json({ error: 'Failed to fetch lab results' });
  }
}
