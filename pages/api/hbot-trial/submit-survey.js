// /api/hbot-trial/submit-survey
// Saves pre or post HBOT trial survey responses
// Updates trial_passes survey completion flags
// On post-survey: runs HBOT check-in recommendation engine
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { generateHBOTTrialRecommendation } from '../../../lib/hbot-trial-checkin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      trialId,
      surveyType,          // 'pre' or 'post'
      brain_fog,
      headaches,
      recovery,
      sleep,
      mood,
      labs_past_12mo,      // pre only
      want_fix_90d,        // pre only
      noticed_notes,       // post only
    } = req.body;

    if (!trialId || !surveyType) {
      return res.status(400).json({ error: 'trialId and surveyType are required' });
    }

    if (!['pre', 'post'].includes(surveyType)) {
      return res.status(400).json({ error: 'surveyType must be "pre" or "post"' });
    }

    // Verify trial pass exists
    const { data: trial, error: trialErr } = await supabase
      .from('trial_passes')
      .select('id, importance_1_10, sessions_used, pre_survey_completed, post_survey_completed')
      .eq('id', trialId)
      .single();

    if (trialErr || !trial) {
      return res.status(404).json({ error: 'Trial pass not found' });
    }

    // Insert survey
    const surveyData = {
      trial_pass_id: trialId,
      survey_type: surveyType,
      brain_fog: brain_fog ?? null,
      headaches: headaches ?? null,
      recovery: recovery ?? null,
      sleep: sleep ?? null,
      mood: mood ?? null,
    };

    if (surveyType === 'pre') {
      surveyData.labs_past_12mo = labs_past_12mo ?? null;
      surveyData.want_fix_90d = want_fix_90d ?? null;
    }

    if (surveyType === 'post') {
      surveyData.noticed_notes = noticed_notes || null;
    }

    const { data: survey, error: surveyErr } = await supabase
      .from('trial_surveys')
      .insert(surveyData)
      .select('id')
      .single();

    if (surveyErr) throw surveyErr;

    // Update trial pass
    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (surveyType === 'pre') {
      updates.pre_survey_completed = true;
    } else {
      updates.post_survey_completed = true;

      // Run HBOT check-in recommendation engine
      const { data: preSurvey } = await supabase
        .from('trial_surveys')
        .select('*')
        .eq('trial_pass_id', trialId)
        .eq('survey_type', 'pre')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const postSurvey = { brain_fog, headaches, recovery, sleep, mood, noticed_notes };

      const result = generateHBOTTrialRecommendation({
        preSurvey: preSurvey || {},
        postSurvey,
        importance: trial.importance_1_10,
        sessionsUsed: trial.sessions_used,
        wantsFix: preSurvey?.want_fix_90d === true,
      });

      updates.checkin_recommendation = result.recommendation;
      updates.checkin_notes = result.reasoning;
    }

    await supabase
      .from('trial_passes')
      .update(updates)
      .eq('id', trialId);

    console.log(`HBOT trial survey (${surveyType}) saved for trial ${trialId}`);

    return res.status(200).json({
      success: true,
      surveyId: survey.id,
      recommendation: updates.checkin_recommendation || null,
    });
  } catch (error) {
    console.error('HBOT trial survey error:', error);
    return res.status(500).json({ error: error.message });
  }
}
