// /pages/api/dose-change-requests/create.js
// Creates a dose change request and sends SMS to Dr. Burgess for approval.
// The protocol is NOT updated until Dr. Burgess approves via the SMS link.
// Full audit trail: who requested, when SMS sent, when approved, from where.

import { createClient } from '@supabase/supabase-js';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { DOSE_APPROVAL_STAFF, STAFF_DISPLAY_NAMES } from '../../../lib/staff-config';
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
    current_dose,
    proposed_dose,
    current_injections_per_week,
    proposed_injections_per_week,
    reason,
    requested_by_email,
    requested_by_name,
  } = req.body;

  if (!patient_id || !protocol_id || !current_dose || !proposed_dose) {
    return res.status(400).json({ error: 'patient_id, protocol_id, current_dose, and proposed_dose are required' });
  }

  if (!requested_by_email || !requested_by_name) {
    return res.status(400).json({ error: 'requested_by_email and requested_by_name are required' });
  }

  try {
    // Determine if this is an increase or decrease
    const currentMl = parseMl(current_dose);
    const proposedMl = parseMl(proposed_dose);
    const currentIpw = current_injections_per_week || 0;
    const proposedIpw = proposed_injections_per_week || currentIpw;

    let changeType = 'increase';
    if (proposedMl !== null && currentMl !== null) {
      const currentWeekly = currentMl * (currentIpw || 1);
      const proposedWeekly = proposedMl * (proposedIpw || 1);
      changeType = proposedWeekly >= currentWeekly ? 'increase' : 'decrease';
    }

    // Generate a secure approval token
    const approvalToken = crypto.randomBytes(32).toString('hex');

    // Cancel any existing pending requests for this protocol
    await supabase
      .from('dose_change_requests')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('protocol_id', protocol_id)
      .in('status', ['pending']);

    // Get the provider info (Dr. Burgess)
    const providerEmail = DOSE_APPROVAL_STAFF[0]; // burgess@range-medical.com
    const providerName = STAFF_DISPLAY_NAMES[providerEmail] || 'Dr. Damien Burgess';

    // Create the request
    const { data: request, error: insertError } = await supabase
      .from('dose_change_requests')
      .insert({
        patient_id,
        patient_name,
        protocol_id,
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
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create dose change request:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    // Get Dr. Burgess's phone number
    const { data: provider } = await supabase
      .from('employees')
      .select('phone')
      .eq('email', providerEmail)
      .single();

    if (!provider?.phone) {
      console.error('No phone number for provider:', providerEmail);
      return res.status(500).json({ error: 'Provider phone number not found. Cannot send approval SMS.' });
    }

    // Build the approval link
    const approvalLink = `${BASE_URL}/verify/dose/${approvalToken}`;

    // Build the SMS message
    const arrow = changeType === 'increase' ? '\u2191' : '\u2193'; // up/down arrow
    const smsMessage = [
      `RANGE MEDICAL - Dose ${changeType === 'increase' ? 'Increase' : 'Decrease'} Request`,
      ``,
      `Patient: ${patient_name}`,
      `Current: ${current_dose}${currentIpw ? ` (${currentIpw}x/wk)` : ''}`,
      `Proposed: ${proposed_dose}${proposedIpw && proposedIpw !== currentIpw ? ` (${proposedIpw}x/wk)` : ''}`,
      reason ? `Reason: ${reason}` : null,
      ``,
      `Requested by: ${requested_by_name}`,
      ``,
      `Review & approve:`,
      approvalLink,
    ].filter(Boolean).join('\n');

    // Send the SMS
    const phone = normalizePhone(provider.phone);
    const smsResult = await sendSMS({ to: phone, message: smsMessage });

    // Update the request with SMS status
    await supabase
      .from('dose_change_requests')
      .update({
        sms_sent_at: new Date().toISOString(),
        sms_delivered: smsResult.success,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    if (!smsResult.success) {
      console.error('SMS send failed:', smsResult.error);
      return res.status(500).json({
        error: `SMS to Dr. Burgess failed: ${smsResult.error}. Please try again or contact him directly.`,
        request_id: request.id,
      });
    }

    console.log(`Dose change request created: ${patient_name} ${current_dose} -> ${proposed_dose}, SMS sent to ${providerName}`);

    return res.status(200).json({
      success: true,
      request_id: request.id,
      status: 'pending',
      provider_name: providerName,
      sms_sent: true,
    });

  } catch (err) {
    console.error('Dose change request error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function parseMl(doseStr) {
  if (!doseStr) return null;
  const m = doseStr.match(/(\d+\.?\d*)\s*ml/i);
  return m ? parseFloat(m[1]) : null;
}
