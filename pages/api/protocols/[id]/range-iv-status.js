// /pages/api/protocols/[id]/range-iv-status.js
// Returns Range IV perk status for an HRT protocol's current billing cycle.
// The billing cycle is anchored to last_payment_date (30-day window).
// Checks service_logs for an IV session in that window.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;

  try {
    // Get the HRT protocol with last_payment_date
    const { data: protocol, error: pErr } = await supabase
      .from('protocols')
      .select('id, patient_id, program_type, last_payment_date, start_date, status')
      .eq('id', id)
      .single();

    if (pErr || !protocol) return res.status(404).json({ error: 'Protocol not found' });

    // Determine billing cycle start (last_payment_date or start_date as fallback)
    const cycleStart = protocol.last_payment_date || protocol.start_date;
    if (!cycleStart) {
      return res.json({ used: false, cycle_start: null, cycle_end: null, entry_date: null });
    }

    // Billing cycle = cycleStart to cycleStart + 30 days
    const cycleStartDate = new Date(cycleStart + 'T00:00:00');
    const cycleEndDate = new Date(cycleStartDate);
    cycleEndDate.setDate(cycleEndDate.getDate() + 30);
    const cycleEndStr = cycleEndDate.toISOString().split('T')[0];

    // Check for any IV service log entry for this patient in the billing cycle
    const { data: ivLogs, error: ivErr } = await supabase
      .from('service_logs')
      .select('id, entry_date, medication, notes')
      .eq('patient_id', protocol.patient_id)
      .eq('category', 'iv')
      .gte('entry_date', cycleStart)
      .lte('entry_date', cycleEndStr)
      .order('entry_date', { ascending: false })
      .limit(1);

    if (ivErr) throw ivErr;

    // Also check with 'iv_therapy' category (some logs use this)
    let usedLog = ivLogs?.[0] || null;
    if (!usedLog) {
      const { data: ivLogs2 } = await supabase
        .from('service_logs')
        .select('id, entry_date, medication, notes')
        .eq('patient_id', protocol.patient_id)
        .eq('category', 'iv_therapy')
        .gte('entry_date', cycleStart)
        .lte('entry_date', cycleEndStr)
        .order('entry_date', { ascending: false })
        .limit(1);
      usedLog = ivLogs2?.[0] || null;
    }

    return res.json({
      used: !!usedLog,
      service_date: usedLog?.entry_date || null,
      service_log_id: usedLog?.id || null,
      cycle_start: cycleStart,
      cycle_end: cycleEndStr,
    });

  } catch (error) {
    console.error('Range IV status error:', error);
    return res.status(500).json({ error: error.message });
  }
}
