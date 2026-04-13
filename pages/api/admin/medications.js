// /pages/api/admin/medications.js
// Medication tracking API — active take-home protocols with refill & dispensing data
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse per-injection ml dose from selected_dose string
// Handles: "0.4ml/80mg", "0.3ml/60mg", "1 vial @ 0.4ml/80mg (12 weeks)", "4 prefilled @ 0.3ml/60mg"
function parseDoseMl(selectedDose) {
  if (!selectedDose) return null;
  // Try to parse "X weeks" directly from dose string (e.g., "1 vial @ 0.4ml/80mg (12 weeks)")
  const weeksMatch = selectedDose.match(/\((\d+)\s*weeks?\)/i);
  if (weeksMatch) return { weeks: parseInt(weeksMatch[1]) };
  // Skip if this describes the entire vial, not per-injection dose
  // e.g., "1 vial (10ml @ 200mg/ml)" — the 10ml is the vial volume
  if (/vial\s*\(\d+ml/i.test(selectedDose)) return null;
  // Parse per-injection ml: look for "@ 0.4ml" first (most explicit), then standalone "0.4ml"
  const atMlMatch = selectedDose.match(/@\s*(\d+\.?\d*)\s*ml/i);
  if (atMlMatch) return { ml: parseFloat(atMlMatch[1]) };
  // Standalone ml (e.g., "0.4ml/80mg" or "0.4ml / 80mg")
  const mlMatch = selectedDose.match(/(\d+\.?\d*)\s*ml/i);
  if (mlMatch) {
    const ml = parseFloat(mlMatch[1]);
    // Sanity check: per-injection dose should be < 2ml; anything larger is likely vial volume
    if (ml < 2) return { ml };
  }
  return null;
}

// Calculate refill interval in days based on protocol type, supply, dose, and injection method
function getRefillIntervalDays(protocol) {
  const pt = (protocol.program_type || '').toLowerCase();
  const supply = (protocol.supply_type || '').toLowerCase();
  const dose = protocol.selected_dose || '';

  // ---- Weight Loss ----
  if (pt.includes('weight_loss')) {
    if (protocol.pickup_frequency === 'weekly') return 7;
    if (protocol.pickup_frequency === 'every_2_weeks') return 14;
    return 28; // default monthly
  }

  // ---- HRT ----
  if (pt.includes('hrt')) {
    // Pellets — 4 months
    if (supply === 'pellet') return 120;

    // Oral — 30 day supply
    if (supply === 'oral_30day' || supply.includes('oral')) return 30;

    // In-clinic injections — weekly visits
    if (supply === 'in_clinic') return 7;

    // Prefilled syringes — next_expected_date is calculated from quantity + frequency at checkout
    if (supply === 'prefilled' || supply.startsWith('prefilled_')) {
      const prefillDays = { prefilled_1week: 7, prefilled_2week: 14, prefilled_4week: 28 };
      return prefillDays[supply] || 28;
    }

    // Vials — calculate from dose + injection frequency
    if (supply.includes('vial')) {
      const vialMl = supply === 'vial_5ml' ? 5 : 10; // default 10ml
      const parsed = parseDoseMl(dose);

      // If dose string contains explicit weeks, use that
      if (parsed?.weeks) return parsed.weeks * 7;

      // Calculate from dose_ml × injections_per_week
      if (parsed?.ml) {
        // Default 2x/week (IM). Sub-Q = 7x/week (daily)
        const isSubQ = (protocol.injection_method || '').toLowerCase() === 'subq';
        const injectionsPerWeek = isSubQ ? 7 : (protocol.injection_frequency || 2);
        const mlPerWeek = parsed.ml * injectionsPerWeek;
        const weeks = vialMl / mlPerWeek;
        return Math.round(weeks * 7);
      }

      // Fallback: can't parse dose, estimate conservatively
      return supply === 'vial_5ml' ? 42 : 84; // ~6 weeks / ~12 weeks
    }

    // HRT fallback
    return 30;
  }

  // ---- Peptide ----
  if (pt === 'peptide') return 30;

  // ---- Default ----
  return 30;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filter } = req.query; // 'all' | 'overdue' | 'due_soon'
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysOut = new Date(today);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    const sevenDaysStr = sevenDaysOut.toISOString().split('T')[0];

    // Get all active take-home protocols with patient info
    let query = supabase
      .from('protocols')
      .select('id, patient_id, program_name, program_type, medication, selected_dose, delivery_method, next_expected_date, status, start_date, end_date, sessions_used, total_sessions, supply_type, pickup_frequency, injection_method, injection_frequency, secondary_medications, secondary_medication_details, created_at, patients!inner(id, first_name, last_name, phone, email)')
      .eq('status', 'active')
      .eq('delivery_method', 'take_home')
      .order('next_expected_date', { ascending: true, nullsFirst: false });

    const { data: protocols, error: protocolError } = await query;

    if (protocolError) {
      console.error('Medications query error:', protocolError);
      return res.status(500).json({ error: protocolError.message });
    }

    // Get recent dispensing history (last 30 days of pickups)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentDispensing, error: dispError } = await supabase
      .from('service_logs')
      .select('id, patient_id, category, medication, entry_date, entry_type, protocol_id, created_at, patients(first_name, last_name)')
      .eq('entry_type', 'pickup')
      .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('entry_date', { ascending: false })
      .limit(200);

    if (dispError) {
      console.error('Dispensing query error:', dispError);
    }

    // Flatten patient name onto dispensing records
    const dispensingWithNames = (recentDispensing || []).map(d => ({
      ...d,
      patient_name: d.patients ? `${d.patients.first_name || ''} ${d.patients.last_name || ''}`.trim() : null,
    }));

    // Build dispensing map by protocol_id
    const dispensingByProtocol = {};
    for (const log of dispensingWithNames) {
      const key = log.protocol_id || log.patient_id;
      if (!dispensingByProtocol[key]) dispensingByProtocol[key] = [];
      dispensingByProtocol[key].push(log);
    }

    // Process protocols with refill status
    const processed = (protocols || []).map(p => {
      const patient = p.patients;
      const patientName = patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'Unknown';

      let daysUntilRefill = null;
      let isOverdue = false;
      let isDueSoon = false;

      if (p.next_expected_date) {
        const nextDate = new Date(p.next_expected_date + 'T00:00:00');
        daysUntilRefill = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        isOverdue = daysUntilRefill < 0;
        isDueSoon = !isOverdue && daysUntilRefill <= 7;
      }

      // Calculate refill interval based on protocol type, supply, dose, and injection method
      const refillDays = getRefillIntervalDays(p);

      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: patientName,
        patient_phone: patient?.phone || null,
        program_name: p.program_name,
        program_type: p.program_type,
        medication: p.medication,
        dosage: p.selected_dose,
        supply_type: p.supply_type,
        pickup_frequency: p.pickup_frequency,
        injection_method: p.injection_method,
        next_expected_date: p.next_expected_date,
        start_date: p.start_date,
        days_until_refill: daysUntilRefill,
        is_overdue: isOverdue,
        is_due_soon: isDueSoon,
        refill_interval_days: refillDays,
        recent_pickups: dispensingByProtocol[p.id] || [],
        last_pickup: dispensingByProtocol[p.id]?.[0]?.entry_date || null,
        secondary_medications: p.secondary_medications || null,
        secondary_medication_details: p.secondary_medication_details || [],
      };
    });

    // Apply filter
    let filtered = processed;
    if (filter === 'overdue') {
      filtered = processed.filter(p => p.is_overdue);
    } else if (filter === 'due_soon') {
      filtered = processed.filter(p => p.is_due_soon || p.is_overdue);
    }

    // Stats
    const stats = {
      total: processed.length,
      overdue: processed.filter(p => p.is_overdue).length,
      dueSoon: processed.filter(p => p.is_due_soon).length,
      onTrack: processed.filter(p => !p.is_overdue && !p.is_due_soon).length,
      noDate: processed.filter(p => p.days_until_refill === null).length,
    };

    return res.status(200).json({
      medications: filtered,
      stats,
      recentDispensing: dispensingWithNames,
    });

  } catch (error) {
    console.error('Medications API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
