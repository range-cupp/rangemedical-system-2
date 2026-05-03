// /lib/assessment-post-booking.js
// Notifications + record creation that fire AFTER an assessment booking is confirmed.
//
// Why this lives here (not in submit.js): on submit, the contact info may be
// browser-autofilled with a stale email. Sending intake notifications then
// produces records pointing at the wrong patient. By the time book.js runs,
// the user has paid and confirmed the booking — the email is verified.

import { Resend } from 'resend';
import { insertIntoPipeline } from './pipeline-insert.js';
import { notifyTaskAssignee } from './notify-task-assignee.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const PATH_LABEL = {
  injury: 'Injury & Recovery',
  energy: 'Energy & Optimization',
  both: 'Full-Spectrum',
};

/**
 * Run all post-booking work in one shot.
 *   - Email intake@range-medical.com with assessment + verified contact info
 *   - Create a follow-up task for Damon (with SMS notification)
 *   - Add to sales pipeline
 *
 * @param {object} opts
 * @param {object} opts.supabase  Supabase service-role client
 * @param {string} opts.leadId
 * @param {object} opts.verified  { firstName, lastName, email, phone } from the booking step (verified)
 * @param {string|null} opts.patientId
 */
export async function runPostBookingNotifications({ supabase, leadId, verified, patientId }) {
  if (!supabase || !leadId) return;

  // Pull the assessment-specific fields (symptoms, injury type, goals, etc.) — those
  // are filled out in the questionnaire and aren't at risk of autofill drift.
  const { data: lead, error } = await supabase
    .from('assessment_leads')
    .select(
      'assessment_path, injury_type, injury_location, injury_duration, in_physical_therapy, ' +
      'recovery_goal, primary_symptom, symptom_duration, has_recent_labs, ' +
      'tried_hormone_therapy, energy_goal, additional_info, post_booking_notified_at'
    )
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    console.error(`[post-booking] could not load lead ${leadId}:`, error?.message);
    return;
  }

  // Idempotency: if we've already fired notifications for this lead, skip.
  if (lead.post_booking_notified_at) {
    console.log(`[post-booking] lead ${leadId} already notified — skipping`);
    return;
  }

  const data = {
    firstName: verified.firstName || '',
    lastName: verified.lastName || '',
    email: verified.email || '',
    phone: verified.phone || '',
    assessmentPath: lead.assessment_path || 'energy',
    injuryType: lead.injury_type,
    injuryLocation: lead.injury_location,
    injuryDuration: lead.injury_duration,
    inPhysicalTherapy: lead.in_physical_therapy,
    recoveryGoal: lead.recovery_goal,
    symptoms: lead.primary_symptom ? lead.primary_symptom.split(', ') : [],
    symptomDuration: lead.symptom_duration,
    lastLabWork: lead.has_recent_labs,
    triedHormoneTherapy: lead.tried_hormone_therapy,
    goals: lead.energy_goal ? lead.energy_goal.split(', ') : [],
    additionalInfo: lead.additional_info,
  };

  // 1. Staff intake email
  try {
    await sendIntakeEmail(data);
  } catch (err) {
    console.error('[post-booking] intake email error:', err.message);
  }

  // 2. Pipeline insert
  try {
    await insertIntoPipeline({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      source: 'assessment',
      lead_type: 'assessment',
      lead_id: leadId,
      patient_id: patientId || null,
      path: data.assessmentPath,
    });
  } catch (err) {
    console.error('[post-booking] pipeline insert error:', err.message);
  }

  // 3. Damon follow-up task
  try {
    const { data: damon } = await supabase
      .from('employees')
      .select('id')
      .eq('email', 'damon@range-medical.com')
      .single();

    if (damon) {
      const pathLabel = PATH_LABEL[data.assessmentPath] || data.assessmentPath;
      const taskTitle = `New Assessment: ${data.firstName} ${data.lastName} (${pathLabel})`;
      await supabase.from('tasks').insert({
        title: taskTitle,
        description: `${data.firstName} ${data.lastName} booked a ${pathLabel} assessment.\nEmail: ${data.email}\nPhone: ${data.phone}`,
        assigned_to: damon.id,
        assigned_by: damon.id,
        patient_id: patientId || null,
        patient_name: `${data.firstName} ${data.lastName}`,
        priority: 'high',
        status: 'pending',
      });
      notifyTaskAssignee(damon.id, {
        assignerName: 'Range Medical',
        taskTitle,
        priority: 'high',
      }).catch((err) => console.error('[post-booking] task SMS error:', err.message));
    }
  } catch (err) {
    console.error('[post-booking] task create error:', err.message);
  }

  // Mark lead so retries don't double-send
  await supabase
    .from('assessment_leads')
    .update({ post_booking_notified_at: new Date().toISOString() })
    .eq('id', leadId);
}

