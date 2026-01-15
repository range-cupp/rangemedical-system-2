// /pages/api/patient-checkin/info.js
// Get patient info for check-in form
// Range Medical
// CREATED: 2026-01-04

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contact_id } = req.query;
    
    if (!contact_id) {
      return res.status(400).json({ error: 'Contact ID required' });
    }

    // Find patient by GHL contact ID
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, email, phone, ghl_contact_id')
      .eq('ghl_contact_id', contact_id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Extract first name
    const firstName = patient.name ? patient.name.split(' ')[0] : null;

    // Find active weight loss protocol
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, medication, selected_dose, program_name, start_date')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or('program_type.eq.weight_loss,program_name.ilike.%weight loss%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return res.status(200).json({
      patient: {
        id: patient.id,
        first_name: firstName,
        ghl_contact_id: patient.ghl_contact_id
      },
      protocol: protocol ? {
        id: protocol.id,
        medication: protocol.medication,
        dose: protocol.selected_dose,
        program_name: protocol.program_name
      } : null
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
