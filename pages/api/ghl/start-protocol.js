// /pages/api/ghl/start-protocol.js
// Start a new protocol for a patient
// Handles different protocol types: weight_loss, hrt, peptide, iv_therapy, injection, hbot, rlt
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GHL API helper
async function addGHLNote(contactId, noteBody) {
  if (!contactId) return null;
  
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: noteBody })
    });
    return await response.json();
  } catch (err) {
    console.error('GHL note error:', err);
    return null;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    // Validate required fields
    if (!payload.contact_id || !payload.protocol_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: contact_id and protocol_type' 
      });
    }

    // Find or create patient
    let patient;
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('ghl_contact_id', payload.contact_id)
      .single();

    if (existingPatient) {
      patient = existingPatient;
    } else {
      // Create new patient
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          name: payload.contact_name || 'Unknown',
          ghl_contact_id: payload.contact_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Create patient error:', createError);
        return res.status(500).json({ error: 'Failed to create patient' });
      }
      patient = newPatient;
    }

    // Parse start date
    const startDate = payload.start_date 
      ? new Date(payload.start_date) 
      : new Date();
    const startDateStr = startDate.toISOString().split('T')[0];

    // Base protocol data
    let protocolData = {
      patient_id: patient.id,
      program_type: payload.protocol_type,
      status: 'active',
      start_date: startDateStr,
      created_at: new Date().toISOString()
    };

    let responseMessage = '';

    // Build protocol based on type
    switch (payload.protocol_type) {
      case 'weight_loss':
        const wlDelivery = payload.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home';
        const wlSessions = payload.delivery_method === 'take_home' 
          ? (parseInt(payload.total_sessions) || 4)
          : (parseInt(payload.total_sessions) || 4);
        
        protocolData = {
          ...protocolData,
          program_name: `Weight Loss - ${payload.medication || 'Retatrutide'}`,
          medication: payload.medication || 'Retatrutide',
          selected_dose: payload.dosage,
          delivery_method: payload.delivery_method,
          total_sessions: wlSessions,
          sessions_used: 0,
          starting_weight: payload.starting_weight ? parseFloat(payload.starting_weight) : null
        };
        responseMessage = `Weight Loss protocol started: ${payload.medication} (${wlDelivery})`;
        break;

      case 'peptide':
        const peptideDelivery = payload.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home';
        
        // Calculate end date based on program duration
        let peptideDuration = 30; // default 30 days
        const programName = (payload.program_name || '').toLowerCase();
        if (programName.includes('7 day') || programName.includes('7-day')) {
          peptideDuration = 7;
        } else if (programName.includes('10 day') || programName.includes('10-day')) {
          peptideDuration = 10;
        } else if (programName.includes('20 day') || programName.includes('20-day')) {
          peptideDuration = 20;
        } else if (programName.includes('30 day') || programName.includes('30-day')) {
          peptideDuration = 30;
        } else if (payload.duration_days) {
          peptideDuration = parseInt(payload.duration_days);
        }
        
        const peptideEndDate = new Date(startDate);
        peptideEndDate.setDate(peptideEndDate.getDate() + peptideDuration);
        const peptideEndDateStr = peptideEndDate.toISOString().split('T')[0];
        
        protocolData = {
          ...protocolData,
          program_name: /^\d+\s*Day$/i.test(payload.program_name) ? `Peptide Therapy - ${peptideDuration} Days` : `Peptide - ${payload.program_name}`,
          medication: payload.medication,
          selected_dose: payload.dosage,
          frequency: payload.frequency,
          delivery_method: payload.delivery_method,
          end_date: peptideEndDateStr
        };
        responseMessage = `Peptide protocol started: ${payload.medication} ${payload.program_name} (${peptideDuration} days, ${peptideDelivery})`;
        break;

      case 'hrt':
        const hrtDelivery = payload.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home';
        
        // Determine HRT type from medication
        let hrtType = 'male';
        const medLower = (payload.medication || '').toLowerCase();
        if (medLower.includes('female') || medLower.includes('estrogen') || medLower.includes('progesterone')) {
          hrtType = 'female';
        }
        
        protocolData = {
          ...protocolData,
          program_name: `HRT - ${payload.medication}`,
          medication: payload.medication,
          selected_dose: payload.dosage,
          delivery_method: payload.delivery_method,
          supply_type: payload.supply_type || payload.fulfillment_type || null // Support both for backwards compatibility
        };
        responseMessage = `HRT protocol started: ${payload.medication} (${hrtDelivery})`;
        break;

      case 'iv_therapy':
        const ivSessions = parseInt(payload.total_sessions) || 1;
        const ivName = payload.therapy_type || 'Custom';
        protocolData = {
          ...protocolData,
          program_name: ivSessions > 1 ? `${ivName} - ${ivSessions} Pack` : `${ivName}`,
          medication: payload.therapy_type,
          total_sessions: ivSessions,
          sessions_used: 0,
          delivery_method: 'in_clinic'
        };
        responseMessage = `IV Therapy protocol started: ${payload.therapy_type} (${ivSessions} sessions)`;
        break;

      case 'hbot':
        const hbotSessions = parseInt(payload.total_sessions) || 1;
        protocolData = {
          ...protocolData,
          program_name: `HBOT - ${hbotSessions} Pack`,
          total_sessions: hbotSessions,
          sessions_used: 0,
          delivery_method: 'in_clinic'
        };
        responseMessage = `HBOT protocol started: ${hbotSessions} sessions`;
        break;

      case 'rlt':
        const rltSessions = parseInt(payload.total_sessions) || 1;
        protocolData = {
          ...protocolData,
          program_name: `Red Light Therapy - ${rltSessions} Pack`,
          total_sessions: rltSessions,
          sessions_used: 0,
          delivery_method: 'in_clinic'
        };
        responseMessage = `Red Light Therapy protocol started: ${rltSessions} sessions`;
        break;

      case 'injection':
        const injSessions = parseInt(payload.total_sessions) || 1;
        protocolData = {
          ...protocolData,
          program_name: `Injection Pack - ${payload.injection_type || 'Custom'}`,
          medication: payload.injection_type,
          total_sessions: injSessions,
          sessions_used: 0,
          delivery_method: 'in_clinic'
        };
        responseMessage = `Injection protocol started: ${payload.injection_type} (${injSessions} sessions)`;
        break;

      default:
        return res.status(400).json({ error: `Unknown protocol type: ${payload.protocol_type}` });
    }

    // Insert protocol
    const { data: protocol, error: insertError } = await supabase
      .from('protocols')
      .insert(protocolData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert protocol error:', insertError);
      return res.status(500).json({ error: `Failed to create protocol: ${insertError.message}` });
    }

    // Add note to GHL
    const ghlNote = `📋 PROTOCOL STARTED

Type: ${payload.protocol_type.toUpperCase()}
${protocolData.program_name ? `Program: ${protocolData.program_name}` : ''}
${protocolData.medication ? `Medication: ${protocolData.medication}` : ''}
${protocolData.selected_dose ? `Dose: ${protocolData.selected_dose}` : ''}
${protocolData.delivery_method ? `Delivery: ${protocolData.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home'}` : ''}
${protocolData.supply_type ? `Supply: ${protocolData.supply_type}` : ''}
${protocolData.total_sessions ? `Sessions: ${protocolData.total_sessions}` : ''}
Start Date: ${startDateStr}
${protocolData.end_date ? `End Date: ${protocolData.end_date}` : ''}

Protocol ID: ${protocol.id}`;

    await addGHLNote(payload.contact_id, ghlNote);

    console.log(`✓ Protocol created: ${protocol.id} - ${responseMessage}`);

    return res.status(200).json({
      success: true,
      message: responseMessage,
      protocol: protocol
    });

  } catch (err) {
    console.error('Start protocol error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
