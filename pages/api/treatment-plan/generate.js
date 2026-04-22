// /api/treatment-plan/generate
// Generates a treatment plan PDF from pasted SUMMARY/RECOMMENDATIONS bullets.
// mode='preview' streams the PDF inline. mode='send' emails + archives it.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateTreatmentPlanPdf, parseBullets } from '../../../lib/treatment-plan-pdf';

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function buildEmailHtml({ firstName, dateStr }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
        <tr><td style="background:#000; padding:32px 40px; text-align:center;">
          <img src="https://storage.googleapis.com/msgsndr/WICdvbXmTjQORW6GiHWW/media/695fe7ca6eabe6386b2d84e1.png" alt="Range Medical" width="180" style="display:block; margin:0 auto;">
        </td></tr>
        <tr><td style="padding:32px 40px 8px;">
          <h1 style="margin:0; font-size:24px; font-weight:700; color:#171717; line-height:1.3;">Your Treatment Plan</h1>
          <p style="margin:8px 0 0; font-size:14px; color:#737373;">Issued ${dateStr}</p>
        </td></tr>
        <tr><td style="padding:16px 40px 0;">
          <p style="margin:0; font-size:16px; color:#525252; line-height:1.7;">Hi ${firstName || 'there'},</p>
        </td></tr>
        <tr><td style="padding:16px 40px 24px;">
          <p style="margin:0; font-size:16px; color:#525252; line-height:1.7;">
            Attached is your personalized treatment plan based on your recent visit with your Range Medical provider.
            Please review the recommendations and reach out if you have any questions.
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 32px; text-align:center;">
          <a href="tel:+19499973988" style="display:inline-block; background:#171717; color:#fff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px;">Call or Text Us: (949) 997-3988</a>
        </td></tr>
        <tr><td style="background:#fafafa; padding:24px 40px; text-align:center; border-top:1px solid #e5e5e5;">
          <p style="margin:0 0 4px; font-size:14px; color:#525252;">Range Medical</p>
          <p style="margin:0 0 4px; font-size:13px; color:#737373;">1901 Westcliff Dr. Suite 10, Newport Beach, CA 92660</p>
          <p style="margin:0; font-size:13px; color:#737373;">(949) 997-3988 &middot; <a href="https://range-medical.com" style="color:#737373;">range-medical.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patient_id, summary_text, bullets: bulletsIn,
      next_steps_text, next_steps: nextStepsIn,
      mode = 'preview', note_id, provider,
    } = req.body || {};

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    const bullets = Array.isArray(bulletsIn) && bulletsIn.length > 0
      ? bulletsIn
      : parseBullets(summary_text || '');

    const nextSteps = Array.isArray(nextStepsIn) && nextStepsIn.length > 0
      ? nextStepsIn
      : parseBullets(next_steps_text || '');

    // Fetch patient
    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email')
      .eq('id', patient_id)
      .single();

    if (patientErr || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const planDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    // Generate PDF
    const pdfBytes = await generateTreatmentPlanPdf({
      patientName,
      bullets,
      nextSteps,
      provider,
      planDate,
    });

    // -----------------------------
    // PREVIEW: stream inline
    // -----------------------------
    if (mode === 'preview') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="treatment-plan-preview.pdf"');
      res.setHeader('Cache-Control', 'no-store');
      return res.send(Buffer.from(pdfBytes));
    }

    // -----------------------------
    // SEND: upload, email, archive
    // -----------------------------
    if (mode === 'send') {
      if (!patient.email) {
        return res.status(400).json({ error: 'Patient has no email on file' });
      }
      if (!resend) {
        return res.status(500).json({ error: 'Email service not configured' });
      }

      const timestamp = Date.now();
      const dateStamp = planDate.replace(/-/g, '');
      const fileName = `treatment-plan-${dateStamp}.pdf`;
      const filePath = `${patient_id}/${timestamp}-${fileName}`;
      const buffer = Buffer.from(pdfBytes);

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, buffer, { contentType: 'application/pdf', upsert: false });

      if (uploadErr) {
        console.error('Treatment plan upload error:', uploadErr);
        return res.status(500).json({ error: 'Failed to save PDF', details: uploadErr.message });
      }

      // Signed URL for patient record
      const { data: urlData } = await supabase.storage
        .from('patient-documents')
        .createSignedUrl(filePath, 60 * 60 * 24 * 30); // 30 days

      // Archive in medical_documents
      await supabase.from('medical_documents').insert({
        patient_id,
        document_name: `Treatment Plan — ${new Date(planDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}`,
        document_url: urlData?.signedUrl || null,
        document_type: 'Treatment Plan',
        file_path: filePath,
        file_size: buffer.length,
        notes: note_id ? `Generated from encounter note ${note_id}` : null,
        uploaded_by: provider || 'Range Medical',
      });

      // Send email with PDF attachment
      const issueObj = new Date(planDate + 'T00:00:00');
      const dateStr = issueObj.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles',
      });

      const { error: emailErr } = await resend.emails.send({
        from: 'Range Medical <hello@range-medical.com>',
        to: patient.email,
        subject: `Your Treatment Plan — ${dateStr}`,
        html: buildEmailHtml({ firstName: patient.first_name, dateStr }),
        attachments: [{ filename: fileName, content: buffer.toString('base64') }],
      });

      if (emailErr) {
        console.error('Treatment plan email error:', emailErr);
        return res.status(500).json({ error: 'Failed to send email', details: emailErr.message });
      }

      return res.status(200).json({ success: true, document_url: urlData?.signedUrl || null });
    }

    return res.status(400).json({ error: 'Invalid mode' });
  } catch (err) {
    console.error('Treatment plan generate error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
