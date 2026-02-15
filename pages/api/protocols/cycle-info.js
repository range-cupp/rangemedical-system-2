// /pages/api/protocols/cycle-info.js
// GET cycle status for a patient's recovery peptide protocols
// Returns cycle days used, remaining, sub-protocols, and off-period info

import { createClient } from '@supabase/supabase-js';
import { isRecoveryPeptide, RECOVERY_CYCLE_MAX_DAYS, RECOVERY_CYCLE_OFF_DAYS } from '../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patientId } = req.query;
  if (!patientId) {
    return res.status(400).json({ error: 'patientId is required' });
  }

  try {
    // Fetch all recovery peptide protocols for this patient that have a cycle_start_date
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select('id, medication, start_date, end_date, status, cycle_start_date, program_type')
      .eq('patient_id', patientId)
      .eq('program_type', 'peptide')
      .not('status', 'in', '("cancelled","merged")')
      .not('cycle_start_date', 'is', null)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching cycle protocols:', error);
      return res.status(500).json({ error: error.message });
    }

    // Filter to only recovery peptides
    const recoveryProtocols = (protocols || []).filter(p => isRecoveryPeptide(p.medication));

    if (recoveryProtocols.length === 0) {
      return res.status(200).json({
        success: true,
        hasCycle: false,
        cycleDaysUsed: 0,
        daysRemaining: RECOVERY_CYCLE_MAX_DAYS,
        cycleStartDate: null,
        cycleExhausted: false,
        offPeriodEnds: null,
        subProtocols: []
      });
    }

    // Find the latest cycle (most recent cycle_start_date)
    const cycleGroups = {};
    for (const p of recoveryProtocols) {
      const key = p.cycle_start_date;
      if (!cycleGroups[key]) cycleGroups[key] = [];
      cycleGroups[key].push(p);
    }

    const latestCycleDate = Object.keys(cycleGroups).sort().pop();
    const cycleProtocols = cycleGroups[latestCycleDate];

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

    const daysRemaining = Math.max(0, RECOVERY_CYCLE_MAX_DAYS - cycleDaysUsed);
    const cycleExhausted = cycleDaysUsed >= RECOVERY_CYCLE_MAX_DAYS;

    // Calculate off period end date if cycle is exhausted
    let offPeriodEnds = null;
    if (cycleExhausted) {
      // Find the latest end_date in this cycle
      const latestEnd = cycleProtocols
        .filter(p => p.end_date)
        .map(p => new Date(p.end_date + 'T12:00:00'))
        .sort((a, b) => b - a)[0];

      if (latestEnd) {
        const offEnd = new Date(latestEnd);
        offEnd.setDate(offEnd.getDate() + RECOVERY_CYCLE_OFF_DAYS);
        offPeriodEnds = offEnd.toISOString().split('T')[0];
      }
    }

    return res.status(200).json({
      success: true,
      hasCycle: true,
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
