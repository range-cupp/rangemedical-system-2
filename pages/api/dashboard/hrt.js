// /pages/api/dashboard/hrt.js
// HRT & Ongoing Dashboard API

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
    const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get HRT protocols (ongoing, no end date or category = hrt)
    const { data: hrtProtocols } = await supabase
      .from('patient_protocols')
      .select(`
        id,
        patient_id,
        patient_name,
        protocol_name,
        medication,
        dose,
        frequency,
        start_date,
        status,
        notes
      `)
      .eq('category', 'hrt')
      .eq('status', 'active')
      .order('patient_name', { ascending: true });

    // Enrich HRT with additional data
    // For now, we'll need to add supply tracking columns later
    // This is a simplified version
    const hrtEnriched = (hrtProtocols || []).map(p => ({
      ...p,
      supply_type: p.notes?.includes('vial') ? 'vial' : 
                   p.notes?.includes('prefilled') ? 'prefilled' : null,
      refill_due: null, // Will need supply tracking to calculate
      last_labs: null   // Will join with labs table
    }));

    // Get last labs for HRT patients
    const hrtPatientIds = hrtEnriched.map(p => p.patient_id);
    if (hrtPatientIds.length > 0) {
      const { data: labs } = await supabase
        .from('labs')
        .select('patient_id, test_date')
        .in('patient_id', hrtPatientIds)
        .order('test_date', { ascending: false });

      const labsByPatient = {};
      (labs || []).forEach(l => {
        if (!labsByPatient[l.patient_id]) {
          labsByPatient[l.patient_id] = l.test_date;
        }
      });

      hrtEnriched.forEach(p => {
        p.last_labs = labsByPatient[p.patient_id] || null;
      });
    }

    // Get Weight Loss protocols (ongoing)
    const { data: weightLossProtocols } = await supabase
      .from('patient_protocols')
      .select(`
        id,
        patient_id,
        patient_name,
        protocol_name,
        medication,
        dose,
        frequency,
        start_date,
        status,
        notes
      `)
      .eq('category', 'weight_loss')
      .eq('status', 'active')
      .order('patient_name', { ascending: true });

    // Calculate week number for weight loss
    const weightLossEnriched = (weightLossProtocols || []).map(p => {
      const startDate = new Date(p.start_date);
      const today = new Date();
      const weekNumber = Math.ceil((today - startDate) / (7 * 24 * 60 * 60 * 1000));
      return {
        ...p,
        week_number: weekNumber > 0 ? weekNumber : 1,
        next_visit: null // Would need appointment integration
      };
    });

    // Stats
    const stats = {
      totalHRT: hrtEnriched.length,
      totalWeightLoss: weightLossEnriched.length,
      refillsDue: hrtEnriched.filter(p => {
        // For now count those without recent labs (90+ days)
        if (!p.last_labs) return true;
        const daysSinceLabs = Math.ceil((new Date() - new Date(p.last_labs)) / (1000 * 60 * 60 * 24));
        return daysSinceLabs > 90;
      }).length
    };

    return res.status(200).json({
      hrt: hrtEnriched,
      weightLoss: weightLossEnriched,
      stats
    });

  } catch (error) {
    console.error('HRT Dashboard API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
