// /pages/api/hrt/followup-bloodwork.js
// Returns all active HRT patients with their most recent lab date
// and follow-up bloodwork status (overdue, due soon, on track).
// Uses the adaptive HRT lab schedule to determine due dates.

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
    // Get all active HRT protocols with patient info
    const { data: protocols, error: protocolsError } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_type,
        start_date,
        status,
        medication,
        patients!inner (
          id,
          name,
          phone,
          email
        )
      `)
      .ilike('program_type', '%hrt%')
      .eq('status', 'active')
      .order('start_date', { ascending: true });

    if (protocolsError) {
      throw new Error('Protocols query error: ' + protocolsError.message);
    }

    if (!protocols || protocols.length === 0) {
      return res.status(200).json({
        success: true,
        data: { patients: [], summary: { total: 0, overdue: 0, dueSoon: 0, onTrack: 0 } },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const results = [];

    for (const protocol of protocols) {
      if (!protocol.start_date) continue;

      // Get blood draw logs for this protocol
      const { data: bloodDrawLogs } = await supabase
        .from('protocol_logs')
        .select('id, log_date, notes')
        .eq('protocol_id', protocol.id)
        .eq('log_type', 'blood_draw');

      // Get all labs for this patient (sorted by date desc)
      const { data: labs } = await supabase
        .from('labs')
        .select('id, test_date, collection_date, lab_date, completed_date, panel_type, status, pdf_url')
        .eq('patient_id', protocol.patient_id)
        .order('test_date', { ascending: false });

      // Get lab protocols (auto-scheduled) for this patient
      const { data: labProtocols } = await supabase
        .from('protocols')
        .select('id, start_date, status')
        .eq('patient_id', protocol.patient_id)
        .eq('program_type', 'labs');

      // Build adaptive schedule
      const schedule = buildAdaptiveHRTSchedule(
        protocol.start_date,
        8,
        bloodDrawLogs || [],
        labs || [],
        labProtocols || []
      );

      // Find most recent completed lab
      const mostRecentLab = (labs || []).find(l => l.test_date || l.collection_date || l.lab_date);
      const lastLabDate = mostRecentLab
        ? (mostRecentLab.collection_date || mostRecentLab.test_date || mostRecentLab.lab_date)
        : null;

      // Find the next upcoming or overdue draw
      const nextDraw = schedule.find(d => d.status === 'overdue') || schedule.find(d => d.status === 'upcoming');

      // Calculate days since last lab
      let daysSinceLastLab = null;
      if (lastLabDate) {
        const lastDate = new Date(lastLabDate + 'T00:00:00');
        daysSinceLastLab = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      }

      // Determine overall status
      let followupStatus = 'on_track';
      let daysUntilDue = null;
      if (nextDraw) {
        const targetDate = new Date(nextDraw.targetDate + 'T00:00:00');
        daysUntilDue = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));

        if (nextDraw.status === 'overdue') {
          followupStatus = 'overdue';
        } else if (daysUntilDue <= 14) {
          followupStatus = 'due_soon';
        }
      }

      results.push({
        patient_name: protocol.patients.name,
        patient_email: protocol.patients.email,
        patient_phone: protocol.patients.phone,
        patient_id: protocol.patient_id,
        protocol_id: protocol.id,
        program_type: protocol.program_type,
        medication: protocol.medication,
        protocol_start_date: protocol.start_date,
        last_lab_date: lastLabDate,
        last_lab_panel: mostRecentLab?.panel_type || null,
        days_since_last_lab: daysSinceLastLab,
        next_draw_label: nextDraw?.label || null,
        next_draw_target: nextDraw?.targetDate || null,
        days_until_due: daysUntilDue,
        followup_status: followupStatus,
        schedule,
      });
    }

    // Sort: overdue first, then due_soon, then on_track
    const statusOrder = { overdue: 0, due_soon: 1, on_track: 2 };
    results.sort((a, b) => statusOrder[a.followup_status] - statusOrder[b.followup_status]);

    const summary = {
      total: results.length,
      overdue: results.filter(r => r.followup_status === 'overdue').length,
      dueSoon: results.filter(r => r.followup_status === 'due_soon').length,
      onTrack: results.filter(r => r.followup_status === 'on_track').length,
    };

    return res.status(200).json({
      success: true,
      data: {
        patients: results,
        summary,
        generated_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('HRT followup bloodwork error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
