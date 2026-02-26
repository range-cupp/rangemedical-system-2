import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

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
      // Add tags for each selected symptom
      if (symptoms && symptoms.length > 0) {
        symptoms.forEach(s => tags.push(`symptom_${s}`));
      }
      if (symptomDuration) tags.push(`symptom_duration_${symptomDuration}`);
      if (lastLabWork) tags.push(`last_labs_${lastLabWork}`);
      if (triedHormoneTherapy) tags.push(`hrt_experience_${triedHormoneTherapy}`);
      // Add tags for each selected goal
      if (goals && goals.length > 0) {
        goals.forEach(g => tags.push(`goal_${g}`));
      }
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
        primary_symptom: symptoms && symptoms.length > 0 ? symptoms.join(', ') : null,
        symptom_duration: symptomDuration || null,
        has_recent_labs: lastLabWork || null,
        tried_hormone_therapy: triedHormoneTherapy || null,
        energy_goal: goals && goals.length > 0 ? goals.join(', ') : null,
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
            symptoms, symptomDuration, lastLabWork, triedHormoneTherapy, goals,
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

    // 4. Send confirmation SMS to the lead
    if (GHL_API_KEY && ghlContactId) {
      try {
        const pathName = assessmentPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization';
        await fetch(
          'https://services.leadconnectorhq.com/conversations/messages',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-04-15',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'SMS',
              contactId: ghlContactId,
              message: `Hi ${firstName}, thanks for completing your ${pathName} assessment with Range Medical! We received your information and will be in contact with you shortly to discuss your results and next steps. Feel free to call us at (949) 997-3988 with any questions. - Range Medical`
            })
          }
        );
      } catch (leadSmsError) {
        console.error('Lead SMS confirmation error:', leadSmsError);
      }
    }

    // 5. Send email notification
    try {
      await sendEmailNotification({
        firstName,
        lastName,
        email,
        phone,
        assessmentPath,
        injuryType, injuryLocation, injuryDuration, inPhysicalTherapy, recoveryGoal,
        symptoms, symptomDuration, lastLabWork, triedHormoneTherapy, goals,
        additionalInfo
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    // 5. Patient results email removed — now sent from /api/assessment/complete after intake

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
    const symptomsDisplay = data.symptoms && data.symptoms.length > 0
      ? data.symptoms.map(s => getLabelForValue('symptoms', s)).join(', ')
      : 'Not specified';
    const goalsDisplay = data.goals && data.goals.length > 0
      ? data.goals.map(g => getLabelForValue('goals', g)).join(', ')
      : 'Not specified';

    return `📋 Range Assessment - Energy & Optimization
Date: ${date}

Symptoms: ${symptomsDisplay}
Duration: ${getLabelForValue('symptomDuration', data.symptomDuration) || 'Not specified'}
Last Lab Work: ${getLabelForValue('lastLabWork', data.lastLabWork) || 'Not specified'}
Previous HRT: ${getLabelForValue('triedHormoneTherapy', data.triedHormoneTherapy) || 'Not specified'}
Goals: ${goalsDisplay}

${data.additionalInfo ? `Additional Notes: ${data.additionalInfo}` : ''}`;
  }
}

// Send SMS notification
async function sendSMSNotification(data) {
  const { firstName, lastName, email, phone, assessmentPath } = data;
  const ghlApiKey = process.env.GHL_API_KEY;
  const notifyRecipients = [
    process.env.RESEARCH_NOTIFY_CONTACT_ID || 'a2IWAaLOI1kJGJGYMCU2', // Chris
    '6rpcbVD71tCzuFMpz8oV' // Damon
  ];

  if (!ghlApiKey) return;

  const pathName = assessmentPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization';
  const message = `New Assessment Lead!\n\n${firstName} ${lastName}\n${email}\n${phone}\n\nPath: ${pathName}`;

  for (const contactId of notifyRecipients) {
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
          contactId,
          message: message
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`SMS send error for ${contactId}:`, errorData);
    } else {
      console.log(`Assessment SMS notification sent to ${contactId}`);
    }
  }
}

