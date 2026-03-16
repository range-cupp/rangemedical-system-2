// Debug: Find John Choi's protocols
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // Get full patient record
    const { data: patients } = await supabase
      .from('patients')
      .select('*')
      .or('full_name.ilike.%choi%,name.ilike.%choi%');

    // Search protocols by patient_name
    const { data: byName } = await supabase
      .from('protocols')
      .select('*')
      .or('patient_name.ilike.%choi%,patient_name.ilike.%john%,patient_name.ilike.%jon%');

    // Search protocols by patient_id
    let byPatientId = null;
    if (patients && patients.length > 0) {
      const ids = patients.map(p => p.id);
      const { data } = await supabase
        .from('protocols')
        .select('*')
        .in('patient_id', ids);
      byPatientId = data;
    }

    // Search protocols by ghl_contact_id
    let byGhlId = null;
    if (patients && patients.length > 0) {
      const ghlIds = patients.filter(p => p.ghl_contact_id).map(p => p.ghl_contact_id);
      if (ghlIds.length > 0) {
        const { data } = await supabase
          .from('protocols')
          .select('*')
          .in('ghl_contact_id', ghlIds);
        byGhlId = data;
      }
    }

    // Also search service_logs for this patient
    let serviceLogs = null;
    if (patients && patients.length > 0) {
      const ids = patients.map(p => p.id);
      const { data } = await supabase
        .from('service_logs')
        .select('*')
        .in('patient_id', ids)
        .order('created_at', { ascending: false })
        .limit(10);
      serviceLogs = data;
    }

    // Recent weight loss protocols
    const { data: recentWL } = await supabase
      .from('protocols')
      .select('id, patient_id, ghl_contact_id, patient_name, program_name, start_date, end_date, total_sessions, sessions_used, next_expected_date, status, category')
      .eq('category', 'weight_loss')
      .gte('start_date', '2026-03-14')
      .order('created_at', { ascending: false })
      .limit(10);

    return res.status(200).json({
      patients: patients?.map(p => ({ id: p.id, name: p.name, full_name: p.full_name, ghl_contact_id: p.ghl_contact_id })),
      byName,
      byPatientId,
      byGhlId,
      serviceLogs,
      recentWL
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
