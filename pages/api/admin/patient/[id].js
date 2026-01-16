// /pages/api/admin/patient/[id].js
// Patient Profile API - fetches all data for a single patient
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  try {
    let patient = null;

    // First try to find by UUID (if it looks like a UUID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        patient = data;
      }
    }

    // If not found by UUID, try by ghl_contact_id
    if (!patient) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('ghl_contact_id', id)
        .single();
      
      if (!error && data) {
        patient = data;
      }
    }

    // If still not found, return error
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientId = patient.id;

    // Fetch protocols by patient_id (this is the correct field!)
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (protocolsError) {
      console.error('Error fetching protocols:', protocolsError);
    }

    // Fetch purchases
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .eq('patient_id', patientId)
      .order('purchase_date', { ascending: false });

    // Fetch intakes
    const { data: intakes } = await supabase
      .from('intakes')
      .select('*')
      .eq('patient_id', patientId)
      .order('submitted_at', { ascending: false });

    // Fetch consents
    const { data: consents } = await supabase
      .from('consents')
      .select('*')
      .eq('patient_id', patientId)
      .order('submitted_at', { ascending: false });

    // Fetch injection logs
    const { data: injectionLogs } = await supabase
      .from('injection_logs')
      .select('*')
      .eq('patient_id', patientId)
      .order('entry_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch lab results
    const { data: labResults } = await supabase
      .from('lab_results')
      .select('*')
      .eq('patient_id', patientId)
      .order('result_date', { ascending: false });

    // Return complete patient data
    return res.status(200).json({
      ...patient,
      protocols: protocols || [],
      purchases: purchases || [],
      intakes: intakes || [],
      consents: consents || [],
      injection_logs: injectionLogs || [],
      lab_results: labResults || []
    });

  } catch (error) {
    console.error('Patient API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
