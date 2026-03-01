// /pages/api/peptide-checkin/optin-info.js
// Get patient/protocol info for the weekly check-in opt-in form
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
    const { contact_id, protocol_id } = req.query;

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

    // Find active peptide protocol — prefer specific protocol_id if given
    let protocolQuery = supabase
      .from('protocols')
      .select('id, medication, primary_peptide, program_name, start_date, end_date, total_days, total_sessions, peptide_reminders_enabled')
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .or('program_type.eq.peptide,program_name.ilike.%peptide%')
      .order('created_at', { ascending: false })
      .limit(1);

    if (protocol_id) {
      protocolQuery = supabase
        .from('protocols')
        .select('id, medication, primary_peptide, program_name, start_date, end_date, total_days, total_sessions, peptide_reminders_enabled')
        .eq('id', protocol_id)
        .single();
    }

    const { data: protocolData } = protocol_id
      ? await protocolQuery
      : await protocolQuery.then(r => ({ data: r.data?.[0] || null }));

    const protocol = protocolData;

    // Check if already opted in
    if (protocol && protocol.peptide_reminders_enabled === true) {
      return res.status(200).json({
        patient: {
          id: patient.id,
          first_name: firstName,
          ghl_contact_id: patient.ghl_contact_id
        },
        protocol: {
          id: protocol.id,
          medication: protocol.primary_peptide || protocol.medication || 'Recovery Peptide',
          program_name: protocol.program_name,
          total_days: protocol.total_days || protocol.total_sessions || null
        },
        already_opted_in: true
      });
    }

    // Calculate total days for display
    let totalDays = null;
    if (protocol) {
      totalDays = protocol.total_days || protocol.total_sessions;
      if (!totalDays && protocol.start_date && protocol.end_date) {
        const startParts = protocol.start_date.split('-');
        const endParts = protocol.end_date.split('-');
        const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
        const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
        totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
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
        program_name: protocol.program_name,
        total_days: totalDays
      } : null,
      already_opted_in: false
    });

  } catch (error) {
    console.error('Peptide optin info API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
