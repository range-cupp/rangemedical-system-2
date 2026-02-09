// /pages/api/service-log/patient-protocols.js
// Get active protocols for a patient (used by Service Log)
// Range Medical - 2026-02-09

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_id } = req.query;

  if (!patient_id) {
    return res.status(400).json({ success: false, error: 'patient_id is required' });
  }

  try {
    // Fetch active protocols for this patient
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('id, program_type, program_name, medication, selected_dose, frequency, total_sessions, sessions_used, status, start_date, supply_type')
      .eq('patient_id', patient_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patient protocols:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Normalize program_type to match SERVICE_TYPES in service-log.js
    // SERVICE_TYPES uses: testosterone->hrt, weight_loss, vitamin, peptide, iv_therapy, hbot, red_light
    const normalizedProtocols = (protocols || []).map(p => {
      let normalizedType = p.program_type?.toLowerCase() || '';

      // Map common variations to the expected program_type values
      if (normalizedType === 'hrt' || normalizedType.includes('testosterone') || normalizedType.includes('hrt')) {
        normalizedType = 'hrt';
      } else if (normalizedType.includes('weight') || normalizedType.includes('semaglutide') || normalizedType.includes('tirzepatide')) {
        normalizedType = 'weight_loss';
      } else if (normalizedType.includes('vitamin') || normalizedType.includes('b12')) {
        normalizedType = 'vitamin';
      } else if (normalizedType.includes('peptide') || normalizedType.includes('bpc') || normalizedType.includes('tb-500')) {
        normalizedType = 'peptide';
      } else if (normalizedType.includes('iv') || normalizedType.includes('infusion')) {
        normalizedType = 'iv_therapy';
      } else if (normalizedType.includes('hbot') || normalizedType.includes('hyperbaric')) {
        normalizedType = 'hbot';
      } else if (normalizedType.includes('red') || normalizedType.includes('light') || normalizedType.includes('rlt')) {
        normalizedType = 'red_light';
      }

      return {
        ...p,
        program_type: normalizedType
      };
    });

    return res.status(200).json({
      success: true,
      protocols: normalizedProtocols
    });

  } catch (err) {
    console.error('Patient protocols API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
