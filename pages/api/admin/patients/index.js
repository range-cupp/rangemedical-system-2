// /pages/api/admin/patients/index.js
// Patients List API
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

  try {
    // Get all patients
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .order('last_name', { ascending: true })
      .limit(500);

    if (error) throw error;

    // Get active protocol counts per patient
    const { data: protocolCounts } = await supabase
      .from('protocols')
      .select('ghl_contact_id')
      .eq('status', 'active');

    // Count protocols per patient
    const countMap = {};
    protocolCounts?.forEach(p => {
      if (p.ghl_contact_id) {
        countMap[p.ghl_contact_id] = (countMap[p.ghl_contact_id] || 0) + 1;
      }
    });

    // Merge counts into patient data
    const patientsWithCounts = patients.map(p => ({
      ...p,
      active_protocols: countMap[p.ghl_contact_id] || 0
    }));

    // Sort by active protocols (most active first), then by name
    patientsWithCounts.sort((a, b) => {
      if (b.active_protocols !== a.active_protocols) {
        return b.active_protocols - a.active_protocols;
      }
      return (a.last_name || '').localeCompare(b.last_name || '');
    });

    return res.status(200).json({ patients: patientsWithCounts });

  } catch (error) {
    console.error('Patients error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
