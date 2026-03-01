// /pages/api/admin/protocols/create.js
// Create Protocol API with type-specific logic
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { logComm } from '../../../../lib/comms-log';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GHL_API_KEY = process.env.GHL_API_KEY;
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
      notes
    } = req.body;

    if (!protocolType || !patientName || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const config = PROTOCOL_CONFIGS[protocolType] || {};
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Calculate end date for time-bound protocols
    let endDate = null;
    let sessions = null;

    if (protocolType === 'peptide') {
      const days = parseInt(duration) || 10;
      sessions = days;
      // Twice daily = supply lasts half as long
      const effectiveDays = frequency === '2x_daily' ? Math.ceil(days / 2) : days;
      const end = new Date(startDate);
      end.setDate(end.getDate() + effectiveDays - 1);
      endDate = end.toISOString().split('T')[0];
    } else if (protocolType === 'red_light' || protocolType === 'hbot') {
      sessions = parseInt(totalSessions) || 1;
    }
    // HRT and weight_loss are ongoing (no end date)

    // Calculate supply for HRT
    let supplyQuantity = null;
    let supplyRemaining = null;
    let dosePerInjection = null;

    if (protocolType === 'hrt' && supplyType) {
      if (supplyType === 'prefilled') {
        supplyQuantity = 8;
        supplyRemaining = 8;
      } else if (supplyType === 'vial') {
        supplyQuantity = 10; // ml
        supplyRemaining = 10;
      }
      // Extract dose from dosage string (e.g., "0.3ml/60mg" -> 60)
      const doseMatch = dosage?.match(/(\d+)mg/);
      if (doseMatch) {
        dosePerInjection = parseInt(doseMatch[1]);
      }
    }

    // Calculate followup labs due date
    let followupLabsDue = null;
    if (protocolType === 'hrt' || protocolType === 'weight_loss') {
      const followup = new Date(startDate);
      followup.setDate(followup.getDate() + (config.followupLabsWeeks || 6) * 7);
      followupLabsDue = followup.toISOString().split('T')[0];
    }

    // Build protocol name
    let protocolName = '';
    if (protocolType === 'peptide') {
      protocolName = `${duration || 10}-Day Recovery Protocol`;
    } else if (protocolType === 'hrt') {
      protocolName = 'HRT Protocol';
    } else if (protocolType === 'weight_loss') {
      protocolName = `Weight Loss - ${medication}`;
    } else if (protocolType === 'red_light') {
      protocolName = `Red Light Therapy (${totalSessions} sessions)`;
    } else if (protocolType === 'hbot') {
      protocolName = `HBOT (${totalSessions} sessions)`;
    }

    // Create the protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .insert({
        patient_id: patient_id || null,
        ghl_contact_id: ghl_contact_id || null,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail,

        program_name: protocolName,
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
        injections_at_current_dose: 0,
        
        baseline_labs_due: baselineLabsDate ? null : startDate,
        baseline_labs_completed: !!baselineLabsDate,
        baseline_labs_date: baselineLabsDate || null,
        followup_labs_due: followupLabsDue,
        
        program_type: protocolType,
        peptide_reminders_enabled: protocolType === 'peptide' ? false : null,

        status: 'active',
        access_token: accessToken,
        notes
      })
      .select()
      .single();

    if (protocolError) {
      console.error('Protocol create error:', protocolError);
      return res.status(500).json({ error: 'Failed to create protocol' });
    }

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
    if ((protocolType === 'hrt' || protocolType === 'weight_loss') && !baselineLabsDate) {
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

    // Send opt-in SMS for peptide protocols (ask patient to agree to weekly check-ins)
    if (protocolType === 'peptide' && ghl_contact_id && GHL_API_KEY) {
      const firstName = patientName ? patientName.split(' ')[0] : 'there';
      const optinUrl = `${BASE_URL}/peptide-checkin-optin.html?contact_id=${ghl_contact_id}&protocol_id=${protocol.id}`;
      const optinMessage = `Hi ${firstName}! You've started your recovery peptide protocol at Range Medical. We offer quick weekly check-ins via text to track your progress — takes just 30 seconds.\n\nWould you like to opt in?\n${optinUrl}\n\n- Range Medical`;

      try {
        const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-04-15',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'SMS',
            contactId: ghl_contact_id,
            message: optinMessage
          })
        });

        if (smsRes.ok) {
          console.log(`✓ Opt-in SMS sent to ${patientName} (${ghl_contact_id})`);

          // Log the opt-in request
          await supabase.from('protocol_logs').insert({
            protocol_id: protocol.id,
            patient_id: patient_id || null,
            log_type: 'peptide_checkin_optin_sent',
            log_date: new Date().toISOString().split('T')[0],
            notes: `Weekly check-in opt-in SMS sent to patient`
          });

          await logComm({
            channel: 'sms',
            messageType: 'peptide_checkin_optin_request',
            message: optinMessage,
            source: 'protocol-create',
            patientId: patient_id || null,
            protocolId: protocol.id,
            ghlContactId: ghl_contact_id,
            patientName
          });
        } else {
          console.error('Opt-in SMS send failed:', await smsRes.text());
        }
      } catch (smsError) {
        console.error('Opt-in SMS error:', smsError);
        // Don't fail the protocol creation over SMS issues
      }
    }

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
