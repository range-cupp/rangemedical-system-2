// /pages/api/ghl/start-protocol.js
// Start a new protocol from Staff Quick Log form
// Range Medical
// CREATED: 2026-01-04
//
// Creates protocol in Supabase and syncs to GHL
// Handles different protocol types: weight_loss, hrt, peptide, iv_therapy, injection

import { createClient } from '@supabase/supabase-js';
import { 
  syncWeightLossProtocolCreated, 
  syncHRTProtocolCreated,
  syncPeptideProtocolCreated,
  syncIVPackageCreated,
  syncInjectionProtocolCreated,
  updateGHLContact,
  addGHLNote,
  createGHLTask
} from '../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Start Protocol webhook active',
      version: '2026-01-04'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    console.log('=== Start Protocol Request ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const contactId = payload.contact_id;
    const patientId = payload.patient_id;
    const contactName = payload.contact_name;
    const protocolType = payload.protocol_type;
    const startDate = payload.start_date || new Date().toISOString().split('T')[0];

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID required' });
    }

    // Find patient if not provided
    let patient;
    if (patientId) {
      const { data } = await supabase
        .from('patients')
        .select('id, name, ghl_contact_id')
        .eq('id', patientId)
        .single();
      patient = data;
    } else {
      const { data } = await supabase
        .from('patients')
        .select('id, name, ghl_contact_id')
        .eq('ghl_contact_id', contactId)
        .single();
      patient = data;
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Build protocol record based on type
    let protocolData = {
      patient_id: patient.id,
      status: 'active',
      start_date: startDate,
      program_type: protocolType,
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let responseMessage = '';
    let syncFunction = null;

    switch (protocolType) {
      case 'weight_loss':
        protocolData = {
          ...protocolData,
          program_name: `Weight Loss - ${payload.medication}`,
          medication: payload.medication,
          selected_dose: payload.starting_dose,
          delivery_method: payload.delivery_method,
          total_sessions: parseInt(payload.total_injections) || 4,
          sessions_used: 0,
          starting_weight: payload.starting_weight ? parseFloat(payload.starting_weight) : null
        };
        responseMessage = `Weight Loss protocol started: ${payload.medication} (${payload.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home'})`;
        break;

      case 'hrt':
        protocolData = {
          ...protocolData,
          program_name: `HRT - ${payload.medication}`,
          medication: payload.medication,
          selected_dose: payload.dosage,
          delivery_method: payload.fulfillment_type
        };
        responseMessage = `HRT protocol started: ${payload.medication}`;
        break;

      case 'peptide':
        protocolData = {
          ...protocolData,
          program_name: payload.program_name,
          medication: payload.medication,
          selected_dose: payload.dosage,
          frequency: payload.frequency
        };
        responseMessage = `Peptide protocol started: ${payload.medication}`;
        break;

      case 'iv_therapy':
        protocolData = {
          ...protocolData,
          program_name: payload.package_name || 'IV Therapy Package',
          total_sessions: parseInt(payload.total_sessions) || 1,
          sessions_used: 0
        };
        responseMessage = `IV Therapy package started: ${payload.total_sessions} sessions`;
        break;

      case 'injection':
        protocolData = {
          ...protocolData,
          program_name: payload.package_name || 'Injection Package',
          total_sessions: parseInt(payload.total_sessions) || 1,
          sessions_used: 0
        };
        responseMessage = `Injection package started: ${payload.total_sessions} sessions`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid protocol type' });
    }

    // Insert protocol into Supabase
    const { data: insertedProtocol, error: insertError } = await supabase
      .from('protocols')
      .insert(protocolData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating protocol:', insertError);
      return res.status(500).json({ error: 'Failed to create protocol: ' + insertError.message });
    }

    console.log('✓ Protocol created:', insertedProtocol.id);

    // Sync to GHL based on type
    try {
      switch (protocolType) {
        case 'weight_loss':
          await syncWeightLossProtocolCreated(contactId, insertedProtocol, patient.name);
          
          // Create first task based on delivery method
          if (payload.delivery_method === 'in_clinic') {
            // Create task for first injection
            const firstInjectionDate = new Date(startDate);
            await createGHLTask(
              contactId,
              `💉 First WL Injection - ${patient.name}`,
              firstInjectionDate.toISOString(),
              `${payload.medication} ${payload.starting_dose} - In Clinic`
            );
          } else {
            // Take home - add note about weekly check-ins
            await addGHLNote(contactId, `📱 TAKE HOME PROTOCOL STARTED

Patient will receive weekly SMS check-in links to report weight and side effects.

Medication: ${payload.medication}
Starting Dose: ${payload.starting_dose}
Injections: ${payload.total_injections}`);
          }
          break;

        case 'hrt':
          await syncHRTProtocolCreated(contactId, insertedProtocol, patient.name);
          break;

        case 'peptide':
          await syncPeptideProtocolCreated(contactId, insertedProtocol, patient.name);
          break;

        case 'iv_therapy':
          await syncIVPackageCreated(contactId, insertedProtocol, patient.name);
          break;

        case 'injection':
          await syncInjectionProtocolCreated(contactId, insertedProtocol, patient.name);
          break;
      }
    } catch (syncError) {
      console.error('GHL sync error (non-fatal):', syncError);
      // Continue - protocol was created successfully
    }

    console.log('✓ Protocol synced to GHL');

    return res.status(200).json({
      success: true,
      message: responseMessage,
      protocol_id: insertedProtocol.id,
      delivery_method: payload.delivery_method || null
    });

  } catch (error) {
    console.error('Start protocol error:', error);
    return res.status(500).json({ error: error.message });
  }
}
