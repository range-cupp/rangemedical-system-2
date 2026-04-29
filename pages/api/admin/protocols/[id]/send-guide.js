// /pages/api/admin/protocols/[id]/send-guide.js
// Send peptide guide SMS from the protocol detail page
// Gathers ALL active peptide protocols for the patient and sends one consolidated guide link
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../../lib/comms-log';
import { sendSMS, normalizePhone } from '../../../../../lib/send-sms';
import { hasBlooioOptIn, queuePendingLinkMessage, isBlooioProvider } from '../../../../../lib/blooio-optin';
import { getVialIdForMedication } from '../../../../../lib/protocol-config';
import { VIAL_CATALOG } from '../../../../../lib/vial-catalog';
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
  const { phaseDose, phaseLabel } = req.body || {};

  try {
    // Fetch the clicked protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, medication, program_name, patient_name, peptide_guide_sent, notes, delivery_method, supply_type, num_vials, total_sessions')
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
      .select('id, medication, program_name, program_type, status, total_sessions, delivery_method, supply_type, num_vials, secondary_medications, secondary_medication_details, selected_dose, frequency')
      .eq('patient_id', protocol.patient_id)
      .eq('status', 'active')
      .in('program_type', ['peptide', 'longevity', 'hrt', 'injection', 'injection_pack', 'nad_injection', 'recovery_jumpstart_10day', 'month_program_30day', 'weight_loss']);

    // Build enhanced vial entries: vialId.days.delivery
    // num_vials > 0 = patient got a whole vial (needs reconstitution)
    // num_vials null/0 with total_sessions = pre-filled day-count protocol
    const vialEntries = [];
    const protocolIds = [];
    const seenVialIds = new Set();
    for (const p of (allProtocols || [])) {
      // Include HRT secondary medications (e.g. HCG) so they appear in the guide
      let secondaryMeds = [];
      try {
        const raw = p.secondary_medications;
        secondaryMeds = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
      } catch { secondaryMeds = []; }
      for (const med of secondaryMeds) {
        const secVialId = getVialIdForMedication(med, null);
        if (secVialId && !seenVialIds.has(secVialId)) {
          seenVialIds.add(secVialId);
          vialEntries.push({ vialId: secVialId, days: 0, delivery: 'vial' });
        }
      }

      const vialId = getVialIdForMedication(p.medication, p.program_name);
      if (vialId && !seenVialIds.has(vialId)) {
        seenVialIds.add(vialId);
        const supplyTypeStr = (p.supply_type || '').toLowerCase();
        const deliveryStr = (p.delivery_method || '').toLowerCase();
        // Vial only if explicitly marked: num_vials set, or supply_type is exactly 'vial'
        const isVial =
          (p.num_vials && p.num_vials > 0) ||
          supplyTypeStr === 'vial' ||
          deliveryStr.includes('vial');
        // Everything else is prefilled
        const delivery = isVial ? 'vial' : 'prefilled';
        // For vial protocols, calculate days from num_vials × catalog injectionsPerVial
        let days = p.total_sessions || null;
        if (isVial) {
          const catalogEntry = VIAL_CATALOG.find(v => v.id === vialId);
          if (catalogEntry && (catalogEntry.daysPerVial || catalogEntry.injectionsPerVial)) {
            days = p.num_vials * (catalogEntry.daysPerVial || catalogEntry.injectionsPerVial);
          }
        }
        // Use phase dose override if this is the clicked protocol and a phase was selected
        const dose = (p.id === id && phaseDose) ? phaseDose : (p.selected_dose || '');
        vialEntries.push({ vialId, days, delivery, dose, freq: p.frequency || '' });
      }
      protocolIds.push(p.id);
    }

    // Fallback: if nothing matched, try just the clicked protocol
    if (vialEntries.length === 0) {
      const fallbackId = getVialIdForMedication(protocol.medication, protocol.program_name);
      if (fallbackId) {
        const fbSupply = (protocol.supply_type || '').toLowerCase();
        const fbDelivery = (protocol.delivery_method || '').toLowerCase();
        const fbIsVial = (protocol.num_vials && protocol.num_vials > 0) || fbSupply === 'vial' || fbDelivery.includes('vial');
        vialEntries.push({ vialId: fallbackId, days: protocol.total_sessions || null, delivery: fbIsVial ? 'vial' : 'prefilled' });
      }
    }

    if (vialEntries.length === 0) {
      return res.status(400).json({ error: 'Could not determine vial type for this protocol' });
    }

    // Build consolidated guide URL with enhanced format: v=motsc.20.vial,ghk_cu.30.vial
    // Dose and frequency are passed as separate query params keyed by vial ID
    const vParam = vialEntries.map(e => {
      const parts = [e.vialId];
      if (e.days) parts.push(e.days);
      else parts.push('0');
      parts.push(e.delivery);
      return parts.join('.');
    }).join(',');
    // Build dose/freq params from protocol data
    const doseParams = vialEntries
      .filter(e => e.dose)
      .map(e => `d_${e.vialId}=${encodeURIComponent(e.dose)}`)
      .join('&');
    const freqParams = vialEntries
      .filter(e => e.freq)
      .map(e => `f_${e.vialId}=${encodeURIComponent(e.freq)}`)
      .join('&');
    const noteText = phaseLabel ? `${phaseLabel} — ${phaseDose}` : (protocol.notes || '');
    const noteParam = noteText ? `note=${encodeURIComponent(noteText)}` : '';
    const extraParams = [doseParams, freqParams, noteParam].filter(Boolean).join('&');
    const guideUrl = `https://www.range-medical.com/peptide-guide?v=${vParam}${extraParams ? '&' + extraParams : ''}`;
    const guideMessage = `Hi ${firstName}! Here's your personalized peptide guide with ${vialEntries.some(e => e.delivery === 'vial') ? 'reconstitution and ' : ''}injection instructions: ${guideUrl} - Range Medical`;

    // Blooio two-step: first contact cannot include links
    if (isBlooioProvider()) {
      const optedIn = await hasBlooioOptIn(phone);

      if (!optedIn) {
        const hasVials = vialEntries.some(e => e.delivery === 'vial');
        const optInMsg = `Hi ${firstName}! Range Medical here. We have your peptide ${hasVials ? 'reconstitution ' : ''}guide ready for you. Reply YES to receive it.`;

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
          notes: `Blooio two-step: opt-in request sent, guide link queued (${vialEntries.map(e => e.vialId).join(', ')})`
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

    return res.status(200).json({ success: true, message: 'Peptide guide SMS sent', vials: vialEntries.map(e => e.vialId) });

  } catch (error) {
    console.error('Send guide error:', error);
    return res.status(500).json({ error: error.message });
  }
}
