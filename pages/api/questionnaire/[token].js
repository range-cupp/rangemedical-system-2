// pages/api/questionnaire/[token].js
// GET  — load questionnaire data (responses, intake context)
// PUT  — auto-save section progress
// POST — final submission

import { createClient } from '@supabase/supabase-js';
import {
  DOOR1_SECTIONS,
  DOOR2_CORE_SECTIONS,
  DOOR2_FINAL_SECTION,
  calculateScores,
  getApplicableModalities,
} from '../../../lib/questionnaire-definitions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  // Look up questionnaire by token
  const { data: questionnaire, error: qErr } = await supabase
    .from('baseline_questionnaires')
    .select('*')
    .eq('token', token)
    .single();

  if (qErr || !questionnaire) {
    return res.status(404).json({ error: 'Questionnaire not found or link expired' });
  }

  // ─── GET: Load questionnaire ───
  if (req.method === 'GET') {
    try {
    // Fetch intake data for branching logic
    let intakeData = null;
    if (questionnaire.intake_id) {
      const { data: intake } = await supabase
        .from('intakes')
        .select('symptoms, gender, first_name, injured, interested_in_optimization')
        .eq('id', questionnaire.intake_id)
        .single();
      intakeData = intake;
    }

    // Determine which sections to show
    // Door 1 = injury only, Door 2 = optimization only, Door 3 = both
    let sections = [];

    if (questionnaire.door === 1 || questionnaire.door === 3) {
      sections.push(...DOOR1_SECTIONS.map(s => ({ ...s })));
    }

    if (questionnaire.door === 2 || questionnaire.door === 3) {
      sections.push(...DOOR2_CORE_SECTIONS.map(s => ({ ...s })));
      if (intakeData) {
        const modalities = getApplicableModalities(intakeData.symptoms, intakeData.gender);
        sections.push(...modalities.map(s => ({ ...s })));
      }
      sections.push({ ...DOOR2_FINAL_SECTION });
    }

    return res.status(200).json({
      id: questionnaire.id,
      door: questionnaire.door,
      questionnaire_type: questionnaire.questionnaire_type,
      status: questionnaire.status,
      responses: questionnaire.responses || {},
      sections_completed: questionnaire.sections_completed || [],
      sections,
      patient_first_name: intakeData?.first_name || null,
    });
    } catch (getErr) {
      console.error('GET questionnaire error:', getErr);
      return res.status(500).json({ error: 'Failed to load questionnaire', details: getErr.message });
    }
  }

  // ─── PUT: Auto-save section progress ───
  if (req.method === 'PUT') {
    if (questionnaire.status === 'completed') {
      return res.status(400).json({ error: 'Questionnaire already completed' });
    }

    const { responses, section_id } = req.body;

    // Merge new responses into existing
    const mergedResponses = { ...(questionnaire.responses || {}), ...responses };
    const completedSections = [...(questionnaire.sections_completed || [])];
    if (section_id && !completedSections.includes(section_id)) {
      completedSections.push(section_id);
    }

    const { error: updateErr } = await supabase
      .from('baseline_questionnaires')
      .update({
        responses: mergedResponses,
        sections_completed: completedSections,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionnaire.id);

    if (updateErr) {
      console.error('Auto-save error:', updateErr);
      return res.status(500).json({ error: 'Failed to save progress' });
    }

    return res.status(200).json({ success: true });
  }

  // ─── POST: Final submission ───
  if (req.method === 'POST') {
    if (questionnaire.status === 'completed') {
      return res.status(400).json({ error: 'Questionnaire already submitted' });
    }

    const { responses } = req.body;
    const finalResponses = { ...(questionnaire.responses || {}), ...responses };

    // Calculate scored totals
    let allSections = [];

    if (questionnaire.door === 1 || questionnaire.door === 3) {
      allSections.push(...DOOR1_SECTIONS);
    }

    if (questionnaire.door === 2 || questionnaire.door === 3) {
      allSections.push(...DOOR2_CORE_SECTIONS);
      if (questionnaire.intake_id) {
        const { data: intake } = await supabase
          .from('intakes')
          .select('symptoms, gender')
          .eq('id', questionnaire.intake_id)
          .single();
        if (intake) {
          const modalities = getApplicableModalities(intake.symptoms, intake.gender);
          allSections.push(...modalities);
        }
      }
      allSections.push(DOOR2_FINAL_SECTION);
    }

    const scoredTotals = calculateScores(finalResponses, allSections);

    const { error: submitErr } = await supabase
      .from('baseline_questionnaires')
      .update({
        responses: finalResponses,
        scored_totals: scoredTotals,
        status: 'completed',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionnaire.id);

    if (submitErr) {
      console.error('Submit error:', submitErr);
      return res.status(500).json({ error: 'Failed to submit questionnaire' });
    }

    console.log(`✅ Baseline questionnaire completed: ${questionnaire.id} (door ${questionnaire.door})`);

    return res.status(200).json({
      success: true,
      scored_totals: scoredTotals,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
