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
      .select('*')
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
      const pt = (p.program_type || '').toLowerCase();
      const med = (p.medication || '').toLowerCase();
      let normalizedType = pt;

      // Map from program_type first
      if (pt.includes('hrt') || pt.includes('testosterone') || pt.includes('hormone')) {
        normalizedType = 'hrt';
      } else if (pt.includes('weight') || pt.includes('semaglutide') || pt.includes('tirzepatide')) {
        normalizedType = 'weight_loss';
      } else if (pt.includes('vitamin') || pt.includes('b12') || pt.includes('injection')) {
        normalizedType = 'vitamin';
      } else if (pt.includes('peptide') || pt.includes('bpc') || pt.includes('tb-500') || pt.includes('recovery') || pt.includes('jumpstart') || pt.includes('maintenance')) {
        normalizedType = 'peptide';
      } else if (pt.includes('iv') || pt.includes('infusion')) {
        normalizedType = 'iv_therapy';
      } else if (pt.includes('hbot') || pt.includes('hyperbaric')) {
        normalizedType = 'hbot';
      } else if (pt.includes('red') || pt.includes('light') || pt.includes('rlt')) {
        normalizedType = 'red_light';
      } else if (pt.includes('nad')) {
        normalizedType = 'vitamin';
      } else {
        // Fall back to medication name
        if (med.includes('testosterone') || med.includes('estradiol') || med.includes('progesterone')) {
          normalizedType = 'hrt';
        } else if (med.includes('semaglutide') || med.includes('tirzepatide') || med.includes('retatrutide')) {
          normalizedType = 'weight_loss';
        } else if (med.includes('b12') || med.includes('nad') || med.includes('lipo') || med.includes('taurine') || med.includes('toradol') || med.includes('glutathione')) {
          normalizedType = 'vitamin';
        } else if (med.includes('bpc') || med.includes('tb-500') || med.includes('tb500') || med.includes('wolverine') || med.includes('recovery') || med.includes('glow') || med.includes('ghk')) {
          normalizedType = 'peptide';
        }
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
