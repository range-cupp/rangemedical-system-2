// /pages/api/admin/patients/[id].js
// Patient Detail API
// Range Medical

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
    // Try to find patient by GHL contact ID first
    let patient = null;

    // Check patients table
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('ghl_contact_id', id)
      .maybeSingle();

    if (patientData) {
      patient = patientData;
    } else {
      // Try by ID
      const { data: byId } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (byId) {
        patient = byId;
      }
    }

    // Get protocols for this patient
    const { data: protocols } = await supabase
      .from('protocols')
      .select('*')
      .or(`ghl_contact_id.eq.${id},patient_id.eq.${id}`)
      .order('created_at', { ascending: false });

    // If no patient found but we have protocols, construct from first protocol
    if (!patient && protocols?.length > 0) {
      const p = protocols[0];
      patient = {
        id: id,
        ghl_contact_id: p.ghl_contact_id || id,
        first_name: p.patient_name?.split(' ')[0] || '',
        last_name: p.patient_name?.split(' ').slice(1).join(' ') || '',
        email: p.patient_email,
        phone: p.patient_phone
      };
    }

    // Get purchases for this patient
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .eq('ghl_contact_id', id)
      .order('payment_date', { ascending: false });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.status(200).json({
      patient,
      protocols: protocols || [],
      purchases: purchases || []
    });

  } catch (error) {
    console.error('Patient detail error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
