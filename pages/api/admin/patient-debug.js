// /pages/api/admin/patient-debug.js
// Debug patient data — check demographics, documents, assessment links
// Range Medical — temporary diagnostic

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { name, email } = req.query;

  if (!name && !email) {
    return res.status(400).json({ error: 'Provide ?name=xxx or ?email=xxx' });
  }

  try {
    // 1. Find patient
    let patientQuery = supabase.from('patients').select('*');
    if (email) {
      patientQuery = patientQuery.ilike('email', `%${email}%`);
    } else {
      patientQuery = patientQuery.ilike('name', `%${name}%`);
    }

    const { data: patients } = await patientQuery.limit(3);
    if (!patients || patients.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patients[0];
    const result = { patient };

    // 2. Find assessment leads by email
    if (patient.email) {
      const { data: leads } = await supabase
        .from('assessment_leads')
        .select('id, first_name, last_name, email, assessment_path, intake_status, intake_completed_at, medical_history, tags, pdf_url, created_at')
        .ilike('email', patient.email)
        .order('created_at', { ascending: false });

      result.assessmentLeads = leads || [];
    }

    // 3. Find medical documents
    const { data: docs, error: docsError } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('patient_id', patient.id);

    result.medicalDocuments = docs || [];
    if (docsError) result.medicalDocumentsError = docsError.message;

    // 4. Find intakes
    const { data: intakes } = await supabase
      .from('intakes')
      .select('id, patient_id, email, intake_type, status, created_at')
      .ilike('email', patient.email || '')
      .order('created_at', { ascending: false })
      .limit(5);

    result.intakes = intakes || [];

    // 5. Check what demographics are missing
    result.demographicsStatus = {
      date_of_birth: patient.date_of_birth || 'MISSING',
      gender: patient.gender || 'MISSING',
      address: patient.address || 'MISSING',
      city: patient.city || 'MISSING',
      state: patient.state || 'MISSING',
      zip_code: patient.zip_code || 'MISSING',
      phone: patient.phone || 'MISSING',
      email: patient.email || 'MISSING',
    };

    // 6. Check if assessment lead has demographics to push
    if (result.assessmentLeads.length > 0) {
      const lead = result.assessmentLeads[0];
      const mh = lead.medical_history || {};
      const pi = mh.personalInfo || {};
      const addr = pi.address || {};
      result.availableDemographics = {
        fromMedicalHistory: {
          dob: pi.dob || mh.dob || mh.date_of_birth || 'NOT IN DATA',
          gender: pi.gender || mh.gender || mh.sex || 'NOT IN DATA',
          address: addr.street || pi.streetAddress || mh.streetAddress || 'NOT IN DATA',
          city: addr.city || pi.city || mh.city || 'NOT IN DATA',
          state: addr.state || pi.state || mh.state || 'NOT IN DATA',
          zip: addr.postalCode || pi.postalCode || mh.zip || 'NOT IN DATA',
        },
        intakeStatus: lead.intake_status,
        hasPdfUrl: !!lead.pdf_url,
        pdfUrl: lead.pdf_url || 'NONE',
      };
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
