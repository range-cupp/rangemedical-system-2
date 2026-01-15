// /pages/api/patient-portal/[token].js
// Patient Portal API - Works with access_token OR protocol ID
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let protocols = [];
    let patient = null;

    // Check if token looks like a UUID (protocol ID) vs access token
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

    if (isUUID) {
      // Look up by protocol ID directly
      const { data: protocol } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', token)
        .maybeSingle();

      if (protocol) {
        patient = {
          id: protocol.patient_id,
          first_name: protocol.patient_name?.split(' ')[0] || 'there',
          last_name: protocol.patient_name?.split(' ').slice(1).join(' ') || '',
          phone: protocol.patient_phone,
          email: protocol.patient_email,
          ghl_contact_id: protocol.ghl_contact_id
        };

        const totalDays = protocol.total_sessions || protocol.total_days || protocol.duration_days || 10;
        
        protocols.push({
          id: protocol.id,
          protocol_name: protocol.program_name || `${totalDays}-Day Recovery Protocol`,
          medication: protocol.primary_peptide,
          dosage: protocol.dose_amount,
          frequency: protocol.dose_frequency || 'daily',
          delivery_method: protocol.injection_location || 'take_home',
          start_date: protocol.start_date,
          end_date: protocol.end_date,
          total_sessions: totalDays,
          sessions_completed: protocol.injections_completed || 0,
          status: protocol.status,
          special_instructions: protocol.special_instructions,
          category: 'peptide',
          checkin_type: 'recovery',
          checkin_due: true
        });
      }
    }

    // If not found by ID, try access_token
    if (protocols.length === 0) {
      const { data: oldProtocols, error: oldError } = await supabase
        .from('protocols')
        .select('*')
        .eq('access_token', token);

      if (oldProtocols?.length > 0) {
        const first = oldProtocols[0];
        
        patient = {
          id: first.patient_id,
          first_name: first.patient_name?.split(' ')[0] || 'there',
          last_name: first.patient_name?.split(' ').slice(1).join(' ') || '',
          phone: first.patient_phone,
          email: first.patient_email,
          ghl_contact_id: first.ghl_contact_id
        };

        for (const p of oldProtocols) {
          const totalDays = p.total_sessions || p.total_days || p.duration_days || 10;

          protocols.push({
            id: p.id,
            protocol_name: p.program_name || `${totalDays}-Day Recovery Protocol`,
            medication: p.primary_peptide,
            dosage: p.dose_amount,
            frequency: p.dose_frequency || 'daily',
            delivery_method: p.injection_location || 'take_home',
            start_date: p.start_date,
            end_date: p.end_date,
            total_sessions: totalDays,
            sessions_completed: p.injections_completed || 0,
            status: p.status,
            special_instructions: p.special_instructions,
            category: 'peptide',
            checkin_type: 'recovery',
            checkin_due: true
          });
        }
      }
    }

    // Try new patient_protocols table
    if (protocols.length === 0) {
      const { data: newProtocols } = await supabase
        .from('patient_protocols')
        .select('*')
        .or(`access_token.eq.${token},id.eq.${token}`);

      if (newProtocols?.length > 0) {
        const first = newProtocols[0];
        
        patient = {
          id: first.patient_id,
          first_name: first.patient_name?.split(' ')[0] || 'there',
          last_name: first.patient_name?.split(' ').slice(1).join(' ') || '',
          phone: first.patient_phone,
          email: first.patient_email
        };

        for (const p of newProtocols) {
          protocols.push({
            ...p,
            protocol_name: p.protocol_name || p.program_name,
            category: 'peptide',
            checkin_type: 'recovery',
            checkin_due: true
          });
        }
      }
    }

    if (protocols.length === 0) {
      return res.status(404).json({ error: 'No protocols found for this link' });
    }

    return res.status(200).json({
      patient: patient || { first_name: 'there' },
      protocols
    });

  } catch (error) {
    console.error('Portal API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
