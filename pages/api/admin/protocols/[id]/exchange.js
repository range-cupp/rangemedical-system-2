// /pages/api/admin/protocols/[id]/exchange.js
// Exchange one protocol for another (e.g., adverse reaction → switch medication)
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { isGHPeptide, isRecoveryPeptide, isWeightLossType } from '../../../../../lib/protocol-config';
import { createProtocol, closeProtocol } from '../../../../../lib/create-protocol';
import { todayPacific } from '../../../../../lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query; // Old protocol ID
  const {
    medication,
    dosage,
    frequency,
    deliveryMethod,
    duration,
    reason,     // adverse_reaction, patient_preference, provider_recommendation, other
    reasonNote, // Freetext note
    protocolType: newProtocolType // Optional override — if switching categories (e.g., weight_loss → peptide)
  } = req.body;

  if (!medication || !reason) {
    return res.status(400).json({ error: 'Medication and reason are required' });
  }

  try {
    // 1. Fetch the old protocol
    const { data: oldProtocol, error: fetchErr } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !oldProtocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    if (oldProtocol.status === 'exchanged') {
      return res.status(400).json({ error: 'Protocol has already been exchanged' });
    }

    // 2. Determine the new protocol type
    const pType = newProtocolType || oldProtocol.program_type;
    const today = todayPacific();

    // Calculate remaining days from old protocol
    let newDuration = duration;
    if (!newDuration && oldProtocol.duration_days) {
      const oldStart = new Date(oldProtocol.start_date);
      const now = new Date();
      oldStart.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const daysUsed = Math.max(0, Math.floor((now - oldStart) / (1000 * 60 * 60 * 24)));
      newDuration = Math.max(1, oldProtocol.duration_days - daysUsed);
    }
    // Default to 30 days if no duration available
    if (!newDuration) newDuration = 30;

    // 3. Build protocol name
    let protocolName = '';
    if (pType === 'peptide') {
      if (isGHPeptide(medication)) {
        protocolName = `${newDuration}-Day GH Protocol`;
      } else if (isRecoveryPeptide(medication)) {
        protocolName = `${newDuration}-Day Recovery Protocol`;
      } else {
        protocolName = `${newDuration}-Day Peptide Protocol`;
      }
    } else if (isWeightLossType(pType)) {
      protocolName = `Weight Loss - ${medication}`;
    } else {
      protocolName = oldProtocol.program_name || `${newDuration}-Day Protocol`;
    }

    // 4. Calculate end date for peptides
    let endDate = null;
    let sessions = null;
    const freq = frequency || oldProtocol.frequency;

    if (pType === 'peptide') {
      sessions = parseInt(newDuration);
      const effectiveDays = freq === '2x_daily' ? Math.ceil(newDuration / 2) : newDuration;
      const end = new Date(today);
      end.setDate(end.getDate() + effectiveDays - 1);
      endDate = end.toISOString().split('T')[0];
    }

    // 5. Create the new protocol via centralized function
    const result = await createProtocol({
      patient_id: oldProtocol.patient_id,
      ghl_contact_id: oldProtocol.ghl_contact_id,
      patient_name: oldProtocol.patient_name,
      patient_phone: oldProtocol.patient_phone,
      patient_email: oldProtocol.patient_email,

      program_name: protocolName,
      medication,
      selected_dose: dosage || null,
      frequency: freq,
      delivery_method: deliveryMethod || oldProtocol.delivery_method,

      start_date: today,
      end_date: endDate,
      total_sessions: sessions,
      sessions_used: 0,

      continuous_days_started: pType === 'peptide' ? today : null,
      continuous_days_used: 0,

      program_type: pType,
      notes: `Exchanged from ${oldProtocol.program_name || oldProtocol.medication} — ${reason}${reasonNote ? ': ' + reasonNote : ''}`,

      // Exchange tracking
      exchanged_from: oldProtocol.id,
      exchange_reason: reason,
      exchange_date: today,

      peptide_reminders_enabled: pType === 'peptide' ? true : null,
    }, {
      source: 'exchange',
      parentProtocolId: oldProtocol.id,
      skipDuplicateCheck: true, // exchange always creates a new protocol
    });

    if (!result.success) {
      console.error('Exchange create error:', result.error);
      return res.status(500).json({ error: 'Failed to create new protocol' });
    }

    const newProtocol = result.protocol;

    // 6. Create scheduled sessions for peptides
    if (pType === 'peptide' && sessions) {
      const sessionInserts = [];
      const start = new Date(today);

      for (let i = 1; i <= sessions; i++) {
        const sessionDate = new Date(start);
        sessionDate.setDate(start.getDate() + i - 1);

        sessionInserts.push({
          protocol_id: newProtocol.id,
          session_number: i,
          scheduled_date: sessionDate.toISOString().split('T')[0],
          status: 'scheduled'
        });
      }

      await supabase.from('protocol_sessions').insert(sessionInserts);
    }

    // 7. Mark old protocol as exchanged via centralized function
    const closeResult = await closeProtocol(oldProtocol.id, 'exchanged', {
      replacedByProtocolId: newProtocol.id,
      notes: `Exchanged to ${medication} — ${reason}${reasonNote ? ': ' + reasonNote : ''}`,
    });

    if (!closeResult.success) {
      console.error('Exchange update error:', closeResult.error);
      // New protocol was created, so we still return success but warn
    }

    // Also set exchange fields on old protocol
    await supabase
      .from('protocols')
      .update({ exchange_reason: reason, exchange_date: today })
      .eq('id', oldProtocol.id);

    // 8. Log a service log entry for the exchange
    await supabase.from('service_logs').insert({
      patient_id: oldProtocol.patient_id,
      protocol_id: oldProtocol.id,
      category: 'exchange',
      service_name: `Protocol Exchange: ${oldProtocol.medication || oldProtocol.program_name} → ${medication}`,
      notes: `Reason: ${reason}${reasonNote ? ' — ' + reasonNote : ''}`,
      log_date: today,
      performed_by: 'staff'
    });

    // 9. Auto-assign journey template to new protocol
    try {
      const { data: template } = await supabase
        .from('journey_templates')
        .select('id, stages')
        .eq('protocol_type', pType)
        .eq('is_default', true)
        .maybeSingle();

      if (template && template.stages && template.stages.length > 0) {
        const initialStage = template.stages[0].key;
        await supabase
          .from('protocols')
          .update({
            journey_template_id: template.id,
            current_journey_stage: initialStage
          })
          .eq('id', newProtocol.id);
      }
    } catch (journeyErr) {
      console.error('Journey assignment error (non-fatal):', journeyErr);
    }

    return res.status(201).json({
      success: true,
      oldProtocol: { id: oldProtocol.id, status: 'exchanged' },
      newProtocol
    });

  } catch (error) {
    console.error('Exchange error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
