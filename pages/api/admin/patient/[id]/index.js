// /pages/api/admin/patient/[id]/index.js
// Patient Profile API - fetches all data for a single patient
// Range Medical
// 
// NOTE: This API pulls patient name from multiple sources to ensure it's never empty

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
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

    // Fetch protocols - by patient_id OR ghl_contact_id
    let protocols = [];
    const { data: protocolsByPatientId } = await supabase
      .from('protocols')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (protocolsByPatientId?.length > 0) {
      protocols = protocolsByPatientId;
    } else if (ghlContactId) {
      const { data: protocolsByGhl } = await supabase
        .from('protocols')
        .select('*')
        .eq('ghl_contact_id', ghlContactId)
        .order('created_at', { ascending: false });
      protocols = protocolsByGhl || [];
    }

    // Fetch purchases - by patient_id OR ghl_contact_id
    let purchases = [];
    const { data: purchasesByPatientId } = await supabase
      .from('purchases')
      .select('*')
      .eq('patient_id', patientId)
      .order('purchase_date', { ascending: false });
    
    if (purchasesByPatientId?.length > 0) {
      purchases = purchasesByPatientId;
    } else if (ghlContactId) {
      const { data: purchasesByGhl } = await supabase
        .from('purchases')
        .select('*')
        .eq('ghl_contact_id', ghlContactId)
        .order('purchase_date', { ascending: false });
      purchases = purchasesByGhl || [];
    }

    // Fetch intakes
    let intakes = [];
    const { data: intakesByPatient } = await supabase
      .from('intakes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    intakes = intakesByPatient || [];

    // Fetch consents
    let consents = [];
    const { data: consentsByPatient } = await supabase
      .from('consents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    consents = consentsByPatient || [];

    // Fetch lab results
    let labResults = [];
    const { data: labsByPatient } = await supabase
      .from('lab_results')
      .select('*')
      .eq('patient_id', patientId)
      .order('result_date', { ascending: false });
    
    labResults = labsByPatient || [];

    // ==========================================
    // DETERMINE PATIENT NAME FROM MULTIPLE SOURCES
    // ==========================================
    let patientName = null;

    // 1. Try patients.name
    if (patient.name && patient.name !== 'Unknown' && patient.name.trim() !== '') {
      patientName = patient.name;
    }
    
    // 2. Try patients.first_name + last_name
    if (!patientName && (patient.first_name || patient.last_name)) {
      const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
      if (fullName && fullName !== 'Unknown') {
        patientName = fullName;
      }
    }

    // 3. Try getting name from purchases
    if (!patientName && purchases.length > 0) {
      const purchaseWithName = purchases.find(p => p.patient_name && p.patient_name !== 'Unknown');
      if (purchaseWithName) {
        patientName = purchaseWithName.patient_name;
      }
    }

    // 4. Fallback to 'Unknown Patient'
    if (!patientName) {
      patientName = 'Unknown Patient';
    }

    // Update patient record with name if we found it from purchases
    if (patientName && patientName !== 'Unknown Patient' && !patient.name) {
      await supabase
        .from('patients')
        .update({ name: patientName })
        .eq('id', patientId);
    }

    // Return complete patient data
    return res.status(200).json({
      id: patient.id,
      ghl_contact_id: patient.ghl_contact_id,
      name: patientName,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      address: patient.address,
      city: patient.city,
      state: patient.state,
      zip: patient.zip_code || patient.zip,
      status: patient.status,
      created_at: patient.created_at,
      protocols: protocols || [],
      purchases: purchases || [],
      intakes: intakes,
      consents: consents,
      lab_results: labResults
    });

  } catch (error) {
    console.error('Patient API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
