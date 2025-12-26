// /pages/api/admin/patients/index.js
// Patients API - Aggregates patient data from protocols and purchases
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Normalize name for matching
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

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

    // Build patient map - ALWAYS keyed by normalized name
    const patientMap = new Map();

    // Process all records
    const allRecords = [
      ...protocols.map(p => ({ ...p, source: 'protocol' })),
      ...purchases.map(p => ({ ...p, source: 'purchase' }))
    ];

    allRecords.forEach(record => {
      if (!record.patient_name || record.patient_name.toLowerCase() === 'unknown') return;
      
      // Always use normalized name as key
      const key = normalizeName(record.patient_name);
      if (!key) return;
      
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          id: key,
          ghl_contact_id: null,
          name: record.patient_name, // Keep original casing from first record
          phone: null,
          email: null,
          protocol_count: 0,
          purchase_count: 0
        });
      }
      
      const patient = patientMap.get(key);
      
      // Update counts
      if (record.source === 'protocol') {
        patient.protocol_count++;
      } else {
        patient.purchase_count++;
      }
      
      // Update contact info - prefer records that have more data
      if (record.ghl_contact_id && !patient.ghl_contact_id) {
        patient.ghl_contact_id = record.ghl_contact_id;
      }
      if (record.patient_phone && !patient.phone) {
        patient.phone = record.patient_phone;
      }
      if (record.patient_email && !patient.email) {
        patient.email = record.patient_email;
      }
      
      // Update name to prefer properly capitalized version
      if (record.patient_name && record.patient_name !== record.patient_name.toLowerCase()) {
        patient.name = record.patient_name;
      }
    });

    // Convert to array and sort by name
    const patients = Array.from(patientMap.values())
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return res.status(200).json({ 
      patients,
      total: patients.length
    });

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
