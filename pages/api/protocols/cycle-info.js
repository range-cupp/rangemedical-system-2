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
      .select('id, medication, start_date, end_date, status, cycle_start_date, program_type, program_name, total_sessions')
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
        return pt.includes('recovery') ||
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

    // Group protocols into cycles based on proximity
    // Two protocols are in the same cycle if the gap between one ending and
    // the next starting is <= off period (14 days). Otherwise they're separate cycles.
    // We always show the most recent cycle (which contains the latest protocol).
    const gapThreshold = offDays + 7; // off period + 1 week buffer

    // Build cycles by walking protocols chronologically and splitting on gaps
    const cycles = [];
    let currentCycle = [matchingProtocols[0]];

    for (let i = 1; i < matchingProtocols.length; i++) {
      const prev = matchingProtocols[i - 1];
      const curr = matchingProtocols[i];
      const prevEnd = prev.end_date ? new Date(prev.end_date + 'T12:00:00') : new Date();
      const currStart = new Date(curr.start_date + 'T12:00:00');
      const gapDays = Math.round((currStart - prevEnd) / (1000 * 60 * 60 * 24));

      if (gapDays > gapThreshold) {
        // Big gap — start a new cycle
        cycles.push(currentCycle);
        currentCycle = [curr];
      } else {
        currentCycle.push(curr);
      }
    }
    cycles.push(currentCycle);

    // Use the most recent cycle (last one, since protocols are sorted by start_date)
    const cycleProtocols = cycles[cycles.length - 1];
    const latestCycleDate = cycleProtocols[0].cycle_start_date || cycleProtocols[0].start_date;

    // Calculate total days used and total planned days in this cycle
    let cycleDaysUsed = 0;
    let totalPlannedDays = 0;
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const subProtocols = cycleProtocols.map(p => {
      const start = new Date(p.start_date + 'T12:00:00');
      // For active protocols, count days elapsed so far (up to today)
      // For completed protocols, count full duration (start to end)
      const isActive = p.status === 'active';
      const endForUsed = isActive ? today : (p.end_date ? new Date(p.end_date + 'T12:00:00') : today);
      const days = Math.max(0, Math.round((endForUsed - start) / (1000 * 60 * 60 * 24)));
      cycleDaysUsed += days;

      // Calculate planned duration — source of truth from the protocol itself
      // Prefer total_sessions (matches protocol detail page) over date math
      let plannedDuration = 0;
      if (p.total_sessions) {
        // Best source: explicit day/session count (same as protocol detail page)
        plannedDuration = p.total_sessions;
      } else if (p.end_date) {
        // Fallback: calculate from dates (inclusive)
        const plannedEnd = new Date(p.end_date + 'T12:00:00');
        plannedDuration = Math.max(0, Math.round((plannedEnd - start) / (1000 * 60 * 60 * 24)) + 1);
      } else if (p.program_name) {
        // Last resort: parse from program_name (e.g., "30-Day Recovery Protocol")
        const match = p.program_name.match(/(\d+)\s*[-\s]?day/i);
        if (match) plannedDuration = parseInt(match[1]);
      }
      // If we still have nothing, use days elapsed as fallback
      if (!plannedDuration) plannedDuration = days;
      totalPlannedDays += plannedDuration;

      return {
        id: p.id,
        medication: p.medication,
        startDate: p.start_date,
        endDate: p.end_date,
        days,
        status: p.status
      };
    });

    // Days remaining on the actual planned protocols (source of truth)
    const protocolDaysRemaining = Math.max(0, totalPlannedDays - cycleDaysUsed);
    // Days remaining before hitting the 90-day safety max
    const cycleDaysRemaining = Math.max(0, maxDays - cycleDaysUsed);
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
      totalPlannedDays,
      cycleDaysUsed,
      daysRemaining: protocolDaysRemaining,
      cycleDaysRemaining,
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
