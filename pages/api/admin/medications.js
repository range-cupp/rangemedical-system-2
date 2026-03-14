// /pages/api/admin/medications.js
// Medication tracking API — active take-home protocols with refill & dispensing data
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
    const { filter } = req.query; // 'all' | 'overdue' | 'due_soon'
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysOut = new Date(today);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    const sevenDaysStr = sevenDaysOut.toISOString().split('T')[0];

    // Get all active take-home protocols with patient info
    let query = supabase
      .from('protocols')
      .select('id, patient_id, program_name, program_type, medication, selected_dose, delivery_method, next_expected_date, status, start_date, end_date, sessions_used, total_sessions, created_at, patients!inner(id, first_name, last_name, phone, email)')
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
      .select('id, patient_id, category, medication, entry_date, entry_type, protocol_id, created_at')
      .eq('entry_type', 'pickup')
      .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('entry_date', { ascending: false })
      .limit(200);

    if (dispError) {
      console.error('Dispensing query error:', dispError);
    }

    // Build dispensing map by protocol_id
    const dispensingByProtocol = {};
    for (const log of (recentDispensing || [])) {
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

      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: patientName,
        patient_phone: patient?.phone || null,
        program_name: p.program_name,
        program_type: p.program_type,
        medication: p.medication,
        dosage: p.selected_dose,
        next_expected_date: p.next_expected_date,
        start_date: p.start_date,
        days_until_refill: daysUntilRefill,
        is_overdue: isOverdue,
        is_due_soon: isDueSoon,
        recent_pickups: dispensingByProtocol[p.id] || [],
        last_pickup: dispensingByProtocol[p.id]?.[0]?.entry_date || null,
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
      recentDispensing: recentDispensing || [],
    });

  } catch (error) {
    console.error('Medications API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