// Send email notification
async function sendEmailNotification(data) {
  const {
    firstName, lastName, email, phone, assessmentPath,
    injuryType, injuryLocation, injuryDuration, inPhysicalTherapy, recoveryGoal,
    symptoms, symptomDuration, lastLabWork, triedHormoneTherapy, goals,
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
    const symptomsDisplay = symptoms && symptoms.length > 0
      ? symptoms.map(s => getLabelForValue('symptoms', s)).join(', ')
      : 'Not specified';
    const goalsDisplay = goals && goals.length > 0
      ? goals.map(g => getLabelForValue('goals', g)).join(', ')
      : 'Not specified';

    detailsHtml = `
      <tr><td style="padding: 8px 0; color: #737373;">Symptoms:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${symptomsDisplay}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Duration:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('symptomDuration', symptomDuration) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Last Lab Work:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('lastLabWork', lastLabWork) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Previous HRT:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${getLabelForValue('triedHormoneTherapy', triedHormoneTherapy) || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #171717;">Goals:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${goalsDisplay}</td></tr>
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
    to: 'intake@range-medical.com',
    subject: `New ${pathName} Assessment: ${firstName} ${lastName}`,
    html: emailHtml
  });

  if (error) {
    console.error('Email notification error:', error);
  } else {
    console.log('Assessment email notification sent successfully');
  }
}

// Send patient results email with their recommendation
async function sendPatientResultsEmail({ firstName, email, symptoms, goals, lastLabWork }) {
  // Calculate recommendation (same logic as frontend)
  const recommendElite = goals.includes('longevity') ||
                         symptoms.length >= 3 ||
                         goals.includes('performance') ||
                         (symptoms.includes('brain_fog') && (symptoms.includes('mood_changes') || symptoms.includes('fatigue'))) ||
                         symptoms.includes('muscle_loss') ||
                         goals.includes('build_muscle') ||
                         symptoms.includes('recovery') ||
                         lastLabWork === 'over_year' ||
                         lastLabWork === 'never';

  const panelName = recommendElite ? 'Elite Panel' : 'Essential Panel';
  const panelPrice = recommendElite ? '$750' : '$350';

  const symptomLabels = {
    fatigue: 'Fatigue or low energy',
    brain_fog: 'Brain fog or poor focus',
    weight_gain: 'Unexplained weight gain',
    poor_sleep: 'Poor sleep or insomnia',
    low_libido: 'Low libido or sexual function',
    muscle_loss: 'Muscle loss or weakness',
    mood_changes: 'Mood changes or irritability',
    recovery: 'Slow recovery from workouts'
  };

  const goalLabels = {
    more_energy: 'More energy throughout the day',
    better_sleep: 'Better, more restful sleep',
    lose_weight: 'Lose weight',
    build_muscle: 'Build or maintain muscle',
    mental_clarity: 'Mental clarity and focus',
    feel_myself: 'Feel like myself again',
    longevity: 'Optimize for longevity',
    performance: 'Athletic or sexual performance'
  };

  const symptomsHtml = symptoms.map(s => `<li style="padding: 4px 0; color: #171717;">${symptomLabels[s] || s}</li>`).join('');
  const goalsHtml = goals.map(g => `<li style="padding: 4px 0; color: #171717;">${goalLabels[g] || g}</li>`).join('');

  const labsSection = lastLabWork === 'within_60_days' ? `
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #166534;">You mentioned having recent labs</h3>
                <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #166534;">
                  Please send your lab results to help us prepare for your visit:
                </p>
                <a href="mailto:intake@range-medical.com" style="display: inline-block; background: #166534; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 14px;">Email Labs to intake@range-medical.com</a>
              </div>
  ` : '';

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
            <td style="background-color: #000000; padding: 24px 32px; text-align: center;">
              <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" alt="Range Medical" style="height: 60px; width: auto;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #171717;">Thanks for completing your assessment, ${firstName}!</h1>
              <p style="margin: 0 0 32px; font-size: 16px; color: #737373;">Here's a summary of your personalized lab recommendation.</p>

              <!-- Recommendation Box -->
              <div style="background: #000000; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #a3a3a3;">Your Recommended Panel</p>
                <h2 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff;">${panelName}</h2>
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">${panelPrice}</p>
              </div>

              ${labsSection}

              <!-- What You Told Us -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="48%" style="vertical-align: top; padding-right: 12px;">
                    <h3 style="margin: 0 0 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #737373;">Your Symptoms</h3>
                    <ul style="margin: 0; padding: 0 0 0 16px; font-size: 14px;">
                      ${symptomsHtml}
                    </ul>
                  </td>
                  <td width="48%" style="vertical-align: top; padding-left: 12px;">
                    <h3 style="margin: 0 0 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #737373;">Your Goals</h3>
                    <ul style="margin: 0; padding: 0 0 0 16px; font-size: 14px;">
                      ${goalsHtml}
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #171717;">What Happens Next</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #000; color: #fff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 12px;">1</span>
                      <span style="font-size: 14px; color: #171717;">Book your panel online or call us</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <span style="display: inline-block; width: 24px; height: 24px; background: #000; color: #fff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 12px;">2</span>
                      <span style="font-size: 14px; color: #171717;">Get your blood draw at a local lab</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="display: inline-block; width: 24px; height: 24px; background: #000; color: #fff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 12px;">3</span>
                      <span style="font-size: 14px; color: #171717;">Review results with your provider</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align: center;">
                <a href="${recommendElite ? 'https://link.range-medical.com/payment-link/698365ba6503ca98c6834212' : 'https://link.range-medical.com/payment-link/698365fcc80eaf78e79b8ef7'}" style="display: inline-block; background: #000000; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">Pay & Book ${panelName}</a>
                <p style="margin: 16px 0 0; font-size: 14px; color: #737373;">
                  Or call <a href="tel:9499973988" style="color: #171717; font-weight: 600;">(949) 997-3988</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #171717;">Range Medical</p>
              <p style="margin: 0 0 4px; font-size: 13px; color: #737373;">1901 Westcliff Dr. Suite 10</p>
              <p style="margin: 0 0 12px; font-size: 13px; color: #737373;">Newport Beach, CA 92660</p>
              <a href="tel:9499973988" style="font-size: 13px; color: #737373; text-decoration: none;">(949) 997-3988</a>
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
    from: 'Range Medical <noreply@range-medical.com>',
    to: email,
    subject: `Your Lab Recommendation: ${panelName} - Range Medical`,
    html: emailHtml
  });

  if (error) {
    console.error('Patient results email error:', error);
  } else {
    console.log('Patient results email sent successfully to:', email);
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
    symptoms: {
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
    goals: {
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
    },
    lastLabWork: {
      'within_60_days': 'Within the last 60 days',
      '2_6_months': '2–6 months ago',
      '6_12_months': '6–12 months ago',
      'over_year': 'Over a year ago',
      'never': 'Never or don\'t remember'
    }
  };

  return labels[fieldName]?.[value] || value;
}
