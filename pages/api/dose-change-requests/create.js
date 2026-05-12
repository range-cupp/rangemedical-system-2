// /pages/api/dose-change-requests/create.js
// Creates a dose change request and SMS-pings the chosen approving provider
// (Dr. Burgess or Brendyn Reed NP). The protocol is NOT updated until the
// provider taps Approve via the SMS link.
// Full audit trail: who requested, when SMS sent, link opened, approved, IP.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import {
  DOSE_APPROVAL_STAFF,
  STAFF_DISPLAY_NAMES,
  canApproveDoseChange,
} from '../../../lib/staff-config';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    patient_id,
    patient_name,
    protocol_id,
    medication,
    current_dose,
    proposed_dose,
    current_injections_per_week,
    proposed_injections_per_week,
    reason,
    requested_by_email,
    requested_by_name,
    provider_email: requestedProviderEmail,
    is_secondary_med,
    secondary_medication_name,
  } = req.body;

  if (!patient_id || !protocol_id || !current_dose || !proposed_dose) {
    return res.status(400).json({ error: 'patient_id, protocol_id, current_dose, and proposed_dose are required' });
  }

  if (!requested_by_email || !requested_by_name) {
    return res.status(400).json({ error: 'requested_by_email and requested_by_name are required' });
  }

  if (is_secondary_med && !secondary_medication_name) {
    return res.status(400).json({ error: 'secondary_medication_name is required when is_secondary_med is true' });
  }

  try {
    // Determine if this is an increase or decrease
    const currentVal = parseDoseNum(current_dose);
    const proposedVal = parseDoseNum(proposed_dose);
    const currentIpw = current_injections_per_week || 0;
    const proposedIpw = proposed_injections_per_week || currentIpw;

    let changeType = 'increase';
    if (proposedVal !== null && currentVal !== null) {
      changeType = proposedVal >= currentVal ? 'increase' : 'decrease';
    }

    // Generate a secure approval token
    const approvalToken = crypto.randomBytes(32).toString('hex');

    // Cancel any existing pending requests for this protocol
    await supabase
      .from('dose_change_requests')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('protocol_id', protocol_id)
      .in('status', ['pending']);

    // Resolve which provider approves this request. Default to first
    // entry in DOSE_APPROVAL_STAFF (Dr. Burgess) if no choice was sent or
    // the requested provider isn't authorized to approve dose changes.
    const requestedLower = (requestedProviderEmail || '').toLowerCase();
    const providerEmail = canApproveDoseChange(requestedLower)
      ? requestedLower
      : DOSE_APPROVAL_STAFF[0];
    const providerName = STAFF_DISPLAY_NAMES[providerEmail] || providerEmail;

    // Create the request
    const { data: request, error: insertError } = await supabase
      .from('dose_change_requests')
      .insert({
        patient_id,
        patient_name,
        protocol_id,
        medication: medication || null,
        current_dose,
        proposed_dose,
        current_injections_per_week: currentIpw || null,
        proposed_injections_per_week: proposedIpw || null,
        change_type: changeType,
        reason: reason || null,
        requested_by_email,
        requested_by_name,
        provider_email: providerEmail,
        provider_name: providerName,
        approval_token: approvalToken,
        is_secondary_med: is_secondary_med === true,
        secondary_medication_name: is_secondary_med ? secondary_medication_name : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create dose change request:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    // Get the chosen provider's phone number
    const { data: provider } = await supabase
      .from('employees')
      .select('phone')
      .eq('email', providerEmail)
      .single();

    // Build the approval link
    const approvalLink = `${BASE_URL}/verify/dose/${approvalToken}`;

    // PHI-safe name for SMS: "Chris C." format
    const phiSafeName = toFirstNameLastInitial(patient_name);

    // Build the SMS message
    const medLine = is_secondary_med
      ? `Medication: ${secondary_medication_name} (HRT secondary)`
      : medication
        ? `Medication: ${medication}`
        : null;
    const smsMessage = [
      `RANGE MEDICAL - Dose ${changeType === 'increase' ? 'Increase' : 'Decrease'} Request`,
      ``,
      `Patient: ${phiSafeName}`,
      medLine,
      `Current: ${current_dose}${currentIpw ? ` (${currentIpw}x/wk)` : ''}`,
      `Proposed: ${proposed_dose}${proposedIpw && proposedIpw !== currentIpw ? ` (${proposedIpw}x/wk)` : ''}`,
      reason ? `Reason: ${reason}` : null,
      ``,
      `Requested by: ${requested_by_name}`,
      ``,
      `Review & approve:`,
      approvalLink,
    ].filter(Boolean).join('\n');

    // Send the SMS (skip if no phone number on file)
    let smsResult = { success: false, error: 'No phone number' };
    if (provider?.phone) {
      const phone = normalizePhone(provider.phone);
      smsResult = await sendSMS({
        to: phone,
        message: smsMessage,
        skipEmailCopy: true,
        log: {
          messageType: 'dose_change_request',
          source: 'dose-change-requests',
          patientId: patient_id,
          protocolId: protocol_id,
        },
      });
    }

    // Send email to the approving provider
    const resend = new Resend(process.env.RESEND_API_KEY);
    const medLabel = is_secondary_med
      ? `${secondary_medication_name} (HRT secondary)`
      : medication || 'medication';
    let emailSent = false;
    try {
      const { error: emailErr } = await resend.emails.send({
        from: 'Range Medical <notifications@range-medical.com>',
        to: providerEmail,
        subject: `Dose ${changeType === 'increase' ? 'Increase' : 'Decrease'} Request — ${patient_name}`,
        html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f5f5f5;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellspacing="0" cellpadding="0" style="background:#fff;max-width:600px;">
<tr><td style="background:#000;padding:24px 30px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:0.1em;">RANGE MEDICAL</h1>
</td></tr>
<tr><td style="padding:36px 30px 24px;">
  <h2 style="margin:0 0 20px;color:#000;font-size:20px;">Dose ${changeType === 'increase' ? 'Increase' : 'Decrease'} Request</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr><td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;font-weight:600;width:40%;">Patient</td>
        <td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;">${patient_name}</td></tr>
    <tr><td style="padding:10px 12px;border:1px solid #eee;font-weight:600;">Medication</td>
        <td style="padding:10px 12px;border:1px solid #eee;">${medLabel}</td></tr>
    <tr><td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;font-weight:600;">Current Dose</td>
        <td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;">${current_dose}${currentIpw ? ` (${currentIpw}x/wk)` : ''}</td></tr>
    <tr><td style="padding:10px 12px;border:1px solid #eee;font-weight:600;">Proposed Dose</td>
        <td style="padding:10px 12px;border:1px solid #eee;font-weight:600;color:#1a7f37;">${proposed_dose}${proposedIpw && proposedIpw !== currentIpw ? ` (${proposedIpw}x/wk)` : ''}</td></tr>
    ${reason ? `<tr><td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;font-weight:600;">Reason</td>
        <td style="padding:10px 12px;background:#f9f9f9;border:1px solid #eee;">${reason}</td></tr>` : ''}
    <tr><td style="padding:10px 12px;border:1px solid #eee;font-weight:600;">Requested By</td>
        <td style="padding:10px 12px;border:1px solid #eee;">${requested_by_name}</td></tr>
  </table>
  <div style="text-align:center;margin:28px 0 8px;">
    <a href="${approvalLink}" style="display:inline-block;background:#000;color:#fff;padding:14px 36px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:600;">Review &amp; Approve</a>
  </div>
</td></tr>
<tr><td style="background:#fafafa;padding:20px 30px;border-top:1px solid #eee;">
  <p style="margin:0;color:#888;font-size:13px;text-align:center;">Range Medical &bull; (949) 997-3988</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
      });
      if (emailErr) {
        console.error('Dose change email error:', emailErr);
      } else {
        emailSent = true;
      }
    } catch (emailCatchErr) {
      console.error('Dose change email exception:', emailCatchErr.message);
    }

    // Update the request with notification status
    await supabase
      .from('dose_change_requests')
      .update({
        sms_sent_at: new Date().toISOString(),
        sms_delivered: smsResult.success || emailSent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    if (!smsResult.success && !emailSent) {
      console.error('Both SMS and email failed for dose change request');
      return res.status(500).json({
        error: `Could not reach ${providerName} via SMS or email. Please contact them directly.`,
        request_id: request.id,
      });
    }

    const channels = [smsResult.success && 'SMS', emailSent && 'email'].filter(Boolean).join(' + ');
    console.log(`Dose change request created: ${patient_name} ${current_dose} -> ${proposed_dose}, sent to ${providerName} via ${channels}`);

    return res.status(200).json({
      success: true,
      request_id: request.id,
      status: 'pending',
      provider_name: providerName,
      sms_sent: smsResult.success,
      email_sent: emailSent,
    });

  } catch (err) {
    console.error('Dose change request error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Parse numeric value from dose string — handles both "0.5ml" and "2.5mg"
function parseDoseNum(doseStr) {
  if (!doseStr) return null;
  const m = doseStr.match(/(\d+\.?\d*)\s*(ml|mg)/i);
  return m ? parseFloat(m[1]) : null;
}

// PHI-safe name: "John Smith" → "John S."
function toFirstNameLastInitial(fullName) {
  if (!fullName) return 'Patient';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
