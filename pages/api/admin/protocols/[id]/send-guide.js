// /pages/api/admin/protocols/[id]/send-guide.js
// Send peptide guide SMS from the protocol detail page
// Uses unified sendSMS (Blooio/Twilio) — no GHL dependency
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../../../lib/send-sms';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../../../lib/blooio-optin';
import { getGuideSlug } from '../../../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Fetch protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, medication, program_name, patient_name, peptide_guide_sent')
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

    // Check if guide was already sent
    if (protocol.peptide_guide_sent) {
      return res.status(409).json({ error: 'Peptide guide was already sent for this protocol' });
    }

    const { data: existingLog } = await supabase
      .from('protocol_logs')
      .select('id')
      .eq('protocol_id', id)
      .eq('log_type', 'peptide_guide_sent')
      .maybeSingle();

    if (existingLog) {
      return res.status(409).json({ error: 'Peptide guide was already sent for this protocol' });
    }

    // Build guide URL dynamically based on medication — uses centralized catalog matching
    const guideSlug = getGuideSlug(protocol.medication, protocol.program_name);
    const guideMessage = `Hi ${firstName}! Here's your guide to your peptide protocol: https://www.range-medical.com${guideSlug} - Range Medical`;

    // Blooio two-step: first contact cannot include links
    if (isBlooioProvider()) {
      const optedIn = await hasBlooioOptIn(phone);

      if (!optedIn) {
        // Step 1: Send link-free message
        const optInMsg = `Hi ${firstName}! Range Medical here. We have your recovery peptide guide ready for you. Reply YES to receive it.`;

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
          message: guideMessage,
          messageType: 'guide_links',
          patientId: protocol.patient_id,
          patientName: patient.name || protocol.patient_name,
        });

        // Mark guide sent on protocol
        await supabase
          .from('protocols')
          .update({ peptide_guide_sent: true })
          .eq('id', id);

        // Log to protocol_logs
        await supabase.from('protocol_logs').insert({
          protocol_id: id,
          patient_id: protocol.patient_id,
          log_type: 'peptide_guide_sent',
          log_date: new Date().toISOString().split('T')[0],
          notes: `Blooio two-step: opt-in request sent, guide link queued for auto-delivery`
        });

        return res.status(200).json({
          success: true,
          twoStep: true,
          message: 'Opt-in message sent. The guide will be delivered automatically when the patient replies.',
        });
      }
    }

    // Direct send — either not Blooio, or patient already opted in
    const result = await sendSMS({ to: phone, message: guideMessage });

    if (!result.success) {
      return res.status(500).json({ error: 'SMS failed', details: result.error });
    }

    // Mark guide sent on protocol
    await supabase
      .from('protocols')
      .update({ peptide_guide_sent: true })
      .eq('id', id);

    // Log to protocol_logs
    await supabase.from('protocol_logs').insert({
      protocol_id: id,
      patient_id: protocol.patient_id,
      log_type: 'peptide_guide_sent',
      log_date: new Date().toISOString().split('T')[0],
      notes: guideMessage
    });

    // Log to comms_log
    await logComm({
      channel: 'sms',
      messageType: 'peptide_guide_sent',
      message: guideMessage,
      source: 'admin-protocol-page',
      patientId: protocol.patient_id,
      patientName: patient.name || protocol.patient_name,
      recipient: phone,
      direction: 'outbound',
      provider: result.provider || null,
    });

    return res.status(200).json({ success: true, message: 'Peptide guide SMS sent' });

  } catch (error) {
    console.error('Send guide error:', error);
    return res.status(500).json({ error: error.message });
  }
}
