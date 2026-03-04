// /pages/api/admin/send-forms-email.js
// Send consent/form links to patients via email (Resend)
// Range Medical

import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';

const FORM_DEFINITIONS = {
  'intake': { name: 'Medical Intake', path: '/intake' },
  'hipaa': { name: 'HIPAA Privacy Notice', path: '/consent/hipaa' },
  'blood-draw': { name: 'Blood Draw Consent', path: '/consent/blood-draw' },
  'hrt': { name: 'HRT Consent', path: '/consent/hrt' },
  'peptide': { name: 'Peptide Therapy Consent', path: '/consent/peptide' },
  'iv': { name: 'IV/Injection Consent', path: '/consent/iv' },
  'hbot': { name: 'HBOT Consent', path: '/consent/hbot' },
  'weight-loss': { name: 'Weight Loss Consent', path: '/consent/weight-loss' },
  'red-light': { name: 'Red Light Therapy Consent', path: '/consent/red-light' },
  'prp': { name: 'PRP Consent', path: '/consent/prp' },
  'exosome-iv': { name: 'Exosome IV Consent', path: '/consent/exosome-iv' },
};

function generateFormsEmailHtml({ firstName, forms, baseUrl }) {
  const formLinksHtml = forms.map(f => `
    <tr>
      <td style="padding: 8px 0;">
        <a href="${baseUrl}${f.path}" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          ${f.name}
        </a>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forms from Range Medical</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Forms to Complete</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Please complete the following form${forms.length > 1 ? 's' : ''} before your visit to Range Medical:</p>

                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                                ${formLinksHtml}
                            </table>

                            <p style="margin: 0 0 8px; color: #666; font-size: 13px; line-height: 1.6;">Completing these forms ahead of time helps us provide you with the best care possible.</p>
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

  const { email, firstName, formIds, patientId, patientName, ghlContactId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  if (!formIds || formIds.length === 0) {
    return res.status(400).json({ error: 'At least one form must be selected' });
  }

  // Validate form IDs
  const validForms = formIds
    .filter(id => FORM_DEFINITIONS[id])
    .map(id => FORM_DEFINITIONS[id]);

  if (validForms.length === 0) {
    return res.status(400).json({ error: 'No valid forms selected' });
  }

  const baseUrl = 'https://app.range-medical.com';
  const name = firstName || 'there';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = generateFormsEmailHtml({
      firstName: name,
      forms: validForms,
      baseUrl,
    });

    const formNames = validForms.map(f => f.name).join(', ');
    const subject = validForms.length === 1
      ? `Please complete your ${validForms[0].name} — Range Medical`
      : `Forms to complete before your visit — Range Medical`;

    const { data, error } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: email,
      bcc: 'info@range-medical.com',
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
      messageType: 'form_links',
      message: `Forms sent via email: ${formNames}`,
      source: 'send-forms-email',
      patientId: patientId || null,
      patientName: patientName || firstName || null,
      ghlContactId: ghlContactId || null,
      recipient: email,
      direction: 'outbound',
      subject,
    });

    console.log(`Forms email sent to ${email}: ${formNames}`);

    return res.status(200).json({
      success: true,
      formsSent: validForms.length,
      message: `Sent ${validForms.length} form${validForms.length > 1 ? 's' : ''} via email`,
    });

  } catch (error) {
    console.error('Send forms email error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
