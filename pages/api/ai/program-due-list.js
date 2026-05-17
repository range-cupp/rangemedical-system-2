// /pages/api/ai/program-due-list.js
// Returns patients who are due for their next payment round on a given program.
// Used by the AI assistant to answer "who needs their next WL 4-pack?" etc.
// Range Medical

import { createClient } from '@supabase/supabase-js';
import { parseFrequencyDays } from '../../../lib/protocol-config';
import { computePaymentStatus, computeDispenseStatus } from '../../../lib/wl-dispense';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function todayPacificISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

const PROGRAM_TYPE_MAP = {
  weight_loss: 'weight_loss%',
  hrt: 'hrt%',
  peptide: 'peptide%',
  iv: 'iv%',
  hbot: 'hbot%',
  rlt: 'rlt%',
  injection: 'injection%',
};

const PURCHASE_CATEGORY_MAP = {
  weight_loss: 'weight_loss',
  hrt: 'hrt',
  peptide: 'peptide',
  iv: 'iv_therapy',
  hbot: 'hbot',
  rlt: 'rlt',
  injection: 'injection',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { program } = req.query;
  if (!program) return res.status(400).json({ error: 'program query parameter required' });

  const programFilter = PROGRAM_TYPE_MAP[program];
  if (!programFilter) return res.status(400).json({ error: `Unknown program: ${program}. Valid: ${Object.keys(PROGRAM_TYPE_MAP).join(', ')}` });

  const today = todayPacificISO();

  try {
    const { data: protocols, error: protoErr } = await supabase
      .from('protocols')
      .select(`
        id, patient_id, program_name, program_type, medication, selected_dose,
        frequency, checkin_cadence_days, delivery_method,
        total_sessions, sessions_used, next_expected_date, comp, start_date,
        patients!inner ( id, name, first_name, last_name, email, phone )
      `)
      .eq('status', 'active')
      .ilike('program_type', programFilter)
      .order('start_date', { ascending: false });

    if (protoErr) throw protoErr;
    if (!protocols || protocols.length === 0) {
      return res.status(200).json({ program, today, patients: [], summary: { total_active: 0, due_now: 0, due_soon: 0 } });
    }

    const patientIds = [...new Set(protocols.map(p => p.patient_id))];
    const purchaseCategory = PURCHASE_CATEGORY_MAP[program] || program;

    const { data: purchasesRaw } = await supabase
      .from('purchases')
      .select('patient_id, purchase_date, amount_paid, quantity, item_name')
      .in('patient_id', patientIds)
      .eq('category', purchaseCategory)
      .order('purchase_date', { ascending: false });

    const lastPurchaseByPatient = {};
    for (const p of (purchasesRaw || [])) {
      if (!lastPurchaseByPatient[p.patient_id]) lastPurchaseByPatient[p.patient_id] = p;
    }

    const results = [];

    for (const proto of protocols) {
      if (proto.comp) continue;

      const pat = proto.patients;
      const lastPurchase = lastPurchaseByPatient[proto.patient_id];
      const cadenceDays = proto.checkin_cadence_days || parseFrequencyDays(proto.frequency);

      const payment = computePaymentStatus(lastPurchase, proto.comp);
      const dispense = computeDispenseStatus(cadenceDays, lastPurchase, today);

      const dispenseUrgent = ['send_now', 'due_now', 'due_soon'].includes(dispense.state);

      // For patients with a recent purchase, the dispense calculation (purchase_date +
      // coverage days) is more reliable than sessions_used, which can include future-
      // dated service logs. Only trust sessions_used when there's no purchase to
      // compute dispense from, or for in-clinic patients where sessions are counted
      // at the time of visit.
      const isInClinic = proto.delivery_method === 'in_clinic';
      const sessionsExhausted = isInClinic && proto.total_sessions > 0 && proto.sessions_used >= proto.total_sessions;
      const refillDue = proto.next_expected_date && proto.next_expected_date <= today;

      if (!sessionsExhausted && !refillDue && !dispenseUrgent) continue;

      let urgency = 'due_soon';
      if (sessionsExhausted || dispense.state === 'send_now') urgency = 'overdue';
      else if (refillDue || dispense.state === 'due_now') urgency = 'due_now';

      results.push({
        patient_id: pat.id,
        patient_name: pat.name,
        patient_email: pat.email,
        patient_phone: pat.phone,
        program_name: proto.program_name,
        medication: proto.medication,
        dose: proto.selected_dose,
        delivery_method: proto.delivery_method,
        sessions_used: proto.sessions_used,
        total_sessions: proto.total_sessions,
        sessions_remaining: dispense.sessions_remaining,
        days_until_due: dispense.days_until_due,
        last_purchase_date: payment.last_purchase_date,
        last_amount_paid: payment.amount_paid,
        urgency,
        urgency_label: urgency === 'overdue' ? 'Overdue' : urgency === 'due_now' ? 'Due Now' : 'Due Soon',
      });
    }

    results.sort((a, b) => {
      const urgencyOrder = { overdue: 0, due_now: 1, due_soon: 2 };
      return (urgencyOrder[a.urgency] || 3) - (urgencyOrder[b.urgency] || 3);
    });

    return res.status(200).json({
      program,
      today,
      patients: results,
      summary: {
        total_active: protocols.filter(p => !p.comp).length,
        due_count: results.length,
        overdue: results.filter(r => r.urgency === 'overdue').length,
        due_now: results.filter(r => r.urgency === 'due_now').length,
        due_soon: results.filter(r => r.urgency === 'due_soon').length,
      },
    });
  } catch (err) {
    console.error('Program due list error:', err);
    return res.status(500).json({ error: 'Failed to fetch program due list' });
  }
}