async function sendIntakeEmail(data) {
  const {
    firstName, lastName, email, phone, assessmentPath,
    injuryType, injuryLocation, injuryDuration, inPhysicalTherapy, recoveryGoal,
    symptoms, symptomDuration, lastLabWork, triedHormoneTherapy, goals,
    additionalInfo,
  } = data;

  const pathName = PATH_LABEL[assessmentPath] || assessmentPath;
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
  });

  let detailsHtml = '';
  if (assessmentPath === 'injury') {
    detailsHtml = `
      <tr><td style="padding: 8px 0; color: #737373;">Injury Type:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabel('injuryType', injuryType) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Location:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabel('injuryLocation', injuryLocation) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Duration:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabel('injuryDuration', injuryDuration) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Physical Therapy:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabel('inPhysicalTherapy', inPhysicalTherapy) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Recovery Goal:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabel('recoveryGoal', recoveryGoal) || 'Not specified'}</td></tr>
    `;
  } else {
    const symptomsDisplay = symptoms?.length ? symptoms.map((s) => getLabel('symptoms', s)).join(', ') : 'Not specified';
    const goalsDisplay = goals?.length ? goals.map((g) => getLabel('goals', g)).join(', ') : 'Not specified';
    detailsHtml = `
      <tr><td style="padding: 8px 0; color: #737373;">Symptoms:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${symptomsDisplay}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Duration:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabel('symptomDuration', symptomDuration) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Last Lab Work:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabel('lastLabWork', lastLabWork) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Previous HRT:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabel('triedHormoneTherapy', triedHormoneTherapy) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #171717;">Goals:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${goalsDisplay}</td></tr>
    `;
  }

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#000;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">New Assessment Booked</h1>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <span style="display:inline-block;background:${assessmentPath === 'injury' ? '#fef2f2' : '#f0fdf4'};color:${assessmentPath === 'injury' ? '#dc2626' : '#16a34a'};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding:6px 12px;border-radius:4px;">${pathName}</span>
          <p style="margin:8px 0 0;font-size:13px;color:#737373;">${date}</p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.05em;">Contact Information</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
            <tr><td style="padding:8px 0;color:#737373;">Name:</td><td style="padding:8px 0;color:#171717;font-weight:600;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding:8px 0;color:#737373;">Email:</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#171717;">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#737373;">Phone:</td><td style="padding:8px 0;"><a href="tel:${phone}" style="color:#171717;">${phone}</a></td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.05em;">Assessment Details</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">${detailsHtml}</table>
        </td></tr>
        ${additionalInfo ? `
        <tr><td style="padding:0 32px 24px;">
          <div style="background:#fafafa;border-radius:8px;padding:16px;">
            <h3 style="margin:0 0 8px;font-size:13px;font-weight:600;color:#737373;text-transform:uppercase;">Additional Notes</h3>
            <p style="margin:0;font-size:14px;color:#525252;line-height:1.6;">${additionalInfo}</p>
          </div>
        </td></tr>` : ''}
        <tr><td style="background:#fafafa;padding:20px 32px;text-align:center;border-top:1px solid #e5e5e5;">
          <p style="margin:0;font-size:13px;color:#737373;">Range Medical Assessment System</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const { error } = await resend.emails.send({
    from: 'Range Medical <notifications@range-medical.com>',
    to: 'intake@range-medical.com',
    subject: `New ${pathName} Assessment: ${firstName} ${lastName}`,
    html,
  });

  if (error) {
    console.error('[post-booking] resend error:', error);
  } else {
    console.log(`[post-booking] intake email sent for ${firstName} ${lastName}`);
  }
}

const LABELS = {
  injuryType: { joint_ligament: 'Joint or ligament injury', muscle_tendon: 'Muscle or tendon injury', post_surgical: 'Post-surgical recovery', concussion: 'Concussion or head injury', chronic_pain: 'Chronic pain condition', fracture: 'Bone fracture', other: 'Other' },
  injuryLocation: { shoulder: 'Shoulder', knee: 'Knee', back: 'Back', hip: 'Hip', neck: 'Neck', ankle: 'Ankle', elbow: 'Elbow', wrist_hand: 'Wrist or hand', head: 'Head', multiple: 'Multiple areas', other: 'Other' },
  injuryDuration: { less_2_weeks: 'Less than 2 weeks', '2_4_weeks': '2–4 weeks', '1_3_months': '1–3 months', '3_6_months': '3–6 months', '6_plus_months': '6+ months' },
  inPhysicalTherapy: { yes: 'Currently in PT', no: 'Not in PT', completed: 'Completed PT but not 100%' },
  recoveryGoal: { return_sport: 'Return to sport/athletic activity', daily_activities: 'Daily activities pain-free', avoid_surgery: 'Avoid surgery', speed_healing: 'Speed up healing', reduce_pain: 'Reduce pain and inflammation', post_surgery: 'Recover faster after surgery' },
  symptoms: { fatigue: 'Fatigue or low energy', brain_fog: 'Brain fog or poor focus', weight_gain: 'Unexplained weight gain', poor_sleep: 'Poor sleep or insomnia', low_libido: 'Low libido or sexual function', muscle_loss: 'Muscle loss or weakness', mood_changes: 'Mood changes/anxiety/irritability', recovery: 'Slow recovery from workouts', other: 'Other' },
  symptomDuration: { less_1_month: 'Less than 1 month', '1_3_months': '1–3 months', '3_6_months': '3–6 months', '6_12_months': '6–12 months', '1_plus_years': '1+ years' },
  goals: { more_energy: 'More energy throughout the day', better_sleep: 'Better, more restful sleep', lose_weight: 'Lose weight', build_muscle: 'Build or maintain muscle', mental_clarity: 'Mental clarity and focus', feel_myself: 'Feel like myself again', longevity: 'Optimize for longevity', performance: 'Athletic or sexual performance' },
  triedHormoneTherapy: { yes: 'Yes', no: 'No', not_sure: 'Not sure what this is' },
  lastLabWork: { within_60_days: 'Within the last 60 days', '2_6_months': '2–6 months ago', '6_12_months': '6–12 months ago', over_year: 'Over a year ago', never: "Never or don't remember" },
};

function getLabel(field, value) {
  if (!value) return null;
  return LABELS[field]?.[value] || value;
}
