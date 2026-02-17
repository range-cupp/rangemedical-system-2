// /pages/api/admin/labs-pipeline.js
// API for Labs Pipeline - Protocol-based lab tracking
// Range Medical
// CREATED: 2026-01-26
// UPDATED: 2026-02-17 - Added pre-consult summary endpoint

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lab stages stored in protocols.status for program_type='labs'
const LAB_STAGES = ['blood_draw_complete', 'results_received', 'provider_reviewed', 'consult_scheduled', 'consult_complete'];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (req.query.action === 'summary' && req.query.patientId) {
      return getPatientSummary(req, res);
    }
    return getLabsPipeline(req, res);
  } else if (req.method === 'PATCH') {
    return updateLabProtocol(req, res);
  } else if (req.method === 'POST') {
    return createLabProtocol(req, res);
  } else if (req.method === 'DELETE') {
    return deleteLabProtocol(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// GET: Fetch all lab protocols grouped by stage
async function getLabsPipeline(req, res) {
  try {
    // Fetch all lab protocols that are not completed or cancelled
    const { data: labProtocols, error } = await supabase
      .from('protocols')
      .select('id, patient_id, program_name, program_type, medication, status, notes, start_date, created_at, updated_at, delivery_method, patients(id, name, first_name, last_name, email, phone)')
      .eq('program_type', 'labs')
      .in('status', LAB_STAGES)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching lab protocols:', error);
      return res.status(500).json({ error: error.message });
    }

    // Group by stage (status field)
    const stages = {};
    for (const stage of LAB_STAGES) {
      stages[stage] = (labProtocols || []).filter(p => p.status === stage);
    }

    // Build counts
    const counts = {};
    for (const stage of LAB_STAGES) {
      counts[stage] = stages[stage].length;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return res.status(200).json({
      success: true,
      stages,
      counts,
      total
    });

  } catch (error) {
    console.error('Labs Pipeline Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// GET: Fetch pre-consult summary for a patient
async function getPatientSummary(req, res) {
  try {
    const { patientId } = req.query;

    // Fetch patient record
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, email, date_of_birth, ghl_contact_id')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const intakeFields = 'id, patient_id, ghl_contact_id, email, submitted_at, date_of_birth, current_medications, medication_notes, allergies, allergy_reactions, what_brings_you, what_brings_you_in, symptoms, additional_notes, on_hrt, hrt_details, high_blood_pressure, high_blood_pressure_year, high_cholesterol, high_cholesterol_year, heart_disease, heart_disease_type, heart_disease_year, diabetes, diabetes_type, diabetes_year, thyroid_disorder, thyroid_disorder_type, thyroid_disorder_year, depression_anxiety, depression_anxiety_year, kidney_disease, kidney_disease_type, kidney_disease_year, liver_disease, liver_disease_type, liver_disease_year, autoimmune_disorder, autoimmune_disorder_type, autoimmune_disorder_year, cancer, cancer_type, cancer_year, medical_conditions';

    // Fetch most recent intake - try patient_id, then ghl_contact_id, then email
    let intake = null;

    const { data: intakeByPatient } = await supabase
      .from('intakes')
      .select(intakeFields)
      .eq('patient_id', patientId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (intakeByPatient) {
      intake = intakeByPatient;
    }

    if (!intake && patient.ghl_contact_id) {
      const { data: intakeByGhl } = await supabase
        .from('intakes')
        .select(intakeFields)
        .eq('ghl_contact_id', patient.ghl_contact_id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();
      if (intakeByGhl) intake = intakeByGhl;
    }

    if (!intake && patient.email) {
      const { data: intakeByEmail } = await supabase
        .from('intakes')
        .select(intakeFields)
        .ilike('email', patient.email)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();
      if (intakeByEmail) intake = intakeByEmail;
    }

    if (!intake) {
      return res.status(200).json({ success: true, noIntake: true });
    }

    // Fetch most recent session date
    let lastVisitDate = null;
    const { data: lastSession } = await supabase
      .from('sessions')
      .select('session_date')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false })
      .limit(1)
      .single();

    if (lastSession) {
      lastVisitDate = lastSession.session_date;
    }

    // Build diagnoses from boolean condition fields
    const conditionMap = [
      { field: 'high_blood_pressure', label: 'High blood pressure', yearField: 'high_blood_pressure_year', jsonKey: 'hypertension' },
      { field: 'high_cholesterol', label: 'High cholesterol', yearField: 'high_cholesterol_year', jsonKey: 'highCholesterol' },
      { field: 'heart_disease', label: 'Heart disease', yearField: 'heart_disease_year', typeField: 'heart_disease_type', jsonKey: 'heartDisease' },
      { field: 'diabetes', label: 'Diabetes', yearField: 'diabetes_year', typeField: 'diabetes_type', jsonKey: 'diabetes' },
      { field: 'thyroid_disorder', label: 'Thyroid disorder', yearField: 'thyroid_disorder_year', typeField: 'thyroid_disorder_type', jsonKey: 'thyroid' },
      { field: 'depression_anxiety', label: 'Depression/Anxiety', yearField: 'depression_anxiety_year', jsonKey: 'depression' },
      { field: 'kidney_disease', label: 'Kidney disease', yearField: 'kidney_disease_year', typeField: 'kidney_disease_type', jsonKey: 'kidney' },
      { field: 'liver_disease', label: 'Liver disease', yearField: 'liver_disease_year', typeField: 'liver_disease_type', jsonKey: 'liver' },
      { field: 'autoimmune_disorder', label: 'Autoimmune disorder', yearField: 'autoimmune_disorder_year', typeField: 'autoimmune_disorder_type', jsonKey: 'autoimmune' },
      { field: 'cancer', label: 'Cancer', yearField: 'cancer_year', typeField: 'cancer_type', jsonKey: 'cancer' },
    ];

    const mc = intake.medical_conditions || {}; // JSONB fallback

    const diagnoses = [];
    for (const c of conditionMap) {
      const boolVal = intake[c.field] === true;
      const jsonVal = mc[c.jsonKey]?.response === 'Yes';

      if (boolVal || jsonVal) {
        let entry = c.label;
        const typeVal = (c.typeField && intake[c.typeField]) || mc[c.jsonKey]?.type || null;
        const yearVal = intake[c.yearField] || mc[c.jsonKey]?.year || null;
        if (typeVal) entry += ` - ${typeVal}`;
        if (yearVal) entry += ` (${yearVal})`;
        diagnoses.push(entry);
      }
    }

    const patientName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const dob = patient.date_of_birth || intake.date_of_birth || null;
    const reasonForVisit = intake.what_brings_you || intake.what_brings_you_in || intake.additional_notes || null;
    const medications = intake.current_medications || intake.medication_notes || null;
    const allergies = intake.allergies
      ? (intake.allergy_reactions ? `${intake.allergies} (${intake.allergy_reactions})` : intake.allergies)
      : null;

    return res.status(200).json({
      success: true,
      summary: {
        name: patientName,
        dob,
        lastVisitDate,
        reasonForVisit,
        diagnoses,
        medications,
        allergies,
        onHRT: intake.on_hrt || false,
        hrtDetails: intake.hrt_details || null,
      }
    });

  } catch (error) {
    console.error('Patient Summary Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// PATCH: Move a lab protocol to a different stage
async function updateLabProtocol(req, res) {
  try {
    const { id, newStage, notes } = req.body;

    if (!id || !newStage) {
      return res.status(400).json({ error: 'id and newStage required' });
    }

    if (!LAB_STAGES.includes(newStage)) {
      return res.status(400).json({ error: 'Invalid stage: ' + newStage });
    }

    const updates = {
      status: newStage,
      updated_at: new Date().toISOString()
    };

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', id)
      .eq('program_type', 'labs')
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Update Lab Protocol Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// DELETE: Remove a lab protocol
async function deleteLabProtocol(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id required' });
    }

    // Set to cancelled rather than hard delete
    const { error } = await supabase
      .from('protocols')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('program_type', 'labs');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Lab protocol removed' });

  } catch (error) {
    console.error('Delete Lab Protocol Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// POST: Manually create a lab protocol
async function createLabProtocol(req, res) {
  try {
    const { patientId, patientName, panelType, labType, bloodDrawDate, notes } = req.body;

    if (!patientName && !patientId) {
      return res.status(400).json({ error: 'patientName or patientId required' });
    }

    const panel = panelType || 'essential';
    const type = labType || 'new_patient';
    const programName = `${type === 'follow_up' ? 'Follow-up' : 'New Patient'} Labs - ${panel === 'elite' ? 'Elite' : 'Essential'}`;

    // Look up patient if we have a patientId
    let resolvedPatientId = patientId;
    let resolvedPatientName = patientName;

    if (patientId && !patientName) {
      const { data: patient } = await supabase
        .from('patients')
        .select('name, first_name, last_name')
        .eq('id', patientId)
        .single();
      if (patient) {
        resolvedPatientName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
      }
    }

    // If no patientId but we have a name, try to find patient
    if (!patientId && patientName) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name')
        .ilike('name', `%${patientName}%`)
        .limit(1);

      if (patients && patients.length > 0) {
        resolvedPatientId = patients[0].id;
        resolvedPatientName = patients[0].name;
      }
    }

    const insertData = {
      patient_id: resolvedPatientId || null,
      program_name: programName,
      program_type: 'labs',
      medication: panel === 'elite' ? 'Elite' : 'Essential',
      delivery_method: type,
      status: 'blood_draw_complete',
      start_date: bloodDrawDate || new Date().toISOString().split('T')[0],
      notes: notes || null
    };

    const { data, error } = await supabase
      .from('protocols')
      .insert(insertData)
      .select('*, patients(id, name, first_name, last_name, email, phone)')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Create Lab Protocol Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
