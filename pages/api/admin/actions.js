// /pages/api/admin/actions.js
// Daily Action Board API - Returns medication due + payment due lists
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { getProtocolTracking } from '../../../lib/protocol-tracking';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all active protocols with patient info
    const { data: protocols, error } = await supabase
      .from('protocols')
      .select(`
        id,
        patient_id,
        program_type,
        program_name,
        medication,
        selected_dose,
        delivery_method,
        supply_type,
        hrt_type,
        injections_per_week,
        dose_per_injection,
        start_date,
        end_date,
        status,
        total_sessions,
        sessions_used,
        next_expected_date,
        last_refill_date,
        last_payment_date,
        last_visit_date,
        frequency,
        num_vials,
        doses_per_vial,
        comp,
        patient_name,
        patients (
          id,
          name,
          first_name,
          last_name,
          preferred_name,
          phone,
          email
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Actions API - protocols error:', error);
      return res.status(500).json({ error: 'Failed to fetch protocols' });
    }

    // Get service logs for last dispensed dates
    const protocolIds = protocols.map(p => p.id);
    let lastDispensedMap = {};
    let lastServiceMap = {};

    if (protocolIds.length > 0) {
      const { data: logs } = await supabase
        .from('service_logs')
        .select('protocol_id, entry_date, entry_type')
        .in('protocol_id', protocolIds)
        .order('entry_date', { ascending: false });

      if (logs) {
        logs.forEach(log => {
          // Last dispensed = injection, session, or pickup
          if (['injection', 'session', 'pickup'].includes(log.entry_type) && !lastDispensedMap[log.protocol_id]) {
            lastDispensedMap[log.protocol_id] = log.entry_date;
          }
          // Last any activity
          if (!lastServiceMap[log.protocol_id]) {
            lastServiceMap[log.protocol_id] = log.entry_date;
          }
        });
      }
    }

    // Get last purchase date per protocol (for payment tracking)
    let lastPurchaseMap = {};
    if (protocolIds.length > 0) {
      const { data: purchases } = await supabase
        .from('purchases')
        .select('protocol_id, purchase_date, amount_paid')
        .in('protocol_id', protocolIds)
        .not('dismissed', 'eq', true)
        .order('purchase_date', { ascending: false });

      if (purchases) {
        purchases.forEach(p => {
          if (!lastPurchaseMap[p.protocol_id]) {
            lastPurchaseMap[p.protocol_id] = { date: p.purchase_date, amount: p.amount_paid };
          }
        });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const medicationDue = [];
    const paymentDue = [];

    protocols.forEach(protocol => {
      const tracking = getProtocolTracking(protocol);
      // Full name: "First Last" or fall back to name field
      const firstName = protocol.patients?.preferred_name || protocol.patients?.first_name || '';
      const lastName = protocol.patients?.last_name || '';
      const patientName = (firstName && lastName) ? `${firstName} ${lastName}` : protocol.patients?.name || protocol.patient_name || 'Unknown';
      const patientId = protocol.patient_id || protocol.patients?.id;
      const phone = protocol.patients?.phone || null;

      const programType = (protocol.program_type || '').toLowerCase();
      const isWeightLoss = programType.includes('weight_loss');
      const isHRT = programType.includes('hrt');
      const isPeptide = programType === 'peptide';
      const isRecurring = isWeightLoss || isHRT || isPeptide;

      // Medication label
      const medLabel = protocol.medication || protocol.program_name || protocol.program_type || 'Unknown';

      // --- MEDICATION DUE ---
      // Time-based: use days_remaining from tracking
      if (tracking.days_remaining !== undefined && tracking.days_remaining !== null) {
        if (tracking.days_remaining <= 7) {
          let medStatus, medColor;
          if (tracking.days_remaining <= 0) {
            medStatus = 'OVERDUE';
            medColor = 'red';
          } else if (tracking.days_remaining <= 3) {
            medStatus = 'DUE NOW';
            medColor = 'yellow';
          } else {
            medStatus = 'THIS WEEK';
            medColor = 'gray';
          }

          // Calculate due date
          let dueDate = null;
          if (protocol.next_expected_date) {
            dueDate = protocol.next_expected_date;
          } else if (protocol.last_refill_date) {
            const d = new Date(protocol.last_refill_date + 'T00:00:00');
            d.setDate(d.getDate() + (isWeightLoss ? 28 : isHRT ? 30 : 28));
            dueDate = d.toISOString().split('T')[0];
          }

          medicationDue.push({
            protocol_id: protocol.id,
            patient_id: patientId,
            patient_name: patientName,
            phone,
            medication: medLabel,
            category: tracking.category,
            status: medStatus,
            color: medColor,
            days_remaining: tracking.days_remaining,
            due_date: dueDate,
            last_dispensed: lastDispensedMap[protocol.id] || null,
            status_text: tracking.status_text
          });
        }
      }

      // Session-based: check if sessions are running out
      if (tracking.tracking_type === 'session_based' && tracking.sessions_used !== undefined) {
        const remaining = (tracking.total_sessions || 0) - (tracking.sessions_used || 0);
        if (remaining <= 2 && tracking.total_sessions > 0) {
          let medStatus, medColor;
          if (remaining <= 0) {
            medStatus = 'OVERDUE';
            medColor = 'red';
          } else if (remaining === 1) {
            medStatus = 'DUE NOW';
            medColor = 'yellow';
          } else {
            medStatus = 'THIS WEEK';
            medColor = 'gray';
          }

          medicationDue.push({
            protocol_id: protocol.id,
            patient_id: patientId,
            patient_name: patientName,
            phone,
            medication: medLabel,
            category: tracking.category,
            status: medStatus,
            color: medColor,
            days_remaining: null,
            sessions_remaining: remaining,
            due_date: null,
            last_dispensed: lastDispensedMap[protocol.id] || null,
            status_text: tracking.status_text
          });
        }
      }

      // --- PAYMENT DUE ---
      // Only track for recurring protocols (WL, HRT, Peptide)
      // Skip comped protocols — they don't owe anything
      if (isRecurring && !protocol.comp) {
        // Payment cycle: WL = 28 days, HRT = 30 days, Peptide = 30 days
        const cycleDays = isWeightLoss ? 28 : 30;

        // Best source: last_payment_date on protocol, then last purchase date
        const lastPaymentDate = protocol.last_payment_date || lastPurchaseMap[protocol.id]?.date || null;

        if (lastPaymentDate) {
          const lastPay = new Date(lastPaymentDate + 'T00:00:00');
          const nextPayDue = new Date(lastPay);
          nextPayDue.setDate(nextPayDue.getDate() + cycleDays);
          const daysUntilPayment = Math.ceil((nextPayDue - today) / (1000 * 60 * 60 * 24));

          if (daysUntilPayment <= 7) {
            let payStatus, payColor;
            if (daysUntilPayment <= 0) {
              payStatus = 'OVERDUE';
              payColor = 'red';
            } else if (daysUntilPayment <= 3) {
              payStatus = 'DUE NOW';
              payColor = 'yellow';
            } else {
              payStatus = 'THIS WEEK';
              payColor = 'gray';
            }

            paymentDue.push({
              protocol_id: protocol.id,
              patient_id: patientId,
              patient_name: patientName,
              phone,
              medication: medLabel,
              category: tracking.category,
              status: payStatus,
              color: payColor,
              days_until: daysUntilPayment,
              last_payment: lastPaymentDate,
              next_due: nextPayDue.toISOString().split('T')[0],
              last_amount: lastPurchaseMap[protocol.id]?.amount || null
            });
          }
        } else if (protocol.start_date) {
          // No payment recorded — check if they've ever paid since start
          const startDate = new Date(protocol.start_date + 'T00:00:00');
          const daysSinceStart = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

          // If protocol started more than cycleDays ago and no payment tracked, flag it
          if (daysSinceStart > cycleDays) {
            paymentDue.push({
              protocol_id: protocol.id,
              patient_id: patientId,
              patient_name: patientName,
              phone,
              medication: medLabel,
              category: tracking.category,
              status: 'OVERDUE',
              color: 'red',
              days_until: -(daysSinceStart - cycleDays),
              last_payment: null,
              next_due: null,
              last_amount: null
            });
          }
        }
      }
    });

    // Sort: overdue (most overdue first), then due now, then this week
    const statusOrder = { 'OVERDUE': 0, 'DUE NOW': 1, 'THIS WEEK': 2 };
    medicationDue.sort((a, b) => {
      const orderDiff = statusOrder[a.status] - statusOrder[b.status];
      if (orderDiff !== 0) return orderDiff;
      return (a.days_remaining ?? -999) - (b.days_remaining ?? -999);
    });

    paymentDue.sort((a, b) => {
      const orderDiff = statusOrder[a.status] - statusOrder[b.status];
      if (orderDiff !== 0) return orderDiff;
      return (a.days_until ?? -999) - (b.days_until ?? -999);
    });

    return res.status(200).json({
      success: true,
      medication_due: medicationDue,
      payment_due: paymentDue,
      counts: {
        medication_overdue: medicationDue.filter(m => m.status === 'OVERDUE').length,
        medication_due_now: medicationDue.filter(m => m.status === 'DUE NOW').length,
        payment_overdue: paymentDue.filter(p => p.status === 'OVERDUE').length,
        payment_due_now: paymentDue.filter(p => p.status === 'DUE NOW').length
      }
    });

  } catch (err) {
    console.error('Actions API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
