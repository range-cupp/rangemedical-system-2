// /pages/api/admin/data-audit.js
// Data integrity audit — scans patients/protocols/service_logs/appointments/notes/purchases
// for inconsistencies and returns a single dashboard payload.
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BLOCK_SIZE = 4;

const dayDiff = (a, b) => Math.abs(new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // Pull everything in parallel
    const [
      patientsRes,
      protocolsRes,
      logsRes,
      apptsRes,
      notesRes,
      purchasesRes,
    ] = await Promise.all([
      supabase.from('patients').select('id, first_name, last_name').limit(10000),
      supabase.from('protocols').select('id, patient_id, program_type, total_sessions, sessions_used, start_date, end_date, status, delivery_method').limit(10000),
      supabase.from('service_logs').select('id, patient_id, protocol_id, category, entry_type, entry_date, dosage, weight, quantity').limit(20000),
      supabase.from('appointments').select('id, patient_id, service_name, service_category, start_time, status').gte('start_time', '2025-01-01').limit(20000),
      supabase.from('patient_notes').select('id, patient_id, appointment_id, note_category, encounter_service, note_date').limit(20000),
      supabase.from('purchases').select('id, patient_id, protocol_id, category, item_name, amount_paid, purchase_date').limit(20000),
    ]);

    const errs = [patientsRes, protocolsRes, logsRes, apptsRes, notesRes, purchasesRes].map(r => r.error).filter(Boolean);
    if (errs.length) return res.status(500).json({ error: errs.map(e => e.message).join('; ') });

    const patients = patientsRes.data || [];
    const protocols = protocolsRes.data || [];
    const logs = logsRes.data || [];
    const appts = apptsRes.data || [];
    const notes = notesRes.data || [];
    const purchases = purchasesRes.data || [];

    const patientName = (id) => {
      const p = patients.find(x => x.id === id);
      return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : 'Unknown';
    };

    const issues = [];
    const push = (severity, type, patient_id, message, link_path, meta) => {
      issues.push({
        severity, type, patient_id, patient_name: patientName(patient_id), message,
        link: link_path || (patient_id ? `/patients/${patient_id}` : null),
        meta: meta || null,
      });
    };

    // Index helpers
    const logsByPatient = {};
    logs.forEach(l => { (logsByPatient[l.patient_id] ||= []).push(l); });
    const apptsByPatient = {};
    appts.forEach(a => { (apptsByPatient[a.patient_id] ||= []).push(a); });
    const notesByPatient = {};
    notes.forEach(n => { (notesByPatient[n.patient_id] ||= []).push(n); });
    const purchasesByPatient = {};
    purchases.forEach(p => { (purchasesByPatient[p.patient_id] ||= []).push(p); });

    // ---------- CHECK 1: Injection appts with no matching service_log ----------
    appts.forEach(a => {
      const name = (a.service_name || '').toLowerCase();
      const isInjection = name.includes('weight loss') && (name.includes('injection') || name.includes('inject'));
      if (!isInjection || a.status === 'cancelled' || a.status === 'no_show') return;
      const pLogs = logsByPatient[a.patient_id] || [];
      const apptDay = a.start_time?.split('T')[0];
      if (!apptDay) return;
      const match = pLogs.find(l => l.category === 'weight_loss' && l.entry_type === 'injection' && dayDiff(l.entry_date, apptDay) <= 2);
      if (!match) {
        push('high', 'missing_service_log', a.patient_id,
          `Weight loss injection appointment on ${apptDay} has no matching service_log`);
      }
    });

    // ---------- CHECK 2: service_logs with NULL dosage (injection types) ----------
    logs.forEach(l => {
      if (l.entry_type !== 'injection') return;
      if (!['weight_loss', 'peptide', 'hrt'].includes(l.category)) return;
      if (!l.dosage || !String(l.dosage).trim()) {
        push('medium', 'missing_dose', l.patient_id,
          `${l.category} injection on ${l.entry_date} has no dosage recorded`);
      }
    });

    // ---------- CHECK 3: Protocols where total_sessions < actual logged injections ----------
    protocols.forEach(p => {
      if (p.program_type !== 'weight_loss' || !p.total_sessions) return;
      const pLogs = (logsByPatient[p.patient_id] || []).filter(l => l.protocol_id === p.id && l.entry_type === 'injection');
      if (pLogs.length > p.total_sessions) {
        push('high', 'protocol_overflow', p.patient_id,
          `Protocol shows ${p.total_sessions} sessions but ${pLogs.length} injections logged — needs extension`);
      }
    });

    // ---------- CHECK 4 + 6: Block-of-4 grouping + owed money ----------
    protocols.forEach(p => {
      if (p.program_type !== 'weight_loss') return;
      if (p.status && p.status !== 'active') return;
      const pLogs = (logsByPatient[p.patient_id] || [])
        .filter(l => l.protocol_id === p.id && l.entry_type === 'injection')
        .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
      if (pLogs.length === 0) return;
      const pPurchases = (purchasesByPatient[p.patient_id] || [])
        .filter(x => x.protocol_id === p.id && x.category === 'weight_loss');
      const blocksNeeded = Math.ceil(pLogs.length / BLOCK_SIZE);
      const blocksPaid = pPurchases.length; // each WL purchase = 1 block of 4
      if (blocksPaid < blocksNeeded) {
        const owed = (blocksNeeded - blocksPaid);
        push('high', 'owes_money', p.patient_id,
          `${pLogs.length} injections logged but only ${blocksPaid} blocks paid for — owes ${owed} block${owed > 1 ? 's' : ''}`);
      }
    });

    // ---------- CHECK 5: WL purchases NOT linked to any protocol ----------
    purchases.forEach(p => {
      if (p.category !== 'weight_loss') return;
      if (p.protocol_id) return;
      push('medium', 'orphan_purchase', p.patient_id,
        `WL purchase "${p.item_name || 'unknown'}" on ${p.purchase_date} ($${p.amount_paid || '?'}) not linked to any protocol`,
        null, { purchase_id: p.id });
    });

    // ---------- CHECK 7: service_logs with no protocol_id ----------
    logs.forEach(l => {
      if (l.entry_type !== 'injection') return;
      if (l.category !== 'weight_loss') return;
      if (!l.protocol_id) {
        push('medium', 'orphan_service_log', l.patient_id,
          `Weight loss injection on ${l.entry_date} not linked to any protocol`);
      }
    });

    // ---------- CHECK 8: Clinical notes with no linked appointment ----------
    notes.forEach(n => {
      if (n.note_category !== 'clinical') return;
      if (n.appointment_id) return;
      if (n.encounter_service === 'Pinned Note') return;
      push('low', 'unlinked_note', n.patient_id,
        `Clinical note on ${n.note_date?.split('T')[0]} (${n.encounter_service || 'no service'}) has no linked appointment`);
    });

    // Sort: severity high → low, then patient name
    const sevRank = { high: 0, medium: 1, low: 2 };
    issues.sort((a, b) => (sevRank[a.severity] - sevRank[b.severity]) || a.patient_name.localeCompare(b.patient_name));

    // Summary counts
    const summary = {
      total: issues.length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      by_type: {},
    };
    issues.forEach(i => { summary.by_type[i.type] = (summary.by_type[i.type] || 0) + 1; });

    return res.status(200).json({ summary, issues, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('data-audit error', err);
    return res.status(500).json({ error: err.message });
  }
}
