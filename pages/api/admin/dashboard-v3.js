// /pages/api/admin/dashboard-v3.js
// Consolidated dashboard API - returns all dashboard data in a single request
// Replaces 6 concurrent client-side API calls with 1 server-side fetch
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
    // Run all database queries in parallel (server-side, no browser connection limit)
    const LAB_STAGES = ['draw_scheduled', 'awaiting_results', 'uploaded', 'under_review', 'ready_to_schedule', 'consult_scheduled', 'in_treatment'];

    const [
      protocolsResult,
      purchasesResult,
      appointmentsResult,
      commsResult,
      invoicesResult,
      labPipelineResult,
      wlScheduleResult,
    ] = await Promise.all([
      // Active protocols count + unique patients
      supabase
        .from('protocols')
        .select('id, patient_id')
        .eq('status', 'active'),

      // Unassigned purchases count
      supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })
        .is('protocol_id', null),

      // Today's appointments
      (() => {
        const today = new Date().toLocaleDateString('en-US', {
          timeZone: 'America/Los_Angeles',
          year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const [m, d, y] = today.split('/');
        const todayStart = `${y}-${m}-${d}T00:00:00`;
        const todayEnd = `${y}-${m}-${d}T23:59:59`;
        return supabase
          .from('appointments')
          .select('*')
          .gte('start_time', todayStart)
          .lte('start_time', todayEnd)
          .order('start_time', { ascending: true });
      })(),

      // Recent comms (last 10)
      supabase
        .from('comms_log')
        .select('id, channel, message_type, message, status, recipient, subject, direction, source, patient_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Recent invoices (last 50 for revenue calc)
      supabase
        .from('invoices')
        .select('id, status, total_cents, paid_at, created_at')
        .order('created_at', { ascending: false })
        .limit(50),

      // Lab pipeline protocols (all active lab stages)
      supabase
        .from('protocols')
        .select('id, patient_id, program_name, program_type, medication, status, notes, start_date, created_at, updated_at, delivery_method, patients(id, name, first_name, last_name, phone)')
        .eq('program_type', 'labs')
        .in('status', LAB_STAGES)
        .order('created_at', { ascending: true }),

      // Weight loss in-clinic schedule
      supabase
        .from('protocols')
        .select('id, patient_id, medication, dosage, scheduled_days, visit_frequency, last_visit_date, patients(id, name, first_name, last_name)')
        .eq('status', 'active')
        .eq('delivery_method', 'in_clinic')
        .eq('program_type', 'weight_loss')
        .order('created_at', { ascending: true }),
    ]);

    // Active protocols stats
    const activeProtocols = protocolsResult.data || [];
    const uniquePatients = new Set(activeProtocols.map(p => p.patient_id).filter(Boolean)).size;

    // Revenue from paid invoices (last 30 days)
    const invoices = invoicesResult.data || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPaid = invoices.filter(inv =>
      inv.status === 'paid' && inv.paid_at && new Date(inv.paid_at) >= thirtyDaysAgo
    );
    const monthlyRevenue = recentPaid.reduce((sum, inv) => sum + (inv.total_cents || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent').length;

    // Lab pipeline processing
    const labProtocols = (labPipelineResult.data || []).map(p => {
      const pat = p.patients;
      const patientName = pat
        ? (pat.first_name && pat.last_name ? `${pat.first_name} ${pat.last_name}` : pat.name || 'Unknown')
        : 'Unknown';
      return { ...p, patient_name: patientName, patient_phone: pat?.phone || null, patients: undefined };
    });

    const labPipeline = {
      counts: {},
      cards: {},
      total: 0,
    };
    for (const stage of LAB_STAGES) {
      const stageItems = labProtocols.filter(p => p.status === stage);
      labPipeline.counts[stage] = stageItems.length;
      labPipeline.cards[stage] = stageItems.slice(0, 8); // top 8 per stage for dashboard
    }
    labPipeline.total = labProtocols.length;

    // Weight loss schedule processing
    const wlProtocols = (wlScheduleResult.data || []).map(p => {
      const pat = p.patients;
      const patientName = pat
        ? (pat.first_name && pat.last_name ? `${pat.first_name} ${pat.last_name}` : pat.name || 'Unknown')
        : 'Unknown';
      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: patientName,
        medication: p.medication,
        dosage: p.dosage,
        scheduled_days: p.scheduled_days || [],
        visit_frequency: p.visit_frequency,
        last_visit_date: p.last_visit_date,
      };
    });

    return res.status(200).json({
      stats: {
        activeProtocols: activeProtocols.length,
        unassignedPurchases: purchasesResult.count || 0,
        uniquePatients,
        todayAppointments: (appointmentsResult.data || []).length,
        monthlyRevenue,
        pendingInvoices,
        activeLabs: labPipeline.total,
      },
      labPipeline,
      todayAppointments: (appointmentsResult.data || []).slice(0, 6),
      recentComms: (commsResult.data || []).slice(0, 5),
      wlSchedule: wlProtocols,
    });

  } catch (error) {
    console.error('Dashboard V3 error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
