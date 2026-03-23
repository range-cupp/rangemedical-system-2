// /pages/api/admin/send-forms-email.js
// Send consent/form links to patients via email (Resend) — creates a form bundle
// Range Medical

import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';
import { createFormBundle, FORM_DEFINITIONS } from '../../../lib/form-bundles';

function generateFormsEmailHtml({ firstName, forms, bundleUrl }) {
  const formListHtml = forms.map(f => `
    <tr>
      <td style="padding: 6px 0; color: #404040; font-size: 14px;">
        &bull; ${f.name} <span style="color: #999;">(${f.time})</span>
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

                            <!-- Single CTA button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
                                <tr>
                                    <td style="padding: 0;">
                                        <a href="${bundleUrl}" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 700; letter-spacing: 0.05em;">
                                            Complete Your Forms
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Form list for context -->
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px; width: 100%;">
                                ${formListHtml}
                            </table>

                            <p style="margin: 0 0 8px; color: #666; font-size: 13px; line-height: 1.6;">Your information carries forward between forms so you only need to enter it once.</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 30px; border-top: 1px solid #e5e5e5; background-color: #fafafa;">
                            <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Range Medical</p>
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

  const { email, firstName, formIds, patientId, patientName, ghlContactId, patientPhone, metadata } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  if (!formIds || formIds.length === 0) {
    return res.status(400).json({ error: 'At least one form must be selected' });
  }

  // Validate and sort form IDs — intake first, hipaa second, then rest
  const PRIORITY_ORDER = ['intake', 'hipaa'];
  const validFormIds = formIds
    .filter(id => FORM_DEFINITIONS[id])
    .sort((a, b) => {
      const aIdx = PRIORITY_ORDER.indexOf(a);
      const bIdx = PRIORITY_ORDER.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

  if (validFormIds.length === 0) {
    return res.status(400).json({ error: 'No valid forms selected' });
  }

  const validForms = validFormIds.map(id => ({ ...FORM_DEFINITIONS[id], id }));
  const name = firstName || 'there';

  try {
    // Create form bundle
    const bundle = await createFormBundle({
      formIds: validFormIds,
      patientId: patientId || null,
      patientName: patientName || firstName || null,
      patientEmail: email,
      patientPhone: patientPhone || null,
      ghlContactId: ghlContactId || null,
      metadata: metadata || undefined,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = generateFormsEmailHtml({
      firstName: name,
      forms: validForms,
      bundleUrl: bundle.url,
    });

    const formNames = validForms.map(f => f.name).join(', ');
    const subject = validForms.length === 1
      ? `Please complete your ${validForms[0].name} — Range Medical`
      : `Forms to complete before your visit — Range Medical`;

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
      messageType: 'form_links',
      message: `Forms sent via email: ${formNames} (bundle: ${bundle.token})`,
      source: 'send-forms-email',
      patientId: patientId || null,
      patientName: patientName || firstName || null,
      ghlContactId: ghlContactId || null,
      recipient: email,
      direction: 'outbound',
      subject,
    });

    console.log(`Forms email sent to ${email}: ${formNames} (bundle: ${bundle.token})`);

    return res.status(200).json({
      success: true,
      formsSent: validForms.length,
      bundleToken: bundle.token,
      bundleUrl: bundle.url,
      message: `Sent ${validForms.length} form${validForms.length > 1 ? 's' : ''} via email`,
    });

  } catch (error) {
    console.error('Send forms email error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
