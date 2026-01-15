// pages/api/patients/[id].js
// Fetch single patient with their protocols
// Deploy to: pages/api/patients/[id].js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (patientError) {
      console.error('Patient fetch error:', patientError);
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Fetch protocols for this patient
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false });

    if (protocolsError) {
      console.error('Protocols fetch error:', protocolsError);
    }

    return res.status(200).json({
      patient,
      protocols: protocols || []
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
