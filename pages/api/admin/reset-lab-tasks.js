// /pages/api/admin/reset-lab-tasks.js
// Utility: delete all pending "Review labs" tasks for Evan + Dr. Burgess,
// then recreate them fresh with full pre-consult summary + LAB_META block.
// Protected by ADMIN_PASSWORD.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Shared helpers ─────────────────────────────────────────────────────────────

const INTAKE_FIELDS = 'id, patient_id, ghl_contact_id, email, submitted_at, date_of_birth, current_medications, medication_notes, allergies, allergy_reactions, what_brings_you, what_brings_you_in, symptoms, additional_notes, high_blood_pressure, high_blood_pressure_year, high_cholesterol, high_cholesterol_year, heart_disease, heart_disease_type, heart_disease_year, diabetes, diabetes_type, diabetes_year, thyroid_disorder, thyroid_disorder_type, thyroid_disorder_year, depression_anxiety, depression_anxiety_year, kidney_disease, kidney_disease_type, kidney_disease_year, liver_disease, liver_disease_type, liver_disease_year, autoimmune_disorder, autoimmune_disorder_type, autoimmune_disorder_year, cancer, cancer_type, cancer_year, medical_conditions';

const CONDITION_MAP = [
  { field: 'high_blood_pressure',  label: 'High blood pressure',  yearField: 'high_blood_pressure_year',  jsonKey: 'hypertension'   },
  { field: 'high_cholesterol',     label: 'High cholesterol',     yearField: 'high_cholesterol_year',     jsonKey: 'highCholesterol' },
  { field: 'heart_disease',        label: 'Heart disease',        yearField: 'heart_disease_year',        typeField: 'heart_disease_type',        jsonKey: 'heartDisease'  },
  { field: 'diabetes',             label: 'Diabetes',             yearField: 'diabetes_year',             typeField: 'diabetes_type',             jsonKey: 'diabetes'      },
  { field: 'thyroid_disorder',     label: 'Thyroid disorder',     yearField: 'thyroid_disorder_year',     typeField: 'thyroid_disorder_type',     jsonKey: 'thyroid'       },
  { field: 'depression_anxiety',   label: 'Depression/Anxiety',   yearField: 'depression_anxiety_year',   jsonKey: 'depression'     },
  { field: 'kidney_disease',       label: 'Kidney disease',       yearField: 'kidney_disease_year',       typeField: 'kidney_disease_type',       jsonKey: 'kidney'        },
  { field: 'liver_disease',        label: 'Liver disease',        yearField: 'liver_disease_year',        typeField: 'liver_disease_type',        jsonKey: 'liver'         },
  { field: 'autoimmune_disorder',  label: 'Autoimmune disorder',  yearField: 'autoimmune_disorder_year',  typeField: 'autoimmune_disorder_type',  jsonKey: 'autoimmune'    },
  { field: 'cancer',               label: 'Cancer',               yearField: 'cancer_year',               typeField: 'cancer_type',               jsonKey: 'cancer'        },
];

