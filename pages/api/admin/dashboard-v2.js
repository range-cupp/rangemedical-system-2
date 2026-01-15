// /pages/api/admin/dashboard-v2.js
// Dashboard API v2 - Protocol Management
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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const oneWeekOut = new Date(today);
    oneWeekOut.setDate(oneWeekOut.getDate() + 7);
    const oneWeekStr = oneWeekOut.toISOString().split('T')[0];

    // Get unassigned purchases (no protocol_id)
    let unassignedCount = 0;
    try {
      const { count } = await supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })
        .is('protocol_id', null);
      unassignedCount = count || 0;
    } catch (e) {
      console.log('Could not count unassigned purchases');
    }

    // Get all active protocols
    const { data: protocols } = await supabase
      .from('patient_protocols')
      .select('*')
      .eq('status', 'active');

    // Fallback: also check old protocols table
    const { data: oldProtocols } = await supabase
      .from('protocols')
      .select('*')
      .eq('status', 'active');

    // Get pending alerts
    const { data: alerts } = await supabase
      .from('staff_alerts')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })
      .limit(20);

    // Categorize protocols
    const protocolsEnding = [];
    const refillsDue = [];
    const labsDue = [];
    const weeklyCheckins = [];

    for (const p of (protocols || [])) {
      // Protocols ending this week
      if (p.end_date && p.end_date <= oneWeekStr && p.end_date >= todayStr) {
        protocolsEnding.push(p);
      }

      // Refills due (HRT with low supply)
      if (p.supply_type === 'prefilled' && p.supply_remaining <= 2) {
        refillsDue.push(p);
      } else if (p.supply_type === 'vial' && p.supply_remaining <= 2) {
        refillsDue.push(p);
      }

      // Labs due
      if (!p.baseline_labs_completed && p.baseline_labs_due && p.baseline_labs_due <= todayStr) {
        labsDue.push({ ...p, lab_type: 'baseline' });
      } else if (!p.followup_labs_completed && p.followup_labs_due && p.followup_labs_due <= oneWeekStr) {
        labsDue.push({ ...p, lab_type: 'followup' });
      }

      // Weekly check-ins for peptide protocols
      if (p.protocol_name?.includes('Recovery') || p.protocol_name?.includes('Peptide')) {
        // Get last staff checkin alert resolved date
        const daysSinceStart = Math.floor((today - new Date(p.start_date)) / 86400000);
        const weekNumber = Math.floor(daysSinceStart / 7);
        
        // Check if we need a day 7, 14, 21, etc. checkin
        if (daysSinceStart >= 7 && daysSinceStart % 7 <= 1) {
          weeklyCheckins.push(p);
        }
      }
    }

    // Also process old protocols for backward compatibility
    for (const p of (oldProtocols || [])) {
      if (p.end_date && p.end_date <= oneWeekStr && p.end_date >= todayStr) {
        protocolsEnding.push({
          ...p,
          protocol_name: p.program_name || p.primary_peptide,
          patient_name: p.patient_name
        });
      }
    }

    // Calculate stats
    const stats = {
      unassigned_purchases: unassignedCount,
      active_protocols: (protocols?.length || 0) + (oldProtocols?.length || 0),
      ending_this_week: protocolsEnding.length,
      needs_attention: refillsDue.length + labsDue.length + weeklyCheckins.length
    };

    return res.status(200).json({
      stats,
      alerts: (alerts || []).map(a => ({
        ...a,
        patient_phone: a.patient_phone // We'd need to join this from patient
      })),
      protocols_ending: protocolsEnding.slice(0, 10),
      refills_due: refillsDue.slice(0, 10),
      labs_due: labsDue.slice(0, 10),
      weekly_checkins: weeklyCheckins.slice(0, 10)
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
