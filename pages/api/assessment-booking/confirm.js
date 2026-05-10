import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, patientInfo } = req.body;

    const patientName = `${patientInfo.firstName} ${patientInfo.lastName}`;
    const patientEmail = patientInfo.email;
    const patientPhone = patientInfo.phone;

    let patientId = null;
    if (patientEmail) {
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('email', patientEmail)
        .single();

      if (existingPatient) {
        patientId = existingPatient.id;
      }
    }

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com'}/api/stripe/record-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        amount: 19700,
        description: 'Range Assessment',
        payment_method: 'stripe',
        service_category: 'assessment',
        service_name: 'Range Assessment',
        quantity: 1,
        stripe_payment_intent_id: paymentIntentId,
      }),
    }).catch(err => console.error('Record purchase error (non-fatal):', err));

    const staffHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#000;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:0.1em;">RANGE MEDICAL</h1>
          <p style="margin:8px 0 0;color:#a3a3a3;font-size:13px;">New Assessment Booking</p>
        </div>
        <div style="padding:30px;background:#fff;">
          <div style="border-left:4px solid #000;padding-left:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Patient</p>
            <p style="margin:0;color:#171717;font-size:16px;font-weight:700;">${patientName}</p>
            <p style="margin:4px 0 0;color:#525252;font-size:14px;">${patientEmail}${patientPhone ? ` · ${patientPhone}` : ''}</p>
            ${patientInfo.dob ? `<p style="margin:4px 0 0;color:#525252;font-size:14px;">DOB: ${patientInfo.dob}</p>` : ''}
          </div>
          <div style="border-left:4px solid #16a34a;padding-left:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Payment</p>
            <p style="margin:0;color:#171717;font-size:16px;font-weight:700;">$197.00 paid</p>
          </div>
          <div style="background:#f5f5f5;padding:12px 16px;margin-top:16px;">
            <p style="margin:0;color:#525252;font-size:13px;">
              Patient booked a Range Assessment via the Clarity Finder quiz. Send consent forms manually from the patient profile.
            </p>
          </div>
        </div>
        <div style="background:#fafafa;padding:20px;text-align:center;border-top:2px solid #e5e5e5;">
          <p style="margin:0;color:#737373;font-size:12px;">Range Medical · Newport Beach, CA · (949) 997-3988</p>
        </div>
      </div>
    `;

    resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      replyTo: 'info@range-medical.com',
      to: ['intake@range-medical.com'],
      subject: `New Assessment Booking: ${patientName}`,
      html: staffHtml,
    }).catch(err => console.error('Staff email error (non-fatal):', err));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Assessment booking confirm error:', error);
    return res.status(500).json({ error: 'Failed to confirm booking', details: error.message });
  }
}