async function buildRichDescription(patientId, patientName, testDate) {
  // ── Patient record ──────────────────────────────────────────────────────────
  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, first_name, last_name, date_of_birth, email, ghl_contact_id')
    .eq('id', patientId)
    .maybeSingle();

  // ── Intake (fallback chain) ─────────────────────────────────────────────────
  let intake = null;
  const { data: byPatient } = await supabase.from('intakes').select(INTAKE_FIELDS).eq('patient_id', patientId).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
  if (byPatient) intake = byPatient;

  if (!intake && patient?.ghl_contact_id) {
    const { data: byGhl } = await supabase.from('intakes').select(INTAKE_FIELDS).eq('ghl_contact_id', patient.ghl_contact_id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
    if (byGhl) intake = byGhl;
  }
  if (!intake && patient?.email) {
    const { data: byEmail } = await supabase.from('intakes').select(INTAKE_FIELDS).ilike('email', patient.email).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
    if (byEmail) intake = byEmail;
  }

  // ── Last visit ──────────────────────────────────────────────────────────────
  let lastVisit = null;
  const { data: lastSession } = await supabase.from('sessions').select('session_date').eq('patient_id', patientId).order('session_date', { ascending: false }).limit(1).maybeSingle();
  if (lastSession) lastVisit = lastSession.session_date;

  // ── Lab ID ──────────────────────────────────────────────────────────────────
  let labId = null;
  const { data: labRow } = await supabase
    .from('labs')
    .select('id, test_date')
    .eq('patient_id', patientId)
    .eq('lab_provider', 'Primex')
    .order('test_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (labRow) {
    labId = labRow.id;
    if (!testDate) testDate = labRow.test_date;
  }

  // ── Diagnoses ───────────────────────────────────────────────────────────────
  const mc = intake?.medical_conditions || {};
  const diagnoses = [];
  if (intake) {
    for (const c of CONDITION_MAP) {
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

  const dob        = patient?.date_of_birth || intake?.date_of_birth || null;
  const reason     = intake?.what_brings_you || intake?.what_brings_you_in || intake?.symptoms || intake?.additional_notes || null;
  const meds       = intake?.current_medications || intake?.medication_notes || null;
  const allergies  = intake?.allergies
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

  return { desc, labId, testDate: collectionDate };
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // ── 1. Find all pending lab review tasks ──────────────────────────────────
    const { data: oldTasks, error: findErr } = await supabase
      .from('tasks')
      .select('id, title, description, patient_id, patient_name, assigned_to, due_date')
      .eq('category', 'labs')
      .eq('status', 'pending')
      .like('title', '%Review labs%');

    if (findErr) return res.status(500).json({ error: `Find error: ${findErr.message}` });

    if (!oldTasks || oldTasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending "Review labs" tasks found. Nothing to reset.',
        deleted: 0,
        created: 0,
      });
    }

    const oldIds = oldTasks.map(t => t.id);

    // ── 2. Capture unique patient+assignee combos before deleting ─────────────
    // Keep: patient_id, patient_name, assigned_to, due_date
    // We'll rebuild one task per combo with fresh description.
    const combos = oldTasks.map(t => ({
      patient_id:   t.patient_id,
      patient_name: t.patient_name,
      assigned_to:  t.assigned_to,
      due_date:     t.due_date,
    }));

    // ── 3. Delete old tasks ───────────────────────────────────────────────────
    const { error: delErr } = await supabase
      .from('tasks')
      .delete()
      .in('id', oldIds);

    if (delErr) return res.status(500).json({ error: `Delete error: ${delErr.message}` });

    // ── 4. Build rich descriptions (dedupe by patient so we don't hit DB N×2 times)
    const descCache = {};
    const uniquePatients = [...new Map(combos.filter(c => c.patient_id).map(c => [c.patient_id, c])).values()];

    for (const p of uniquePatients) {
      try {
        const result = await buildRichDescription(p.patient_id, p.patient_name, null);
        descCache[p.patient_id] = result;
      } catch (e) {
        console.error(`buildRichDescription failed for ${p.patient_name}:`, e.message);
        descCache[p.patient_id] = {
          desc: `New lab results imported for ${p.patient_name}. Review results, then use "Complete Review" to notify Tara.\n\n(Intake summary not available — patient record may be incomplete.)`,
          labId: null,
          testDate: null,
        };
      }
    }

    // ── 5. Reinsert fresh tasks ───────────────────────────────────────────────
    const now = new Date();
    const defaultDue = new Date(now);
    defaultDue.setDate(defaultDue.getDate() + 2);
    const defaultDueStr = defaultDue.toISOString().split('T')[0];

    const newTasks = combos
      .filter(c => c.patient_id && c.assigned_to)
      .map(c => {
        const cached = descCache[c.patient_id];
        return {
          title:        `🔬 Review labs — ${c.patient_name}`,
          description:  cached?.desc || `Review labs for ${c.patient_name}.`,
          patient_id:   c.patient_id,
          patient_name: c.patient_name,
          assigned_to:  c.assigned_to,
          assigned_by:  c.assigned_to,
          priority:     'high',
          due_date:     c.due_date || defaultDueStr,
          status:       'pending',
          category:     'labs',
        };
      });

    if (newTasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Old tasks deleted but no valid patient/assignee combos to recreate.',
        deleted: oldIds.length,
        created: 0,
      });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('tasks')
      .insert(newTasks)
      .select('id, title, assigned_to');

    if (insertErr) return res.status(500).json({ error: `Insert error: ${insertErr.message}`, deleted: oldIds.length });

    return res.status(200).json({
      success: true,
      deleted: oldIds.length,
      created: inserted.length,
      patients: uniquePatients.map(p => p.patient_name),
      tasks: inserted,
    });

  } catch (err) {
    console.error('reset-lab-tasks error:', err);
    return res.status(500).json({ error: err.message });
  }
}
