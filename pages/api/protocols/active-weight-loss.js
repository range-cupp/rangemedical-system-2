// /pages/api/protocols/active-weight-loss.js
// Get active Weight Loss (In Clinic) protocols for a patient
// Used by Log Injection modal
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

  const { patientId, ghlContactId } = req.query;

  if (!patientId && !ghlContactId) {
    return res.status(400).json({ error: 'Patient ID or GHL Contact ID required' });
  }

  try {
    let query = supabase
      .from('protocols')
      .select('*')
      .eq('status', 'active')
      .eq('delivery_method', 'in_clinic')
      .ilike('program_name', '%weight loss%');

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data: protocols, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching protocols:', error);
      return res.status(500).json({ error: 'Failed to fetch protocols' });
    }

    // Also try by ghl_contact_id if no results and ghlContactId provided
    if ((!protocols || protocols.length === 0) && ghlContactId) {
      // First find patient_id from ghl_contact_id
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', ghlContactId)
        .single();

      if (patient) {
        const { data: ghlProtocols } = await supabase
          .from('protocols')
          .select('*')
          .eq('patient_id', patient.id)
          .eq('status', 'active')
          .eq('delivery_method', 'in_clinic')
          .ilike('program_name', '%weight loss%')
          .order('created_at', { ascending: false });

        return res.status(200).json({ protocols: ghlProtocols || [] });
      }
    }

    res.status(200).json({ protocols: protocols || [] });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
}
