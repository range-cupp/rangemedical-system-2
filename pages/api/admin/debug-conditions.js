// Temporary debug endpoint to inspect medical_conditions data in intakes
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Get intakes that have medical_conditions set
  const { data: intakes, error } = await supabase
    .from('intakes')
    .select('patient_id, email, first_name, last_name, medical_conditions')
    .not('medical_conditions', 'is', null)
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });

  const summary = (intakes || []).map(i => ({
    name: `${i.first_name} ${i.last_name}`,
    email: i.email,
    patient_id: i.patient_id,
    mc_type: typeof i.medical_conditions,
    mc_keys: i.medical_conditions && typeof i.medical_conditions === 'object' ? Object.keys(i.medical_conditions) : null,
    mc_sample: i.medical_conditions && typeof i.medical_conditions === 'object'
      ? Object.entries(i.medical_conditions).slice(0, 3).map(([k, v]) => ({ key: k, val: v }))
      : i.medical_conditions,
    has_yes: i.medical_conditions && typeof i.medical_conditions === 'object'
      ? Object.values(i.medical_conditions).filter(v => v && v.response && v.response !== 'No').length
      : 0,
  }));

  // Also count total intakes with non-null medical_conditions
  const { count } = await supabase
    .from('intakes')
    .select('id', { count: 'exact', head: true })
    .not('medical_conditions', 'is', null);

  return res.json({ total_with_conditions: count, sample: summary });
}
