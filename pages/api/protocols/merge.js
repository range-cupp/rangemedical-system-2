// /pages/api/protocols/merge.js
// Merge two protocols for the same patient into one
// The target (surviving) protocol receives the combined sessions_used,
// earliest start_date, and latest end_date.
// The source protocol is marked status='merged'.
// Range Medical System V2

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sourceId, targetId } = req.body;

  if (!sourceId || !targetId) {
    return res.status(400).json({ error: 'sourceId and targetId are required' });
  }
  if (sourceId === targetId) {
    return res.status(400).json({ error: 'Cannot merge a protocol with itself' });
  }

  try {
    // Fetch both protocols
    const [{ data: source, error: srcErr }, { data: target, error: tgtErr }] = await Promise.all([
      supabase.from('protocols').select('*').eq('id', sourceId).single(),
      supabase.from('protocols').select('*').eq('id', targetId).single(),
    ]);

    if (srcErr || !source) return res.status(404).json({ error: 'Source protocol not found' });
    if (tgtErr || !target) return res.status(404).json({ error: 'Target protocol not found' });

    // Validate: must belong to the same patient
    if (source.patient_id !== target.patient_id) {
      return res.status(400).json({ error: 'Protocols must belong to the same patient' });
    }

    // Validate: neither can already be merged or cancelled
    if (source.status === 'merged') return res.status(400).json({ error: 'Source protocol is already merged' });
    if (target.status === 'merged' || target.status === 'cancelled') {
      return res.status(400).json({ error: 'Target protocol is not active' });
    }

    // Compute merged values
    const combinedSessions = (source.sessions_used || 0) + (target.sessions_used || 0);

    // Earliest start_date
    const srcStart = source.start_date ? new Date(source.start_date + 'T12:00:00') : null;
    const tgtStart = target.start_date ? new Date(target.start_date + 'T12:00:00') : null;
    let mergedStartDate = target.start_date;
    if (srcStart && tgtStart) {
      mergedStartDate = srcStart < tgtStart ? source.start_date : target.start_date;
    } else if (srcStart && !tgtStart) {
      mergedStartDate = source.start_date;
    }

    // Latest end_date (null if either is null/open-ended — keeps the longer horizon)
    let mergedEndDate = target.end_date;
    if (source.end_date && target.end_date) {
      const srcEnd = new Date(source.end_date + 'T12:00:00');
      const tgtEnd = new Date(target.end_date + 'T12:00:00');
      mergedEndDate = srcEnd > tgtEnd ? source.end_date : target.end_date;
    } else if (source.end_date && !target.end_date) {
      // Target has no end_date (open-ended) — keep open-ended
      mergedEndDate = null;
    }

    // Combine vial supply fields if present (peptide / injection vial protocols)
    let mergedNumVials = target.num_vials || 0;
    if (source.num_vials) {
      mergedNumVials += source.num_vials;
    }
    // Prefer target's doses_per_vial (same medication), fallback to source
    const mergedDosesPerVial = target.doses_per_vial || source.doses_per_vial || null;
    // Prefer target's supply_type, fallback to source
    const mergedSupplyType = target.supply_type || source.supply_type || null;
    // Prefer target's frequency, fallback to source
    const mergedFrequency = target.frequency || source.frequency || null;

    // Combine total_sessions — for vial protocols, recalculate from merged vials
    let mergedTotalSessions = target.total_sessions;
    if (mergedNumVials > 0 && mergedDosesPerVial) {
      // Vial-based: total = vials × doses per vial
      mergedTotalSessions = mergedNumVials * mergedDosesPerVial;
    } else if (source.total_sessions && target.total_sessions) {
      mergedTotalSessions = source.total_sessions + target.total_sessions;
    } else if (source.total_sessions && !target.total_sessions) {
      mergedTotalSessions = source.total_sessions;
    }

    // For vial protocols, recalculate end_date from start + duration
    if (mergedNumVials > 0 && mergedDosesPerVial && mergedFrequency) {
      // Parse doses per week from frequency string
      let dosesPerWeek = 7; // default daily
      const freq = (mergedFrequency || '').toLowerCase();
      const onOffMatch = freq.match(/(\d+)\s*(?:days?\s*)?on/i);
      if (onOffMatch) {
        dosesPerWeek = parseInt(onOffMatch[1]);
      } else if (freq.includes('daily') || freq.includes('every day')) {
        dosesPerWeek = 7;
      } else if (freq.includes('every other') || freq.includes('eod')) {
        dosesPerWeek = 3.5;
      } else if (freq.includes('3x') || freq.includes('three times')) {
        dosesPerWeek = 3;
      } else if (freq.includes('2x') || freq.includes('twice')) {
        dosesPerWeek = 2;
      } else if (freq.includes('weekly') || freq.includes('1x') || freq.includes('once')) {
        dosesPerWeek = 1;
      }
      const totalDoses = mergedNumVials * mergedDosesPerVial;
      const durationDays = Math.ceil((totalDoses / dosesPerWeek) * 7);
      const startDate = new Date(mergedStartDate + 'T12:00:00');
      const calcEnd = new Date(startDate);
      calcEnd.setDate(calcEnd.getDate() + durationDays);
      mergedEndDate = calcEnd.toISOString().split('T')[0];
    }

    // Merge notes
    let mergedNotes = target.notes || '';
    const srcNote = source.notes ? `[Merged from protocol ${sourceId.slice(0, 8)}]: ${source.notes}` : `[Merged from protocol ${sourceId.slice(0, 8)}]`;
    mergedNotes = mergedNotes ? `${mergedNotes}\n${srcNote}` : srcNote;

    // --- Apply updates in a logical sequence ---

    // 1. Update target protocol with merged values
    const updatePayload = {
      sessions_used: combinedSessions,
      start_date: mergedStartDate,
      end_date: mergedEndDate,
      total_sessions: mergedTotalSessions,
      notes: mergedNotes,
      updated_at: new Date().toISOString(),
    };
    // Include vial fields if we have them
    if (mergedNumVials > 0) updatePayload.num_vials = mergedNumVials;
    if (mergedDosesPerVial) updatePayload.doses_per_vial = mergedDosesPerVial;
    if (mergedSupplyType) updatePayload.supply_type = mergedSupplyType;
    if (mergedFrequency && !target.frequency) updatePayload.frequency = mergedFrequency;

    const { data: updatedTarget, error: updateErr } = await supabase
      .from('protocols')
      .update(updatePayload)
      .eq('id', targetId)
      .select()
      .single();

    if (updateErr) throw new Error(`Failed to update target protocol: ${updateErr.message}`);

    // 2. Mark source as merged
    const { error: mergeErr } = await supabase
      .from('protocols')
      .update({
        status: 'merged',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId);

    if (mergeErr) throw new Error(`Failed to mark source as merged: ${mergeErr.message}`);

    // 3. Re-link purchases from source → target
    await supabase
      .from('purchases')
      .update({ protocol_id: targetId })
      .eq('protocol_id', sourceId);

    // 4. Re-link injection_logs from source → target (preserves history)
    await supabase
      .from('injection_logs')
      .update({ protocol_id: targetId })
      .eq('protocol_id', sourceId);

    // 5. Re-link protocol_logs from source → target
    await supabase
      .from('protocol_logs')
      .update({ protocol_id: targetId })
      .eq('protocol_id', sourceId);

    // 6. Re-link service_logs from source → target (fixes weight loss injection history)
    await supabase
      .from('service_logs')
      .update({ protocol_id: targetId })
      .eq('protocol_id', sourceId);

    // 7. Recalculate sessions_used on target from actual service_logs count
    const { data: svcLogs } = await supabase
      .from('service_logs')
      .select('id')
      .eq('protocol_id', targetId)
      .neq('entry_type', 'pickup')
      .neq('entry_type', 'med_pickup');

    const recalcSessions = svcLogs ? svcLogs.length : combinedSessions;

    await supabase
      .from('protocols')
      .update({ sessions_used: recalcSessions, updated_at: new Date().toISOString() })
      .eq('id', targetId);

    console.log(`[merge] Protocol ${sourceId} merged into ${targetId}. Combined sessions: ${combinedSessions}, recalculated from service_logs: ${recalcSessions}`);

    return res.status(200).json({
      success: true,
      targetProtocol: updatedTarget,
      mergedSessions: combinedSessions,
      message: `Protocol merged. ${combinedSessions} total sessions now on target protocol.`,
    });

  } catch (err) {
    console.error('[merge] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
