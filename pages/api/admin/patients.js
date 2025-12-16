// /pages/api/admin/patients.js
// Patients API - Aggregates unique patients from protocols and purchases
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'range2024admin';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search, limit = 200 } = req.query;

    // Get unique patients from protocols with counts
    let query = supabase
      .from('protocols')
      .select('ghl_contact_id, patient_name, patient_email, patient_phone')
      .not('ghl_contact_id', 'is', null)
      .not('ghl_contact_id', 'eq', 'cWEpIVvPWYRo8oc3dS8Q'); // Exclude walk-in

    if (search) {
      query = query.or(`patient_name.ilike.%${search}%,patient_email.ilike.%${search}%,patient_phone.ilike.%${search}%`);
    }

    const { data: protocolPatients, error: protocolError } = await query;

    if (protocolError) {
      console.error('Protocol query error:', protocolError);
      return res.status(500).json({ error: protocolError.message });
    }

    // Get protocol counts per contact
    const { data: protocolCounts, error: countError } = await supabase
      .from('protocols')
      .select('ghl_contact_id')
      .not('ghl_contact_id', 'is', null);

    // Get purchase counts per contact
    const { data: purchaseCounts, error: purchaseError } = await supabase
      .from('purchases')
      .select('ghl_contact_id')
      .not('ghl_contact_id', 'is', null);

    // Build counts maps
    const protocolCountMap = {};
    (protocolCounts || []).forEach(p => {
      protocolCountMap[p.ghl_contact_id] = (protocolCountMap[p.ghl_contact_id] || 0) + 1;
    });

    const purchaseCountMap = {};
    (purchaseCounts || []).forEach(p => {
      purchaseCountMap[p.ghl_contact_id] = (purchaseCountMap[p.ghl_contact_id] || 0) + 1;
    });

    // Deduplicate patients by ghl_contact_id
    const patientMap = new Map();
    
    (protocolPatients || []).forEach(p => {
      if (p.ghl_contact_id && !patientMap.has(p.ghl_contact_id)) {
        patientMap.set(p.ghl_contact_id, {
          ghl_contact_id: p.ghl_contact_id,
          patient_name: p.patient_name,
          patient_email: p.patient_email,
          patient_phone: p.patient_phone,
          protocol_count: protocolCountMap[p.ghl_contact_id] || 0,
          purchase_count: purchaseCountMap[p.ghl_contact_id] || 0
        });
      }
    });

    // Convert to array and sort by name
    let patients = Array.from(patientMap.values());
    patients.sort((a, b) => (a.patient_name || '').localeCompare(b.patient_name || ''));

    // Apply limit
    const limitedPatients = patients.slice(0, parseInt(limit));

    return res.status(200).json({
      patients: limitedPatients,
      total: patients.length
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
