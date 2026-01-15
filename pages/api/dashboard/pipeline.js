// /pages/api/dashboard/pipeline.js
// Pipeline Dashboard API - Labs complete, Ending Soon, Active protocols

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Labs Complete, No Active Protocol
    const { data: labsComplete } = await supabase.rpc('get_labs_no_protocol');

    // If RPC doesn't exist, use direct query
    let labsNoProtocol = labsComplete;
    if (!labsNoProtocol) {
      const { data: patientsWithLabs } = await supabase
        .from('labs')
        .select(`
          patient_id,
          panel_type,
          test_date,
          patients!inner(id, first_name, last_name)
        `)
        .order('test_date', { ascending: false });

      // Get patients with active protocols
      const { data: activePatientIds } = await supabase
        .from('patient_protocols')
        .select('patient_id')
        .eq('status', 'active');

      const activeIds = new Set((activePatientIds || []).map(p => p.patient_id));

      // Get patients with symptoms
      const { data: symptomsPatients } = await supabase
        .from('symptom_responses')
        .select('patient_id')
        .eq('response_type', 'baseline');

      const symptomsSet = new Set((symptomsPatients || []).map(s => s.patient_id));

      // Filter to patients with labs but no active protocol
      const seen = new Set();
      labsNoProtocol = (patientsWithLabs || [])
        .filter(l => {
          if (seen.has(l.patient_id) || activeIds.has(l.patient_id)) return false;
          seen.add(l.patient_id);
          return true;
        })
        .map(l => ({
          id: l.patient_id,
          name: `${l.patients?.first_name || ''} ${l.patients?.last_name || ''}`.trim() || 'Unknown',
          lab_panel: l.panel_type,
          lab_date: l.test_date,
          has_symptoms: symptomsSet.has(l.patient_id)
        }))
        .slice(0, 50);
    }

    // 2. Ending Soon (within 3 days)
    const { data: endingSoon } = await supabase
      .from('patient_protocols')
      .select('*')
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .lte('end_date', threeDaysOut)
      .gte('end_date', today)
      .order('end_date', { ascending: true });

    // 3. Active Protocols (not ending in 3 days)
    const { data: active } = await supabase
      .from('patient_protocols')
      .select('*')
      .eq('status', 'active')
      .or(`end_date.is.null,end_date.gt.${threeDaysOut}`)
      .order('start_date', { ascending: false })
      .limit(50);

    // Stats
    const stats = {
      labsNoProtocol: labsNoProtocol?.length || 0,
      endingSoon: endingSoon?.length || 0,
      activeProtocols: (endingSoon?.length || 0) + (active?.length || 0)
    };

    return res.status(200).json({
      labsComplete: labsNoProtocol || [],
      endingSoon: endingSoon || [],
      active: active || [],
      stats
    });

  } catch (error) {
    console.error('Pipeline API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
