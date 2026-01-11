import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all HRT protocols with patient info
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_type,
        program_name,
        medication,
        selected_dose,
        starting_dose,
        delivery_method,
        supply_type,
        start_date,
        last_refill_date,
        end_date,
        status,
        notes,
        labs_completed,
        baseline_labs_date,
        eight_week_labs_date,
        last_labs_date,
        created_at,
        patients (
          id,
          name,
          ghl_contact_id
        )
      `)
      .or('program_type.eq.hrt,program_type.ilike.%hrt%,program_name.ilike.%hrt%')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!protocols || protocols.length === 0) {
      return res.status(200).json([]);
    }

    const protocolIds = protocols.map(p => p.id);

    // Get injection counts per protocol
    let injectionCountMap = {};
    try {
      const { data: injectionCounts } = await supabase
        .from('protocol_logs')
        .select('protocol_id')
        .in('protocol_id', protocolIds)
        .eq('log_type', 'injection');

      (injectionCounts || []).forEach(log => {
        injectionCountMap[log.protocol_id] = (injectionCountMap[log.protocol_id] || 0) + 1;
      });
    } catch (e) {
      console.error('Injection count error:', e);
    }

    // Get LATEST refill log_date per protocol (as a fallback)
    let refillLogMap = {};
    try {
      const { data: refillLogs } = await supabase
        .from('protocol_logs')
        .select('protocol_id, log_date')
        .in('protocol_id', protocolIds)
        .eq('log_type', 'refill')
        .order('log_date', { ascending: false });

      (refillLogs || []).forEach(log => {
        if (!refillLogMap[log.protocol_id]) {
          refillLogMap[log.protocol_id] = log.log_date;
        }
      });
    } catch (e) {
      console.error('Refill log error:', e);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrichedProtocols = protocols.map(p => {
      // Determine HRT type from medication
      const medication = (p.medication || '').toLowerCase();
      const hrtType = medication.includes('female') ? 'female' : 'male';
      
      // Normalize supply type
      let supplyType = p.supply_type || 'prefilled_4week';
      if (supplyType === 'vial') supplyType = 'vial_10ml';
      if (supplyType === 'prefilled') supplyType = 'prefilled_4week';

      // Calculate days since start
      let daysSinceStart = 0;
      if (p.start_date) {
        try {
          const startDate = new Date(p.start_date + 'T00:00:00');
          daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        } catch (e) {
          console.error('Date parse error:', e);
        }
      }

      // PRIORITY ORDER for last refill date:
      // 1. last_refill_date field on protocol
      // 2. Most recent refill log's log_date
      // 3. start_date as fallback
      const lastRefillDate = p.last_refill_date || refillLogMap[p.id] || p.start_date;

      // Calculate days since last refill
      let daysSinceLastRefill = daysSinceStart; // default to days since start
      if (lastRefillDate) {
        try {
          const refillDate = new Date(lastRefillDate + 'T00:00:00');
          daysSinceLastRefill = Math.floor((today - refillDate) / (1000 * 60 * 60 * 24));
        } catch (e) {
          console.error('Refill date parse error:', e);
        }
      }

      // Check if labs are completed
      const labsCompleted = p.labs_completed || !!p.eight_week_labs_date;

      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: p.patients?.name || 'Unknown',
        ghl_contact_id: p.patients?.ghl_contact_id || null,
        program_name: p.program_name,
        medication: p.medication,
        hrt_type: hrtType,
        supply_type: supplyType,
        starting_dose: p.starting_dose || p.selected_dose || '0.3ml/60mg',
        current_dose: p.selected_dose || '0.3ml/60mg',
        delivery_method: p.delivery_method || 'take_home',
        start_date: p.start_date,
        last_refill_date: lastRefillDate,
        days_since_start: daysSinceStart,
        days_since_last_refill: daysSinceLastRefill,
        total_injections: injectionCountMap[p.id] || 0,
        labs_completed: labsCompleted,
        baseline_labs_date: p.baseline_labs_date || null,
        eight_week_labs_date: p.eight_week_labs_date || null,
        last_labs_date: p.last_labs_date || null,
        status: p.status || 'active',
        notes: p.notes,
        created_at: p.created_at
      };
    });

    return res.status(200).json(enrichedProtocols);

  } catch (err) {
    console.error('HRT pipeline error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
