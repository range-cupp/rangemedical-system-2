// GET /api/appointments/[id]/briefing
// Provider briefing synopsis for an appointment — pulls patient, most recent
// intake, prior visit, and latest vitals into a single payload that the prep
// page renders as a talking-points card for the provider.
//
// Telemedicine shows: name, DOB/age, reason for visit + goals, last visit
// date, diagnoses, medications, allergies, how heard.
// In-person additionally shows latest vitals and previous plan (last service).
//
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

// Map intake yes/no flag columns to human-readable labels
const HISTORY_FLAGS = [
  ['heart_disease', 'Heart disease', 'heart_disease_type', 'heart_disease_year'],
  ['diabetes', 'Diabetes', 'diabetes_type', 'diabetes_year'],
  ['thyroid_disorder', 'Thyroid disorder', 'thyroid_disorder_type', 'thyroid_disorder_year'],
  ['depression_anxiety', 'Depression / anxiety', null, 'depression_anxiety_year'],
  ['kidney_disease', 'Kidney disease', 'kidney_disease_type', 'kidney_disease_year'],
  ['liver_disease', 'Liver disease', 'liver_disease_type', 'liver_disease_year'],
  ['autoimmune_disorder', 'Autoimmune disorder', 'autoimmune_disorder_type', 'autoimmune_disorder_year'],
  ['cancer', 'Cancer', 'cancer_type', 'cancer_year'],
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;

  try {
    // 1. Appointment
    const { data: apt, error: aptErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();
    if (aptErr || !apt) return res.status(404).json({ error: 'Appointment not found' });

    // 2. Patient (if linked)
    let patient = null;
    if (apt.patient_id) {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, name, preferred_name, date_of_birth, referral_source')
        .eq('id', apt.patient_id)
        .maybeSingle();
      patient = data;
    }

    // 3. Most recent intake — prefer patient_id match, fall back to name match
    let intake = null;
    if (apt.patient_id) {
      const { data } = await supabase
        .from('intakes')
        .select('*')
        .eq('patient_id', apt.patient_id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      intake = data;
    }
    if (!intake && patient?.first_name && patient?.last_name) {
      const { data } = await supabase
        .from('intakes')
        .select('*')
        .ilike('first_name', patient.first_name)
        .ilike('last_name', patient.last_name)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      intake = data;
    }

    // 4. Last completed visit (before this appointment)
    let lastVisit = null;
    if (apt.patient_id) {
      const { data } = await supabase
        .from('appointments')
        .select('id, start_time, service_name, provider, status, visit_reason')
        .eq('patient_id', apt.patient_id)
        .neq('id', apt.id)
        .lt('start_time', apt.start_time || new Date().toISOString())
        .in('status', ['completed', 'checked_out'])
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      lastVisit = data;
    }

    // 5. Latest vitals (in-person only)
    let latestVitals = null;
    if (apt.modality !== 'telemedicine' && apt.modality !== 'phone' && apt.patient_id) {
      const { data } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('patient_id', apt.patient_id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      latestVitals = data;
    }

    // ── Build synopsis ──
    const diagnoses = [];
    if (intake) {
      for (const [flag, label, typeKey, yearKey] of HISTORY_FLAGS) {
        if (intake[flag]) {
          const parts = [label];
          if (typeKey && intake[typeKey]) parts.push(intake[typeKey]);
          if (yearKey && intake[yearKey]) parts.push(String(intake[yearKey]));
          diagnoses.push(parts.join(' — '));
        }
      }
    }

    // Allergies
    let allergies = null;
    if (intake) {
      if (intake.has_allergies === false) {
        allergies = 'NKDA';
      } else if (intake.allergies) {
        if (Array.isArray(intake.allergies)) allergies = intake.allergies.join(', ');
        else if (typeof intake.allergies === 'string') allergies = intake.allergies;
        else allergies = JSON.stringify(intake.allergies);
      }
    }

    // Medications
    let medications = null;
    if (intake) {
      if (intake.on_medications === false) {
        medications = 'None reported';
      } else if (intake.current_medications) {
        medications = intake.current_medications;
      }
    }

    const dob = patient?.date_of_birth || intake?.date_of_birth || null;

    const briefing = {
      modality: apt.modality || 'in_clinic',
      patient: {
        name: patient?.name || [patient?.first_name, patient?.last_name].filter(Boolean).join(' ') || apt.patient_name || null,
        dob,
        age: calcAge(dob),
      },
      reason_for_visit: apt.visit_reason || null,
      patient_goals: intake?.goals || null,
      how_heard: patient?.referral_source || intake?.how_heard || null,
      last_visit: lastVisit ? {
        date: lastVisit.start_time,
        service: lastVisit.service_name,
        provider: lastVisit.provider,
      } : null,
      diagnoses,
      medications,
      allergies,
      latest_vitals: latestVitals,
      intake_submitted_at: intake?.submitted_at || null,
      has_intake: !!intake,
    };

    return res.status(200).json({ briefing });
  } catch (err) {
    console.error('Briefing error:', err);
    return res.status(500).json({ error: err.message });
  }
}
