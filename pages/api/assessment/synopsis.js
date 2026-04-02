// pages/api/assessment/synopsis.js
// GET: Fetch existing synopsis for a baseline questionnaire
// POST: Generate or regenerate AI synopsis

import { createClient } from '@supabase/supabase-js';
import { generateAssessmentSynopsis } from '../../../lib/generate-assessment-synopsis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { questionnaire_id } = req.query;
    if (!questionnaire_id) return res.status(400).json({ error: 'questionnaire_id required' });

    const { data: q, error } = await supabase
      .from('baseline_questionnaires')
      .select('id, patient_id, ai_synopsis, ai_synopsis_generated_at')
      .eq('id', questionnaire_id)
      .single();

    if (error || !q) return res.status(404).json({ error: 'Questionnaire not found' });

    return res.status(200).json({
      success: true,
      synopsis: q.ai_synopsis,
      generated_at: q.ai_synopsis_generated_at
    });
  }

  if (req.method === 'POST') {
    const { questionnaire_id, force } = req.body;
    if (!questionnaire_id) return res.status(400).json({ error: 'questionnaire_id required' });

    const { data: q, error } = await supabase
      .from('baseline_questionnaires')
      .select('id, patient_id, ai_synopsis')
      .eq('id', questionnaire_id)
      .single();

    if (error || !q) return res.status(404).json({ error: 'Questionnaire not found' });

    if (q.ai_synopsis && !force) {
      return res.status(200).json({
        success: true,
        synopsis: q.ai_synopsis,
        cached: true
      });
    }

    const synopsis = await generateAssessmentSynopsis(supabase, questionnaire_id, q.patient_id);

    if (!synopsis) {
      return res.status(500).json({ error: 'Synopsis generation failed' });
    }

    return res.status(200).json({
      success: true,
      synopsis,
      cached: false
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
