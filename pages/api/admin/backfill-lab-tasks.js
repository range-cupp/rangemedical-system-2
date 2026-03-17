// /pages/api/admin/backfill-lab-tasks.js
// One-time utility: re-enrich existing lab review tasks with pre-consult summary + lab_id meta.
// Finds all pending lab tasks for Evan + Dr. Burgess and rewrites their descriptions.
// Protected by ADMIN_PASSWORD.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function buildRichDescription(patientId, patientName, testDate) {
  // Get lab_id
  let labId = null;
  try {
    const { data: labRow } = await supabase
      .from('labs')
      .select('id')
      .eq('patient_id', patientId)
      .eq('lab_provider', 'Primex')
      .order('test_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    labId = labRow?.id || null;
  } catch (e) { /* non-fatal */ }

  // Get patient record
  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, first_name, last_name, date_of_birth, email, ghl_contact_id')
    .eq('id', patientId)
    .single();

  // Get intake
  const intakeFields = 'id, patient_id, ghl_contact_id, email, submitted_at, date_of_birth, current_medications, medication_notes, allergies, allergy_reactions, what_brings_you, what_brings_you_in, symptoms, additional_notes, high_blood_pressure, high_blood_pressure_year, high_cholesterol, high_cholesterol_year, heart_disease, heart_disease_type, heart_disease_year, diabetes, diabetes_type, diabetes_year, thyroid_disorder, thyroid_disorder_type, thyroid_disorder_year, depression_anxiety, depression_anxiety_year, kidney_disease, kidney_disease_type, kidney_disease_year, liver_disease, liver_disease_type, liver_disease_year, autoimmune_disorder, autoimmune_disorder_type, autoimmune_disorder_year, cancer, cancer_type, cancer_year, medical_conditions';
  let intake = null;

  const { data: byPatient } = await supabase.from('intakes').select(intakeFields).eq('patient_id', patientId).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
  if (byPatient) intake = byPatient;

  if (!intake && patient?.ghl_contact_id) {
    const { data: byGhl } = await supabase.from('intakes').select(intakeFields).eq('ghl_contact_id', patient.ghl_contact_id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
    if (byGhl) intake = byGhl;
  }
  if (!intake && patient?.email) {
    const { data: byEmail } = await supabase.from('intakes').select(intakeFields).ilike('email', patient.email).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
    if (byEmail) intake = byEmail;
  }

  // Last visit
  let lastVisit = null;
  const { data: lastSession } = await supabase.from('sessions').select('session_date').eq('patient_id', patientId).order('session_date', { ascending: false }).limit(1).maybeSingle();
  if (lastSession) lastVisit = lastSession.session_date;

  // Diagnoses
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

  const mc = intake?.medical_conditions || {};
  const diagnoses = [];
  if (intake) {
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
  }

  const dob = patient?.date_of_birth || intake?.date_of_birth || null;
  const reason = intake?.what_brings_you || intake?.what_brings_you_in || intake?.symptoms || intake?.additional_notes || null;
  const meds = intake?.current_medications || intake?.medication_notes || null;
  const allergies = intake?.allergies
    ? (intake.allergy_reactions ? `${intake.allergies} (${intake.allergy_reactions})` : intake.allergies)
    : null;

  const collectionDate = testDate || 'date unknown';

  let desc = `New lab results imported for ${patientName} (collected ${collectionDate}). Review results, flag any out-of-range values, then use "Complete Review" to select consult type and notify Tara.\n`;
  desc += '\n━━━ PRE-CONSULT CHECKLIST ━━━\n';
  desc += '\nTELEMEDICINE REQUIRED:\n';
  desc += `Name: ${patientName}\n`;
  desc += `DOB: ${dob || 'Not on file'}\n`;
  desc += `Goals / Reason for visit: ${reason || 'Not on file'}\n`;
  desc += `Last visit: ${lastVisit || 'Not found'}\n`;
  desc += `Diagnoses: ${diagnoses.length > 0 ? diagnoses.join(', ') : 'None on file'}\n`;
  desc += `Medications: ${meds || 'None on file'}\n`;
  desc += `Allergies: ${allergies || 'None on file'}\n`;
  desc += '\nFOR IN-PERSON (add to above):\n';
  desc += '• Vitals — take at visit\n';
  desc += '• Mood & appearance — note at visit\n';
  desc += '• Previous plan — check prior session notes\n';
  desc += '• ⚡ Use Insight Health to scribe the conversation';

  if (labId) {
    desc += `\n---LAB_META---\n{"lab_id":"${labId}","collection_date":"${collectionDate}"}`;
  }

  return desc;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Find all pending lab review tasks (category = 'labs', status = 'pending')
    const { data: tasks, error: taskErr } = await supabase
      .from('tasks')
      .select('id, title, description, patient_id, patient_name')
      .eq('category', 'labs')
      .eq('status', 'pending')
      .like('title', '%Review labs%');

    if (taskErr) return res.status(500).json({ error: taskErr.message });
    if (!tasks || tasks.length === 0) return res.status(200).json({ success: true, message: 'No pending lab review tasks found', updated: 0 });

    // Deduplicate by patient_id (multiple assignees have same patient data)
    const seen = new Set();
    const updates = [];

    for (const task of tasks) {
      if (!task.patient_id) continue;

      // Extract test date from existing description if possible
      const dateMatch = task.description?.match(/collected (\d{4}-\d{2}-\d{2})/);
      const testDate = dateMatch?.[1] || null;

      const richDesc = await buildRichDescription(task.patient_id, task.patient_name, testDate);

      updates.push({ id: task.id, description: richDesc, patient_name: task.patient_name });
    }

    // Apply updates
    let updatedCount = 0;
    for (const u of updates) {
      const { error: upErr } = await supabase
        .from('tasks')
        .update({ description: u.description, updated_at: new Date().toISOString() })
        .eq('id', u.id);
      if (!upErr) {
        updatedCount++;
        console.log(`✓ Updated task for ${u.patient_name} (${u.id})`);
      } else {
        console.error(`✗ Failed to update task ${u.id}:`, upErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      tasksFound: tasks.length,
      updated: updatedCount,
      patients: updates.map(u => u.patient_name),
    });

  } catch (err) {
    console.error('backfill-lab-tasks error:', err);
    return res.status(500).json({ error: err.message });
  }
}
