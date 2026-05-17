// /pages/api/ai/request-protocol-change.js
// Sends a protocol/medication change request to a provider for approval.
// Emails the provider, confirms to the requesting staff, and logs a chart note.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { STAFF } from '../../../lib/staff';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const PROVIDERS = STAFF.filter(s => s.role === 'Provider' && s.email);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    patient_id,
    patient_name,
    change_description,
    current_protocols,
    provider_id,
    requested_by_name,
    requested_by_email,
  } = req.body;

  if (!patient_id || !change_description || !provider_id) {
    return res.status(400).json({ error: 'patient_id, change_description, and provider_id are required' });
  }

  const provider = PROVIDERS.find(p => p.id === provider_id);
  if (!provider) {
    return res.status(400).json({ error: `Unknown provider: ${provider_id}. Valid: ${PROVIDERS.map(p => p.name).join(', ')}` });
  }

  const protocolSummary = (current_protocols || []).map(p =>
    `${p.medication || p.program_name} — ${p.dose || ''} ${p.frequency || ''}`.trim()
  ).join('\n    ');

  const providerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4f46e5; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Protocol Change Request</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 130px;">Patient</td>
            <td style="padding: 8px 0; font-weight: 600;">${patient_name || 'Unknown'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Requested By</td>
            <td style="padding: 8px 0;">${requested_by_name || 'Staff'}</td>
          </tr>
          ${protocolSummary ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Current Protocol</td>
            <td style="padding: 8px 0; white-space: pre-line;">${protocolSummary}</td>
          </tr>` : ''}
        </table>
        <div style="margin-top: 16px; padding: 14px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px;">
          <div style="font-weight: 600; font-size: 13px; color: #92400e; margin-bottom: 6px;">Requested Change</div>
          <div style="font-size: 14px; color: #78350f; white-space: pre-wrap;">${change_description}</div>
        </div>
        <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">
          Please review and update the protocol in the system if approved.
        </p>
      </div>
    </div>
  `;

  const requesterHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Change Request Submitted</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 14px; color: #374151; margin-top: 0;">
          Your protocol change request for <strong>${patient_name || 'the patient'}</strong> has been sent to <strong>${provider.name}</strong> for approval.
        </p>
        <div style="padding: 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin: 12px 0;">
          <div style="font-weight: 600; font-size: 13px; color: #6b7280; margin-bottom: 6px;">Requested Change</div>
          <div style="font-size: 14px; color: #374151; white-space: pre-wrap;">${change_description}</div>
        </div>
        <p style="font-size: 13px; color: #6b7280;">
          You'll see the update in the system once ${provider.name} reviews and approves the change.
        </p>
      </div>
    </div>
  `;

  try {
    const providerSubject = `Protocol Change Request: ${patient_name || 'Patient'}`;
    const { error: providerEmailErr } = await resend.emails.send({
      from: 'Range Medical <noreply@range-medical.com>',
      to: provider.email,
      subject: providerSubject,
      html: providerHtml,
    });
    if (providerEmailErr) {
      console.error('Provider email error:', providerEmailErr);
      return res.status(500).json({ error: 'Failed to send provider email' });
    }

    if (requested_by_email) {
      const { error: requesterEmailErr } = await resend.emails.send({
        from: 'Range Medical <noreply@range-medical.com>',
        to: requested_by_email,
        subject: `Change Request Submitted: ${patient_name || 'Patient'}`,
        html: requesterHtml,
      });
      if (requesterEmailErr) {
        console.error('Requester confirmation email error:', requesterEmailErr);
      }
    }

    if (patient_id) {
      await supabase.from('patient_notes').insert({
        patient_id,
        body: `Protocol change requested by ${requested_by_name || 'Staff'} → sent to ${provider.name} for approval.\n\nRequested change: ${change_description}`,
        raw_input: change_description,
        created_by: requested_by_name || 'AI Assistant',
        source: 'ai-assistant',
        note_category: 'clinical',
        note_date: new Date().toISOString(),
        status: 'draft',
      });
    }

    return res.status(200).json({
      success: true,
      provider_name: provider.name,
      provider_email: provider.email,
      requester_notified: !!requested_by_email,
    });
  } catch (err) {
    console.error('Protocol change request error:', err);
    return res.status(500).json({ error: 'Failed to send protocol change request' });
  }
}
