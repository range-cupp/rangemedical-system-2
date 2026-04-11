// /pages/api/protocols/[id]/dose-change.js
// Provider dose change for HRT (and other vial-based protocols).
//
// Closes the current protocol as `historic` (with end_date = effective date)
// and creates a NEW active protocol starting on that date with the new dose.
//
// Vial supply still on hand carries over to the new protocol via
// `starting_supply_ml`, so the patient's "weeks left" estimate stays accurate
// without needing to log a new dispense.
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
import { createProtocol, closeProtocol } from '../../../../lib/create-protocol';
import { DOSE_APPROVAL_STAFF } from '../../../../lib/staff-config';

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
    approved_by_email,  // email of approving provider (required for dose increases on HRT/WL)
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

    // ── Dose increase approval check (HRT / weight loss) ──
    // If this is a dose INCREASE, it must be approved by an authorized provider (Dr. Burgess)
    const isHRT = (current.program_type || '').toLowerCase().includes('hrt');
    const isWL = (current.program_type || '').toLowerCase().includes('weight_loss');
    if (isHRT || isWL) {
      const oldMl = parseMlFromDose(current.selected_dose);
      const newMl = parseMlFromDose(selected_dose);
      const oldIpw = current.injections_per_week || 2;

      // Dose increase = higher ml per injection OR more injections per week
      const isDoseIncrease =
        (newMl && oldMl && newMl > oldMl) ||
        (newIpw > oldIpw) ||
        (newMl && oldMl && newMl === oldMl && newIpw > oldIpw);

      if (isDoseIncrease) {
        if (!approved_by_email) {
          return res.status(400).json({
            error: 'Dose increases on HRT/weight loss require provider approval. Please select the approving provider.',
            requires_approval: true,
          });
        }
        if (!DOSE_APPROVAL_STAFF.includes(approved_by_email.toLowerCase())) {
          return res.status(403).json({
            error: 'Only Dr. Damien Burgess can approve dose increases for HRT and weight loss protocols.',
            requires_approval: true,
          });
        }
      }
    }

    // 2. Compute remaining supply on the old protocol.
    //    starting_ml = vial size (or carried-over starting_supply_ml from a prior dose change)
    //    used_ml     = sum of injections logged since last_refill_date (or start_date)
    //                  using the OLD dose_per_injection
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
        .select('id, entry_date, entry_type')
        .eq('patient_id', current.patient_id)
        .eq('protocol_id', id)
        .in('entry_type', ['injection', 'session'])
        .gte('entry_date', since || '1970-01-01');

      const injCount = (logs || []).length;
      const usedMl = injCount * parseFloat(current.dose_per_injection);
      remainingMl = Math.max(0, oldStartingMl - usedMl);
      // round to 2 decimals
      remainingMl = Math.round(remainingMl * 100) / 100;
    }

    // 3. Append final entry to old protocol's dose_history (audit trail)
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

    // 4. Close old protocol → historic via centralized function
    const closeNotes = `Closed ${effDate} — dose changed to ${selected_dose}${
      reason ? ` (${reason})` : ''
    }${remainingMl != null ? `. ${remainingMl}ml carried to new protocol.` : ''}`;

    // Save dose_history on the old protocol before closing
    await supabase
      .from('protocols')
      .update({ dose_history: oldHistory })
      .eq('id', id);

    const closeResult = await closeProtocol(id, 'historic', {
      endDate: effDate,
      notes: closeNotes,
    });

    if (!closeResult.success) {
      console.error('Failed to close old protocol:', closeResult.error);
      return res.status(500).json({ error: closeResult.error });
    }

    // 5. Build new protocol payload — copy clinical/admin fields from parent,
    //    override dose-related ones.
    let nextExpectedDate = null;
    const newVialMl = vialMlFromSupplyType(current.supply_type);
    if (newVialMl && newDosePerInj > 0 && newIpw > 0) {
      const supplyMl = remainingMl != null ? remainingMl : newVialMl;
      const supplyDays = Math.round(
        (supplyMl / (newDosePerInj * newIpw)) * 7
      );
      const nextDate = new Date(effDate + 'T12:00:00');
      nextDate.setDate(nextDate.getDate() + supplyDays);
      nextExpectedDate = nextDate.toISOString().split('T')[0];
    }

    const result = await createProtocol({
      patient_id: current.patient_id,
      program_type: current.program_type,
      program_name: current.program_name,
      medication: current.medication,
      hrt_type: current.hrt_type,
      delivery_method: current.delivery_method,
      supply_type: current.supply_type,
      vial_size: current.vial_size,
      injection_method: current.injection_method,
      hrt_reminders_enabled: current.hrt_reminders_enabled,
      hrt_reminder_schedule: current.hrt_reminder_schedule,
      first_followup_weeks: current.first_followup_weeks,
      secondary_medications: current.secondary_medications,
      // New dose fields
      selected_dose,
      injections_per_week: newIpw,
      dose_per_injection: newDosePerInj,
      // Lifecycle
      start_date: effDate,
      last_refill_date: effDate,
      next_expected_date: nextExpectedDate,
      // Versioning
      parent_protocol_id: id,
      dose_change_reason: reason || null,
      starting_supply_ml: remainingMl,
      dose_history: [
        {
          date: effDate,
          dose: selected_dose,
          injections_per_week: newIpw,
          notes: reason || 'Dose change',
        },
      ],
    }, {
      source: 'dose-change',
      parentProtocolId: id,
      skipDuplicateCheck: true, // dose change always creates a new protocol
    });

    if (!result.success) {
      console.error('Failed to create new protocol:', result.error);
      // Try to roll back the close
      await supabase
        .from('protocols')
        .update({ status: current.status, end_date: current.end_date })
        .eq('id', id);
      return res.status(500).json({ error: result.error });
    }

    const created = result.protocol;

    return res.status(200).json({
      success: true,
      closed_protocol_id: id,
      new_protocol: created,
      carried_supply_ml: remainingMl,
    });
  } catch (err) {
    console.error('dose-change error:', err);
    return res.status(500).json({ error: err.message });
  }
}
