// /pages/api/patient-checkin/submit.js
// Submit patient weight loss check-in
// Range Medical
// CREATED: 2026-01-04
//
// This endpoint receives patient self-reported data:
// - Weight
// - Side effects
// - Notes
// It logs to Supabase and syncs to GHL

import { createClient } from '@supabase/supabase-js';
import { updateGHLContact, addGHLNote } from '../../../lib/ghl-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { contact_id, weight, side_effects, notes } = req.body;
    
    if (!contact_id) {
      return res.status(400).json({ error: 'Contact ID required' });
    }
    
    if (!weight) {
      return res.status(400).json({ error: 'Weight required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const parsedWeight = parseFloat(weight);

    // Find patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, ghl_contact_id')
      .eq('ghl_contact_id', contact_id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Find active weight loss protocol
    const { data: protocol, error: protocolError } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or('program_type.eq.weight_loss,program_name.ilike.%weight loss%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (protocolError || !protocol) {
      return res.status(404).json({ error: 'No active weight loss protocol found' });
    }

    // Build notes string with side effects
    let logNotes = 'Patient self-reported check-in';
    if (side_effects && side_effects.length > 0) {
      logNotes += ` | Side effects: ${side_effects.join(', ')}`;
    }
    if (notes && notes.trim()) {
      logNotes += ` | Notes: ${notes.trim()}`;
    }

    // Create log entry (weigh-in type - doesn't increment sessions)
    const logEntry = {
      protocol_id: protocol.id,
      patient_id: patient.id,
      log_type: 'weigh_in',
      log_date: today,
      weight: parsedWeight,
      notes: logNotes
    };

    const { data: insertedLog, error: logError } = await supabase
      .from('protocol_logs')
      .insert(logEntry)
      .select()
      .single();

    if (logError) {
      console.error('Error creating log:', logError);
    }

    // Calculate weight change
    let weightChange = '';
    if (protocol.starting_weight) {
      const change = parsedWeight - protocol.starting_weight;
      weightChange = change < 0 ? `↓ ${Math.abs(change).toFixed(1)} lbs` : `↑ ${change.toFixed(1)} lbs`;
    }

    // Update GHL current weight field
    await updateGHLContact(contact_id, {
      'contact.wl__current_weight': String(parsedWeight)
    });

    // Add note to GHL
    let ghlNote = `📱 PATIENT WEEKLY CHECK-IN

Date: ${today}
Weight: ${parsedWeight} lbs`;

    if (weightChange) {
      ghlNote += ` (${weightChange} from start)`;
    }

    if (side_effects && side_effects.length > 0) {
      ghlNote += `\n\n⚠️ Side Effects Reported:\n• ${side_effects.join('\n• ')}`;
    } else {
      ghlNote += `\n\nNo side effects reported ✓`;
    }

    if (notes && notes.trim()) {
      ghlNote += `\n\nPatient Notes: "${notes.trim()}"`;
    }

    await addGHLNote(contact_id, ghlNote);

    console.log('✓ Patient check-in logged:', patient.name, parsedWeight, 'lbs');

    return res.status(200).json({
      success: true,
      message: 'Check-in recorded',
      weight: parsedWeight,
      weight_change: weightChange || null
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
