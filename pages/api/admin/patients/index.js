// /pages/api/admin/patients/index.js
// Patients API - Aggregates patient data from protocols and purchases
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
    // Get all unique patients from protocols
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select('ghl_contact_id, patient_name, patient_phone, patient_email')
      .not('patient_name', 'is', null);

    if (protocolsError) throw protocolsError;

    // Get all unique patients from purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('ghl_contact_id, patient_name, patient_phone, patient_email')
      .not('patient_name', 'is', null);

    if (purchasesError) throw purchasesError;

    // Build patient map - keyed by ghl_contact_id or name if no contact_id
    const patientMap = new Map();

    // Process protocols
    protocols.forEach(p => {
      const key = p.ghl_contact_id || `name:${p.patient_name}`;
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          id: key,
          ghl_contact_id: p.ghl_contact_id,
          name: p.patient_name,
          phone: p.patient_phone,
          email: p.patient_email,
          protocol_count: 0,
          purchase_count: 0
        });
      }
      const patient = patientMap.get(key);
      patient.protocol_count++;
      // Update contact info if we have better data
      if (p.patient_phone && !patient.phone) patient.phone = p.patient_phone;
      if (p.patient_email && !patient.email) patient.email = p.patient_email;
      if (p.ghl_contact_id && !patient.ghl_contact_id) patient.ghl_contact_id = p.ghl_contact_id;
    });

    // Process purchases
    purchases.forEach(p => {
      const key = p.ghl_contact_id || `name:${p.patient_name}`;
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          id: key,
          ghl_contact_id: p.ghl_contact_id,
          name: p.patient_name,
          phone: p.patient_phone,
          email: p.patient_email,
          protocol_count: 0,
          purchase_count: 0
        });
      }
      const patient = patientMap.get(key);
      patient.purchase_count++;
      // Update contact info if we have better data
      if (p.patient_phone && !patient.phone) patient.phone = p.patient_phone;
      if (p.patient_email && !patient.email) patient.email = p.patient_email;
      if (p.ghl_contact_id && !patient.ghl_contact_id) patient.ghl_contact_id = p.ghl_contact_id;
    });

    // Convert to array and sort by name
    const patients = Array.from(patientMap.values())
      .filter(p => p.name && p.name !== 'Unknown')
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return res.status(200).json({ patients });

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
