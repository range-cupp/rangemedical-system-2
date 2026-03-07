// pages/api/send-hipaa-copy.js
// Sends patient a copy of their signed HIPAA Privacy Notice via email
// Range Medical

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return res.status(200).json({ success: true, message: 'Email skipped (no API key)' });
  }

  try {
    const { email, firstName, lastName, pdfUrl } = req.body;

    if (!email) {
      return res.status(200).json({ success: true, message: 'No email provided' });
    }

    const emailPayload = {
      from: 'Range Medical <noreply@range-medical.com>',
      to: email,
      subject: 'Your HIPAA Privacy Notice — Range Medical',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#000;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:3px;">RANGE MEDICAL</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 28px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#111;">HIPAA Privacy Notice Acknowledged</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
            Hi${firstName ? ` ${firstName}` : ''},
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
            Thank you for acknowledging our Notice of Privacy Practices. A signed copy is attached to this email for your records.
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
            This notice describes how your medical information may be used and disclosed, and how you can access this information. We take your privacy seriously and are committed to protecting your health information.
          </p>
          <p style="margin:0 0 8px;font-size:15px;color:#444;line-height:1.6;">
            If you have any questions about our privacy practices, please contact us:
          </p>
          <p style="margin:0 0 4px;font-size:15px;color:#111;font-weight:600;">Range Medical</p>
          <p style="margin:0 0 4px;font-size:14px;color:#666;">(949) 997-3988</p>
          <p style="margin:0 0 4px;font-size:14px;color:#666;">info@range-medical.com</p>
          <p style="margin:0;font-size:14px;color:#666;">27201 Puerta Real, Suite 300, Mission Viejo, CA 92691</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">
            This is an automated message from Range Medical. Please do not reply to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    };

    // Fetch and attach the signed HIPAA PDF
    if (pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl);
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
          emailPayload.attachments = [
            {
              filename: `HIPAA-Privacy-Notice-${lastName || 'Patient'}-${firstName || ''}.pdf`,
              content: pdfBase64
            }
          ];
        } else {
          console.log('Could not fetch HIPAA PDF for attachment:', pdfResponse.status);
        }
      } catch (pdfError) {
        console.log('Error fetching HIPAA PDF for attachment:', pdfError.message);
      }
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const emailResult = await emailResponse.json();

    if (emailResponse.ok) {
      console.log('HIPAA copy email sent:', emailResult.id);
    } else {
      console.error('HIPAA copy email failed:', emailResult);
    }

    // Always return success — email failure never blocks consent flow
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Send HIPAA copy error:', error);
    // Always return success
    return res.status(200).json({ success: true, message: 'Email error (non-blocking)' });
  }
}
