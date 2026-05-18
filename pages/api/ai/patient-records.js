// /pages/api/ai/patient-records.js
// Fetches a patient's medical summary for the AI assistant
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { patient_id } = req.query;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    const [protocolRes, appointmentRes, serviceLogRes, prescriptionRes, patientRes] = await Promise.all([
      supabase
        .from('protocols')
        .select('id, program_name, program_type, medication, status, current_dose, selected_dose, dose, frequency, visit_frequency, delivery_method, start_date, end_date, next_expected_date, last_visit_date, last_refill_date, supply_dispensed_date, supply_remaining, total_sessions, sessions_used, secondary_medications')
        .eq('patient_id', patient_id)
        .not('status', 'in', '("completed","cancelled")')
        .order('created_at', { ascending: false }),

      supabase
        .from('appointments')
        .select('id, service_name, service_category, provider, start_time, end_time, duration_minutes, status, notes, visit_reason')
        .eq('patient_id', patient_id)
        .gte('start_time', new Date().toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .order('start_time', { ascending: true })
        .limit(10),

      supabase
        .from('service_logs')
        .select('id, category, entry_type, medication, dosage, entry_date, administered_by, notes, quantity, status')
        .eq('patient_id', patient_id)
        .order('entry_date', { ascending: false })
        .limit(20),

      supabase
        .from('prescriptions')
        .select('id, medication_name, strength, form, quantity, sig, schedule, status, refills, days_supply, category')
        .eq('patient_id', patient_id)
        .not('status', 'in', '("cancelled","discontinued")')
        .order('created_at', { ascending: false })
        .limit(20),

      supabase
        .from('patients')
        .select('id, name, first_name, last_name, email, phone, date_of_birth, gender')
        .eq('id', patient_id)
        .single(),
    ]);

    const protocols = (protocolRes.data || []).map(p => ({
      program: p.program_name || p.program_type,
      medication: p.medication,
      status: p.status,
      dose: p.current_dose || p.selected_dose || p.dose,
      frequency: p.frequency || p.visit_frequency,
      delivery: p.delivery_method,
      next_date: p.next_expected_date,
      last_visit: p.last_visit_date,
      last_refill: p.last_refill_date,
      supply_dispensed: p.supply_dispensed_date,
      supply_remaining: p.supply_remaining,
      sessions_total: p.total_sessions,
      sessions_used: p.sessions_used,
      secondary_meds: p.secondary_medications,
    }));

    const appointments = (appointmentRes.data || []).map(a => ({
      service: a.service_name,
      category: a.service_category,
      provider: a.provider,
      date: new Date(a.start_time).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
      date_iso: a.start_time,
      duration: a.duration_minutes,
      status: a.status,
      reason: a.visit_reason,
    }));

    const recentVisits = (serviceLogRes.data || []).map(s => ({
      date: s.entry_date,
      category: s.category,
      type: s.entry_type,
      medication: s.medication,
      dosage: s.dosage,
      quantity: s.quantity,
      administered_by: s.administered_by,
      notes: s.notes,
    }));

    const prescriptions = (prescriptionRes.data || []).map(rx => ({
      medication: rx.medication_name,
      strength: rx.strength,
      form: rx.form,
      quantity: rx.quantity,
      sig: rx.sig,
      schedule: rx.schedule,
      status: rx.status,
      refills: rx.refills,
      days_supply: rx.days_supply,
      category: rx.category,
    }));

    return res.status(200).json({
      patient: patientRes.data || null,
      protocols,
      appointments,
      recentVisits,
      prescriptions,
    });
  } catch (err) {
    console.error('Patient records error:', err);
    return res.status(500).json({ error: 'Failed to fetch records' });
  }
}
