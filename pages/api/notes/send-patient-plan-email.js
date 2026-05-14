// POST /api/notes/send-patient-plan-email
// Sends a patient-facing plan summary email from the chosen provider.
// Body: { note_id, sender, personal_message, assessment, treatment_plan, follow_up }

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildPatientPlanEmailHtml } from '../../../lib/plan-summary';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SENDER_MAP = {
  burgess: { name: 'Damien Burgess, FNP', fromName: 'Damien Burgess — Range Medical' },
  reed:    { name: 'Brendyn Reed, FNP',    fromName: 'Brendyn Reed — Range Medical' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { note_id, sender, personal_message, assessment, treatment_plan, follow_up } = req.body;

  if (!note_id) return res.status(400).json({ error: 'note_id is required' });
  if (!sender || !SENDER_MAP[sender]) return res.status(400).json({ error: 'sender must be "burgess" or "reed"' });

  try {
    const { data: note, error: noteErr } = await supabase
      .from('patient_notes')
      .select('id, patient_id, note_date, plan_summary')
      .eq('id', note_id)
      .single();

    if (noteErr || !note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (!note.plan_summary) {
      return res.status(400).json({ error: 'Note has no plan summary' });
    }

    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .select('id, first_name, last_name, name, email')
      .eq('id', note.patient_id)
      .single();

    if (patientErr || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.email) {
      return res.status(400).json({ error: 'Patient has no email on file' });
    }

    const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.name || 'Unknown';
    const senderInfo = SENDER_MAP[sender];
    const summary = note.plan_summary;

    const html = buildPatientPlanEmailHtml({
      patientFirstName: patient.first_name || null,
      providerName: senderInfo.name,
      noteDate: note.note_date,
      visitType: summary.visit_type,
      assessment: assessment || summary.assessment,
      treatmentPlan: treatment_plan || summary.treatment_plan,
      followUp: follow_up || summary.follow_up,
      personalMessage: personal_message || null,
    });

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Your Visit Summary — ${summary.visit_type || 'Consultation'}`;

    const { error: emailErr } = await resend.emails.send({
      from: `${senderInfo.fromName} <hello@range-medical.com>`,
      to: patient.email,
      replyTo: 'info@range-medical.com',
      subject,
      html,
    });

    if (emailErr) {
      console.error('[send-patient-plan-email] Email error:', emailErr);
      return res.status(500).json({ error: 'Failed to send email', details: emailErr.message });
    }

    // Track sent timestamp in plan_summary JSONB
    await supabase
      .from('patient_notes')
      .update({
        plan_summary: {
          ...summary,
          patient_email_sent_at: new Date().toISOString(),
          patient_email_sent_by: senderInfo.name,
        },
      })
      .eq('id', note_id);

    await logComm({
      channel: 'email',
      messageType: 'plan_summary_patient',
      message: `Visit summary email sent to ${patientName}`,
      source: 'notes/send-patient-plan-email',
      patientId: patient.id,
      patientName,
      recipient: patient.email,
      subject,
      htmlBody: html,
      sentByEmployeeName: senderInfo.name,
    });

    console.log(`[send-patient-plan-email] Sent to ${patientName} (${patient.email}) from ${senderInfo.name}`);

    return res.status(200).json({
      success: true,
      sent_to: patient.email,
      sent_by: senderInfo.name,
    });
  } catch (err) {
    console.error('[send-patient-plan-email] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
