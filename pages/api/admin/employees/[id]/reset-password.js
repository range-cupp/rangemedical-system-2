// /pages/api/admin/employees/[id]/reset-password.js
// Send a branded password reset email to an employee via Resend
// Range Medical System

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { requirePermission, logAction } from '../../../../../lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateResetEmailHtml({ employeeName, resetUrl }) {
  const firstName = (employeeName || 'there').split(' ')[0];

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset — Range Medical</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Password Reset</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">Hi ${firstName},</p>

                            <p style="margin: 0 0 24px; color: #404040; font-size: 15px; line-height: 1.7;">A password reset has been requested for your Range Medical account. Click the button below to set a new password:</p>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 30px;">
                                <tr>
                                    <td style="padding: 0;">
                                        <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 700; letter-spacing: 0.05em;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Account Details -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 6px 0; color: #888; font-size: 13px; width: 80px;">Account</td>
                                                <td style="padding: 6px 0; color: #111; font-size: 14px; font-weight: 600;">${employeeName}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 8px; color: #666; font-size: 13px; line-height: 1.6;">This link will expire in 24 hours. If you did not request this reset, please contact your administrator.</p>
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

  const employee = await requirePermission(req, res, 'can_manage_employees');
  if (!employee) return;

  const { id } = req.query;

  try {
    // Look up the target employee
    const { data: targetEmp, error: empError } = await supabase
      .from('employees')
      .select('id, name, email, is_active')
      .eq('id', id)
      .single();

    if (empError || !targetEmp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (!targetEmp.email) {
      return res.status(400).json({ error: 'Employee has no email address' });
    }

    if (!targetEmp.is_active) {
      return res.status(400).json({ error: 'Cannot reset password for deactivated employee' });
    }

    // Generate a recovery link via Supabase Auth
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: targetEmp.email,
    });

    if (linkError) {
      console.error('Generate recovery link error:', linkError);
      return res.status(500).json({ error: 'Failed to generate reset link' });
    }

    // Build custom reset URL pointing to our reset-password page
    // The generated link contains hashed_token and other params
    const token = linkData?.properties?.hashed_token;
    if (!token) {
      console.error('No hashed_token in generateLink response:', linkData);
      return res.status(500).json({ error: 'Failed to generate reset token' });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.range-medical.com';
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}&type=recovery`;

    // Send branded email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = generateResetEmailHtml({
      employeeName: targetEmp.name,
      resetUrl,
    });

    const { error: emailError } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: targetEmp.email,
      subject: 'Reset your password — Range Medical',
      html,
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    // Log the action
    await logAction({
      employeeId: employee.id,
      employeeName: employee.name,
      action: 'send_password_reset',
      resourceType: 'employee',
      resourceId: id,
      details: { targetEmail: targetEmp.email, targetName: targetEmp.name },
      req,
    });

    console.log(`Password reset email sent to ${targetEmp.email} by ${employee.name}`);

    return res.status(200).json({
      success: true,
      message: `Password reset email sent to ${targetEmp.email}`,
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send reset email' });
  }
}
