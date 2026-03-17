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
const LAB_STAGES = ['draw_scheduled', 'blood_draw_complete', 'results_received', 'provider_reviewed', 'consult_scheduled', 'consult_complete'];

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

    // Sync: when advancing to blood_draw_complete, also log blood draw for parent HRT protocol
    if (newStage === 'blood_draw_complete' && data && (data.notes || '').includes('Auto-scheduled from HRT Protocol')) {
      try {
        // Find the parent HRT protocol for this patient
        const { data: hrtProtos } = await supabase
          .from('protocols')
          .select('id')
          .eq('patient_id', data.patient_id)
          .ilike('program_type', '%hrt%')
          .in('status', ['active', 'completed']);

        if (hrtProtos && hrtProtos.length > 0) {
          const hrtId = hrtProtos[0].id;
          // Extract draw label from program_name (e.g. "8 Week Lab Follow-Up" → "8-Week Labs")
          const pn = data.program_name || '';
          const weekMatch = pn.match(/^(\d+)\s*Week/i);
          const drawLabel = weekMatch ? `${weekMatch[1]}-Week Labs` : pn;

          // Check if blood draw log already exists
          const { data: existingLog } = await supabase
            .from('protocol_logs')
            .select('id')
            .eq('protocol_id', hrtId)
            .eq('log_type', 'blood_draw')
            .eq('notes', drawLabel)
            .maybeSingle();

          if (!existingLog) {
            await supabase.from('protocol_logs').insert({
              protocol_id: hrtId,
              patient_id: data.patient_id,
              log_type: 'blood_draw',
              log_date: data.start_date || new Date().toISOString().split('T')[0],
              notes: drawLabel
            });
            console.log(`✓ Synced blood draw log for HRT protocol ${hrtId}: ${drawLabel}`);
          }
        }
      } catch (syncErr) {
        console.error('HRT blood draw sync error (non-fatal):', syncErr);
      }
    }

    // Sync: when moving back to draw_scheduled, remove the blood draw log
    if (newStage === 'draw_scheduled' && data && (data.notes || '').includes('Auto-scheduled from HRT Protocol')) {
      try {
        const { data: hrtProtos } = await supabase
          .from('protocols')
          .select('id')
          .eq('patient_id', data.patient_id)
          .ilike('program_type', '%hrt%');

        if (hrtProtos && hrtProtos.length > 0) {
          const pn = data.program_name || '';
          const weekMatch = pn.match(/^(\d+)\s*Week/i);
          const drawLabel = weekMatch ? `${weekMatch[1]}-Week Labs` : pn;

          for (const hp of hrtProtos) {
            await supabase
              .from('protocol_logs')
              .delete()
              .eq('protocol_id', hp.id)
              .eq('log_type', 'blood_draw')
              .eq('notes', drawLabel);
          }
          console.log(`✓ Removed blood draw log for draw_scheduled revert: ${drawLabel}`);
        }
      } catch (syncErr) {
        console.error('HRT blood draw undo sync error (non-fatal):', syncErr);
      }
    }

    // Sync: when provider marks labs as reviewed → create scheduling tasks for Tara + Damon
    if (newStage === 'provider_reviewed' && data) {
      try {
        // Look up Tara and Damon IDs
        const { data: staff } = await supabase
          .from('employees')
          .select('id, email')
          .in('email', ['tara@range-medical.com', 'damon@range-medical.com'])
          .eq('is_active', true);

        const taraId  = staff?.find(e => e.email === 'tara@range-medical.com')?.id  || null;
        const damonId = staff?.find(e => e.email === 'damon@range-medical.com')?.id || null;

        // Look up patient name
        const { data: patient } = await supabase
          .from('patients')
          .select('name, first_name, last_name')
          .eq('id', data.patient_id)
          .single();

        const patientName = patient
          ? (patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim())
          : data.patient_id;

        // Due date: tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dueTomorrow = tomorrow.toISOString().split('T')[0];

        const schedTask = {
          title: `Contact ${patientName} — lab results ready`,
          description: `Lab results for ${patientName} have been reviewed by the provider. Please contact the patient to let them know their results are ready and schedule a results consult.`,
          patient_id: data.patient_id,
          patient_name: patientName,
          priority: 'high',
          due_date: dueTomorrow,
          status: 'pending',
          category: 'labs',
        };

        const schedTasks = [];
        if (taraId)  schedTasks.push({ ...schedTask, assigned_to: taraId,  assigned_by: taraId });
        if (damonId) schedTasks.push({ ...schedTask, assigned_to: damonId, assigned_by: damonId });

        if (schedTasks.length > 0) {
          await supabase.from('tasks').insert(schedTasks);
          console.log(`✓ Created ${schedTasks.length} scheduling task(s) for ${patientName}`);
        }
      } catch (syncErr) {
        console.error('Scheduling task creation error (non-fatal):', syncErr);
      }
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

// POST: Create a lab protocol (or advance existing draw_scheduled protocol)
async function createLabProtocol(req, res) {
  try {
    const { patientId, patientName, panelType, labType, bloodDrawDate, notes, advanceExisting } = req.body;

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

    // Check if patient already has an active lab protocol at draw_scheduled (from Cal.com auto-create)
    // If so, advance it to blood_draw_complete instead of creating a new one
    if (resolvedPatientId) {
      const { data: existingDrawScheduled } = await supabase
        .from('protocols')
        .select('id, status')
        .eq('patient_id', resolvedPatientId)
        .eq('program_type', 'labs')
        .eq('status', 'draw_scheduled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingDrawScheduled) {
        // Advance existing protocol instead of creating new
        const { data: advanced, error: advErr } = await supabase
          .from('protocols')
          .update({
            status: 'blood_draw_complete',
            medication: panel === 'elite' ? 'Elite' : 'Essential',
            delivery_method: type,
            start_date: bloodDrawDate || new Date().toISOString().split('T')[0],
            notes: notes ? `${notes}` : existingDrawScheduled.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDrawScheduled.id)
          .select('*, patients(id, name, first_name, last_name, email, phone)')
          .single();

        if (advErr) {
          return res.status(400).json({ error: advErr.message });
        }

        console.log(`✓ Lab protocol advanced from draw_scheduled to blood_draw_complete: ${existingDrawScheduled.id}`);
        return res.status(200).json({ success: true, data: advanced, advanced: true });
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
