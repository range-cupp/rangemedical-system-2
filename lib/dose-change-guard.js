// /lib/dose-change-guard.js
// Single source of truth for "can this endpoint write a new dose to this protocol?"
// Range Medical
//
// Policy:
//   - WL (weight_loss): ANY change to dose fields requires an approved
//     dose_change_requests row that matches this protocol + proposed dose.
//   - HRT: INCREASES require approval; decreases are allowed without.
//   - Everything else (peptide, iv, hbot, rlt, injection): no restriction.
//
// Two modes staff-side:
//   - mode: 'reject'  — return { allowed: false, reason } and let the endpoint
//                       return a 400 with requires_approval: true.
//   - mode: 'strip'   — return { allowed: true, sanitizedUpdate } with the
//                       dose fields removed. The endpoint can still persist
//                       the rest of the update (used by encounter notes where
//                       dose is often documentation, not a change).
//
// The approved flow (POST /api/dose-change-requests/[token] → "apply") does
// NOT call this guard — it closes the old protocol and creates a new one via
// createProtocol(), which is a write to a fresh row. The guard only fires on
// updates to existing protocols.

import { isWeightLossType, isHRTType } from './protocol-config';

const DOSE_FIELDS = [
  'selected_dose',
  'dose',
  'current_dose',
  'dose_per_injection',
  'injections_per_week',
];

// Parse "2.5mg", "0.4ml", "0.4ml/80mg" → 2.5 / 0.4 / 0.4
function parseDoseNum(doseStr) {
  if (doseStr == null) return null;
  const s = String(doseStr);
  const m = s.match(/(\d+\.?\d*)\s*(ml|mg|mcg|iu)/i);
  return m ? parseFloat(m[1]) : null;
}

// Compare two dose strings — returns 'increase' | 'decrease' | 'same' | 'unknown'.
// Weighted by injections_per_week when available, so a jump from 0.4ml 1x/wk to
// 0.4ml 2x/wk counts as an increase.
function compareDose(oldDose, newDose, oldIpw, newIpw) {
  const o = parseDoseNum(oldDose);
  const n = parseDoseNum(newDose);
  if (o == null || n == null) return 'unknown';
  const oWeekly = o * (oldIpw || 1);
  const nWeekly = n * (newIpw || 1);
  if (nWeekly > oWeekly) return 'increase';
  if (nWeekly < oWeekly) return 'decrease';
  return 'same';
}

function normalizeDose(s) {
  if (s == null) return null;
  return String(s).trim().toLowerCase().replace(/\s+/g, '');
}

// Pick out the dose fields that would actually change vs the current protocol.
function diffDose(currentProtocol, update) {
  const changed = [];
  for (const field of DOSE_FIELDS) {
    if (!(field in update)) continue;
    const incoming = update[field];
    const existing = currentProtocol[field];
    if (incoming == null) continue;
    if (normalizeDose(incoming) === normalizeDose(existing)) continue;
    changed.push({ field, from: existing ?? null, to: incoming });
  }
  return changed;
}

/**
 * Guard a dose-related update to a protocol.
 *
 * @param {Object} supabase - initialized supabase client (service role)
 * @param {Object} currentProtocol - the protocol row being updated
 * @param {Object} update - the incoming update payload
 * @param {Object} opts
 * @param {'reject'|'strip'} opts.mode - how to handle blocked changes
 * @param {string} [opts.approvedRequestId] - id of an approved dose_change_requests row
 * @returns {Promise<{
 *   allowed: boolean,
 *   sanitizedUpdate?: Object,
 *   blocked?: Array<{field:string, from:any, to:any}>,
 *   reason?: string,
 *   category?: 'weight_loss'|'hrt'|'other',
 * }>}
 */
export async function guardDoseChange(supabase, currentProtocol, update, opts = {}) {
  const { mode = 'reject', approvedRequestId } = opts;

  if (!currentProtocol) {
    return { allowed: true, sanitizedUpdate: update };
  }

  const isWL = isWeightLossType(currentProtocol.program_type) || currentProtocol.category === 'weight_loss';
  const isHRT = !isWL && (isHRTType(currentProtocol.program_type) || currentProtocol.category === 'hrt');

  // Only WL and HRT are gated.
  if (!isWL && !isHRT) {
    return { allowed: true, sanitizedUpdate: update, category: 'other' };
  }

  const changed = diffDose(currentProtocol, update);
  if (changed.length === 0) {
    return { allowed: true, sanitizedUpdate: update, category: isWL ? 'weight_loss' : 'hrt' };
  }

  // Determine whether the change requires approval.
  const oldIpw = currentProtocol.injections_per_week || 1;
  const newIpw = ('injections_per_week' in update && update.injections_per_week != null)
    ? parseInt(update.injections_per_week) || oldIpw
    : oldIpw;
  const oldDose = currentProtocol.selected_dose || currentProtocol.dose;
  const newDose = update.selected_dose ?? update.dose ?? update.current_dose ?? oldDose;
  const direction = compareDose(oldDose, newDose, oldIpw, newIpw);

  // No effective change: allow. Covers cases where one dose field appears
  // "changed" because of API-side normalization (e.g. dose ← selected_dose
  // sync filling a previously-null `dose` column) while the actual prescribed
  // amount weighted by injections_per_week is identical.
  if (direction === 'same') {
    return { allowed: true, sanitizedUpdate: update, category: isWL ? 'weight_loss' : 'hrt' };
  }

  // HRT decrease: allowed without approval.
  if (isHRT && direction === 'decrease') {
    return { allowed: true, sanitizedUpdate: update, category: 'hrt' };
  }

  // Otherwise an approval is required. If one was provided, verify it.
  if (approvedRequestId) {
    const { data: approval } = await supabase
      .from('dose_change_requests')
      .select('id, protocol_id, proposed_dose, proposed_injections_per_week, status, approved_at')
      .eq('id', approvedRequestId)
      .single();

    const ok =
      approval &&
      approval.protocol_id === currentProtocol.id &&
      ['approved', 'applied'].includes(approval.status) &&
      normalizeDose(approval.proposed_dose) === normalizeDose(newDose) &&
      (approval.proposed_injections_per_week == null ||
        approval.proposed_injections_per_week === newIpw);

    if (ok) {
      return { allowed: true, sanitizedUpdate: update, category: isWL ? 'weight_loss' : 'hrt' };
    }
    // Provided id didn't match — fall through to block.
  }

  const category = isWL ? 'weight_loss' : 'hrt';
  const reason = isWL
    ? 'Weight-loss dose changes require Dr. Burgess approval. Use the Dose Change modal on the patient profile to send an approval request.'
    : 'HRT dose increases require Dr. Burgess approval. Use the Dose Change modal on the patient profile to send an approval request.';

  if (mode === 'strip') {
    const sanitizedUpdate = { ...update };
    for (const f of DOSE_FIELDS) delete sanitizedUpdate[f];
    return {
      allowed: true,
      sanitizedUpdate,
      blocked: changed,
      reason,
      category,
    };
  }

  return {
    allowed: false,
    blocked: changed,
    reason,
    category,
  };
}

// Helper for routes that only want the boolean answer for a field set.
export function wantsDoseChange(update) {
  return DOSE_FIELDS.some((f) => f in update && update[f] != null);
}

export { DOSE_FIELDS };
