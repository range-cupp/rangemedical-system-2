// /pages/api/protocols/[id]/dose-change.js
// Provider dose change for HRT and weight loss protocols.
//
// Updates the existing protocol in place — the protocol stays open and
// continuous on the business side. The medical-side audit trail is preserved
// in dose_history. We do NOT spawn a new protocol or close the old one,
// so the patient's protocol record is one continuous timeline from enrollment
// through every dose escalation to the current dose.
//
// Body:
//   {
//     effective_date: 'YYYY-MM-DD',  // optional, defaults to today
//     selected_dose:  '0.4ml/80mg',  // required
//     injections_per_week: 2,        // required
//     dose_per_injection: 0.4,       // optional, derived from selected_dose if absent
//     reason: 'Provider dose increase' // optional free-text note
//   }

import { createClient } from '@supabase/supabase-js';
import { isWeightLossType, isHRTType } from '../../../../lib/protocol-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const todayLA = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

// Parse "0.4ml/80mg" → 0.4
function parseMlFromDose(doseStr) {
  if (!doseStr) return null;
  const m = doseStr.match(/(\d+\.?\d*)\s*ml/i);
  return m ? parseFloat(m[1]) : null;
}

// Vial size in ml from supply_type ('vial_5ml', 'vial_10ml', 'vial')
function vialMlFromSupplyType(supplyType) {
  if (!supplyType) return null;
  if (supplyType === 'vial_5ml') return 5;
  if (supplyType === 'vial_10ml' || supplyType === 'vial') return 10;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Protocol ID required' });

  const {
    effective_date,
    selected_dose,
    injections_per_week,
    dose_per_injection,
    reason,
    approved_dose_change_request_id,  // id of an approved dose_change_requests row
  } = req.body || {};

  if (!selected_dose || !injections_per_week) {
    return res
      .status(400)
      .json({ error: 'selected_dose and injections_per_week are required' });
  }

  const effDate = effective_date || todayLA();
  const newIpw = parseInt(injections_per_week);
  const newDosePerInj =
    dose_per_injection != null
      ? parseFloat(dose_per_injection)
      : parseMlFromDose(selected_dose);

  try {
    // 1. Load current protocol
    const { data: current, error: loadErr } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (loadErr || !current) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // ── Dose change approval check (HRT / weight loss) ──
    // Policy:
    //   - WL: ALL dose changes require a valid approved_dose_change_request_id.
    //   - HRT: INCREASES require approval; decreases are allowed.
    // An approved dose_change_requests row is the only valid authorization.
    const isHRT = isHRTType(current.program_type);
    const isWL = isWeightLossType(current.program_type);
    if (isHRT || isWL) {
      const oldMl = parseMlFromDose(current.selected_dose);
      const newMl = parseMlFromDose(selected_dose);
      const oldIpw = current.injections_per_week || 2;

      const isDoseIncrease =
        (newMl && oldMl && newMl > oldMl) ||
        (newIpw > oldIpw) ||
        (newMl && oldMl && newMl === oldMl && newIpw > oldIpw);

      const needsApproval = isWL || (isHRT && isDoseIncrease);

      if (needsApproval) {
        if (!approved_dose_change_request_id) {
          return res.status(400).json({
            error: isWL
              ? 'Weight-loss dose changes require Dr. Burgess approval. Use the Dose Change modal on the patient profile to send an approval request.'
              : 'HRT dose increases require Dr. Burgess approval. Use the Dose Change modal on the patient profile to send an approval request.',
            requires_approval: true,
          });
        }

        const { data: approval } = await supabase
          .from('dose_change_requests')
          .select('id, protocol_id, proposed_dose, proposed_injections_per_week, status')
          .eq('id', approved_dose_change_request_id)
          .single();

        const normalize = (s) => (s == null ? null : String(s).trim().toLowerCase().replace(/\s+/g, ''));
        const ok =
          approval &&
          approval.protocol_id === id &&
          ['approved', 'applied'].includes(approval.status) &&
          normalize(approval.proposed_dose) === normalize(selected_dose) &&
          (approval.proposed_injections_per_week == null ||
            approval.proposed_injections_per_week === newIpw);

        if (!ok) {
          return res.status(403).json({
            error: 'Provided dose change approval is invalid, expired, or does not match this protocol/dose.',
            requires_approval: true,
          });
        }
      }
    }

    // 2. Compute remaining supply at the moment of the dose change.
    //    starting_supply_ml may have been seeded by a prior dose change or refill.
    //    used_ml = injections logged since last_refill_date (or start_date) at OLD dose_per_injection.
    const oldVialMl = vialMlFromSupplyType(current.supply_type);
    const oldStartingMl =
      current.starting_supply_ml != null
        ? parseFloat(current.starting_supply_ml)
        : oldVialMl;

    let remainingMl = null;
    if (oldStartingMl && current.dose_per_injection) {
      const since = current.last_refill_date || current.start_date;
      const { data: logs } = await supabase
        .from('service_logs')
        .select('id')
        .eq('patient_id', current.patient_id)
        .eq('protocol_id', id)
        .in('entry_type', ['injection', 'session'])
        .gte('entry_date', since || '1970-01-01');

      const injCount = (logs || []).length;
      const usedMl = injCount * parseFloat(current.dose_per_injection);
      remainingMl = Math.max(0, oldStartingMl - usedMl);
      remainingMl = Math.round(remainingMl * 100) / 100;
    }

    // 3. Append dose entry to dose_history (audit trail).
    //    If history is empty, seed a starting-dose entry first so the timeline
    //    is complete even for protocols that pre-date dose tracking.
    const oldHistory = Array.isArray(current.dose_history)
      ? [...current.dose_history]
      : [];
    if (
      oldHistory.length === 0 &&
      current.selected_dose &&
      current.start_date
    ) {
      oldHistory.push({
        date: current.start_date,
        dose: current.selected_dose,
        injections_per_week: current.injections_per_week || 2,
        notes: 'Starting dose',
      });
    }
    const newHistory = [
      ...oldHistory,
      {
        date: effDate,
        dose: selected_dose,
        injections_per_week: newIpw,
        notes: reason || 'Dose change',
      },
    ];

    // 4. Recalculate next_expected_date based on remaining supply + new dose.
    let nextExpectedDate = current.next_expected_date || null;
    const newVialMl = vialMlFromSupplyType(current.supply_type);
    if (newVialMl && newDosePerInj > 0 && newIpw > 0) {
      const supplyMl = remainingMl != null ? remainingMl : newVialMl;
      const supplyDays = Math.round((supplyMl / (newDosePerInj * newIpw)) * 7);
      const nextDate = new Date(effDate + 'T12:00:00');
      nextDate.setDate(nextDate.getDate() + supplyDays);
      nextExpectedDate = nextDate.toISOString().split('T')[0];
    }

    // 5. Update existing protocol in place — protocol stays open; this is a
    //    continuation, not a new prescription on the business side.
    const updatePayload = {
      selected_dose,
      current_dose: selected_dose,
      injections_per_week: newIpw,
      dose_history: newHistory,
      dose_change_reason: reason || null,
      // Treat the dose-change date as a checkpoint so the supply-remaining
      // calculation uses the new dose_per_injection from here forward.
      last_refill_date: effDate,
      starting_supply_ml: remainingMl,
      next_expected_date: nextExpectedDate,
      updated_at: new Date().toISOString(),
    };
    if (newDosePerInj != null) updatePayload.dose_per_injection = newDosePerInj;
    if (current.sig && current.selected_dose && current.sig.includes(current.selected_dose)) {
      updatePayload.sig = current.sig.replace(current.selected_dose, selected_dose);
    }

    const { data: updated, error: updateErr } = await supabase
      .from('protocols')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update protocol with dose change:', updateErr);
      return res.status(500).json({ error: updateErr.message });
    }

    // Back-compat: prior callers expected `closed_protocol_id` and
    // `new_protocol`. Both now point to the same protocol — dose changes
    // update in place rather than spawning a new protocol row.
    return res.status(200).json({
      success: true,
      protocol: updated,
      closed_protocol_id: id,
      new_protocol: updated,
      carried_supply_ml: remainingMl,
    });
  } catch (err) {
    console.error('dose-change error:', err);
    return res.status(500).json({ error: err.message });
  }
}
