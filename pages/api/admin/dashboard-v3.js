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
    const LAB_STAGES = ['draw_scheduled', 'blood_draw_complete', 'results_received', 'provider_reviewed', 'consult_scheduled', 'consult_complete'];

    const [
      protocolsResult,
      purchasesResult,
      appointmentsResult,
      commsResult,
      invoicesResult,
      labPipelineResult,
      refillsDueResult,
    ] = await Promise.all([
      // Active protocols with patient info (for recent list + renewal alerts)
      supabase
        .from('protocols')
        .select('*, patients(id, name, first_name, last_name, email, phone)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),

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

      // Refills due — take-home protocols with next_expected_date within 7 days or overdue
      (() => {
        const sevenDaysOut = new Date();
        sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
        return supabase
          .from('protocols')
          .select('id, patient_id, program_name, program_type, medication, delivery_method, next_expected_date, last_refill_date, supply_type, status, patients(id, name, first_name, last_name, phone)')
          .eq('status', 'active')
          .eq('delivery_method', 'take_home')
          .not('next_expected_date', 'is', null)
          .lte('next_expected_date', sevenDaysOut.toISOString().split('T')[0])
          .order('next_expected_date', { ascending: true })
          .limit(20);
      })(),
    ]);

    // Process protocols
    const activeProtocols = (protocolsResult.data || []).map(protocol => {
      const p = protocol.patients;
      const patientName = p
        ? (p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.name || protocol.patient_name)
        : protocol.patient_name;
      return { ...protocol, patient_name: patientName, patients: undefined };
    });

    // Revenue from paid invoices (last 30 days)
    const invoices = invoicesResult.data || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPaid = invoices.filter(inv =>
      inv.status === 'paid' && inv.paid_at && new Date(inv.paid_at) >= thirtyDaysAgo
    );
    const monthlyRevenue = recentPaid.reduce((sum, inv) => sum + (inv.total_cents || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent').length;

    // Unique patients
    const uniquePatients = new Set(activeProtocols.map(p => p.patient_id).filter(Boolean)).size;

    // Renewal alerts
    const todayDate = new Date();
    const renewals = activeProtocols.filter(p => {
      if (p.total_sessions && p.total_sessions > 0) {
        const sessionsRemaining = p.total_sessions - (p.sessions_used || 0);
        if (sessionsRemaining <= 2) {
          // If end_date is still well in the future, sessions were dispensed in advance — not a renewal
          if (p.end_date) {
            const endDays = Math.ceil((new Date(p.end_date + 'T23:59:59') - todayDate) / (1000 * 60 * 60 * 24));
            if (endDays > 7) return false;
          }
          return true;
        }
        return false;
      }
      if (p.end_date) {
        const daysLeft = Math.ceil((new Date(p.end_date + 'T23:59:59') - todayDate) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7;
      }
      return false;
    });

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

    // Refills due processing
    const todayStr = new Date().toISOString().split('T')[0];
    const refillsDue = (refillsDueResult.data || []).map(p => {
      const pat = p.patients;
      const patientName = pat
        ? (pat.first_name && pat.last_name ? `${pat.first_name} ${pat.last_name}` : pat.name || 'Unknown')
        : 'Unknown';
      const daysUntil = p.next_expected_date
        ? Math.ceil((new Date(p.next_expected_date + 'T23:59:59') - todayDate) / (1000 * 60 * 60 * 24))
        : null;
      return {
        ...p,
        patient_name: patientName,
        patient_phone: pat?.phone || null,
        patients: undefined,
        days_until_refill: daysUntil,
        is_overdue: daysUntil !== null && daysUntil < 0,
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
        refillsDueCount: refillsDue.length,
      },
      labPipeline,
      recentProtocols: activeProtocols.slice(0, 8),
      todayAppointments: (appointmentsResult.data || []).slice(0, 6),
      recentComms: (commsResult.data || []).slice(0, 5),
      renewalAlerts: renewals.slice(0, 10),
      refillsDue,
    });

  } catch (error) {
    console.error('Dashboard V3 error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
