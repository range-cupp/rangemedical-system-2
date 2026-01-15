// /pages/api/patient/questionnaire.js
// Questionnaire Submission API
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      token,
      questionnaire_type, // 'intake' or 'completion'
      primary_complaint,
      injury_location,
      injury_duration,
      pain_level,
      pain_frequency,
      mobility_score,
      sleep_quality,
      energy_level,
      activities_limited,
      previous_treatments,
      current_medications,
      recovery_goals,
      goals_achieved,
      overall_improvement,
      would_recommend,
      continue_treatment,
      additional_notes
    } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    if (!questionnaire_type || !['intake', 'completion'].includes(questionnaire_type)) {
      return res.status(400).json({ error: 'Valid questionnaire_type required (intake or completion)' });
    }

    // Find protocol by access token
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('access_token', token)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Check if questionnaire of this type already exists for this protocol
    const { data: existing } = await supabase
      .from('questionnaire_responses')
      .select('id')
      .eq('protocol_id', protocol.id)
      .eq('questionnaire_type', questionnaire_type)
      .single();

    if (existing) {
      return res.status(400).json({ error: `${questionnaire_type} questionnaire already submitted for this protocol` });
    }

    // Build response data
    const responseData = {
      protocol_id: protocol.id,
      ghl_contact_id: protocol.ghl_contact_id,
      patient_name: protocol.patient_name,
      patient_email: protocol.patient_email,
      questionnaire_type,
      pain_level: parseInt(pain_level) || 5,
      mobility_score: parseInt(mobility_score) || 5,
      sleep_quality: parseInt(sleep_quality) || 5,
      energy_level: parseInt(energy_level) || 5,
      activities_limited: activities_limited || [],
      additional_notes: additional_notes || null
    };

    // Add intake-specific fields
    if (questionnaire_type === 'intake') {
      responseData.primary_complaint = primary_complaint || null;
      responseData.injury_location = injury_location || null;
      responseData.injury_duration = injury_duration || null;
      responseData.pain_frequency = pain_frequency || null;
      responseData.previous_treatments = previous_treatments || null;
      responseData.current_medications = current_medications || null;
      responseData.recovery_goals = recovery_goals || null;
    }

    // Add completion-specific fields
    if (questionnaire_type === 'completion') {
      responseData.goals_achieved = goals_achieved || null;
      responseData.overall_improvement = parseInt(overall_improvement) || 5;
      responseData.would_recommend = would_recommend !== false;
      responseData.continue_treatment = continue_treatment !== false;
    }

    // Insert
    const { data: response, error: insertError } = await supabase
      .from('questionnaire_responses')
      .insert(responseData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json({
      success: true,
      response
    });

  } catch (error) {
    console.error('Questionnaire API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
