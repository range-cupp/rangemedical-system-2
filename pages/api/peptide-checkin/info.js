// /pages/api/peptide-checkin/info.js
// Get patient info for peptide recovery check-in form
// Range Medical

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
      .select('id, name, first_name, last_name, email, phone, ghl_contact_id')
      .eq('ghl_contact_id', contact_id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : null);

    // Find active peptide protocol
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id, medication, primary_peptide, selected_dose, dose_amount, program_name, start_date, end_date, duration_days')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or('program_type.eq.peptide,program_name.ilike.%peptide%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate current day
    let currentDay = null;
    let totalDays = null;
    if (protocol && protocol.start_date) {
      const now = new Date();
      const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      pacific.setHours(0, 0, 0, 0);
      const parts = protocol.start_date.split('-');
      const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      start.setHours(0, 0, 0, 0);
      currentDay = Math.floor((pacific - start) / (1000 * 60 * 60 * 24)) + 1;

      // Calculate total days
      totalDays = protocol.duration_days;
      if (!totalDays && protocol.end_date) {
        const endParts = protocol.end_date.split('-');
        const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
        totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
      }
      if (!totalDays && protocol.program_name) {
        const match = protocol.program_name.match(/(\d+)\s*day/i);
        if (match) totalDays = parseInt(match[1]);
      }
    }

    return res.status(200).json({
      patient: {
        id: patient.id,
        first_name: firstName,
        ghl_contact_id: patient.ghl_contact_id
      },
      protocol: protocol ? {
        id: protocol.id,
        medication: protocol.primary_peptide || protocol.medication || 'Recovery Peptide',
        dose: protocol.dose_amount || protocol.selected_dose || null,
        program_name: protocol.program_name,
        current_day: currentDay,
        total_days: totalDays
      } : null
    });

  } catch (error) {
    console.error('Peptide checkin info API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
