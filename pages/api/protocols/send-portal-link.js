// /pages/api/protocols/send-portal-link.js
// Generate access_token (if needed) and send HRT portal link to patient via SMS
// Used for existing HRT members who don't go through onboarding flow
// Range Medical

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { isHRTType } from '../../../lib/protocol-config';
import { sendSMS, normalizePhone } from '../../../lib/send-sms';
import { logComm } from '../../../lib/comms-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { protocolId } = req.body;

    if (!protocolId) {
      return res.status(400).json({ error: 'Protocol ID required' });
    }

    // Fetch protocol with patient info
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*, patients(id, name, first_name, last_name, email, phone, ghl_contact_id)')
      .eq('id', protocolId)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Validate: must be HRT
    if (!isHRTType(protocol.program_type)) {
      return res.status(400).json({ error: 'Portal link is only for HRT protocols' });
    }

    const patient = protocol.patients;
    if (!patient?.phone) {
      return res.status(400).json({ error: 'Patient has no phone number on file' });
    }

    const phone = normalizePhone(patient.phone);
    if (!phone) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Generate access_token if not already set
    let accessToken = protocol.access_token;
    if (!accessToken) {
      accessToken = crypto.randomBytes(32).toString('hex');
      await supabase
        .from('protocols')
        .update({ access_token: accessToken, updated_at: new Date().toISOString() })
        .eq('id', protocolId);
    }

    const portalUrl = `https://www.range-medical.com/hrt/${accessToken}`;
    const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');

    // Send SMS with portal link
    const message = `Hi ${firstName}! Here's your personal HRT dashboard at Range Medical: ${portalUrl} — View your protocol, labs, and book appointments anytime.`;

    const smsResult = await sendSMS({ to: phone, message });

    await logComm({
      channel: 'sms',
      messageType: 'hrt_portal_link',
      message,
      source: 'send-portal-link',
      patientId: protocol.patient_id,
      protocolId: protocol.id,
      ghlContactId: patient.ghl_contact_id,
      patientName: patient.name,
      recipient: phone,
      status: smsResult.success ? 'sent' : 'error',
      errorMessage: smsResult.success ? null : smsResult.error,
      provider: smsResult.provider,
      twilioMessageSid: smsResult.messageSid
    });

    if (!smsResult.success) {
      return res.status(500).json({
        error: 'Failed to send SMS',
        portalUrl // Return URL so staff can share manually
      });
    }

    return res.status(200).json({
      success: true,
      message: `Portal link sent to ${phone}`,
      portalUrl,
      patientName: patient.name
    });

  } catch (error) {
    console.error('Send portal link error:', error);
    return res.status(500).json({ error: error.message });
  }
}
