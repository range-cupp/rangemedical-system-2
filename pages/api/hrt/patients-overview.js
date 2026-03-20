// /pages/api/hrt/patients-overview.js
// Comprehensive HRT patient overview for staff dashboard
// Returns all HRT protocols with patient info, medication, labs, and schedule status

import { createClient } from '@supabase/supabase-js';
import { buildAdaptiveHRTSchedule } from '../../../lib/hrt-lab-schedule';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all HRT protocols (all statuses) with patient info
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_type,
        status,
        start_date,
        end_date,
        medication,
        dose_amount,
        dose_frequency,
        delivery_method,
        hrt_type,
        last_refill_date,
        next_expected_date,
        created_at,
        patients!inner (
          id,
          name,
          first_name,
          last_name,
          phone,
          email,
          date_of_birth,
          gender
        )
      `)
      .ilike('program_type', '%hrt%')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false });

    if (protocolsError) {
      throw new Error('Protocols query error: ' + protocolsError.message);
    }

    if (!protocols || protocols.length === 0) {
      return res.status(200).json({
        success: true,
        data: { patients: [], summary: { total: 0, active: 0, completed: 0, cancelled: 0, paused: 0, overdueLabs: 0, dueSoonLabs: 0, overdueMeds: 0 } },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const results = [];

    for (const protocol of protocols) {
      // Get blood draw logs
      const { data: bloodDrawLogs } = await supabase
        .from('protocol_logs')
        .select('id, log_date, notes')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'blood_draw');

      // Get all labs for this patient
      const { data: labs } = await supabase
        .from('labs')
        .select('id, test_date, collection_date, lab_date, completed_date, panel_type, status')
        .eq('patient_id', protocol.patient_id)
        .order('test_date', { ascending: false });

      // Get lab protocols for this patient
      const { data: labProtocols } = await supabase
        .from('protocols')
        .select('id, start_date, status')
        .eq('patient_id', protocol.patient_id)
        .eq('program_type', 'labs');

      // Build adaptive lab schedule (only for active protocols)
      let schedule = [];
      let nextDraw = null;
      let labStatus = 'n/a';
      if (protocol.status === 'active' && protocol.start_date) {
        schedule = buildAdaptiveHRTSchedule(
          protocol.start_date,
          8,
          bloodDrawLogs || [],
          labs || [],
          labProtocols || []
        );
        const overdueDraw = schedule.find(d => d.status === 'overdue');
        const upcomingDraw = schedule.find(d => d.status === 'upcoming');
        nextDraw = overdueDraw || upcomingDraw || null;

        if (overdueDraw) {
          labStatus = 'overdue';
        } else if (upcomingDraw) {
          const targetDate = new Date(upcomingDraw.targetDate + 'T00:00:00');
          const daysUntil = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
          labStatus = daysUntil <= 14 ? 'due_soon' : 'on_track';
        } else {
          labStatus = 'on_track';
        }
      }

      // Most recent lab
      const mostRecentLab = (labs || []).find(l => l.test_date || l.collection_date || l.lab_date);
      const lastLabDate = mostRecentLab
        ? (mostRecentLab.collection_date || mostRecentLab.test_date || mostRecentLab.lab_date)
        : null;

      // Medication status
      let medStatus = 'n/a';
      let daysSinceRefill = null;
      if (protocol.status === 'active') {
        if (protocol.last_refill_date) {
          const refillDate = new Date(protocol.last_refill_date + 'T00:00:00');
          daysSinceRefill = Math.floor((today - refillDate) / (1000 * 60 * 60 * 24));
        }
        if (protocol.next_expected_date) {
          const nextDate = new Date(protocol.next_expected_date + 'T00:00:00');
          const daysUntilRefill = Math.floor((nextDate - today) / (1000 * 60 * 60 * 24));
          if (daysUntilRefill < 0) {
            medStatus = 'overdue';
          } else if (daysUntilRefill <= 7) {
            medStatus = 'due_soon';
          } else {
            medStatus = 'on_track';
          }
        } else {
          medStatus = protocol.last_refill_date ? 'on_track' : 'no_data';
        }
      }

      // Calculate program duration
      let programWeek = null;
      if (protocol.start_date) {
        const startDate = new Date(protocol.start_date + 'T00:00:00');
        programWeek = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 7));
      }

      results.push({
        protocol_id: protocol.id,
        patient_id: protocol.patient_id,
        patient_name: protocol.patients.name,
        patient_phone: protocol.patients.phone,
        patient_email: protocol.patients.email,
        patient_dob: protocol.patients.date_of_birth,
        gender: protocol.patients.gender,
        program_type: protocol.program_type,
        hrt_type: protocol.hrt_type,
        status: protocol.status,
        start_date: protocol.start_date,
        end_date: protocol.end_date,
        program_week: programWeek,
        medication: protocol.medication,
        dose_amount: protocol.dose_amount,
        dose_frequency: protocol.dose_frequency,
        delivery_method: protocol.delivery_method,
        last_refill_date: protocol.last_refill_date,
        next_expected_date: protocol.next_expected_date,
        days_since_refill: daysSinceRefill,
        med_status: medStatus,
        last_lab_date: lastLabDate,
        last_lab_panel: mostRecentLab?.panel_type || null,
        next_draw_label: nextDraw?.label || null,
        next_draw_target: nextDraw?.targetDate || null,
        lab_status: labStatus,
        schedule,
      });
    }

    // Sort: active first, then by lab urgency
    const statusOrder = { active: 0, paused: 1, completed: 2, cancelled: 3 };
    const labOrder = { overdue: 0, due_soon: 1, on_track: 2, no_data: 3, 'n/a': 4 };
    results.sort((a, b) => {
      const s = (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9);
      if (s !== 0) return s;
      return (labOrder[a.lab_status] || 9) - (labOrder[b.lab_status] || 9);
    });

    const active = results.filter(r => r.status === 'active');
    const summary = {
      total: results.length,
      active: active.length,
      completed: results.filter(r => r.status === 'completed').length,
      cancelled: results.filter(r => r.status === 'cancelled').length,
      paused: results.filter(r => r.status === 'paused').length,
      overdueLabs: active.filter(r => r.lab_status === 'overdue').length,
      dueSoonLabs: active.filter(r => r.lab_status === 'due_soon').length,
      overdueMeds: active.filter(r => r.med_status === 'overdue').length,
    };

    return res.status(200).json({
      success: true,
      data: { patients: results, summary, generated_at: new Date().toISOString() },
    });

  } catch (error) {
    console.error('HRT patients overview error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
