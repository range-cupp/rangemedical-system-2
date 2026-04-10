// /pages/api/admin/protocols/create.js
// Create Protocol API with type-specific logic
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../lib/comms-log';
import { isWeightLossType, isHRTType, isRecoveryPeptide, isGHPeptide } from '../../../../lib/protocol-config';
import { createProtocol } from '../../../../lib/create-protocol';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.range-medical.com';

// Protocol type configurations
const PROTOCOL_CONFIGS = {
  peptide: {
    maxContinuousDays: 120,
    breakDays: 14,
    staffCheckinDays: 7,
    symptomCheckinDays: 7
  },
  hrt: {
    symptomCheckinDays: 30,
    followupLabsWeeks: 6,
    prefillQuantity: 8,
    vialMl: 10,
    vialMgPerMl: 200
  },
  weight_loss: {
    symptomCheckinDays: 7,
    followupLabsWeeks: 6,
    titrationAlertInjection: 4
  },
  red_light: {},
  hbot: {}
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      patient_id,
      ghl_contact_id,
      protocolType,
      patientName,
      patientPhone,
      patientEmail,
      medication,
      dosage,
      frequency,
      deliveryMethod,
      startDate,
      duration,
      totalSessions,
      supplyType,
      supplyDispensedDate,
      currentDose,
      baselineLabsDate,
      notes,
      initial_journey_stage,  // Optional: skip to a specific journey stage (e.g. 'dispensed' for POS purchases)
      source,                  // Optional: 'pos', 'admin', etc.
      force                    // Optional: true to bypass duplicate prevention
    } = req.body;

    if (!protocolType || !patientName || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const config = PROTOCOL_CONFIGS[protocolType] || {};

    // Calculate end date for time-bound protocols
    let endDate = null;
    let sessions = null;

    if (protocolType === 'peptide') {
      const days = parseInt(duration) || 30;
      sessions = totalSessions ? parseInt(totalSessions) : days;
      const effectiveDays = frequency === '2x_daily' ? Math.ceil(days / 2) : days;
      const end = new Date(startDate);
      end.setDate(end.getDate() + effectiveDays - 1);
      endDate = end.toISOString().split('T')[0];
    } else if (protocolType === 'red_light' || protocolType === 'hbot') {
      sessions = parseInt(totalSessions) || 1;
    }

    // Calculate supply for HRT
    let supplyQuantity = null;
    let supplyRemaining = null;
    let dosePerInjection = null;

    if (protocolType === 'hrt' && supplyType) {
      if (supplyType === 'prefilled') {
        supplyQuantity = 8;
        supplyRemaining = 8;
      } else if (supplyType === 'vial') {
        supplyQuantity = 10;
        supplyRemaining = 10;
      }
      const doseMatch = dosage?.match(/(\d+)mg/);
      if (doseMatch) {
        dosePerInjection = parseInt(doseMatch[1]);
      }
    }

    // Calculate followup labs due date
    let followupLabsDue = null;
    if (isHRTType(protocolType) || isWeightLossType(protocolType)) {
      const followup = new Date(startDate);
      followup.setDate(followup.getDate() + (config.followupLabsWeeks || 6) * 7);
      followupLabsDue = followup.toISOString().split('T')[0];
    }

    // Build protocol name
    let protocolName = '';
    if (protocolType === 'peptide') {
      const days = parseInt(duration) || 30;
      const durationLabel = days >= 90 ? '90' : days;
      if (isGHPeptide(medication)) {
        protocolName = `${durationLabel}-Day GH Protocol`;
      } else if (isRecoveryPeptide(medication)) {
        protocolName = `${durationLabel}-Day Recovery Protocol`;
      } else {
        protocolName = `${durationLabel}-Day Peptide Protocol`;
      }
    } else if (isHRTType(protocolType)) {
      protocolName = 'HRT Protocol';
    } else if (isWeightLossType(protocolType)) {
      protocolName = `Weight Loss - ${medication}`;
    } else if (protocolType === 'red_light') {
      protocolName = `Red Light Therapy (${totalSessions} sessions)`;
    } else if (protocolType === 'hbot') {
      protocolName = `HBOT (${totalSessions} sessions)`;
    }

    // Create the protocol via centralized function
    const result = await createProtocol({
      patient_id: patient_id || null,
      ghl_contact_id: ghl_contact_id || null,
      patient_name: patientName,
      patient_phone: patientPhone,
      patient_email: patientEmail,

      program_name: protocolName,
      program_type: protocolType,
      medication,
      selected_dose: dosage,
      frequency,
      delivery_method: deliveryMethod,

      start_date: startDate,
      end_date: endDate,
      total_sessions: sessions,
      sessions_used: 0,

      continuous_days_started: protocolType === 'peptide' ? startDate : null,
      continuous_days_used: 0,

      supply_type: supplyType || null,
      supply_dispensed_date: supplyDispensedDate || null,
      supply_quantity: supplyQuantity,
      supply_remaining: supplyRemaining,
      dose_per_injection: dosePerInjection,

      current_dose: currentDose || dosage,

      peptide_reminders_enabled: protocolType === 'peptide' ? true : null,

      notes,
    }, {
      source: 'admin-protocols-create',
      force: !!force,
    });

    if (!result.success) {
      if (result.duplicate) {
        return res.status(409).json({
          error: 'Active protocol already exists',
          details: `Patient already has an active ${protocolType} protocol. Use the existing protocol instead.`,
          existing_protocol_id: result.duplicate.protocolId || result.duplicate.protocol?.id,
        });
      }
      console.error('Protocol create error:', result.error);
      return res.status(500).json({ error: 'Failed to create protocol' });
    }

    const protocol = result.protocol;
    const accessToken = protocol.access_token;

    // Create scheduled sessions for peptides
    if (protocolType === 'peptide' && sessions) {
      const sessionInserts = [];
      const start = new Date(startDate);
      
      for (let i = 1; i <= sessions; i++) {
        const sessionDate = new Date(start);
        sessionDate.setDate(start.getDate() + i - 1);
        
        sessionInserts.push({
          protocol_id: protocol.id,
          session_number: i,
          scheduled_date: sessionDate.toISOString().split('T')[0],
          status: 'scheduled'
        });
      }

      await supabase.from('protocol_sessions').insert(sessionInserts);
    }

    // Create staff alert for weekly check-in (peptides)
    if (protocolType === 'peptide' && config.staffCheckinDays) {
      const checkinDate = new Date(startDate);
      checkinDate.setDate(checkinDate.getDate() + config.staffCheckinDays);
      
      await supabase.from('staff_alerts').insert({
        patient_id: patient_id || null,
        protocol_id: protocol.id,
        alert_type: 'weekly_checkin',
        title: `Weekly check-in: ${patientName}`,
        message: `${protocolName} - Day 7 check-in`,
        due_date: checkinDate.toISOString().split('T')[0],
        priority: 'medium'
      });
    }

    // Create staff alert for baseline labs (HRT/Weight Loss)
    if ((isHRTType(protocolType) || isWeightLossType(protocolType)) && !baselineLabsDate) {
      await supabase.from('staff_alerts').insert({
        patient_id: patient_id || null,
        protocol_id: protocol.id,
        alert_type: 'labs_due',
        title: `Baseline labs needed: ${patientName}`,
        message: `${protocolName} - Baseline labs required`,
        due_date: startDate,
        priority: 'high'
      });
    }

    // Auto-assign journey template and initial stage
    try {
      const { data: template } = await supabase
        .from('journey_templates')
        .select('id, stages')
        .eq('protocol_type', protocolType)
        .eq('is_default', true)
        .maybeSingle();

      if (template && template.stages && template.stages.length > 0) {
        // Use the requested initial stage if valid, otherwise default to first stage
        let initialStage = template.stages[0].key;
        if (initial_journey_stage) {
          const validStage = template.stages.find(s => s.key === initial_journey_stage);
          if (validStage) {
            initialStage = initial_journey_stage;
          }
        }

        await supabase
          .from('protocols')
          .update({
            journey_template_id: template.id,
            current_journey_stage: initialStage
          })
          .eq('id', protocol.id);

        // Log the initial journey event
        const sourceLabel = source === 'pos' ? 'POS purchase' : 'Protocol created';
        await supabase.from('journey_events').insert({
          patient_id: patient_id || null,
          protocol_id: protocol.id,
          current_stage: initialStage,
          previous_stage: null,
          trigger_type: 'auto',
          triggered_by: source || 'system',
          notes: `${sourceLabel} — placed at ${initialStage}`
        });

        console.log(`✓ Journey assigned: ${protocolType} template → ${initialStage} (source: ${source || 'admin'})`);
      }
    } catch (journeyErr) {
      console.error('Journey assignment error (non-fatal):', journeyErr);
      // Don't fail protocol creation over journey issues
    }

    // Weekly check-ins are auto-enabled for all peptide protocols (no opt-in needed)
    // The peptide-reminders cron job handles sending weekly check-in texts

    return res.status(201).json({
      success: true,
      protocol,
      access_token: accessToken
    });

  } catch (error) {
    console.error('Create protocol error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
