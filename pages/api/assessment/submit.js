import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

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
      primarySymptom,
      symptomDuration,
      hasRecentLabs,
      triedHormoneTherapy,
      energyGoal,
      // Additional
      additionalInfo
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !assessmentPath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build tags based on responses
    const tags = [`assessment_${assessmentPath}`];

    if (assessmentPath === 'injury') {
      if (injuryType) tags.push(`injury_type_${injuryType}`);
      if (injuryLocation) tags.push(`injury_location_${injuryLocation}`);
      if (injuryDuration) tags.push(`injury_duration_${injuryDuration}`);
      if (inPhysicalTherapy) tags.push(`pt_status_${inPhysicalTherapy}`);
      if (recoveryGoal) tags.push(`goal_${recoveryGoal}`);
    } else {
      if (primarySymptom) tags.push(`symptom_${primarySymptom}`);
      if (symptomDuration) tags.push(`symptom_duration_${symptomDuration}`);
      if (hasRecentLabs) tags.push(`has_labs_${hasRecentLabs}`);
      if (triedHormoneTherapy) tags.push(`hrt_experience_${triedHormoneTherapy}`);
      if (energyGoal) tags.push(`goal_${energyGoal}`);
    }

    // 1. Save to Supabase
    let savedLead = null;
    if (supabase) {
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
        primary_symptom: primarySymptom || null,
        symptom_duration: symptomDuration || null,
        has_recent_labs: hasRecentLabs || null,
        tried_hormone_therapy: triedHormoneTherapy || null,
        energy_goal: energyGoal || null,
        additional_info: additionalInfo || null,
        tags
      };

      const { data, error: dbError } = await supabase
        .from('assessment_leads')
        .insert([assessmentData])
        .select()
        .single();

      if (dbError) {
        console.error('Supabase error:', dbError);
        // Continue anyway - we don't want to block the user
      } else {
        savedLead = data;
      }
    } else {
      console.warn('Supabase not configured, skipping database save');
    }

    // 2. Sync to GoHighLevel
    let ghlContactId = null;
    if (GHL_API_KEY) {
      try {
        // Search for existing contact
        const searchResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(email)}`,
          {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28'
            }
          }
        );

        const searchData = await searchResponse.json();
        const existingContact = searchData.contacts?.find(c => c.email?.toLowerCase() === email.toLowerCase());

        const contactPayload = {
          firstName,
          lastName,
          email: email.toLowerCase().trim(),
          phone,
          locationId: GHL_LOCATION_ID,
          tags,
          source: `Range Assessment - ${assessmentPath === 'injury' ? 'Injury' : 'Energy'}`
        };

        if (existingContact) {
          // Update existing contact - merge tags
          ghlContactId = existingContact.id;
          const existingTags = existingContact.tags || [];
          contactPayload.tags = [...new Set([...existingTags, ...tags])];

          await fetch(
            `https://services.leadconnectorhq.com/contacts/${ghlContactId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28'
              },
              body: JSON.stringify(contactPayload)
            }
          );
        } else {
          // Create new contact
          const createResponse = await fetch(
            'https://services.leadconnectorhq.com/contacts/',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28'
              },
              body: JSON.stringify(contactPayload)
            }
          );

          const createData = await createResponse.json();
          ghlContactId = createData.contact?.id;
        }

        // Add note with assessment details
        if (ghlContactId) {
          const noteBody = buildAssessmentNote(assessmentPath, {
            injuryType, injuryLocation, injuryDuration, inPhysicalTherapy, recoveryGoal,
            primarySymptom, symptomDuration, hasRecentLabs, triedHormoneTherapy, energyGoal,
            additionalInfo
          });

          await fetch(
            `https://services.leadconnectorhq.com/contacts/${ghlContactId}/notes`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ body: noteBody })
            }
          );
        }

        // Update Supabase record with GHL contact ID
        if (supabase && savedLead?.id && ghlContactId) {
          await supabase
            .from('assessment_leads')
            .update({ ghl_contact_id: ghlContactId })
            .eq('id', savedLead.id);
        }

      } catch (ghlError) {
        console.error('GHL sync error:', ghlError);
        // Continue anyway - don't block the user flow
      }
    }

    // 3. Send SMS notification
    try {
      await sendSMSNotification({
        firstName,
        lastName,
        email,
        phone,
        assessmentPath
      });
    } catch (smsError) {
      console.error('SMS notification error:', smsError);
    }

    // 4. Send email notification to cupp@range-medical.com
    try {
      await sendEmailNotification({
        firstName,
        lastName,
        email,
        phone,
        assessmentPath,
        injuryType, injuryLocation, injuryDuration, inPhysicalTherapy, recoveryGoal,
        primarySymptom, symptomDuration, hasRecentLabs, triedHormoneTherapy, energyGoal,
        additionalInfo
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    return res.status(200).json({
      success: true,
      leadId: savedLead?.id,
      ghlContactId
    });

  } catch (error) {
    console.error('Assessment submit error:', error);
    return res.status(500).json({ error: 'Failed to submit assessment' });
  }
}

// Build assessment note for GHL
function buildAssessmentNote(path, data) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (path === 'injury') {
    return `📋 Range Assessment - Injury & Recovery
Date: ${date}

Injury Type: ${getLabelForValue('injuryType', data.injuryType) || 'Not specified'}
Location: ${getLabelForValue('injuryLocation', data.injuryLocation) || 'Not specified'}
Duration: ${getLabelForValue('injuryDuration', data.injuryDuration) || 'Not specified'}
Physical Therapy: ${getLabelForValue('inPhysicalTherapy', data.inPhysicalTherapy) || 'Not specified'}
Recovery Goal: ${getLabelForValue('recoveryGoal', data.recoveryGoal) || 'Not specified'}

${data.additionalInfo ? `Additional Notes: ${data.additionalInfo}` : ''}`;
  } else {
    return `📋 Range Assessment - Energy & Optimization
Date: ${date}

Primary Symptom: ${getLabelForValue('primarySymptom', data.primarySymptom) || 'Not specified'}
Duration: ${getLabelForValue('symptomDuration', data.symptomDuration) || 'Not specified'}
Recent Labs: ${data.hasRecentLabs || 'Not specified'}
Previous HRT: ${data.triedHormoneTherapy || 'Not specified'}
Main Goal: ${getLabelForValue('energyGoal', data.energyGoal) || 'Not specified'}

${data.additionalInfo ? `Additional Notes: ${data.additionalInfo}` : ''}`;
  }
}

