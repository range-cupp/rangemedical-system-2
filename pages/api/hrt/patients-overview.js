// /pages/api/hrt/patients-overview.js
// Comprehensive HRT patient overview for staff dashboard
// Pulls from the SAME source of truth as /api/pipelines/hrt.js:
//   - protocols table for program data
//   - service_logs table for actual pickup dates (single source of truth)
//   - labs + protocol_logs + buildAdaptiveHRTSchedule for lab schedule
// Range Medical

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
    // Same filter as /api/pipelines/hrt.js — matches all HRT variants
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_type,
        program_name,
        status,
        start_date,
        end_date,
        medication,
        selected_dose,
        delivery_method,
        supply_type,
        hrt_type,
        secondary_medications,
        first_followup_weeks,
        labs_completed,
        baseline_labs_date,
        eight_week_labs_date,
        last_labs_date,
        next_expected_date,
        total_sessions,
        sessions_used,
        notes,
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
      .or('program_type.eq.hrt,program_type.ilike.%hrt%,program_name.ilike.%hrt%')
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

    // ── Separate real HRT protocols from Range IV perk protocols ──
    // The query matches program_name containing 'hrt' which catches
    // Range IV perk protocols (program_name: 'Range IV — HRT Membership Perk').
    // We need to show only actual HRT protocols as primary rows, with
    // Range IV status attached as metadata.
    const isRangeIVPerk = (p) => {
      const pt = (p.program_type || '').toLowerCase();
      return (pt === 'iv' || pt === 'iv_therapy') && (p.medication || '').toLowerCase().includes('range iv');
    };

    const hrtProtocols = [];
    const ivPerksByPatient = {};

    for (const p of protocols) {
      if (isRangeIVPerk(p)) {
        if (!ivPerksByPatient[p.patient_id]) ivPerksByPatient[p.patient_id] = [];
        ivPerksByPatient[p.patient_id].push(p);
      } else {
        hrtProtocols.push(p);
      }
    }

    // Deduplicate HRT protocols by patient — keep the most recent active one
    const hrtByPatient = {};
    for (const p of hrtProtocols) {
      const existing = hrtByPatient[p.patient_id];
      if (!existing) {
        hrtByPatient[p.patient_id] = p;
      } else {
        // Prefer active over inactive, then most recent
        const existingActive = existing.status === 'active';
        const currentActive = p.status === 'active';
        if (currentActive && !existingActive) {
          hrtByPatient[p.patient_id] = p;
        }
        // Both same status — keep the one already stored (created_at desc from query)
      }
    }

    const dedupedProtocols = Object.values(hrtByPatient);
    const protocolIds = dedupedProtocols.map(p => p.id);

    // ── Service logs: single source of truth for pickups + injections ──
    // Same approach as /api/pipelines/hrt.js
    const { data: pickupLogs } = await supabase
      .from('service_logs')
      .select('protocol_id, entry_date')
      .in('protocol_id', protocolIds)
      .eq('entry_type', 'pickup')
      .order('entry_date', { ascending: false });

    const lastPickupMap = {};
    (pickupLogs || []).forEach(log => {
      if (!lastPickupMap[log.protocol_id]) {
        lastPickupMap[log.protocol_id] = log.entry_date;
      }
    });

    const { data: injectionLogs } = await supabase
      .from('service_logs')
      .select('protocol_id')
      .in('protocol_id', protocolIds)
      .in('entry_type', ['injection', 'session']);

    const injectionCountMap = {};
    (injectionLogs || []).forEach(log => {
      injectionCountMap[log.protocol_id] = (injectionCountMap[log.protocol_id] || 0) + 1;
    });

    // ── Batch-fetch labs and blood draw logs per patient ──
    const patientIds = [...new Set(dedupedProtocols.map(p => p.patient_id))];

    const { data: allLabs } = await supabase
      .from('labs')
      .select('id, patient_id, test_date, completed_date, panel_type, status')
      .in('patient_id', patientIds)
      .order('test_date', { ascending: false });

    const { data: allBloodDrawLogs } = await supabase
      .from('protocol_logs')
      .select('id, protocol_id, log_date, notes')
      .in('protocol_id', protocolIds)
      .eq('log_type', 'blood_draw');

    const { data: allLabProtocols } = await supabase
      .from('protocols')
      .select('id, patient_id, start_date, status')
      .in('patient_id', patientIds)
      .eq('program_type', 'labs');

    // Index by patient/protocol
    const labsByPatient = {};
    (allLabs || []).forEach(l => {
      if (!labsByPatient[l.patient_id]) labsByPatient[l.patient_id] = [];
      labsByPatient[l.patient_id].push(l);
    });
    const bloodDrawsByProtocol = {};
    (allBloodDrawLogs || []).forEach(l => {
      if (!bloodDrawsByProtocol[l.protocol_id]) bloodDrawsByProtocol[l.protocol_id] = [];
      bloodDrawsByProtocol[l.protocol_id].push(l);
    });
    const labProtocolsByPatient = {};
    (allLabProtocols || []).forEach(l => {
      if (!labProtocolsByPatient[l.patient_id]) labProtocolsByPatient[l.patient_id] = [];
      labProtocolsByPatient[l.patient_id].push(l);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const results = [];

    for (const protocol of dedupedProtocols) {
      const labs = labsByPatient[protocol.patient_id] || [];
      const bloodDrawLogs = bloodDrawsByProtocol[protocol.id] || [];
      const labProtocols = labProtocolsByPatient[protocol.patient_id] || [];

      // ── Lab schedule (adaptive) ──
      let schedule = [];
      let nextDraw = null;
      let labStatus = 'n/a';
      if (protocol.status === 'active' && protocol.start_date) {
        const firstFollowup = protocol.first_followup_weeks || 8;
        schedule = buildAdaptiveHRTSchedule(
          protocol.start_date,
          firstFollowup,
          bloodDrawLogs,
          labs,
          labProtocols
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

      // Most recent lab — derive from the adaptive schedule (single source of truth)
      // This ensures the HRT patients page shows the same "last lab" as the patient profile
      const completedDraws = schedule.filter(d => d.status === 'completed' && d.completedDate);
      const lastCompletedDraw = completedDraws.length > 0
        ? completedDraws[completedDraws.length - 1]
        : null;
      // Fall back to labs table if no schedule (inactive protocols)
      const mostRecentLab = labs.find(l => l.test_date || l.completed_date);
      const lastLabDate = lastCompletedDraw
        ? lastCompletedDraw.completedDate
        : (mostRecentLab ? (mostRecentLab.test_date || mostRecentLab.completed_date) : null);

      // ── Medication pickup — from service_logs (same as hrt pipeline) ──
      const lastPickupDate = lastPickupMap[protocol.id] || protocol.start_date;
      let daysSincePickup = null;
      if (lastPickupDate) {
        const pickupDate = new Date(lastPickupDate + 'T00:00:00');
        daysSincePickup = Math.floor((today - pickupDate) / (1000 * 60 * 60 * 24));
      }

      // Med status from next_expected_date
      let medStatus = 'n/a';
      if (protocol.status === 'active') {
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
          medStatus = lastPickupDate ? 'on_track' : 'no_data';
        }
      }

      // Program week
      let programWeek = null;
      if (protocol.start_date) {
        const startDate = new Date(protocol.start_date + 'T00:00:00');
        programWeek = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 7));
      }

      // Normalize supply type (same as hrt pipeline)
      let supplyType = protocol.supply_type || 'prefilled_4week';
      if (supplyType === 'vial') supplyType = 'vial_10ml';
      if (supplyType === 'prefilled') supplyType = 'prefilled_4week';

      // ── Range IV perk status for this patient ──
      const patientIVPerks = ivPerksByPatient[protocol.patient_id] || [];
      const activeIVPerk = patientIVPerks.find(p => p.status === 'active');
      const hasRangeIV = patientIVPerks.length > 0;
      let rangeIVStatus = null;
      if (activeIVPerk) {
        const sessionsUsed = activeIVPerk.sessions_used || 0;
        const totalSessions = activeIVPerk.total_sessions || 1;
        rangeIVStatus = sessionsUsed >= totalSessions ? 'used' : 'available';
      } else if (hasRangeIV) {
        rangeIVStatus = 'expired';
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
        secondary_medications: (() => {
          try {
            const val = protocol.secondary_medications;
            if (!val || val === '[]') return [];
            if (typeof val === 'string') return JSON.parse(val);
            if (Array.isArray(val)) return val;
            return [];
          } catch { return []; }
        })(),
        current_dose: protocol.selected_dose || null,
        supply_type: supplyType,
        delivery_method: protocol.delivery_method,
        last_pickup_date: lastPickupDate,
        next_expected_date: protocol.next_expected_date,
        days_since_pickup: daysSincePickup,
        total_injections: injectionCountMap[protocol.id] || 0,
        med_status: medStatus,
        last_lab_date: lastLabDate,
        last_lab_panel: mostRecentLab?.panel_type || null,
        labs_completed: protocol.labs_completed || !!protocol.eight_week_labs_date,
        baseline_labs_date: protocol.baseline_labs_date,
        eight_week_labs_date: protocol.eight_week_labs_date,
        last_labs_date: protocol.last_labs_date,
        next_draw_label: nextDraw?.label || null,
        next_draw_target: nextDraw?.targetDate || null,
        lab_status: labStatus,
        schedule,
        range_iv: hasRangeIV ? rangeIVStatus : null,
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
