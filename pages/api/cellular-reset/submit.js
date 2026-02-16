import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

const AVATAR_LABELS = {
  'athlete': 'Athletes & Performance',
  'general': 'General Wellness',
  'women-anti-aging': 'Women\'s Anti-Aging',
  'men-35-55': 'Men 35–55'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, phone, scores, goal, timeline, avatar, source } = req.body;

    if (!firstName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const tags = [
      'cellular_reset_lead',
      `cr_avatar_${avatar}`,
      `cr_goal_${goal}`,
      `cr_timeline_${timeline}`
    ];

    // 1. Create/update GHL contact
    let ghlContactId = null;
    if (GHL_API_KEY) {
      try {
        // Search for existing contact
        const searchResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(cleanEmail)}`,
          {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28'
            }
          }
        );

        const searchData = await searchResponse.json();
        const existingContact = searchData.contacts?.find(c => c.email?.toLowerCase() === cleanEmail);

        const contactPayload = {
          firstName,
          lastName: lastName || '',
          email: cleanEmail,
          phone,
          locationId: GHL_LOCATION_ID,
          tags,
          source: 'Cellular Reset Landing Page'
        };

        if (existingContact) {
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

        // Add note with quiz scores
        if (ghlContactId) {
          const noteBody = buildQuizNote({ firstName, lastName, scores, goal, timeline, avatar });

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
      } catch (ghlError) {
        console.error('GHL sync error:', ghlError);
      }
    }

    // 2. Send notification email
    try {
      await sendNotificationEmail({ firstName, lastName, email: cleanEmail, phone, scores, goal, timeline, avatar });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    return res.status(200).json({ success: true, ghlContactId });

  } catch (error) {
    console.error('Cellular reset submit error:', error);
    return res.status(500).json({ error: 'Failed to submit quiz' });
  }
}

function buildQuizNote({ firstName, lastName, scores, goal, timeline, avatar }) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const avatarLabel = AVATAR_LABELS[avatar] || avatar;

  let scoreLines = '';
  if (scores) {
    scoreLines = Object.entries(scores)
      .map(([label, value]) => `  ${label}: ${value}/10`)
      .join('\n');
  }

  return `📋 Cellular Reset Quiz — ${avatarLabel}
Date: ${date}

Name: ${firstName} ${lastName || ''}
Avatar: ${avatarLabel}

Quiz Scores:
${scoreLines}

Goal: ${goal || 'Not specified'}
Timeline: ${timeline || 'Not specified'}`;
}

function getScoreColor(score) {
  const n = parseInt(score, 10);
  if (n <= 3) return '#dc2626';
  if (n <= 5) return '#f59e0b';
  if (n <= 7) return '#3b82f6';
  return '#16a34a';
}

async function sendNotificationEmail({ firstName, lastName, email, phone, scores, goal, timeline, avatar }) {
  const avatarLabel = AVATAR_LABELS[avatar] || avatar;
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  let scoreRowsHtml = '';
  if (scores) {
    scoreRowsHtml = Object.entries(scores).map(([label, value]) => {
      const color = getScoreColor(value);
      return `<tr>
        <td style="padding: 10px 12px; color: #737373; font-size: 14px; border-bottom: 1px solid #f5f5f5;">${label}</td>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #f5f5f5;">
          <span style="display: inline-block; background: ${color}; color: #ffffff; font-weight: 700; font-size: 14px; width: 32px; height: 32px; line-height: 32px; border-radius: 50%; text-align: center;">${value}</span>
        </td>
        <td style="padding: 10px 12px; text-align: right; color: #a3a3a3; font-size: 13px; border-bottom: 1px solid #f5f5f5;">/10</td>
      </tr>`;
    }).join('');
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
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">New Cellular Reset Lead</h1>
            </td>
          </tr>

          <!-- Avatar Badge -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <span style="display: inline-block; background: #f0f9ff; color: #0369a1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 4px;">
                ${avatarLabel}
              </span>
              <p style="margin: 8px 0 0; font-size: 13px; color: #737373;">${date}</p>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Contact Information</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                <tr><td style="padding: 8px 0; color: #737373;">Name:</td><td style="padding: 8px 0; color: #171717; font-weight: 600;">${firstName} ${lastName || ''}</td></tr>
                <tr><td style="padding: 8px 0; color: #737373;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #171717;">${email}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #737373;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #171717;">${phone}</a></td></tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td>
          </tr>

          <!-- Quiz Scores -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Quiz Scores</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                ${scoreRowsHtml}
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td>
          </tr>

          <!-- Goal & Timeline -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Goal &amp; Timeline</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                <tr><td style="padding: 8px 0; color: #737373;">Primary Goal:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${goal || 'Not specified'}</td></tr>
                <tr><td style="padding: 8px 0; color: #737373;">Timeline:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${timeline || 'Not specified'}</td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 13px; color: #737373;">Range Medical — Cellular Reset Quiz</p>
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
    to: 'info@range-medical.com',
    subject: `New Cellular Reset Lead: ${firstName} ${lastName || ''}`.trim(),
    html: emailHtml
  });

  if (error) {
    console.error('Email send error:', error);
  }
}
