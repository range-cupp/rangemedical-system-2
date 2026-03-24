// /pages/api/admin/protocols/[id]/send-optin.js
// Send peptide check-in opt-in SMS from the protocol detail page
// Uses unified sendSMS (Blooio/Twilio) — no GHL dependency
// Range Medical

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logComm } from '../../../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../../../lib/send-sms';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../../../lib/blooio-optin';
import { todayPacific } from '../../../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Fetch protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, medication, program_name, access_token, patient_name')
      .eq('id', id)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Get patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, first_name, phone, email')
      .eq('id', protocol.patient_id)
      .single();

    if (!patient?.phone) {
      return res.status(400).json({ error: 'Patient has no phone number on file — cannot send SMS' });
    }

    const phone = normalizePhone(patient.phone);
    if (!phone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : 'there');

    // Check if opt-in was already sent
    const { data: existingLog } = await supabase
      .from('protocol_logs')
      .select('id')
      .eq('protocol_id', id)
      .eq('log_type', 'peptide_checkin_optin_sent')
      .maybeSingle();

    if (existingLog) {
      return res.status(409).json({ error: 'Opt-in SMS was already sent for this protocol' });
    }

    // Generate access token if missing
    let accessToken = protocol.access_token;
    if (!accessToken) {
      accessToken = crypto.randomBytes(32).toString('hex');
      await supabase
        .from('protocols')
        .update({ access_token: accessToken })
        .eq('id', id);
    }

    const shortCode = accessToken.slice(0, 8);
    const optinUrl = `${BASE_URL}/optin/${shortCode}`;
    const message = `Hi ${firstName}! You've started your recovery peptide protocol at Range Medical. We'd like to send quick weekly check-ins via text to track your progress — just 30 seconds each.\n\nTap here to get started:\n${optinUrl}\n\n- Range Medical`;

    // Blooio two-step: first contact cannot include links
    if (isBlooioProvider()) {
      const optedIn = await hasBlooioOptIn(phone);

      if (!optedIn) {
        // Step 1: Send link-free opt-in message
        const optInMsg = `Hi ${firstName}! Range Medical here. You've started your recovery peptide protocol. We'd like to send weekly check-ins to track your progress. Reply YES to get started.`;

        const optInResult = await sendSMS({ to: phone, message: optInMsg });
        if (!optInResult.success) {
          return res.status(500).json({ error: 'Failed to send SMS', details: optInResult.error });
        }

        // Log the opt-in request
        await logComm({
          channel: 'sms',
          messageType: 'blooio_optin_request',
          message: optInMsg,
          source: 'admin-protocol-page',
          patientId: protocol.patient_id,
          patientName: patient.name || protocol.patient_name,
          recipient: phone,
          direction: 'outbound',
          provider: optInResult.provider || null,
        });

        // Queue the link message for auto-send when patient replies
        await queuePendingLinkMessage({
          phone,
          message,
          messageType: 'peptide_checkin_optin',
          patientId: protocol.patient_id,
          patientName: patient.name || protocol.patient_name,
        });

        // Log to protocol_logs
        await supabase.from('protocol_logs').insert({
          protocol_id: id,
          patient_id: protocol.patient_id,
          log_type: 'peptide_checkin_optin_sent',
          log_date: todayPacific(),
          notes: `Blooio two-step: opt-in request sent, link queued for auto-delivery`
        });

        return res.status(200).json({
          success: true,
          twoStep: true,
          message: 'Opt-in request sent. The check-in link will be delivered automatically when the patient replies.',
        });
      }
    }

    // Direct send — either not Blooio, or patient already opted in
    const result = await sendSMS({ to: phone, message });

    if (!result.success) {
      return res.status(500).json({ error: 'SMS failed', details: result.error });
    }

    // Log it
    await supabase.from('protocol_logs').insert({
      protocol_id: id,
      patient_id: protocol.patient_id,
      log_type: 'peptide_checkin_optin_sent',
      log_date: todayPacific(),
      notes: message
    });

    await logComm({
      channel: 'sms',
      messageType: 'peptide_checkin_optin_sent',
      message,
      source: 'admin-protocol-page',
      patientId: protocol.patient_id,
      patientName: patient.name || protocol.patient_name,
      recipient: phone,
      direction: 'outbound',
      provider: result.provider || null,
    });

    return res.status(200).json({ success: true, message: 'Opt-in SMS sent' });

  } catch (error) {
    console.error('Send opt-in error:', error);
    return res.status(500).json({ error: error.message });
  }
}
