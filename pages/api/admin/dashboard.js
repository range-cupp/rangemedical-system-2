// /pages/api/admin/dashboard.js
// Staff Dashboard API - At-Risk Patients & Stats
// Range Medical

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Get active protocols
    const { data: activeProtocols, error: protocolError } = await supabase
      .from('protocols')
      .select('id, patient_id, ghl_contact_id, patient_name, patient_phone, injections_completed, total_sessions, start_date')
      .eq('status', 'active');

    if (protocolError) {
      console.error('Protocol fetch error:', protocolError);
      return res.status(500).json({ error: 'Failed to fetch protocols' });
    }

    // Build patient list from protocols
    const patientMap = new Map();
    for (const p of (activeProtocols || [])) {
      const key = p.ghl_contact_id || p.patient_id || p.id;
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          id: p.patient_id,
          ghl_contact_id: p.ghl_contact_id,
          name: p.patient_name || 'Unknown',
          phone: p.patient_phone,
          protocols: []
        });
      }
      patientMap.get(key).protocols.push(p);
    }

    const patients = Array.from(patientMap.values());
    const atRisk = [];
    let totalScore = 0;
    let patientsScored = 0;

    // Calculate accountability for each patient
    for (const patient of patients) {
      let completed = 0;
      let expected = 0;

      for (const protocol of patient.protocols) {
        const protocolCompleted = protocol.injections_completed || 0;
        const totalSessions = protocol.total_sessions || 10;
        
        // Calculate expected based on days since start
        let protocolExpected = totalSessions;
        if (protocol.start_date) {
          const daysSinceStart = Math.floor((new Date() - new Date(protocol.start_date)) / 86400000) + 1;
          protocolExpected = Math.min(daysSinceStart, totalSessions);
        }
        
        completed += protocolCompleted;
        expected += protocolExpected;
      }

      const score = expected > 0 ? Math.round((completed / expected) * 100) : 0;
      
      if (score > 0) {
        totalScore += score;
        patientsScored++;
      }

      // Flag as at-risk if score < 70%
      if (expected > 0 && score < 70) {
        atRisk.push({
          ...patient,
          accountability_score: score,
          completed,
          expected,
          risk_reason: score < 50 ? `Only ${score}% complete` : `${score}% completion`
        });
      }
    }

    // Sort by lowest score first
    atRisk.sort((a, b) => a.accountability_score - b.accountability_score);

    // Get check-ins this week (if table exists)
    let checkInsThisWeek = 0;
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('id')
        .gte('check_in_date', weekAgo.toISOString().split('T')[0]);
      checkInsThisWeek = checkIns?.length || 0;
    } catch (e) {
      // Table might not exist yet
    }

    return res.status(200).json({
      stats: {
        active_patients: patients.length,
        avg_accountability: patientsScored > 0 ? Math.round(totalScore / patientsScored) : 0,
        check_ins_this_week: checkInsThisWeek
      },
      at_risk: atRisk.slice(0, 15),
      today_sessions: [] // Not tracking sessions yet
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
