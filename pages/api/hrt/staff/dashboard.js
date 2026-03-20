// =====================================================
// STAFF HRT DASHBOARD API
// /pages/api/hrt/staff/dashboard.js
// Returns all HRT members with IV and lab status
// Lab status uses buildAdaptiveHRTSchedule() — same
// source of truth as the patient profile.
// Range Medical
// =====================================================

import { createClient } from '@supabase/supabase-js';
import { buildAdaptiveHRTSchedule, getLabStatusSummary, isHRTProtocol } from '../../../../lib/hrt-lab-schedule';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all active memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('hrt_memberships')
      .select(`
        id,
        ghl_contact_id,
        patient_name,
        patient_email,
        patient_phone,
        membership_type,
        status,
        start_date,
        next_lab_due,
        next_lab_type
      `)
      .eq('status', 'active')
      .order('patient_name');

    if (membershipError) throw membershipError;

    // Get current month periods for all memberships
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: periods, error: periodError } = await supabase
      .from('hrt_monthly_periods')
      .select('*')
      .gte('period_start', currentMonthStart)
      .lte('period_start', currentMonthEnd);

    if (periodError) throw periodError;

    const periodMap = {};
    for (const period of periods || []) {
      periodMap[period.membership_id] = period;
    }

    // Collect all unique ghl_contact_ids to look up patients + protocols
    const ghlIds = memberships.map(m => m.ghl_contact_id).filter(Boolean);

    // Look up patients by ghl_contact_id
    let patientMap = {}; // ghl_contact_id -> patient
    if (ghlIds.length > 0) {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, ghl_contact_id')
        .in('ghl_contact_id', ghlIds);
      for (const p of patients || []) {
        patientMap[p.ghl_contact_id] = p;
      }
    }

    // Get all patient_ids we found
    const patientIds = Object.values(patientMap).map(p => p.id);

    // Fetch all active HRT protocols for these patients
    let protocolMap = {}; // patient_id -> protocol (most recent active HRT)
    if (patientIds.length > 0) {
      const { data: protocols } = await supabase
        .from('protocols')
        .select('id, patient_id, program_type, start_date, first_followup_weeks, status')
        .in('patient_id', patientIds)
        .in('status', ['active', 'completed'])
        .order('start_date', { ascending: false });

      for (const proto of protocols || []) {
        if (!isHRTProtocol(proto.program_type)) continue;
        // Keep the most recent active, falling back to most recent completed
        if (!protocolMap[proto.patient_id] ||
            (proto.status === 'active' && protocolMap[proto.patient_id].status !== 'active')) {
          protocolMap[proto.patient_id] = proto;
        }
      }
    }

    // Fetch blood draw logs and labs for these patients
    let bloodDrawMap = {}; // protocol_id -> logs[]
    let labsMap = {}; // patient_id -> labs[]
    let labProtocolMap = {}; // patient_id -> lab protocols[]

    if (patientIds.length > 0) {
      // Blood draw logs
      const protocolIds = Object.values(protocolMap).map(p => p.id);
      if (protocolIds.length > 0) {
        const { data: logs } = await supabase
          .from('protocol_logs')
          .select('id, protocol_id, log_type, log_date, notes')
          .in('protocol_id', protocolIds)
          .eq('log_type', 'blood_draw');
        for (const log of logs || []) {
          if (!bloodDrawMap[log.protocol_id]) bloodDrawMap[log.protocol_id] = [];
          bloodDrawMap[log.protocol_id].push(log);
        }
      }

      // Labs
      const { data: labs } = await supabase
        .from('labs')
        .select('id, patient_id, collection_date, test_date, lab_date, completed_date')
        .in('patient_id', patientIds);
      for (const lab of labs || []) {
        if (!labsMap[lab.patient_id]) labsMap[lab.patient_id] = [];
        labsMap[lab.patient_id].push(lab);
      }

      // Lab protocols (auto-scheduled)
      const { data: labProtos } = await supabase
        .from('protocols')
        .select('id, patient_id, program_type, start_date, status')
        .in('patient_id', patientIds)
        .eq('program_type', 'labs');
      for (const lp of labProtos || []) {
        if (!labProtocolMap[lp.patient_id]) labProtocolMap[lp.patient_id] = [];
        labProtocolMap[lp.patient_id].push(lp);
      }
    }

    // Build enriched memberships with computed lab status
    const today = new Date();
    const enrichedMemberships = memberships.map(m => {
      const period = periodMap[m.id] || {};
      const periodEnd = period.period_end ? new Date(period.period_end) : new Date(currentMonthEnd);
      const daysLeft = Math.ceil((periodEnd - today) / (1000 * 60 * 60 * 24));

      // Compute lab status from adaptive schedule (single source of truth)
      let labStatus = 'On track';
      let nextLabDue = null;
      let nextLabType = null;
      let labSchedule = null;

      const patient = patientMap[m.ghl_contact_id];
      const protocol = patient ? protocolMap[patient.id] : null;

      if (protocol) {
        const bloodDrawLogs = bloodDrawMap[protocol.id] || [];
        const patientLabs = labsMap[patient.id] || [];
        const patientLabProtos = labProtocolMap[patient.id] || [];

        const schedule = buildAdaptiveHRTSchedule(
          protocol.start_date,
          protocol.first_followup_weeks || 8,
          bloodDrawLogs,
          patientLabs,
          patientLabProtos
        );

        const summary = getLabStatusSummary(schedule);
        labSchedule = schedule;

        if (summary.status === 'complete') {
          labStatus = 'Complete';
        } else if (summary.status === 'overdue') {
          labStatus = 'OVERDUE';
        } else if (summary.nextDraw) {
          // Check how soon the next draw is
          const targetDate = new Date(summary.nextDraw.targetDate + 'T00:00:00');
          const daysUntilLab = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
          if (daysUntilLab <= 7) {
            labStatus = 'Due this week';
          } else if (daysUntilLab <= 14) {
            labStatus = 'Due soon';
          }
          nextLabDue = summary.nextDraw.targetDate;
          nextLabType = summary.nextDraw.label;
        }
      }

      // Calculate IV status
      let ivStatus = 'Available';
      if (period.iv_used) {
        ivStatus = 'Used';
      } else if (daysLeft <= 3) {
        ivStatus = 'Urgent - Expiring!';
      } else if (daysLeft <= 7) {
        ivStatus = 'Reminder Needed';
      }

      return {
        membership_id: m.id,
        ghl_contact_id: m.ghl_contact_id,
        patient_name: m.patient_name,
        patient_email: m.patient_email,
        patient_phone: m.patient_phone,
        membership_type: m.membership_type,
        status: m.status,
        start_date: m.start_date,

        // Period info
        current_period: period.period_label || null,
        period_start: period.period_start,
        period_end: period.period_end,

        // IV info
        iv_available: period.iv_available !== false,
        iv_used: period.iv_used || false,
        iv_appointment_date: period.iv_appointment_date,
        days_left_in_period: Math.max(0, daysLeft),
        iv_status: ivStatus,

        // Lab info (computed from adaptive schedule)
        next_lab_due: nextLabDue,
        next_lab_type: nextLabType,
        lab_status: labStatus,
        lab_schedule: labSchedule
      };
    });

    // Calculate summary
    const summary = {
      totalActive: enrichedMemberships.length,
      ivsAvailable: enrichedMemberships.filter(m => !m.iv_used).length,
      ivsUsed: enrichedMemberships.filter(m => m.iv_used).length,
      ivsUrgent: enrichedMemberships.filter(m => !m.iv_used && m.days_left_in_period <= 7).length,
      labsOverdue: enrichedMemberships.filter(m => m.lab_status === 'OVERDUE').length,
      labsDueSoon: enrichedMemberships.filter(m => ['Due this week', 'Due soon'].includes(m.lab_status)).length
    };

    return res.status(200).json({
      success: true,
      data: {
        memberships: enrichedMemberships,
        summary
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
