// /pages/api/patients/[id]/labs.js
// Add and manage patient labs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query; // patient_id

  if (req.method === 'GET') {
    return getLabs(id, res);
  }
  
  if (req.method === 'POST') {
    return addLab(id, req.body, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getLabs(patientId, res) {
  try {
    const { data: labs, error } = await supabase
      .from('labs')
      .select('*')
      .eq('patient_id', patientId)
      .order('test_date', { ascending: false, nullsFirst: false });

    if (error) throw error;

    return res.status(200).json({ labs: labs || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function addLab(patientId, data, res) {
  try {
    // Get patient info
    const { data: patient } = await supabase
      .from('patients')
      .select('ghl_contact_id')
      .eq('id', patientId)
      .single();

    const { data: lab, error } = await supabase
      .from('labs')
      .insert({
        patient_id: patientId,
        ghl_contact_id: patient?.ghl_contact_id,
        lab_type: data.labType,           // 'Baseline', 'Follow-up', 'Quarterly'
        panel_type: data.labPanel,        // 'Essential', 'Elite' - matches existing column
        lab_panel: data.labPanel,         // Also set the new column
        test_date: data.completedDate,    // Required NOT NULL column
        completed_date: data.completedDate,
        service_type: data.serviceType,
        status: data.status || 'completed',
        notes: data.notes
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, lab });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
