// lib/lab-post-import.js
// Shared post-import actions run after each patient's labs are successfully imported.
// 1. Advances the lab protocol: blood_draw_complete → results_received
// 2. Generates AI clinical synopsis for provider review
// 3. Creates rich "Review Labs" tasks for Evan and Dr. Burgess with full pre-consult summary + synopsis

import { generateLabSynopsis } from './generate-lab-synopsis';

/**
 * Load all relevant staff IDs once per import batch.
 * Returns { evanId, burgessId, taraId, damonId, chrisId } — any may be null if not found.
 */
export async function loadReviewerIds(supabase) {
  const { data } = await supabase
    .from('employees')
    .select('id, email')
    .in('email', [
      'evan@range-medical.com',
      'burgess@range-medical.com',
      'tara@range-medical.com',
      'damon@range-medical.com',
      'cupp@range-medical.com',
    ])
    .eq('is_active', true);

  const evanId    = data?.find(e => e.email === 'evan@range-medical.com')?.id    || null;
  const burgessId = data?.find(e => e.email === 'burgess@range-medical.com')?.id || null;
  const taraId    = data?.find(e => e.email === 'tara@range-medical.com')?.id    || null;
  const damonId   = data?.find(e => e.email === 'damon@range-medical.com')?.id   || null;
  const chrisId   = data?.find(e => e.email === 'cupp@range-medical.com')?.id    || null;
  return { evanId, burgessId, taraId, damonId, chrisId };
}

/**
 * Fetch a pre-consult summary for a patient from their intake form.
 * Returns a formatted multi-line string to embed in the task description.
 */
async function getPatientIntakeSummary(supabase, patientId) {
  try {
    // Fetch patient record
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, first_name, last_name, date_of_birth, email, ghl_contact_id, referral_source')
      .eq('id', patientId)
      .single();

    if (!patient) return null;

    const patientName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();

    const intakeFields = 'id, patient_id, ghl_contact_id, email, submitted_at, date_of_birth, current_medications, medication_notes, allergies, allergy_reactions, what_brings_you, what_brings_you_in, symptoms, additional_notes, on_hrt, hrt_details, high_blood_pressure, high_blood_pressure_year, high_cholesterol, high_cholesterol_year, heart_disease, heart_disease_type, heart_disease_year, diabetes, diabetes_type, diabetes_year, thyroid_disorder, thyroid_disorder_type, thyroid_disorder_year, depression_anxiety, depression_anxiety_year, kidney_disease, kidney_disease_type, kidney_disease_year, liver_disease, liver_disease_type, liver_disease_year, autoimmune_disorder, autoimmune_disorder_type, autoimmune_disorder_year, cancer, cancer_type, cancer_year, medical_conditions';

    // Try intake by patient_id, then ghl_contact_id, then email
    let intake = null;
    const { data: byPatient } = await supabase.from('intakes').select(intakeFields).eq('patient_id', patientId).order('submitted_at', { ascending: false }).limit(1).single();
    if (byPatient) intake = byPatient;

    if (!intake && patient.ghl_contact_id) {
      const { data: byGhl } = await supabase.from('intakes').select(intakeFields).eq('ghl_contact_id', patient.ghl_contact_id).order('submitted_at', { ascending: false }).limit(1).single();
      if (byGhl) intake = byGhl;
    }

    if (!intake && patient.email) {
      const { data: byEmail } = await supabase.from('intakes').select(intakeFields).ilike('email', patient.email).order('submitted_at', { ascending: false }).limit(1).single();
      if (byEmail) intake = byEmail;
    }

    // Last visit date
    let lastVisit = null;
    const { data: lastSession } = await supabase.from('sessions').select('session_date').eq('patient_id', patientId).order('session_date', { ascending: false }).limit(1).single();
    if (lastSession) lastVisit = lastSession.session_date;

    // Build diagnoses
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

    const dob = patient.date_of_birth || intake?.date_of_birth || null;
    const reasonForVisit = intake?.what_brings_you || intake?.what_brings_you_in || intake?.symptoms || intake?.additional_notes || null;
    const medications = intake?.current_medications || intake?.medication_notes || null;
    const allergies = intake?.allergies
      ? (intake.allergy_reactions ? `${intake.allergies} (${intake.allergy_reactions})` : intake.allergies)
      : null;

    // Format the summary
    const lines = [];
    lines.push('━━━ PRE-CONSULT CHECKLIST ━━━');
    lines.push('');
    lines.push('TELEMEDICINE REQUIRED:');
    lines.push(`Name: ${patientName}`);
    lines.push(`DOB: ${dob || 'Not on file'}`);
    lines.push(`Referred by: ${patient.referral_source || 'Not on file'}`);
    lines.push(`Goals / Reason for visit: ${reasonForVisit || 'Not on file'}`);
    lines.push(`Last visit: ${lastVisit || 'Not found'}`);
    lines.push(`Diagnoses: ${diagnoses.length > 0 ? diagnoses.join(', ') : 'None on file'}`);
    lines.push(`Medications: ${medications || 'None on file'}`);
    lines.push(`Allergies: ${allergies || 'None on file'}`);
    lines.push('');
    lines.push('FOR IN-PERSON (add to above):');
    lines.push('• Vitals — take at visit');
    lines.push('• Mood & appearance — note at visit');
    lines.push('• Previous plan — check prior session notes');
    lines.push('• ⚡ Use Insight Health to scribe the conversation');

    return lines.join('\n');
  } catch (e) {
    console.error('[lab-post-import] Intake summary error:', e.message);
    return null;
  }
}

