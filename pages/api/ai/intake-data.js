import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    const { data: intakes, error } = await supabase
      .from('intakes')
      .select('id, first_name, last_name, email, phone, date_of_birth, gender, submitted_at, has_allergies, allergies, allergy_reactions, on_medications, current_medications, medication_notes, on_hrt, hrt_details, medical_conditions, has_pcp, pcp_name, recent_hospitalization, hospitalization_reason, symptoms, symptom_followups, symptom_duration, additional_notes, is_minor, guardian_name, guardian_relationship, how_heard, how_heard_other')
      .eq('patient_id', patient_id)
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!intakes || intakes.length === 0) {
      return res.status(200).json({ has_intake: false, message: 'No intake form found for this patient.' });
    }

    const intake = intakes[0];

    const allergies = {
      has_allergies: intake.has_allergies || 'Unknown',
      list: intake.allergies || null,
      reactions: intake.allergy_reactions || null,
    };

    const medications = {
      on_medications: intake.on_medications || 'Unknown',
      current_list: intake.current_medications || null,
      notes: intake.medication_notes || null,
      on_hrt: intake.on_hrt || 'Unknown',
      hrt_details: intake.hrt_details || null,
    };

    const conditions = intake.medical_conditions || {};

    const healthcare = {
      has_pcp: intake.has_pcp || 'Unknown',
      pcp_name: intake.pcp_name || null,
      recent_hospitalization: intake.recent_hospitalization || 'Unknown',
      hospitalization_reason: intake.hospitalization_reason || null,
    };

    const concerns = {
      symptoms: intake.symptoms || [],
      followups: intake.symptom_followups || {},
      duration: intake.symptom_duration || null,
      additional_notes: intake.additional_notes || null,
    };

    return res.status(200).json({
      has_intake: true,
      submitted_at: intake.submitted_at,
      patient: {
        name: `${intake.first_name} ${intake.last_name}`,
        email: intake.email,
        phone: intake.phone,
        dob: intake.date_of_birth,
        gender: intake.gender,
        is_minor: intake.is_minor,
        guardian: intake.is_minor === 'Yes' ? { name: intake.guardian_name, relationship: intake.guardian_relationship } : null,
      },
      allergies,
      medications,
      medical_conditions: conditions,
      healthcare,
      concerns,
      how_heard: intake.how_heard || intake.how_heard_other || null,
    });
  } catch (err) {
    console.error('Intake data error:', err);
    return res.status(500).json({ error: 'Failed to fetch intake data' });
  }
}
