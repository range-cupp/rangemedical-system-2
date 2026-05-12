import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const [activeRes, allPeptideRes] = await Promise.all([
      supabase.rpc('get_peptide_pipeline_active', {}),
      supabase.rpc('get_peptide_pipeline_lapsed', {}),
    ]).catch(() => [null, null]);

    // Fallback: direct queries if RPCs don't exist
    // Active protocols ending within 14 days
    const endingSoonDate = new Date();
    endingSoonDate.setDate(endingSoonDate.getDate() + 14);
    const endingSoonStr = endingSoonDate.toISOString().split('T')[0];

    const { data: activeProtocols, error: activeErr } = await supabase
      .from('protocols')
      .select('id, patient_id, patient_name, patient_phone, patient_email, medication, start_date, end_date, status, comp')
      .eq('program_type', 'peptide')
      .eq('status', 'active')
      .gte('end_date', today)
      .order('end_date', { ascending: true });

    if (activeErr) throw activeErr;

    // Get patient contact info for those missing it on the protocol
    const patientIds = [...new Set((activeProtocols || []).map(p => p.patient_id).filter(Boolean))];

    const { data: patients } = patientIds.length > 0
      ? await supabase
          .from('patients')
          .select('id, first_name, last_name, phone, email')
          .in('id', patientIds)
      : { data: [] };

    const patientMap = {};
    (patients || []).forEach(p => {
      patientMap[p.id] = p;
    });

    // Enrich active protocols with patient data
    const enrichedActive = (activeProtocols || []).map(p => {
      const pt = patientMap[p.patient_id] || {};
      return {
        ...p,
        patient_name: p.patient_name || (pt.first_name ? `${pt.first_name} ${pt.last_name || ''}`.trim() : null),
        patient_phone: p.patient_phone || pt.phone,
        patient_email: p.patient_email || pt.email,
        days_remaining: Math.ceil((new Date(p.end_date) - new Date(today)) / (1000 * 60 * 60 * 24)),
        duration_days: Math.ceil((new Date(p.end_date) - new Date(p.start_date)) / (1000 * 60 * 60 * 24)),
      };
    });

    // All completed peptide protocols to find lapsed patients
    const lapsedCutoff = new Date();
    lapsedCutoff.setDate(lapsedCutoff.getDate() - 90);
    const lapsedCutoffStr = lapsedCutoff.toISOString().split('T')[0];

    const { data: recentCompleted, error: lapsedErr } = await supabase
      .from('protocols')
      .select('id, patient_id, patient_name, patient_phone, patient_email, medication, start_date, end_date, status')
      .eq('program_type', 'peptide')
      .lt('end_date', today)
      .gte('end_date', lapsedCutoffStr)
      .order('end_date', { ascending: false });

    if (lapsedErr) throw lapsedErr;

    // Group by patient — find those with no active protocol
    const activePatientIds = new Set(enrichedActive.map(p => p.patient_id));
    const lapsedByPatient = {};

    (recentCompleted || []).forEach(p => {
      if (activePatientIds.has(p.patient_id)) return;
      if (!lapsedByPatient[p.patient_id]) {
        lapsedByPatient[p.patient_id] = p;
      }
    });

    const lapsedPatientIds = Object.keys(lapsedByPatient);
    const { data: lapsedPatients } = lapsedPatientIds.length > 0
      ? await supabase
          .from('patients')
          .select('id, first_name, last_name, phone, email')
          .in('id', lapsedPatientIds)
      : { data: [] };

    const lapsedPatientMap = {};
    (lapsedPatients || []).forEach(p => {
      lapsedPatientMap[p.id] = p;
    });

    // Count total protocols per lapsed patient
    const { data: protocolCounts } = lapsedPatientIds.length > 0
      ? await supabase
          .from('protocols')
          .select('patient_id')
          .eq('program_type', 'peptide')
          .in('patient_id', lapsedPatientIds)
      : { data: [] };

    const countMap = {};
    (protocolCounts || []).forEach(p => {
      countMap[p.patient_id] = (countMap[p.patient_id] || 0) + 1;
    });

    const enrichedLapsed = Object.values(lapsedByPatient).map(p => {
      const pt = lapsedPatientMap[p.patient_id] || {};
      const daysSinceEnded = Math.ceil((new Date(today) - new Date(p.end_date)) / (1000 * 60 * 60 * 24));
      return {
        ...p,
        patient_name: p.patient_name || (pt.first_name ? `${pt.first_name} ${pt.last_name || ''}`.trim() : null),
        patient_phone: p.patient_phone || pt.phone,
        patient_email: p.patient_email || pt.email,
        days_since_ended: daysSinceEnded,
        duration_days: Math.ceil((new Date(p.end_date) - new Date(p.start_date)) / (1000 * 60 * 60 * 24)),
        total_protocols: countMap[p.patient_id] || 1,
      };
    }).sort((a, b) => a.days_since_ended - b.days_since_ended);

    // Count total protocols per active patient
    const { data: activeProtocolCounts } = patientIds.length > 0
      ? await supabase
          .from('protocols')
          .select('patient_id')
          .eq('program_type', 'peptide')
          .in('patient_id', patientIds)
      : { data: [] };

    const activeCountMap = {};
    (activeProtocolCounts || []).forEach(p => {
      activeCountMap[p.patient_id] = (activeCountMap[p.patient_id] || 0) + 1;
    });

    enrichedActive.forEach(p => {
      p.total_protocols = activeCountMap[p.patient_id] || 1;
    });

    // Stats
    const endingThisWeek = enrichedActive.filter(p => p.days_remaining <= 7).length;
    const endingNextWeek = enrichedActive.filter(p => p.days_remaining > 7 && p.days_remaining <= 14).length;
    const lapsedUnder14 = enrichedLapsed.filter(p => p.days_since_ended <= 14).length;
    const lapsedUnder30 = enrichedLapsed.filter(p => p.days_since_ended <= 30).length;

    return res.status(200).json({
      active: enrichedActive,
      lapsed: enrichedLapsed,
      stats: {
        totalActive: enrichedActive.length,
        endingThisWeek,
        endingNextWeek,
        totalLapsed: enrichedLapsed.length,
        lapsedUnder14,
        lapsedUnder30,
      },
    });
  } catch (err) {
    console.error('Peptide pipeline error:', err);
    return res.status(500).json({ error: 'Failed to load peptide pipeline data' });
  }
}
