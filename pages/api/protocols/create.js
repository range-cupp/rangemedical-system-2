// /pages/api/protocols/create.js
// Create a new protocol
// Range Medical - 2026-01-17

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patient_id,
      ghl_contact_id,
      program_type,
      program_name,
      medication,
      dose,
      frequency,
      delivery_method,
      supply_type,
      total_sessions,
      start_date,
      notes
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    if (!program_type) {
      return res.status(400).json({ error: 'Protocol type is required' });
    }

    // Calculate end date based on protocol type
    let end_date = null;
    let duration_days = null;

    if (program_name) {
      // Parse program name for duration (e.g., "7 Day", "10 Day", "30 Day")
      const match = program_name.match(/(\d+)\s*Day/i);
      if (match) {
        duration_days = parseInt(match[1]);
      }
    }

    // Session-based protocols (IV, HBOT, RLT, Injection)
    if (['iv', 'hbot', 'rlt', 'injection'].includes(program_type) && total_sessions) {
      // Estimate ~1 session per week
      duration_days = total_sessions * 7;
    }

    // Weight loss defaults to 4 weeks if not specified
    if (program_type === 'weight_loss' && !duration_days) {
      duration_days = 28;
    }

    // HRT has no end date (ongoing)
    if (program_type === 'hrt') {
      duration_days = null;
    }

    // Calculate end date
    if (duration_days && start_date) {
      const startD = new Date(start_date);
      const endD = new Date(startD);
      endD.setDate(endD.getDate() + duration_days);
      end_date = endD.toISOString().split('T')[0];
    }

    // Build protocol record
    const protocolData = {
      patient_id,
      ghl_contact_id: ghl_contact_id || null,
      program_type,
      program_name: program_name || getProgramName(program_type),
      medication: medication || null,
      dose: dose || null,
      selected_dose: dose || null,
      starting_dose: dose || null,
      frequency: frequency || getDefaultFrequency(program_type),
      delivery_method: delivery_method || 'in_clinic',
      supply_type: supply_type || null,
      total_sessions: total_sessions || null,
      sessions_used: 0,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date,
      status: 'active',
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert protocol
    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert(protocolData)
      .select()
      .single();

    if (error) {
      console.error('Error creating protocol:', error);
      return res.status(500).json({ error: error.message });
    }

    // TODO: Sync to GHL if needed

    return res.status(200).json({
      success: true,
      protocol,
      message: 'Protocol created successfully'
    });

  } catch (err) {
    console.error('Create protocol error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function getProgramName(type) {
  const names = {
    weight_loss: 'Weight Loss Protocol',
    peptide: 'Peptide Protocol',
    hrt: 'HRT Protocol',
    iv: 'IV Therapy',
    hbot: 'HBOT',
    rlt: 'Red Light Therapy',
    injection: 'Injection Therapy'
  };
  return names[type] || 'Protocol';
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
