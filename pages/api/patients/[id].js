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

    // Fetch protocols for this patient with calculated fields
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false });

    if (protocolsError) {
      console.error('Protocols fetch error:', protocolsError);
    }

    // Add calculated fields to protocols
    const protocolsWithCalcs = (protocols || []).map(p => {
      let days_remaining = null;
      let duration_days = null;
      
      if (p.end_date) {
        const end = new Date(p.end_date);
        const today = new Date();
        days_remaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      }
      
      if (p.start_date && p.end_date) {
        const start = new Date(p.start_date);
        const end = new Date(p.end_date);
        duration_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      }

      let sessions_remaining = null;
      if (p.total_sessions !== null && p.sessions_used !== null) {
        sessions_remaining = p.total_sessions - p.sessions_used;
      }

      return {
        ...p,
        days_remaining,
        duration_days,
        sessions_remaining
      };
    });

    return res.status(200).json({
      patient,
      protocols: protocolsWithCalcs
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
