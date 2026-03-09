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
    const [
      protocolsResult,
      purchasesResult,
      appointmentsResult,
      commsResult,
      invoicesResult,
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
        return (p.total_sessions - (p.sessions_used || 0)) <= 2;
      }
      if (p.end_date) {
        const daysLeft = Math.ceil((new Date(p.end_date + 'T23:59:59') - todayDate) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7;
      }
      return false;
    });

    return res.status(200).json({
      stats: {
        activeProtocols: activeProtocols.length,
        unassignedPurchases: purchasesResult.count || 0,
        uniquePatients,
        todayAppointments: (appointmentsResult.data || []).length,
        monthlyRevenue,
        pendingInvoices,
      },
      recentProtocols: activeProtocols.slice(0, 8),
      todayAppointments: (appointmentsResult.data || []).slice(0, 6),
      recentComms: (commsResult.data || []).slice(0, 5),
      renewalAlerts: renewals.slice(0, 10),
    });

  } catch (error) {
    console.error('Dashboard V3 error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
