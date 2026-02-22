import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getStudyById } from '../../../data/researchStudies';

// Initialize Supabase only if credentials are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const resend = new Resend(process.env.RESEND_API_KEY);

// GHL API helper - Add note to contact
async function addGHLNote(contactId, noteBody, ghlApiKey) {
  try {
    await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: noteBody })
      }
    );
  } catch (error) {
    console.error('GHL note error:', error);
  }
}

// Send SMS notification for new research lead
async function sendSMSNotification(data) {
  const { firstName, lastName, email, studyTitle, servicePage } = data;
  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;
  const notifyPhone = process.env.RESEARCH_NOTIFY_PHONE || '+19496900339';
  // Contact ID for Chris Cupp (owner) - used for SMS notifications
  const notifyContactId = process.env.RESEARCH_NOTIFY_CONTACT_ID || 'a2IWAaLOI1kJGJGYMCU2';

  if (!ghlApiKey) {
    console.warn('GHL_API_KEY not configured, skipping SMS notification');
    return;
  }

  const serviceNames = {
    'red-light-therapy': 'Red Light Therapy',
    'hyperbaric-oxygen-therapy': 'HBOT',
    'peptide-therapy': 'Peptide Therapy',
    'iv-therapy': 'IV Therapy',
    'hormone-optimization': 'HRT',
    'weight-loss': 'Weight Loss',
    'nad-therapy': 'NAD+',
    'prp-therapy': 'PRP',
    'exosome-therapy': 'Exosomes'
  };
  const serviceName = serviceNames[servicePage] || servicePage;

  const message = `New Research Lead!\n\n${firstName} ${lastName}\n${email}\n\nStudy: ${studyTitle}\nService: ${serviceName}`;

  try {
    // Send SMS using GHL conversations API with contact ID
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
      console.log('SMS notification sent successfully');
    }
  } catch (error) {
    console.error('SMS notification error:', error);
  }
}

