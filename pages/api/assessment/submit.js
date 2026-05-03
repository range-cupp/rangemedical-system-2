// /pages/api/assessment/submit.js
// Inserts a new assessment_leads row and returns the leadId.
//
// Intentionally silent — no patient creation, no staff email, no task, no
// pipeline insert here. Browser autofill can fire this with stale contact
// info; the real notifications wait until book.js, where the email/name/phone
// have been verified by the payment + booking flow.
// See lib/assessment-post-booking.js for the deferred work.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      assessmentPath,
      // Injury fields
      injuryType,
      injuryLocation,
      injuryDuration,
      inPhysicalTherapy,
      recoveryGoal,
      // Energy fields
      symptoms,
      symptomDuration,
      lastLabWork,
      triedHormoneTherapy,
      goals,
      // Additional
      additionalInfo,
      referralSource,
      // UTM tracking
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !assessmentPath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!supabase) {
      console.error('Supabase not configured — cannot save assessment lead');
      return res.status(500).json({
        error: 'Service temporarily unavailable. Please call (949) 997-3988.',
      });
    }

    const tags = [`assessment_${assessmentPath}`];
    if (referralSource === 'start_funnel') tags.push('from_start_funnel');
    if (assessmentPath === 'injury') {
      if (injuryType) tags.push(`injury_type_${injuryType}`);
      if (injuryLocation) tags.push(`injury_location_${injuryLocation}`);
      if (injuryDuration) tags.push(`injury_duration_${injuryDuration}`);
      if (inPhysicalTherapy) tags.push(`pt_status_${inPhysicalTherapy}`);
      if (recoveryGoal) tags.push(`goal_${recoveryGoal}`);
    } else {
      if (symptoms?.length) symptoms.forEach((s) => tags.push(`symptom_${s}`));
      if (symptomDuration) tags.push(`symptom_duration_${symptomDuration}`);
      if (lastLabWork) tags.push(`last_labs_${lastLabWork}`);
      if (triedHormoneTherapy) tags.push(`hrt_experience_${triedHormoneTherapy}`);
      if (goals?.length) goals.forEach((g) => tags.push(`goal_${g}`));
    }

    const assessmentData = {
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase().trim(),
      phone,
      assessment_path: assessmentPath,
      injury_type: injuryType || null,
      injury_location: injuryLocation || null,
      injury_duration: injuryDuration || null,
      in_physical_therapy: inPhysicalTherapy || null,
      recovery_goal: recoveryGoal || null,
      primary_symptom: symptoms?.length ? symptoms.join(', ') : null,
      symptom_duration: symptomDuration || null,
      has_recent_labs: lastLabWork || null,
      tried_hormone_therapy: triedHormoneTherapy || null,
      energy_goal: goals?.length ? goals.join(', ') : null,
      additional_info: additionalInfo || null,
      tags,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null,
    };

    const { data: savedLead, error: dbError } = await supabase
      .from('assessment_leads')
      .insert([assessmentData])
      .select()
      .single();

    if (dbError || !savedLead?.id) {
      console.error('Supabase assessment_leads insert error:', dbError, 'payload:', assessmentData);
      return res.status(500).json({
        error: 'Could not save your information. Please try again or call (949) 997-3988.',
        details: dbError?.message || 'No row returned',
      });
    }

    return res.status(200).json({ success: true, leadId: savedLead.id });
  } catch (error) {
    console.error('Assessment submit error:', error);
    return res.status(500).json({ error: 'Failed to submit assessment' });
  }
}
