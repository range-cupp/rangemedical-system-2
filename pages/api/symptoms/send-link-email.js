// /pages/api/symptoms/send-link-email.js
// Send symptoms questionnaire link via email (Resend)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

function generateQuestionnaireEmailHtml({ firstName, questionnaireUrl }) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Symptoms Questionnaire — Range Medical</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Symptoms Questionnaire</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Please take a moment to complete your symptoms questionnaire. It helps us track your progress and tailor your treatment plan.</p>

                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <a href="${questionnaireUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500;">
                                            Complete Questionnaire
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 8px; color: #666; font-size: 13px; line-height: 1.6;">The questionnaire takes about 5 minutes and covers energy, sleep, mood, weight management, recovery, and hormonal health.</p>
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

  const { patientId, email, name } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: 'Patient ID is required' });
  }

  try {
    // Fetch patient from database
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, name, email, ghl_contact_id')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientEmail = email || patient.email;
    if (!patientEmail) {
      return res.status(400).json({ error: 'Patient has no email address' });
    }

    const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : name?.split(' ')[0] || 'there');
    const displayName = name || patient.name || `${patient.first_name || ''}`.trim();
    const questionnaireUrl = `${BASE_URL}/symptom-questionnaire?patient=${patientId}&name=${encodeURIComponent(displayName)}`;

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = generateQuestionnaireEmailHtml({
      firstName,
      questionnaireUrl,
    });

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: patientEmail,
      subject: 'Please complete your Symptoms Questionnaire — Range Medical',
      html,
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
      return res.status(500).json({ error: 'Failed to send email', details: emailError.message });
    }

    // Log to comms_log
    await logComm({
      channel: 'email',
      messageType: 'symptoms_questionnaire_link',
      message: html,
      source: 'send-forms',
      patientId: patient.id,
      ghlContactId: patient.ghl_contact_id || null,
      patientName: displayName,
      recipient: patientEmail,
      subject: 'Please complete your Symptoms Questionnaire — Range Medical',
      direction: 'outbound',
    });

    console.log(`Symptoms questionnaire email sent to ${patientEmail} for ${displayName}`);

    return res.status(200).json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('Error sending symptoms questionnaire email:', error);
    return res.status(500).json({ error: error.message });
  }
}
