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
        delivery_method,
        supply_type,
        start_date,
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
    const { data: injectionCounts } = await supabase
      .from('protocol_logs')
      .select('protocol_id')
      .in('protocol_id', protocolIds)
      .eq('log_type', 'injection');

    (injectionCounts || []).forEach(log => {
      injectionCountMap[log.protocol_id] = (injectionCountMap[log.protocol_id] || 0) + 1;
    });

    // Get latest refill date per protocol from logs - sorted by LOG_DATE not created_at
    let lastRefillMap = {};
    const { data: refillLogs } = await supabase
      .from('protocol_logs')
      .select('protocol_id, log_date')
      .in('protocol_id', protocolIds)
      .eq('log_type', 'refill')
      .order('log_date', { ascending: false });

    (refillLogs || []).forEach(log => {
      // Only keep the first (most recent by log_date) for each protocol
      if (!lastRefillMap[log.protocol_id]) {
        lastRefillMap[log.protocol_id] = log.log_date;
      }
    });

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
        const startDate = new Date(p.start_date + 'T00:00:00');
        daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      }

      // Use refill log date (by actual log_date) if available, otherwise start date
      const lastRefillDate = lastRefillMap[p.id] || p.start_date;

      // Calculate days since last refill from the ACTUAL refill date
      let daysSinceLastRefill = daysSinceStart;
      if (lastRefillDate) {
        const refillDate = new Date(lastRefillDate + 'T00:00:00');
        daysSinceLastRefill = Math.floor((today - refillDate) / (1000 * 60 * 60 * 24));
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
        starting_dose: p.selected_dose || '0.3ml/60mg',
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