/**
 * Run post-import actions for one patient whose labs were just imported.
 *
 * @param {object} supabase    - Supabase client
 * @param {string} patientId   - UUID of the patient
 * @param {string} patientName - Display name e.g. "Jamie Lewis"
 * @param {string} testDate    - YYYY-MM-DD of the lab collection date
 * @param {object} reviewerIds - { evanId, burgessId, taraId, damonId, chrisId }
 */
export async function postImportActions(supabase, patientId, patientName, testDate, reviewerIds) {
  const { evanId, burgessId } = reviewerIds;

  // ── 1. Advance lab protocol ─────────────────────────────────────────────────
  try {
    const { data: proto } = await supabase
      .from('protocols')
      .select('id, status')
      .eq('patient_id', patientId)
      .eq('program_type', 'labs')
      .in('status', ['awaiting_results', 'ordered', 'draw_scheduled', 'blood_draw_complete'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proto) {
      await supabase
        .from('protocols')
        .update({ status: 'uploaded', updated_at: new Date().toISOString() })
        .eq('id', proto.id);
    }
  } catch (e) {
    console.error(`[lab-post-import] Protocol advance error for ${patientName}:`, e.message);
  }

  // ── 2. Get the lab_id just inserted ────────────────────────────────────────
  let labId = null;
  try {
    const { data: labRow } = await supabase
      .from('labs')
      .select('id')
      .eq('patient_id', patientId)
      .eq('test_date', testDate)
      .eq('lab_provider', 'Primex')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    labId = labRow?.id || null;
  } catch (e) {
    console.error(`[lab-post-import] Lab ID lookup error for ${patientName}:`, e.message);
  }

  // ── 3. Fetch pre-consult intake summary ────────────────────────────────────
  const intakeSummary = await getPatientIntakeSummary(supabase, patientId);

  // ── 3b. Generate AI clinical synopsis (with timeout) ──────────────────────
  let synopsis = null;
  if (labId) {
    try {
      synopsis = await Promise.race([
        generateLabSynopsis(supabase, labId, patientId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Synopsis timeout (15s)')), 15000))
      ]);
    } catch (e) {
      console.error(`[lab-post-import] Synopsis error for ${patientName}:`, e.message);
    }
  }

  // ── 4. Build task description ──────────────────────────────────────────────
  const today = new Date();
  const reviewDue = new Date(today);
  reviewDue.setDate(reviewDue.getDate() + 2);
  const reviewDueStr = reviewDue.toISOString().split('T')[0];

  let description = `New lab results imported for ${patientName} (collected ${testDate}). Review results, flag any out-of-range values, then use "Complete Review" to select consult type and notify Tara.\n`;

  if (intakeSummary) {
    description += '\n' + intakeSummary;
  } else {
    description += '\nNo intake form found for this patient.';
  }

  // Add AI synopsis if available
  if (synopsis) {
    description += '\n\n━━━ AI CLINICAL SYNOPSIS ━━━\n\n' + synopsis;
  }

  // Append parseable meta at end (stripped from display in UI)
  if (labId) {
    description += `\n---LAB_META---\n{"lab_id":"${labId}","collection_date":"${testDate}"}`;
  }

  // ── 5. Clinical review tasks (Evan + Dr. Burgess) ─────────────────────────
  const reviewTask = {
    title: `🔬 Review labs — ${patientName}`,
    description,
    patient_id: patientId,
    patient_name: patientName,
    priority: 'high',
    due_date: reviewDueStr,
    status: 'pending',
    category: 'labs',
  };

  const reviewTasks = [];
  if (evanId)    reviewTasks.push({ ...reviewTask, assigned_to: evanId,    assigned_by: evanId });
  if (burgessId) reviewTasks.push({ ...reviewTask, assigned_to: burgessId, assigned_by: burgessId });

  if (reviewTasks.length > 0) {
    try {
      await supabase.from('tasks').insert(reviewTasks);
    } catch (e) {
      console.error(`[lab-post-import] Review task creation error for ${patientName}:`, e.message);
    }
  }

  // Main Pipeline: ensure the patient has an energy_workup card at under_review.
  // Create if missing, advance from labs_scheduled/awaiting_results. We pass
  // skipTaskCreation=true because the rich "Review labs" tasks above already
  // cover Damien + Evan — we don't want a second generic joint task.
  try {
    const { ensureEnergyWorkupAtUnderReview } = await import('./pipeline-automations');
    await ensureEnergyWorkupAtUnderReview({
      patientId,
      reason: 'lab_biomarker_import',
      skipTaskCreation: true,
    });
  } catch (e) {
    console.error(`[lab-post-import] Pipeline card ensure error for ${patientName}:`, e.message);
  }

  // NOTE: Scheduling tasks for Tara + Chris are NOT created here.
  // They fire when Evan or Dr. Burgess clicks "Complete Review" on the task,
  // selects the consultation type(s), adds instructions, and hits "Send to Tara & Chris".
  // This is handled by /api/admin/complete-lab-review.js.
}
