// /pages/api/admin/patient/[id].js
// Patient Profile API - fetches all data for a single patient
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  try {
    let patient = null;

    // First try to find by UUID (if it looks like a UUID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        patient = data;
      }
    }

    // If not found by UUID, try by ghl_contact_id
    if (!patient) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('ghl_contact_id', id)
        .single();
      
      if (!error && data) {
        patient = data;
      }
    }

    // If still not found, return error
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientId = patient.id;
    const ghlContactId = patient.ghl_contact_id;

    // Fetch protocols by ghl_contact_id (protocols table uses ghl_contact_id, not patient_id)
    let protocols = [];
    if (ghlContactId) {
      const { data } = await supabase
        .from('protocols')
        .select('*')
        .eq('ghl_contact_id', ghlContactId)
        .order('created_at', { ascending: false });
      protocols = data || [];
    }

    // Fetch purchases by ghl_contact_id (purchases table uses ghl_contact_id, not patient_id)
    let purchases = [];
    if (ghlContactId) {
      const { data } = await supabase
        .from('purchases')
        .select('*')
        .eq('ghl_contact_id', ghlContactId)
        .order('purchase_date', { ascending: false });
      purchases = data || [];
    }

    // Fetch intakes by patient_id (intakes table uses patient_id)
    const { data: intakes } = await supabase
      .from('intakes')
      .select('*')
      .eq('patient_id', patientId)
      .order('submitted_at', { ascending: false });

    // Fetch consents by patient_id (consents table uses patient_id)
    const { data: consents } = await supabase
      .from('consents')
      .select('*')
      .eq('patient_id', patientId)
      .order('submitted_at', { ascending: false });

    // Fetch injection log - try by protocol_id from protocols
    let injectionLog = [];
    if (protocols.length > 0) {
      const protocolIds = protocols.map(p => p.id);
      const { data } = await supabase
        .from('injection_log')
        .select('*')
        .in('protocol_id', protocolIds)
        .order('completed_at', { ascending: false })
        .limit(50);
      injectionLog = data || [];
    }

    // Return complete patient data
    return res.status(200).json({
      ...patient,
      protocols: protocols,
      purchases: purchases,
      intakes: intakes || [],
      consents: consents || [],
      injection_log: injectionLog
    });

  } catch (error) {
    console.error('Patient API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
