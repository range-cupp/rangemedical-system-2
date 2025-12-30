// /pages/api/patients/[id].js
// Patient Profile API - Returns complete patient data for profile view

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return getPatientProfile(id, res);
  }
  
  if (req.method === 'PUT') {
    return updatePatient(id, req.body, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getPatientProfile(patientId, res) {
  try {
    // Get patient basic info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get active protocols
    const { data: activeProtocols } = await supabase
      .from('patient_protocols')
      .select(`
        id,
        protocol_name,
        category,
        medication,
        dose,
        frequency,
        start_date,
        end_date,
        duration_days,
        total_sessions,
        sessions_completed,
        expected_doses,
        logged_doses,
        compliance_percent,
        next_checkin_date,
        baseline_labs_required,
        baseline_labs_completed,
        followup_labs_due,
        followup_labs_completed,
        status,
        created_at
      `)
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    // Get completed protocols (last 10)
    const { data: completedProtocols } = await supabase
      .from('patient_protocols')
      .select(`
        id,
        protocol_name,
        category,
        start_date,
        end_date,
        compliance_percent,
        status
      `)
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('end_date', { ascending: false })
      .limit(10);

    // Get pending notifications
    const { data: pendingNotifications } = await supabase
      .from('purchase_notifications')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    // Get baseline symptoms (most recent core questionnaire)
    const { data: baselineSymptoms } = await supabase
      .from('symptom_responses')
      .select('*')
      .eq('patient_id', patientId)
      .eq('questionnaire_name', 'core')
      .eq('response_type', 'baseline')
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    // Get latest labs
    const { data: latestLabs } = await supabase
      .from('labs')
      .select('*')
      .eq('patient_id', patientId)
      .order('test_date', { ascending: false, nullsFirst: false })
      .limit(1)
      .single();

    // Get recent purchases
    const { data: recentPurchases } = await supabase
      .from('purchases')
      .select('*')
      .eq('patient_id', patientId)
      .order('purchase_date', { ascending: false })
      .limit(10);

    // Calculate stats
    const totalProtocols = (activeProtocols?.length || 0) + (completedProtocols?.length || 0);
    const avgCompliance = completedProtocols?.length > 0
      ? Math.round(completedProtocols.reduce((sum, p) => sum + (p.compliance_percent || 0), 0) / completedProtocols.length)
      : null;

    return res.status(200).json({
      patient,
      activeProtocols: activeProtocols || [],
      completedProtocols: completedProtocols || [],
      pendingNotifications: pendingNotifications || [],
      baselineSymptoms,
      latestLabs,
      recentPurchases: recentPurchases || [],
      stats: {
        totalProtocols,
        avgCompliance,
        hasBaselineSymptoms: !!baselineSymptoms,
        hasBaselineLabs: !!latestLabs
      }
    });

  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function updatePatient(patientId, data, res) {
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, patient });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
