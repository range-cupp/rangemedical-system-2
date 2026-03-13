// /pages/api/admin/send-guides-email.js
// Send guide links to patients via email (Resend)
// Range Medical

import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';

const GUIDE_DEFINITIONS = {
  'hrt-guide': { name: 'HRT Guide', path: '/hrt-guide' },
  'tirzepatide-guide': { name: 'Tirzepatide Guide', path: '/tirzepatide-guide' },
  'retatrutide-guide': { name: 'Retatrutide Guide', path: '/retatrutide-guide' },
  'weight-loss-medication-guide-page': { name: 'WL Medication Guide', path: '/weight-loss-medication-guide-page' },
  'bpc-tb4-guide': { name: 'BPC/TB4 Guide', path: '/bpc-tb4-guide' },
  'recovery-blend-guide': { name: 'Recovery Blend Guide', path: '/recovery-blend-guide' },
  'glow-guide': { name: 'GLOW Guide', path: '/glow-guide' },
  'ghk-cu-guide': { name: 'GHK-Cu Guide', path: '/ghk-cu-guide' },
  '3x-blend-guide': { name: '3x Blend Guide', path: '/3x-blend-guide' },
  'nad-guide': { name: 'NAD+ Guide', path: '/nad-guide' },
  'methylene-blue-iv-guide': { name: 'Methylene Blue Guide', path: '/methylene-blue-iv-guide' },
  'methylene-blue-combo-iv-guide': { name: 'MB+VitC Combo Guide', path: '/methylene-blue-combo-iv-guide' },
  'glutathione-iv-guide': { name: 'Glutathione Guide', path: '/glutathione-iv-guide' },
  'vitamin-c-iv-guide': { name: 'Vitamin C Guide', path: '/vitamin-c-iv-guide' },
  'range-iv-guide': { name: 'Range IV Guide', path: '/range-iv-guide' },
  'cellular-reset-guide': { name: 'Cellular Reset Guide', path: '/cellular-reset-guide' },
  'hbot-guide': { name: 'HBOT Guide', path: '/hbot-guide' },
  'red-light-guide': { name: 'Red Light Guide', path: '/red-light-guide' },
  'combo-membership-guide': { name: 'Combo Membership', path: '/combo-membership-guide' },
  'hbot-membership-guide': { name: 'HBOT Membership', path: '/hbot-membership-guide' },
  'rlt-membership-guide': { name: 'RLT Membership', path: '/rlt-membership-guide' },
  'essential-panel-male-guide': { name: 'Essential Male Panel', path: '/essential-panel-male-guide' },
  'essential-panel-female-guide': { name: 'Essential Female Panel', path: '/essential-panel-female-guide' },
  'elite-panel-male-guide': { name: 'Elite Male Panel', path: '/elite-panel-male-guide' },
  'elite-panel-female-guide': { name: 'Elite Female Panel', path: '/elite-panel-female-guide' },
  'the-blu-guide': { name: 'The Blu', path: '/the-blu-guide' },
};

function generateGuidesEmailHtml({ firstName, guides, baseUrl }) {
  const guideLinksHtml = guides.map(g => `
    <tr>
      <td style="padding: 8px 0;">
        <a href="${baseUrl}${g.path}" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          ${g.name}
        </a>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Guides from Range Medical</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Your Treatment Guides</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Here ${guides.length > 1 ? 'are your treatment guides' : 'is your treatment guide'} from Range Medical:</p>

                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                                ${guideLinksHtml}
                            </table>

                            <p style="margin: 0 0 8px; color: #666; font-size: 13px; line-height: 1.6;">These guides contain important information about your treatment. Please review them before your visit.</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 30px; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Range Medical</p>
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Questions? Call us at (949) 997-3988</p>
                            <p style="margin: 0; color: #999; font-size: 12px;">www.range-medical.com</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, guideIds, patientId, patientName, ghlContactId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  if (!guideIds || guideIds.length === 0) {
    return res.status(400).json({ error: 'At least one guide must be selected' });
  }

  const validGuides = guideIds
    .filter(id => GUIDE_DEFINITIONS[id])
    .map(id => GUIDE_DEFINITIONS[id]);

  if (validGuides.length === 0) {
    return res.status(400).json({ error: 'No valid guides selected' });
  }

  const baseUrl = 'https://www.range-medical.com';
  const name = firstName || 'there';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = generateGuidesEmailHtml({
      firstName: name,
      guides: validGuides,
      baseUrl,
    });

    const guideNames = validGuides.map(g => g.name).join(', ');
    const subject = validGuides.length === 1
      ? `Your ${validGuides[0].name} — Range Medical`
      : `Your treatment guides — Range Medical`;

    const { data, error } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error.message });
    }

    // Log to comms_log
    await logComm({
      channel: 'email',
      messageType: 'guide_links',
      message: `Guides sent via email: ${guideNames}`,
      source: 'send-guides-email',
      patientId: patientId || null,
      patientName: patientName || firstName || null,
      ghlContactId: ghlContactId || null,
      recipient: email,
      direction: 'outbound',
      subject,
    });

    console.log(`Guides email sent to ${email}: ${guideNames}`);

    return res.status(200).json({
      success: true,
      guidesSent: validGuides.length,
      message: `Sent ${validGuides.length} guide${validGuides.length > 1 ? 's' : ''} via email`,
    });

  } catch (error) {
    console.error('Send guides email error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
