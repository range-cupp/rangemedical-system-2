// lib/plan-summary.js
// Generates AI-structured plan summaries from provider consultation notes
// and emails them to Chris for immediate visibility on treatment plans.

import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const CHRIS_EMAIL = 'cupp@range-medical.com';

const PROVIDER_EMAILS = [
  'burgess@range-medical.com',
  'brendyn@range-medical.com',
  'reed@range-medical.com',
];

const CONSULT_SERVICE_PATTERN = /lab.?review|consult|follow.?up|initial.?visit/i;

export function isProviderConsultNote(createdBy, encounterService) {
  if (!createdBy) return false;
  const lower = createdBy.toLowerCase();
  const isProvider = PROVIDER_EMAILS.some(e => lower.includes(e)) ||
    lower.includes('burgess') || lower.includes('brendyn') || lower.includes('reed');
  if (!isProvider) return false;

  if (!encounterService) return false;
  return CONSULT_SERVICE_PATTERN.test(encounterService);
}

export async function generatePlanSummary(noteBody) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: `You are a clinical plan summarizer for Range Medical, a regenerative medicine clinic. Extract a structured summary from a provider's SOAP/consultation note. Return valid JSON only — no markdown fences, no commentary.

The JSON must have this exact shape:
{
  "visit_type": "string — e.g. Initial Lab Consultation, HRT Follow-Up, Weight Loss Consult",
  "assessment": "string — 2-3 sentence summary of the provider's assessment/findings",
  "treatment_plan": [
    { "item": "name of medication/supplement/therapy", "type": "prescription|supplement|therapy|lab|referral", "details": "dosage, frequency, or instructions" }
  ],
  "action_items": ["actionable string for clinic staff — things the patient needs to leave with or have ordered"],
  "follow_up": "string — when and what for the next visit/labs"
}

Rules:
- Capture EVERY medication, supplement, vitamin, and therapy mentioned in the plan
- For supplements like Vitamin D, K2, magnesium, fish oil — these are critical action items the staff needs to fulfill
- Keep assessment concise but clinically accurate
- action_items should be phrased as tasks for the front-desk/operations team (e.g. "Provide Vitamin D3 5000 IU", "Start HRT protocol", "Schedule 8-week follow-up labs")
- If no follow-up is mentioned, use "Not specified in note"`,
    messages: [
      { role: 'user', content: `Extract the structured plan summary from this clinical note:\n\n${noteBody}` },
    ],
  });

  const text = message.content[0].text.trim();
  return JSON.parse(text);
}

function buildSummaryEmailHtml(patientName, providerName, noteDate, summary) {
  const dateStr = new Date(noteDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });

  const planRows = (summary.treatment_plan || []).map(p => {
    const typeColors = {
      prescription: '#2563eb',
      supplement: '#059669',
      therapy: '#7c3aed',
      lab: '#d97706',
      referral: '#dc2626',
    };
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

    <div style="margin-bottom:20px;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
      <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Action Items</div>
      <ul style="margin:0;padding-left:20px;color:#1f2937;">${actionItems || '<li style="color:#9ca3af;">No action items</li>'}</ul>
    </div>

    <div style="padding:12px 16px;background:#f9fafb;border-radius:6px;">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Follow-Up</div>
      <p style="margin:0;font-size:14px;color:#1f2937;">${summary.follow_up || 'Not specified in note'}</p>
    </div>
  </div>

  <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Range Medical &middot; Auto-generated plan summary</p>
  </div>
</div>
</body></html>`;
}

export async function generateAndEmailPlanSummary(noteId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: note, error: noteErr } = await supabase
    .from('patient_notes')
    .select('id, patient_id, body, created_by, encounter_service, note_date')
    .eq('id', noteId)
    .single();

  if (noteErr || !note || !note.body) {
    console.error('[plan-summary] Note not found or empty:', noteErr?.message);
    return null;
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('first_name, last_name, name')
    .eq('id', note.patient_id)
    .single();

  const patientName = patient
    ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.name || 'Unknown'
    : 'Unknown';

  const providerName = (note.created_by || '').includes('burgess')
    ? 'Dr. Damian Burgess'
    : (note.created_by || '').includes('brendyn') || (note.created_by || '').includes('reed')
      ? 'Brendyn Reed, PA-C'
      : note.created_by || 'Provider';

  const summary = await generatePlanSummary(note.body);
  if (!summary) return null;

  await supabase
    .from('patient_notes')
    .update({ plan_summary: summary })
    .eq('id', noteId);

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailErr } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: CHRIS_EMAIL,
      subject: `Plan Summary: ${patientName} — ${summary.visit_type || 'Consultation'}`,
      html: buildSummaryEmailHtml(patientName, providerName, note.note_date, summary),
    });

    if (emailErr) {
      console.error('[plan-summary] Email error:', emailErr);
    } else {
      console.log(`[plan-summary] Emailed plan summary for ${patientName} to ${CHRIS_EMAIL}`);
    }
  }

  return summary;
}