// GHL API helper
async function createOrUpdateGHLContact(data) {
  const { firstName, lastName, email, studyId, studyTitle, servicePage, category, tags } = data;

  const ghlLocationId = process.env.GHL_LOCATION_ID;
  const ghlApiKey = process.env.GHL_API_KEY;

  if (!ghlApiKey) {
    console.warn('GHL_API_KEY not configured, skipping GHL sync');
    return null;
  }

  try {
    // Search for existing contact
    const searchResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${ghlLocationId}&query=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': '2021-07-28'
        }
      }
    );

    const searchData = await searchResponse.json();
    const existingContact = searchData.contacts?.find(c => c.email === email);

    // Build tags array
    const contactTags = [
      'research_download',
      `research_interest_${category.toLowerCase().replace(/\s+/g, '_')}`,
      `service_interest_${servicePage.replace(/-/g, '_')}`,
      ...tags.map(t => `topic_${t}`)
    ];

    const contactData = {
      firstName,
      lastName,
      email,
      locationId: ghlLocationId,
      tags: contactTags,
      source: 'Research Download'
    };

    // Format service name for note
    const serviceNames = {
      'red-light-therapy': 'Red Light Therapy',
      'hyperbaric-oxygen-therapy': 'Hyperbaric Oxygen Therapy',
      'peptide-therapy': 'Peptide Therapy',
      'iv-therapy': 'IV Therapy',
      'hormone-optimization': 'Hormone Optimization',
      'weight-loss': 'Weight Loss'
    };
    const serviceName = serviceNames[servicePage] || servicePage;

    // Build note content
    const noteBody = `📚 Research Download

Study: ${studyTitle}
Category: ${category}
Service Page: ${serviceName}
Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}

This contact downloaded research about ${category.toLowerCase()} related to ${serviceName.toLowerCase()}. Research summary was emailed automatically.`;

    let contactId;

    if (existingContact) {
      // Update existing contact - merge tags
      const existingTags = existingContact.tags || [];
      const mergedTags = [...new Set([...existingTags, ...contactTags])];

      await fetch(
        `https://services.leadconnectorhq.com/contacts/${existingContact.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...contactData,
            tags: mergedTags
          })
        }
      );

      contactId = existingContact.id;
    } else {
      // Create new contact
      const createResponse = await fetch(
        'https://services.leadconnectorhq.com/contacts/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactData)
        }
      );

      const createData = await createResponse.json();
      contactId = createData.contact?.id;
    }

    // Add note to contact
    if (contactId) {
      await addGHLNote(contactId, noteBody, ghlApiKey);
    }

    return contactId;
  } catch (error) {
    console.error('GHL sync error:', error);
    return null;
  }
}

// Generate email HTML
function generateEmailHtml(study, firstName) {
  const serviceNames = {
    'red-light-therapy': 'Red Light Therapy',
    'hyperbaric-oxygen-therapy': 'Hyperbaric Oxygen Therapy',
    'peptide-therapy': 'Peptide Therapy',
    'iv-therapy': 'IV Therapy',
    'hormone-optimization': 'Hormone Optimization',
    'weight-loss': 'Weight Loss'
  };

  const serviceName = serviceNames[study.service] || study.service;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${study.headline}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 32px 40px; text-align: center;">
              <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" alt="Range Medical" width="180" style="display: block; margin: 0 auto;">
            </td>
          </tr>

          <!-- Category Badge -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <span style="display: inline-block; background-color: #171717; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 6px 12px; border-radius: 4px;">${study.category}</span>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 16px 40px 8px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #171717; line-height: 1.3;">${study.headline}</h1>
            </td>
          </tr>

          <!-- Source -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; font-size: 14px; color: #737373;">${study.sourceJournal}, ${study.sourceYear}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;">
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 40px 16px;">
              <p style="margin: 0; font-size: 16px; color: #525252; line-height: 1.7;">Hi ${firstName},</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; font-size: 16px; color: #525252; line-height: 1.7;">Thanks for your interest in the research behind ${serviceName.toLowerCase()}. Here's a detailed breakdown of the study you requested.</p>
            </td>
          </tr>

          <!-- Study Summary Section -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #171717; text-transform: uppercase; letter-spacing: 0.05em;">What the Study Found</h2>
                    <p style="margin: 0; font-size: 15px; color: #525252; line-height: 1.7;">${study.fullSummary.replace(/\n\n/g, '</p><p style="margin: 16px 0 0; font-size: 15px; color: #525252; line-height: 1.7;">')}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Key Findings -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #171717; text-transform: uppercase; letter-spacing: 0.05em;">Key Findings</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${study.keyFindings.map(finding => `
                <tr>
                  <td style="padding: 8px 0; font-size: 15px; color: #525252; line-height: 1.6;">
                    <span style="color: #22c55e; font-weight: bold; margin-right: 8px;">✓</span>${finding}
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- What This Means -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 8px 8px 0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <h2 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #171717; text-transform: uppercase; letter-spacing: 0.05em;">What This Means for You</h2>
                    <p style="margin: 0; font-size: 15px; color: #525252; line-height: 1.7;">${study.whatThisMeans}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #525252;">Want to learn more about how ${serviceName.toLowerCase()} could help you?</p>
              <a href="https://range-medical.com/range-assessment" style="display: inline-block; background-color: #171717; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">Take Assessment</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #525252;">Range Medical</p>
              <p style="margin: 0 0 8px; font-size: 13px; color: #737373;">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
              <p style="margin: 0; font-size: 13px; color: #737373;">(949) 997-3988 · <a href="https://range-medical.com" style="color: #737373;">range-medical.com</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, studyId, studyTitle, servicePage, category, tags } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !studyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get full study data
    const study = getStudyById(studyId);
    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    // 1. Save to Supabase (if configured)
    let lead = null;
    if (supabase) {
      const { data, error: dbError } = await supabase
        .from('research_leads')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          study_id: studyId,
          study_title: studyTitle || study.headline,
          service_page: servicePage,
          category,
          tags
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Continue anyway - don't block user experience for DB issues
      } else {
        lead = data;
      }
    } else {
      console.warn('Supabase not configured, skipping database save');
    }

    // 2. Sync to GHL
    const ghlContactId = await createOrUpdateGHLContact({
      firstName,
      lastName,
      email,
      studyId,
      studyTitle: studyTitle || study.headline,
      servicePage,
      category,
      tags
    });

    // Update lead with GHL contact ID if we got one
    if (supabase && ghlContactId && lead?.id) {
      await supabase
        .from('research_leads')
        .update({ ghl_contact_id: ghlContactId })
        .eq('id', lead.id);
    }

    // 3. Send email via Resend
    const emailHtml = generateEmailHtml(study, firstName);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Range Medical Research <research@range-medical.com>',
      to: email,
      subject: `Research Summary: ${study.headline}`,
      html: emailHtml
    });

    if (emailError) {
      console.error('Email error:', emailError);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Update lead with email sent status
    if (supabase && lead?.id) {
      await supabase
        .from('research_leads')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', lead.id);
    }

    // Send SMS notification
    await sendSMSNotification({
      firstName,
      lastName,
      email,
      studyTitle: studyTitle || study.headline,
      servicePage
    });

    return res.status(200).json({
      success: true,
      message: 'Research summary sent to your email'
    });

  } catch (error) {
    console.error('Research submit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
