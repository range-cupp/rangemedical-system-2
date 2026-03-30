// /pages/api/admin/labs-pipeline.js
// API for Labs Pipeline - Protocol-based lab tracking
// Range Medical
// CREATED: 2026-01-26
// UPDATED: 2026-02-17 - Added pre-consult summary endpoint

import { createClient } from '@supabase/supabase-js';
import { todayPacific } from '../../../lib/date-utils';
import { buildAdaptiveHRTSchedule } from '../../../lib/hrt-lab-schedule';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lab pipeline stages (6-column Kanban with staff ownership)
// awaiting_results = Primex processing | uploaded = Chris/Evan | under_review = Damien/Evan
// ready_to_schedule = Tara | consult_scheduled = booked | in_treatment = converted
const LAB_STAGES = ['awaiting_results', 'uploaded', 'under_review', 'ready_to_schedule', 'consult_scheduled', 'in_treatment'];

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

    // Fetch "Due for Labs" to-do list using buildAdaptiveHRTSchedule (single source of truth)
    let dueForLabs = [];
    let scheduledForLabs = [];
    try {
      // Get active HRT protocols with their lab schedule info
      const { data: hrtProtocols } = await supabase
        .from('protocols')
        .select('id, patient_id, program_name, start_date, status, first_followup_weeks, patients(id, name, first_name, last_name, phone)')
        .in('program_type', ['hrt', 'hrt_male', 'hrt_female'])
        .in('status', ['active', 'completed'])
        .not('start_date', 'is', null);

      if (hrtProtocols && hrtProtocols.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        // Get all patient IDs that already have an active lab protocol in the pipeline
        const hrtPatientIds = hrtProtocols.map(p => p.patient_id).filter(Boolean);
        const { data: existingLabProtocols } = await supabase
          .from('protocols')
          .select('patient_id')
          .eq('program_type', 'labs')
          .in('status', LAB_STAGES)
          .in('patient_id', hrtPatientIds);

        const patientsWithActiveLabs = new Set((existingLabProtocols || []).map(p => p.patient_id));

        // Fetch ALL data sources needed by buildAdaptiveHRTSchedule for all patients at once
        const hrtProtoIds = hrtProtocols.map(p => p.id);

        // 1. Blood draw logs (protocol_logs)
        const { data: allBloodDrawLogs } = await supabase
          .from('protocol_logs')
          .select('id, protocol_id, patient_id, log_date, notes')
          .in('protocol_id', hrtProtoIds)
          .eq('log_type', 'blood_draw')
          .order('log_date', { ascending: true });

        const logsByProtocol = {};
        for (const log of (allBloodDrawLogs || [])) {
          if (!logsByProtocol[log.protocol_id]) logsByProtocol[log.protocol_id] = [];
          logsByProtocol[log.protocol_id].push(log);
        }

        // 2. Labs table (actual lab results)
        const { data: allLabs } = await supabase
          .from('labs')
          .select('id, patient_id, test_date, completed_date')
          .in('patient_id', hrtPatientIds)
          .order('test_date', { ascending: false });

        const labsByPatient = {};
        for (const lab of (allLabs || [])) {
          if (!labsByPatient[lab.patient_id]) labsByPatient[lab.patient_id] = [];
          labsByPatient[lab.patient_id].push(lab);
        }

        // 3. Lab protocols (auto-scheduled from HRT)
        const { data: allLabProtocols } = await supabase
          .from('protocols')
          .select('id, patient_id, start_date, status')
          .eq('program_type', 'labs')
          .in('patient_id', hrtPatientIds);

        const labProtosByPatient = {};
        for (const lp of (allLabProtocols || [])) {
          if (!labProtosByPatient[lp.patient_id]) labProtosByPatient[lp.patient_id] = [];
          labProtosByPatient[lp.patient_id].push(lp);
        }

        for (const proto of hrtProtocols) {
          // Skip if patient already has an active lab protocol in pipeline
          if (patientsWithActiveLabs.has(proto.patient_id)) continue;

          const firstWeeks = proto.first_followup_weeks || 8;

          // Use the SAME adaptive schedule the patient page uses
          const schedule = buildAdaptiveHRTSchedule(
            proto.start_date,
            firstWeeks,
            logsByProtocol[proto.id] || [],
            labsByPatient[proto.patient_id] || [],
            labProtosByPatient[proto.patient_id] || []
          );

          // Find the next overdue or upcoming draw within our window
          const nextDraw = schedule.find(d => d.status === 'overdue' || d.status === 'upcoming');
          if (!nextDraw) continue;

          const dueDate = new Date(nextDraw.targetDate + 'T00:00:00');
          if (dueDate > thirtyDaysFromNow || dueDate < new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)) continue;

          const patient = proto.patients;
          const patientName = patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();
          dueForLabs.push({
            patientId: proto.patient_id,
            patientName,
            phone: patient?.phone || null,
            protocolId: proto.id,
            protocolName: proto.program_name,
            dueDate: nextDraw.targetDate,
            drawLabel: nextDraw.label,
            daysUntilDue: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
          });
        }

        // Check for scheduled blood draw appointments
        if (dueForLabs.length > 0) {
          const duePatientIds = dueForLabs.map(d => d.patientId).filter(Boolean);
          const { data: scheduledBookings } = await supabase
            .from('calcom_bookings')
            .select('patient_id, start_time, event_slug, status')
            .in('patient_id', duePatientIds)
            .in('event_slug', ['new-patient-blood-draw', 'follow-up-blood-draw'])
            .in('status', ['scheduled', 'confirmed', 'accepted'])
            .gte('start_time', new Date().toISOString());

          if (scheduledBookings && scheduledBookings.length > 0) {
            const bookingsByPatient = {};
            for (const b of scheduledBookings) {
              if (!bookingsByPatient[b.patient_id] || new Date(b.start_time) < new Date(bookingsByPatient[b.patient_id].start_time)) {
                bookingsByPatient[b.patient_id] = b;
              }
            }
            for (const item of dueForLabs) {
              const booking = bookingsByPatient[item.patientId];
              if (booking) {
                item.scheduledDate = booking.start_time;
                item.hasAppointment = true;
              }
            }
          }
        }

        // Filter out patients who already have a scheduled blood draw appointment
        scheduledForLabs = dueForLabs.filter(d => d.hasAppointment);
        dueForLabs = dueForLabs.filter(d => !d.hasAppointment);

        // Sort by due date
        dueForLabs.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
      }
    } catch (dueErr) {
      console.error('Due for labs fetch error (non-fatal):', dueErr);
    }

    return res.status(200).json({
      success: true,
      stages,
      counts,
      total,
      dueForLabs,
      scheduledForLabs
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

    // Sync: when advancing to awaiting_results, also log blood draw for parent HRT protocol
    if (newStage === 'awaiting_results' && data && (data.notes || '').includes('Auto-scheduled from HRT Protocol')) {
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
              log_date: data.start_date || todayPacific(),
              notes: drawLabel
            });
            console.log(`✓ Synced blood draw log for HRT protocol ${hrtId}: ${drawLabel}`);
          }
        }
      } catch (syncErr) {
        console.error('HRT blood draw sync error (non-fatal):', syncErr);
      }
    }

    // NOTE: draw_scheduled stage removed from pipeline. Revert-to-draw sync no longer applies.

    // NOTE: Scheduling tasks for Tara + Chris are NOT auto-created on provider_reviewed.
    // They are created by /api/admin/complete-lab-review when the provider uses the
    // "Complete Review" flow in the task card — which includes consultation type selection,
    // custom instructions, and SMS notification.

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

    const insertData = {
      patient_id: resolvedPatientId || null,
      program_name: programName,
      program_type: 'labs',
      medication: panel === 'elite' ? 'Elite' : 'Essential',
      delivery_method: type,
      status: 'awaiting_results',
      start_date: bloodDrawDate || todayPacific(),
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
