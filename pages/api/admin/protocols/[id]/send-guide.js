// /pages/api/admin/protocols/[id]/send-guide.js
// Send peptide guide SMS from the protocol detail page
// Gathers ALL active peptide protocols for the patient and sends one consolidated guide link
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../../../lib/send-sms';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../../../lib/blooio-optin';
import { getVialIdForMedication } from '../../../../../lib/protocol-config';
import { todayPacific } from '../../../../../lib/date-utils';

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
    // Fetch the clicked protocol
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

    // Gather ALL active peptide protocols for this patient
    const { data: allProtocols } = await supabase
      .from('protocols')
      .select('id, medication, program_name, category, status')
      .eq('patient_id', protocol.patient_id)
      .eq('status', 'active')
      .in('category', ['peptide', 'recovery', 'longevity', 'gh_blend', 'skin', 'neuro', 'immune', 'sexual_health']);

    // Map each protocol to a vial catalog ID and deduplicate
    const vialIds = [];
    const protocolIds = [];
    for (const p of (allProtocols || [])) {
      const vialId = getVialIdForMedication(p.medication, p.program_name);
      if (vialId && !vialIds.includes(vialId)) {
        vialIds.push(vialId);
      }
      protocolIds.push(p.id);
    }

    // Fallback: if no vial IDs matched, try just the clicked protocol
    if (vialIds.length === 0) {
      const fallbackId = getVialIdForMedication(protocol.medication, protocol.program_name);
      if (fallbackId) vialIds.push(fallbackId);
    }

    if (vialIds.length === 0) {
      return res.status(400).json({ error: 'Could not determine vial type for this protocol' });
    }

    // Build consolidated guide URL
    const guideUrl = `https://www.range-medical.com/peptide-guide?vials=${vialIds.join(',')}`;
    const guideMessage = `Hi ${firstName}! Here's your personalized peptide guide with reconstitution and injection instructions: ${guideUrl} - Range Medical`;

    // Blooio two-step: first contact cannot include links
    if (isBlooioProvider()) {
      const optedIn = await hasBlooioOptIn(phone);

      if (!optedIn) {
        const optInMsg = `Hi ${firstName}! Range Medical here. We have your peptide reconstitution guide ready for you. Reply YES to receive it.`;

        const optInResult = await sendSMS({ to: phone, message: optInMsg });
        if (!optInResult.success) {
          return res.status(500).json({ error: 'Failed to send SMS', details: optInResult.error });
        }

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

        await queuePendingLinkMessage({
          phone,
          message: guideMessage,
          messageType: 'guide_links',
          patientId: protocol.patient_id,
          patientName: patient.name || protocol.patient_name,
        });

        // Mark guide sent on ALL active peptide protocols
        if (protocolIds.length > 0) {
          await supabase
            .from('protocols')
            .update({ peptide_guide_sent: true })
            .in('id', protocolIds);
        }

        await supabase.from('protocol_logs').insert({
          protocol_id: id,
          patient_id: protocol.patient_id,
          log_type: 'peptide_guide_sent',
          log_date: todayPacific(),
          notes: `Blooio two-step: opt-in request sent, guide link queued (${vialIds.join(', ')})`
        });

        return res.status(200).json({
          success: true,
          twoStep: true,
          message: 'Opt-in message sent. The guide will be delivered automatically when the patient replies.',
        });
      }
    }

    // Direct send
    const result = await sendSMS({ to: phone, message: guideMessage });

    if (!result.success) {
      return res.status(500).json({ error: 'SMS failed', details: result.error });
    }

    // Mark guide sent on ALL active peptide protocols
    if (protocolIds.length > 0) {
      await supabase
        .from('protocols')
        .update({ peptide_guide_sent: true })
        .in('id', protocolIds);
    }

    await supabase.from('protocol_logs').insert({
      protocol_id: id,
      patient_id: protocol.patient_id,
      log_type: 'peptide_guide_sent',
      log_date: todayPacific(),
      notes: `Sent consolidated guide: ${guideUrl}`
    });

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

    return res.status(200).json({ success: true, message: 'Peptide guide SMS sent', vials: vialIds });

  } catch (error) {
    console.error('Send guide error:', error);
    return res.status(500).json({ error: error.message });
  }
}
