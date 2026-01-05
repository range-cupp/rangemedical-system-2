// /pages/api/ghl/log-wl-injection.js
// GHL Form Webhook - Log Weight Loss Injection
// Range Medical
// CREATED: 2026-01-04
//
// This endpoint receives form submissions from GHL and:
// 1. Finds the patient's active Weight Loss protocol
// 2. Logs the injection with weight/dose
// 3. Updates GHL custom fields
// 4. Creates task for next injection

import { createClient } from '@supabase/supabase-js';
import { syncWeightLossInjectionLogged } from '../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Allow GET for webhook verification
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'Weight Loss Injection webhook active',
      version: '2026-01-04'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    
    console.log('=== WL Injection Form Received ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Extract data from GHL form - try multiple field name formats
    const contactId = payload.contact_id || payload.contactId || payload.contact?.id;
    const contactName = payload.contact_name || payload.full_name || payload.name || 
                        `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
    const weight = payload.weight || payload.current_weight || payload.wl_weight;
    const dose = payload.dose || payload.current_dose || payload.wl_dose;
    const notes = payload.notes || payload.injection_notes || '';
    const logDate = payload.date || payload.injection_date || new Date().toISOString().split('T')[0];

    if (!contactId) {
      console.log('No contact ID in payload');
      return res.status(400).json({ error: 'Contact ID required' });
    }

    // Find patient by GHL contact ID
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id')
      .eq('ghl_contact_id', contactId)
      .single();

    if (!patient) {
      console.log('Patient not found for contact:', contactId);
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Find active Weight Loss protocol
    const { data: protocol } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or('program_type.eq.weight_loss,program_name.ilike.%weight loss%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!protocol) {
      console.log('No active Weight Loss protocol for patient:', patient.id);
      return res.status(404).json({ error: 'No active Weight Loss protocol found' });
    }

    console.log('Found protocol:', protocol.id, protocol.program_name);

    // Create log entry
    const logEntry = {
      protocol_id: protocol.id,
      patient_id: patient.id,
      log_type: 'injection',
      log_date: logDate,
      weight: weight ? parseFloat(weight) : null,
      dose: dose || protocol.selected_dose,
      notes: notes || null
    };

    const { data: insertedLog, error: logError } = await supabase
      .from('protocol_logs')
      .insert(logEntry)
      .select()
      .single();

    if (logError) {
      console.error('Error creating log:', logError);
    }

    // Update protocol sessions
    const newSessionsUsed = (protocol.sessions_used || 0) + 1;
    const updates = {
      sessions_used: newSessionsUsed,
      updated_at: new Date().toISOString()
    };

    // Auto-complete if all sessions used
    if (protocol.total_sessions && newSessionsUsed >= protocol.total_sessions) {
      updates.status = 'completed';
    }

    // Update starting weight if first injection
    if (newSessionsUsed === 1 && weight) {
      updates.starting_weight = parseFloat(weight);
    }

    const { error: updateError } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', protocol.id);

    if (updateError) {
      console.error('Error updating protocol:', updateError);
    }

    // Sync to GHL
    const updatedProtocol = {
      ...protocol,
      sessions_used: newSessionsUsed,
      starting_weight: updates.starting_weight || protocol.starting_weight,
      status: updates.status || protocol.status
    };

    await syncWeightLossInjectionLogged(
      contactId, 
      updatedProtocol, 
      insertedLog || logEntry, 
      patient.name || contactName
    );

    console.log('✓ Injection logged successfully');

    return res.status(200).json({
      success: true,
      message: `Injection #${newSessionsUsed} logged`,
      injections_used: newSessionsUsed,
      injections_remaining: (protocol.total_sessions || 4) - newSessionsUsed,
      protocol_status: updates.status || 'active'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
