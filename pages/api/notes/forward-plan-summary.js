// POST /api/notes/forward-plan-summary
// Forwards the internal plan summary email to a staff member.
// Body: { note_id, recipient_email }

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function buildSummaryEmailHtml(patientName, providerName, noteDate, summary) {
  const dateStr = new Date(noteDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });

  const typeColors = { prescription: '#2563eb', supplement: '#059669', therapy: '#7c3aed', lab: '#d97706', referral: '#dc2626' };
  const planRows = (summary.treatment_plan || []).map(p => {
    const color = typeColors[p.type] || '#6b7280';
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${p.item}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#fff;background:${color};text-transform:uppercase;">${p.type}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${p.details || '—'}</td>
    </tr>`;
  }).join('');

  const actionItems = (summary.action_items || []).map(a =>
    `<li style="margin-bottom:6px;font-size:14px;line-height:1.5;">${a}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:640px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <div style="background:#111827;padding:20px 24px;">
    <h1 style="margin:0;font-size:18px;color:#fff;">Plan Summary</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">${patientName} &middot; ${dateStr}</p>
  </div>
  <div style="padding:24px;">
    <div style="margin-bottom:20px;padding:16px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px;">
      <div style="font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Provider</div>
      <div style="font-size:15px;color:#111827;font-weight:600;">${providerName}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px;">Visit type: ${summary.visit_type || 'Consultation'}</div>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Assessment</div>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#1f2937;">${summary.assessment || 'No assessment provided.'}</p>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Treatment Plan</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Item</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Type</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Details</th>
          </tr>
        </thead>
        <tbody>${planRows || '<tr><td colspan="3" style="padding:12px;text-align:center;color:#9ca3af;">No items listed</td></tr>'}</tbody>
      </table>
    </div>
    ${actionItems ? `<div style="margin-bottom:20px;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
      <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Action Items</div>
      <ul style="margin:0;padding-left:20px;color:#1f2937;">${actionItems}</ul>
    </div>` : ''}
    <div style="padding:12px 16px;background:#f9fafb;border-radius:6px;">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Follow-Up</div>
      <p style="margin:0;font-size:14px;color:#1f2937;">${summary.follow_up || 'Not specified in note'}</p>
    </div>
  </div>
  <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Range Medical &middot; Forwarded plan summary</p>
  </div>
</div>
</body></html>`;
}

const PROVIDER_MAP = {
  burgess: 'Dr. Damien Burgess',
  brendyn: 'Brendyn Reed, PA-C',
  reed: 'Brendyn Reed, PA-C',
};

function resolveProvider(createdBy) {
  if (!createdBy) return 'Provider';
  const lower = createdBy.toLowerCase();
  if (lower.includes('burgess')) return 'Dr. Damien Burgess';
  if (lower.includes('brendyn') || lower.includes('reed')) return 'Brendyn Reed, PA-C';
  return createdBy;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { note_id, recipient_email } = req.body;

  if (!note_id) return res.status(400).json({ error: 'note_id is required' });
  if (!recipient_email) return res.status(400).json({ error: 'recipient_email is required' });

  try {
    const { data: note, error: noteErr } = await supabase
      .from('patient_notes')
      .select('id, patient_id, note_date, created_by, plan_summary')
      .eq('id', note_id)
      .single();

    if (noteErr || !note || !note.plan_summary) {
      return res.status(404).json({ error: 'Note or plan summary not found' });
    }

    const { data: patient } = await supabase
      .from('patients')
      .select('first_name, last_name, name')
      .eq('id', note.patient_id)
      .single();

    const patientName = patient
      ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.name || 'Unknown'
      : 'Unknown';

    const providerName = resolveProvider(note.created_by);
    const summary = note.plan_summary;

    const html = buildSummaryEmailHtml(patientName, providerName, note.note_date, summary);

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: emailErr } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: recipient_email,
      subject: `Plan Summary: ${patientName} — ${summary.visit_type || 'Consultation'}`,
      html,
    });

    if (emailErr) {
      console.error('[forward-plan-summary] Email error:', emailErr);
      return res.status(500).json({ error: 'Failed to send email', details: emailErr.message });
    }

    console.log(`[forward-plan-summary] Forwarded plan summary for ${patientName} to ${recipient_email}`);

    return res.status(200).json({ success: true, sent_to: recipient_email });
  } catch (err) {
    console.error('[forward-plan-summary] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
