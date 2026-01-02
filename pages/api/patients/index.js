// /pages/api/patients/index.js
// Simple Patients API - queries patients table directly
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
    // Query patients table directly
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, email, phone, ghl_contact_id, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Patients query error:', error);
      
      // If patients table doesn't exist, try aggregating from purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('patient_id, patient_name, ghl_contact_id')
        .not('patient_name', 'is', null);
      
      if (purchasesError) {
        throw purchasesError;
      }
      
      // Dedupe by patient_id or name
      const patientMap = new Map();
      purchases.forEach(p => {
        const key = p.patient_id || p.ghl_contact_id || p.patient_name;
        if (key && !patientMap.has(key)) {
          patientMap.set(key, {
            id: p.patient_id || p.ghl_contact_id,
            name: p.patient_name,
            ghl_contact_id: p.ghl_contact_id
          });
        }
      });
      
      const uniquePatients = Array.from(patientMap.values())
        .filter(p => p.name && p.name !== 'Unknown')
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      return res.status(200).json(uniquePatients);
    }

    // Format patients - ensure consistent structure
    const formattedPatients = patients.map(p => ({
      id: p.id,
      name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
      email: p.email,
      phone: p.phone,
      ghl_contact_id: p.ghl_contact_id
    })).filter(p => p.name !== 'Unknown');

    return res.status(200).json(formattedPatients);

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
