// /pages/api/protocols/cycle-info.js
// GET cycle status for a patient's peptide protocols (recovery or GH)
// Query param: cycleType ("recovery" | "gh", defaults to "recovery")
// Returns cycle days used, remaining, sub-protocols, and off-period info
// Works with or without cycle_start_date — falls back to date-based grouping

import { createClient } from '@supabase/supabase-js';
import { isRecoveryPeptide, RECOVERY_CYCLE_MAX_DAYS, RECOVERY_CYCLE_OFF_DAYS, isGHPeptide, GH_CYCLE_MAX_DAYS, GH_CYCLE_OFF_DAYS } from '../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientId, cycleType: rawCycleType } = req.query;
  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }

  // Determine cycle type: "recovery" (default) or "gh"
  const cycleType = rawCycleType === 'gh' ? 'gh' : 'recovery';
  const filterFn = cycleType === 'gh' ? isGHPeptide : isRecoveryPeptide;
  const maxDays = cycleType === 'gh' ? GH_CYCLE_MAX_DAYS : RECOVERY_CYCLE_MAX_DAYS;
  const offDays = cycleType === 'gh' ? GH_CYCLE_OFF_DAYS : RECOVERY_CYCLE_OFF_DAYS;

  try {
    // Fetch ALL peptide protocols for this patient (not just those with cycle_start_date)
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('id, medication, start_date, end_date, status, cycle_start_date, program_type, program_name')
      .eq('patient_id', patientId)
      .not('status', 'in', '("cancelled","merged")')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching cycle protocols:', error);
      return res.status(500).json({ error: error.message });
    }

    // Filter to only the requested peptide type by medication name
    // Also include protocols with peptide-like program types as fallback
    const matchingProtocols = (protocols || []).filter(p => {
      if (filterFn(p.medication)) return true;
      // Fallback: check program_type / program_name for recovery peptides
      if (cycleType === 'recovery') {
        const pt = (p.program_type || '').toLowerCase();
        const pn = (p.program_name || '').toLowerCase();
        return pt.includes('recovery') || pt.includes('peptide') ||
               pn.includes('recovery') || pn.includes('bpc') || pn.includes('thymosin');
      }
      return false;
    });

    if (matchingProtocols.length === 0) {
      return res.status(200).json({
        success: true,
        hasCycle: false,
        cycleType,
        maxDays,
        offDays,
        cycleDaysUsed: 0,
        daysRemaining: maxDays,
        cycleStartDate: null,
        cycleExhausted: false,
        offPeriodEnds: null,
        subProtocols: []
      });
    }

    // Try to group by cycle_start_date first
    const withCycle = matchingProtocols.filter(p => p.cycle_start_date);
    let cycleProtocols;
    let latestCycleDate;

    if (withCycle.length > 0) {
      // Group by cycle_start_date
      const cycleGroups = {};
      for (const p of withCycle) {
        const key = p.cycle_start_date;
        if (!cycleGroups[key]) cycleGroups[key] = [];
        cycleGroups[key].push(p);
      }
      latestCycleDate = Object.keys(cycleGroups).sort().pop();
      cycleProtocols = cycleGroups[latestCycleDate];
    } else {
      // Fallback: group all consecutive protocols as one cycle
      // Use the earliest start_date as the cycle start
      latestCycleDate = matchingProtocols[0].start_date;
      cycleProtocols = matchingProtocols;
    }

    // Calculate total days used in this cycle
    let cycleDaysUsed = 0;
    const subProtocols = cycleProtocols.map(p => {
      const start = new Date(p.start_date + 'T12:00:00');
      const end = p.end_date ? new Date(p.end_date + 'T12:00:00') : new Date();
      const days = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      cycleDaysUsed += days;
      return {
        id: p.id,
        medication: p.medication,
        startDate: p.start_date,
        endDate: p.end_date,
        days,
        status: p.status
      };
    });

    const daysRemaining = Math.max(0, maxDays - cycleDaysUsed);
    const cycleExhausted = cycleDaysUsed >= maxDays;

    // Calculate off period end date if cycle is exhausted
    let offPeriodEnds = null;
    if (cycleExhausted) {
      const latestEnd = cycleProtocols
        .filter(p => p.end_date)
        .map(p => new Date(p.end_date + 'T12:00:00'))
        .sort((a, b) => b - a)[0];

      if (latestEnd) {
        const offEnd = new Date(latestEnd);
        offEnd.setDate(offEnd.getDate() + offDays);
        offPeriodEnds = offEnd.toISOString().split('T')[0];
      }
    }

    return res.status(200).json({
      success: true,
      hasCycle: true,
      cycleType,
      maxDays,
      offDays,
      cycleDaysUsed,
      daysRemaining,
      cycleStartDate: latestCycleDate,
      cycleExhausted,
      offPeriodEnds,
      subProtocols
    });

  } catch (error) {
    console.error('Cycle info error:', error);
    return res.status(500).json({ error: error.message });
  }
}
