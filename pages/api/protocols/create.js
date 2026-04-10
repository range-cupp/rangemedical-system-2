// /pages/api/protocols/create.js
// Create a new protocol — delegates to lib/create-protocol.js
// Range Medical

import { isWeightLossType, isHRTType } from '../../../lib/protocol-config';
import { createProtocol } from '../../../lib/create-protocol';
import { todayPacific } from '../../../lib/date-utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const {
      patient_id,
      ghl_contact_id,
      purchase_id,
      program_type,
      program_name,
      medication,
      dose,
      frequency,
      delivery_method,
      supply_type,
      total_sessions,
      start_date,
      notes,
      hrt_type,
      secondary_medications
    } = body;

    if (!patient_id) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }
    if (!program_type) {
      return res.status(400).json({ error: 'Protocol type is required' });
    }

    // ── Calculate end date based on protocol type ──────────────────────────
    let end_date = null;
    let duration_days = null;
    let resolved_program_name = program_name;

    if (program_name) {
      const match = program_name.match(/(\d+)\s*Day/i);
      if (match) {
        duration_days = parseInt(match[1]);
        if (program_type === 'peptide' && /^(\d+\s*Day|Peptide\s*-\s*\d+\s*Day)$/i.test(program_name)) {
          resolved_program_name = `Peptide Therapy - ${match[1]} Days`;
        }
      }
    }

    if (['iv', 'hbot', 'rlt', 'injection'].includes(program_type) && total_sessions) {
      duration_days = total_sessions * 7;
    }
    if (isWeightLossType(program_type) && !duration_days) {
      duration_days = 28;
    }
    if (isHRTType(program_type)) {
      duration_days = null;
    }

    const startDateValue = start_date || todayPacific();
    if (duration_days && startDateValue) {
      const startD = new Date(startDateValue + 'T00:00:00');
      const endD = new Date(startD);
      endD.setDate(endD.getDate() + duration_days);
      end_date = endD.toISOString().split('T')[0];
    }

    if (program_type === 'iv' && medication && total_sessions) {
      resolved_program_name = `${medication} - ${total_sessions} Pack`;
    }

    // ── Create via centralized function ────────────────────────────────────
    const result = await createProtocol({
      patient_id,
      ghl_contact_id,
      program_type: isWeightLossType(program_type) ? 'weight_loss' : program_type,
      program_name: resolved_program_name,
      medication,
      selected_dose: dose,
      starting_dose: dose,
      frequency: frequency || getDefaultFrequency(program_type),
      delivery_method: delivery_method || 'in_clinic',
      supply_type,
      total_sessions: (program_type === 'peptide' && delivery_method === 'take_home') ? null : (total_sessions ? parseInt(total_sessions) : null),
      start_date: startDateValue,
      end_date,
      notes,
      hrt_type,
      secondary_medications,
    }, {
      source: 'protocols-create',
      purchaseId: purchase_id,
    });

    if (!result.success) {
      // Duplicate — return 409
      if (result.duplicate) {
        return res.status(409).json({
          error: result.error,
          existing_protocol_id: result.duplicate.protocolId || result.duplicate.protocol?.id
        });
      }
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      protocol: result.protocol,
      message: 'Protocol created successfully'
    });

  } catch (err) {
    console.error('Create protocol error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function getDefaultFrequency(type) {
  const frequencies = {
    weight_loss: '1x per week',
    peptide: 'Daily',
    hrt: '2x per week',
    iv: 'As scheduled',
    hbot: 'As scheduled',
    rlt: 'As scheduled',
    injection: 'As scheduled'
  };
  return frequencies[type] || 'As directed';
}
