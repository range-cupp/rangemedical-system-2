// Debug: Find John Choi's protocols
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // Search by various name patterns
    const { data: byName } = await supabase
      .from('protocols')
      .select('id, patient_id, patient_name, program_name, start_date, end_date, total_sessions, sessions_used, next_expected_date, status, category')
      .or('patient_name.ilike.%choi%,patient_name.ilike.%john%choi%,patient_name.ilike.%jon%choi%');

    // Also search by patient table
    const { data: patients } = await supabase
      .from('patients')
      .select('id, full_name, name')
      .or('full_name.ilike.%choi%,name.ilike.%choi%');

    // If we found a patient, search protocols by patient_id
    let protocolsByPatientId = null;
    if (patients && patients.length > 0) {
      const ids = patients.map(p => p.id);
      const { data } = await supabase
        .from('protocols')
        .select('id, patient_id, patient_name, program_name, start_date, end_date, total_sessions, sessions_used, next_expected_date, last_refill_date, status, category')
        .in('patient_id', ids);
      protocolsByPatientId = data;
    }

    // Also look for recent weight_loss protocols from today
    const { data: recentWL } = await supabase
      .from('protocols')
      .select('id, patient_id, patient_name, program_name, start_date, end_date, total_sessions, sessions_used, next_expected_date, status, category')
      .eq('category', 'weight_loss')
      .gte('start_date', '2026-03-15')
      .order('created_at', { ascending: false })
      .limit(10);

    return res.status(200).json({
      byName,
      patients,
      protocolsByPatientId,
      recentWL
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