// Send SMS notification
async function sendSMSNotification(data) {
  const { firstName, lastName, email, phone, assessmentPath } = data;
  const ghlApiKey = process.env.GHL_API_KEY;
  const notifyContactId = process.env.RESEARCH_NOTIFY_CONTACT_ID || 'a2IWAaLOI1kJGJGYMCU2';

  if (!ghlApiKey) return;

  const pathName = assessmentPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization';
  const message = `New Assessment Lead!\n\n${firstName} ${lastName}\n${email}\n${phone}\n\nPath: ${pathName}`;

  const response = await fetch(
    'https://services.leadconnectorhq.com/conversations/messages',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-04-15',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: notifyContactId,
        message: message
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('SMS send error:', errorData);
  } else {
    console.log('Assessment SMS notification sent successfully');
  }
}

// Send email notification
async function sendEmailNotification(data) {
  const {
    firstName, lastName, email, phone, assessmentPath,
    injuryType, injuryLocation, injuryDuration, inPhysicalTherapy, recoveryGoal,
    primarySymptom, symptomDuration, hasRecentLabs, triedHormoneTherapy, energyGoal,
    additionalInfo
  } = data;

  const pathName = assessmentPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization';
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  let detailsHtml = '';

  if (assessmentPath === 'injury') {
    detailsHtml = `
      <tr><td style="padding: 8px 0; color: #737373;">Injury Type:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('injuryType', injuryType) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Location:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('injuryLocation', injuryLocation) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Duration:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('injuryDuration', injuryDuration) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Physical Therapy:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('inPhysicalTherapy', inPhysicalTherapy) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Recovery Goal:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('recoveryGoal', recoveryGoal) || 'Not specified'}</td></tr>
    `;
  } else {
    detailsHtml = `
      <tr><td style="padding: 8px 0; color: #737373;">Primary Symptom:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('primarySymptom', primarySymptom) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Duration:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('symptomDuration', symptomDuration) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Has Recent Labs:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${hasRecentLabs === 'yes' ? 'Yes - within 60 days' : 'No'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Previous HRT:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('triedHormoneTherapy', triedHormoneTherapy) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #171717;">Main Goal:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('energyGoal', energyGoal) || 'Not specified'}</td></tr>
    `;
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">New Assessment Lead</h1>
            </td>
          </tr>

          <!-- Path Badge -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <span style="display: inline-block; background: ${assessmentPath === 'injury' ? '#fef2f2' : '#f0fdf4'}; color: ${assessmentPath === 'injury' ? '#dc2626' : '#16a34a'}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 4px;">
                ${pathName}
              </span>
              <p style="margin: 8px 0 0; font-size: 13px; color: #737373;">${date}</p>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Contact Information</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                <tr><td style="padding: 8px 0; color: #737373;">Name:</td><td style="padding: 8px 0; color: #171717; font-weight: 600;">${firstName} ${lastName}</td></tr>
                <tr><td style="padding: 8px 0; color: #737373;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #171717;">${email}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #737373;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #171717;">${phone}</a></td></tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td>
          </tr>

          <!-- Assessment Details -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Assessment Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                ${detailsHtml}
              </table>
            </td>
          </tr>

          ${additionalInfo ? `
          <!-- Additional Notes -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background: #fafafa; border-radius: 8px; padding: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #737373; text-transform: uppercase;">Additional Notes</h3>
                <p style="margin: 0; font-size: 14px; color: #525252; line-height: 1.6;">${additionalInfo}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 13px; color: #737373;">Range Medical Assessment System</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const { error } = await resend.emails.send({
    from: 'Range Medical <notifications@range-medical.com>',
    to: 'cupp@range-medical.com',
    subject: `New ${pathName} Assessment: ${firstName} ${lastName}`,
    html: emailHtml
  });

  if (error) {
    console.error('Email notification error:', error);
  } else {
    console.log('Assessment email notification sent successfully');
  }
}

// Helper function to convert field values to readable labels
function getLabelForValue(fieldName, value) {
  if (!value) return null;

  const labels = {
    injuryType: {
      'joint_ligament': 'Joint or ligament injury',
      'muscle_tendon': 'Muscle or tendon injury',
      'post_surgical': 'Post-surgical recovery',
      'concussion': 'Concussion or head injury',
      'chronic_pain': 'Chronic pain condition',
      'fracture': 'Bone fracture',
      'other': 'Other'
    },
    injuryLocation: {
      'shoulder': 'Shoulder',
      'knee': 'Knee',
      'back': 'Back',
      'hip': 'Hip',
      'neck': 'Neck',
      'ankle': 'Ankle',
      'elbow': 'Elbow',
      'wrist_hand': 'Wrist or hand',
      'head': 'Head',
      'multiple': 'Multiple areas',
      'other': 'Other'
    },
    injuryDuration: {
      'less_2_weeks': 'Less than 2 weeks',
      '2_4_weeks': '2–4 weeks',
      '1_3_months': '1–3 months',
      '3_6_months': '3–6 months',
      '6_plus_months': '6+ months'
    },
    inPhysicalTherapy: {
      'yes': 'Currently in PT',
      'no': 'Not in PT',
      'completed': 'Completed PT but not 100%'
    },
    recoveryGoal: {
      'return_sport': 'Return to sport/athletic activity',
      'daily_activities': 'Daily activities pain-free',
      'avoid_surgery': 'Avoid surgery',
      'speed_healing': 'Speed up healing',
      'reduce_pain': 'Reduce pain and inflammation',
      'post_surgery': 'Recover faster after surgery'
    },
    primarySymptom: {
      'fatigue': 'Fatigue or low energy',
      'brain_fog': 'Brain fog or poor focus',
      'weight_gain': 'Unexplained weight gain',
      'poor_sleep': 'Poor sleep or insomnia',
      'low_libido': 'Low libido or sexual function',
      'muscle_loss': 'Muscle loss or weakness',
      'mood_changes': 'Mood changes/anxiety/irritability',
      'recovery': 'Slow recovery from workouts',
      'other': 'Other'
    },
    symptomDuration: {
      'less_1_month': 'Less than 1 month',
      '1_3_months': '1–3 months',
      '3_6_months': '3–6 months',
      '6_12_months': '6–12 months',
      '1_plus_years': '1+ years'
    },
    energyGoal: {
      'more_energy': 'More energy throughout the day',
      'better_sleep': 'Better, more restful sleep',
      'lose_weight': 'Lose weight',
      'build_muscle': 'Build or maintain muscle',
      'mental_clarity': 'Mental clarity and focus',
      'feel_myself': 'Feel like myself again',
      'longevity': 'Optimize for longevity',
      'performance': 'Athletic or sexual performance'
    },
    triedHormoneTherapy: {
      'yes': 'Yes',
      'no': 'No',
      'not_sure': 'Not sure what this is'
    }
  };

  return labels[fieldName]?.[value] || value;
}
