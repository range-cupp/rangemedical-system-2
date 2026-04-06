// /pages/api/admin/dashboard-v3.js
// Consolidated dashboard API - returns all dashboard data in a single request
// Replaces 6 concurrent client-side API calls with 1 server-side fetch
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calculate refill interval in days — same logic as /api/admin/dispense.js
function getRefillIntervalDays(protocol) {
  const pt = (protocol.program_type || '').toLowerCase();
  const supply = (protocol.supply_type || '').toLowerCase();

  // Weight Loss
  if (pt.includes('weight_loss')) {
    if (protocol.pickup_frequency === 'weekly') return 7;
    if (protocol.pickup_frequency === 'every_2_weeks') return 14;
    return 28;
  }

  // HRT
  if (pt.includes('hrt')) {
    if (supply === 'pellet') return 120;
    if (supply === 'oral_30day' || supply.includes('oral')) return 30;
    if (supply === 'in_clinic') return 7;
    if (supply.startsWith('prefilled_')) {
      const prefillDays = { prefilled_1week: 7, prefilled_2week: 14, prefilled_4week: 28 };
      return prefillDays[supply] || 28;
    }
    if (supply.includes('vial')) {
      return supply === 'vial_5ml' ? 42 : 84;
    }
    return 30;
  }

  // Peptide
  if (pt === 'peptide') return 30;

  return 30;
}

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
      upcomingApptsResult,
      pastApptsResult,
      serviceLogsResult,
      purchasesResult2,
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

      // Weekly clinic schedule — weight loss, HRT, peptide
      supabase
        .from('protocols')
        .select('id, patient_id, program_type, medication, current_dose, scheduled_days, visit_frequency, last_visit_date, delivery_method, notes, last_refill_date, next_expected_date, pickup_frequency, supply_type, patients(id, name, first_name, last_name, phone)')
        .eq('status', 'active')
        .in('program_type', ['weight_loss', 'hrt', 'peptide'])
        .order('created_at', { ascending: true }),

      // Upcoming appointments for schedule patients
      supabase
        .from('appointments')
        .select('patient_id, start_time, service_name, status')
        .gte('start_time', new Date().toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .order('start_time', { ascending: true }),

      // Most recent past appointments (last 90 days)
      supabase
        .from('appointments')
        .select('patient_id, start_time, service_name, status')
        .lt('start_time', new Date().toISOString())
        .in('status', ['completed', 'scheduled'])
        .order('start_time', { ascending: false })
        .limit(2000),

      // Recent pickups from service_logs (pickups OR injections with pickup-like notes)
      supabase
        .from('service_logs')
        .select('id, protocol_id, patient_id, entry_type, entry_date, fulfillment_method, tracking_number, quantity, notes')
        .in('entry_type', ['pickup', 'injection'])
        .order('entry_date', { ascending: false })
        .limit(1000),

      // Recent purchases per protocol (for refill date calculation)
      supabase
        .from('purchases')
        .select('id, protocol_id, purchase_date, item_name, amount_paid')
        .not('protocol_id', 'is', null)
        .order('purchase_date', { ascending: false })
        .limit(500),
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

    // Build upcoming appointment lookup: patient_id → next appointment
    const upcomingAppts = {};
    (upcomingApptsResult.data || []).forEach(a => {
      // Only keep the earliest upcoming per patient
      if (!upcomingAppts[a.patient_id]) {
        upcomingAppts[a.patient_id] = {
          date: a.start_time,
          service: a.service_name,
        };
      }
    });

    // Build last appointment lookup: patient_id → most recent past appointment
    const lastAppts = {};
    (pastApptsResult.data || []).forEach(a => {
      if (!lastAppts[a.patient_id]) {
        lastAppts[a.patient_id] = {
          date: a.start_time,
          service: a.service_name,
        };
      }
    });

    // Build last pickup lookup: protocol_id → most recent pickup/dispensing event
    // Check both explicit pickups AND injections (some clinics log pickups as injections)
    const lastPickups = {};
    (serviceLogsResult.data || []).forEach(s => {
      if (!s.protocol_id) return;
      // Already have a more recent one
      if (lastPickups[s.protocol_id]) return;
      // Accept explicit pickups, or injections with quantity > 1 or fulfillment info
      if (s.entry_type === 'pickup' || s.fulfillment_method || (s.quantity && s.quantity > 1)) {
        lastPickups[s.protocol_id] = {
          date: s.entry_date,
          fulfillment_method: s.fulfillment_method,
          tracking_number: s.tracking_number,
          quantity: s.quantity,
        };
      }
    });

    // Build last purchase lookup: protocol_id → most recent purchase
    const lastPurchases = {};
    (purchasesResult2.data || []).forEach(pur => {
      if (pur.protocol_id && !lastPurchases[pur.protocol_id]) {
        lastPurchases[pur.protocol_id] = {
          date: pur.purchase_date,
          item_name: pur.item_name,
          amount: pur.amount_paid,
        };
      }
    });

    // Weekly schedule processing
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // YYYY-MM-DD
    const wlProtocols = (wlScheduleResult.data || []).map(p => {
      const pat = p.patients;
      const patientName = pat
        ? (pat.first_name && pat.last_name ? `${pat.first_name} ${pat.last_name}` : pat.name || 'Unknown')
        : 'Unknown';

      // Calculate next expected refill — use the most recent source of truth
      const lastPickup = lastPickups[p.id] || null;
      const lastPurchase = lastPurchases[p.id] || null;

      // Find the most recent dispensing event date from all sources
      const candidateDates = [
        lastPickup?.date,
        lastPurchase?.date,
        p.last_refill_date,
      ].filter(Boolean).map(d => new Date(d + 'T12:00:00'));
      const mostRecentDate = candidateDates.length > 0
        ? candidateDates.sort((a, b) => b - a)[0]
        : null;
      const mostRecentDateStr = mostRecentDate
        ? mostRecentDate.toISOString().split('T')[0]
        : null;

      // Determine which source provided the most recent date
      const lastPickupDate = mostRecentDateStr;
      const lastPickupMethod = lastPickup?.date === mostRecentDateStr ? lastPickup?.fulfillment_method
        : null;

      // Calculate next expected date
      // Priority: if stored next_expected_date is AFTER the most recent event, trust it
      // Otherwise, recalculate from most recent event + interval
      let nextExpected = null;
      if (p.delivery_method === 'take_home' && mostRecentDate) {
        const intervalDays = getRefillIntervalDays(p);

        // Use quantity from pickup if available (e.g., 3 injections = 3 weeks)
        let effectiveInterval = intervalDays;
        if (lastPickup?.quantity && lastPickup.quantity > 1 && p.program_type === 'weight_loss') {
          effectiveInterval = lastPickup.quantity * 7; // each injection = 1 week
        }

        const calculatedNext = new Date(mostRecentDate);
        calculatedNext.setDate(calculatedNext.getDate() + effectiveInterval);
        const calculatedStr = calculatedNext.toISOString().split('T')[0];

        // If stored next_expected_date exists and is later than calculated, prefer it
        // (it may have been manually set or calculated with better context)
        if (p.next_expected_date && p.next_expected_date > calculatedStr) {
          nextExpected = p.next_expected_date;
        } else {
          nextExpected = calculatedStr;
        }
      } else if (p.next_expected_date) {
        nextExpected = p.next_expected_date;
      }

      let daysUntilRefill = null;
      if (nextExpected) {
        const nextDate = new Date(nextExpected + 'T12:00:00');
        const todayDate = new Date(todayStr + 'T12:00:00');
        daysUntilRefill = Math.round((nextDate - todayDate) / (1000 * 60 * 60 * 24));
      }

      return {
        id: p.id,
        patient_id: p.patient_id,
        patient_name: patientName,
        patient_phone: pat?.phone || null,
        program_type: p.program_type,
        medication: p.medication,
        current_dose: p.current_dose,
        scheduled_days: p.scheduled_days || [],
        visit_frequency: p.visit_frequency,
        last_visit_date: p.last_visit_date,
        delivery_method: p.delivery_method,
        notes: p.notes || '',
        next_appt: upcomingAppts[p.patient_id] || null,
        last_appt: lastAppts[p.patient_id] || null,
        // Take-home refill data
        last_refill_date: lastPickupDate,
        next_expected_date: nextExpected,
        days_until_refill: daysUntilRefill,
        last_pickup: lastPickup,
        last_purchase: lastPurchase,
        last_fulfillment_method: lastPickupMethod,
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
